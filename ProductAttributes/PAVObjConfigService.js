(function() {
	angular.module('APTPS_ngCPQ').service('PAVObjConfigService', PAVObjConfigService); 
	PAVObjConfigService.$inject = ['$q', '$log', 'BaseService', 'RemoteService'];
	function PAVObjConfigService($q, $log, BaseService, RemoteService) {
		var service = this;
		service.isvalid = false;
		service.fieldNametoDFRMap = {};
		service.ctodFieldMap = [];
		
		service.getPAVFieldMetaData = getPAVFieldMetaData;
		service.loadPicklistDropDowns = loadPicklistDropDowns;
		service.applyDependedPicklistsOnChange = applyDependedPicklistsOnChange;
		
		function getPAVFieldMetaData(){
			if(service.isvalid == true)
			{
				return $q.when(service.fieldNametoDFRMap);
			}

			var requestPromise = RemoteService.getPAVFieldMetaData();
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response_FieldDescribe){
				initializefieldNametoDFRMap(response_FieldDescribe);
				BaseService.setPAVObjConfigLoadComplete();
				return service.fieldNametoDFRMap;
			});
		}

		// when drop down value is change on the attributes then apply all dependent dropdowns.
		function applyDependedPicklistsOnChange(attributeGroups, PAV, fieldName){
			var res = {};
			applyDependedPicklistsOnChange_SingleField(attributeGroups, PAV, fieldName);
			res = {pavConfigGroups: attributeGroups, PAVObj: PAV};
			return res;
		}

		// this is applicable on page load or first time renedeing of attribute groups.
		function loadPicklistDropDowns(attributeGroups, PAV){
			// cleanup PAV before loading picklist Drop Downs.
			_.each(attributeGroups, function(attributeGroup){
				// configure only on page load or first time...use custom property called 'isPicklistConfigComplete'.
                if(!_.has(attributeGroup, 'isPicklistConfigComplete')
                	|| attributeGroup.isPicklistConfigComplete == false)
                {
	                _.each(attributeGroup.productAtributes, function(attributeConfig){
	                    var fieldName = attributeConfig.fieldName;
	                    var fieldDescribe = service.fieldNametoDFRMap[fieldName].fieldDescribe;
	                    if(fieldDescribe.fieldType == 'picklist')
	                    {
	                    	if(!_.isEmpty(attributeConfig.lovs)
	                    		|| attributeConfig.isDynamicAttr == true)
		                    {
		                    	// load picklist LOV's within APTPS_CPQ.productAtribute for dynamic attributes and custom attributes from custom settings: APTPS_ProdSpec_DynAttr__c. 
	                    		attributeConfig['picklistValues'] = getPicklistValues(prepareOptionsList(attributeConfig.lovs));
	                    	}else{
	                    		// load Normal picklist LOV's from Salesforce config.
		                    	attributeConfig['picklistValues'] = fieldDescribe.picklistValues;

		                    	// load dependent picklists if current field is dependentField.
		                    	if(fieldDescribe.isDependentPicklist == true)
		                    	{
		                    		var controllingField = fieldDescribe.controllerName;
		                    		applyDependentLOVSConfig(attributeConfig, PAV, fieldName, controllingField);	
		                    	}
	                    	}
							// if 'Other' LOV option exists in the database then add the previously selected value to options....Applicable only for loading configured quote.
		                    var selectedvalue = PAV[fieldName];
		                    if(!_.isUndefined(selectedvalue)
		                    	&& !_.contains(_.pluck(attributeConfig.picklistValues, 'value'), selectedvalue) 
		                    	&& _.contains(_.pluck(attributeConfig.picklistValues, 'value'), 'Other'))
		                    {
		                    	attributeConfig.picklistValues.push(selectoptionObject(true, selectedvalue, selectedvalue, false));
		                    }  		
	                    	
	                   }

                    	// set the PAV to null if undefined. - To avoid extra dropdown if it is a picklists.
	                    PAV[fieldName] = _.isUndefined(PAV[fieldName]) ? null : PAV[fieldName];
                    	
                    	// set pav to default value from salesforce configuration.
                    	var defaultValue = fieldDescribe.defaultValue;
                    	PAV[fieldName] = !_.isUndefined(defaultValue) && _.isNull(PAV[fieldName]) ? defaultValue : PAV[fieldName];
	                })
					attributeGroup['isPicklistConfigComplete'] = true;
				}
            })
            res = {pavConfigGroups: attributeGroups, PAVObj: PAV};
			return res;
		}

		// ###################### private methods.###############################
		function initializefieldNametoDFRMap(response){
			service.isvalid = true;
			_.each(response, function(fdrWrapper, fieldName){
				var fieldDescribe = getFieldDescribe(fdrWrapper);
				var dPicklistObj = {};
				if(fieldDescribe.fieldType == 'picklist'
					&& fieldDescribe.isDependentPicklist == true)
				{
					var controller = fieldDescribe.controllerName;
					var controllingpicklistOptions = response[controller].picklistOptions;
					dPicklistObj = getStructuredDependentFields(fdrWrapper.picklistOptions, controllingpicklistOptions);	
					
					service.ctodFieldMap.push({cField:controller, dField:fieldName});
				}

				service.fieldNametoDFRMap[fieldName] = {fieldDescribe:fieldDescribe, dPicklistObj:dPicklistObj};
			})
		}

		// load dropdown values of all dependent fields based on controlling field value selected..applicable on initial load of attributes.
		function applyDependentLOVSConfig(attributeConfig, PAV, dependentField, controllingField){
            var cSelectedPAVValue = _.has(PAV, controllingField) ? PAV[controllingField] : null;
            var options = [];
            var dPicklistConfig = service.fieldNametoDFRMap[dependentField].dPicklistObj;
            if(_.has(dPicklistConfig, cSelectedPAVValue))
            {
            	options = dPicklistConfig[cSelectedPAVValue].slice();// do a slice to cline the list.
            }
            // if dependend selected value does not exists in the options then set the PAV to null
			var dSelectedPAVValue = PAV[dependentField];
			if(!_.contains(_.pluck(options,  'value'), dSelectedPAVValue))
			{
				PAV[dependentField] = null;// set the dependentFile PAV to null.
			}
            options.splice(0, 0, selectoptionObject(true, '--None--', null, false));
            attributeConfig.picklistValues = options;
		}
		
		// reload all dependent dropdowns on controlling field change.
		function applyDependedPicklistsOnChange_SingleField(attributeGroups, PAV, cField){
			// get all dependent fields for given controllingField: cField.
			var dFields = _.pluck(_.where(service.ctodFieldMap, {cField:cField}), 'dField');
			// apply dependencies only if cField is a controlling Field else return.
			if(_.isUndefined(dFields) 
				|| _.isEmpty(dFields))
				return;
			var selectedPAVValue = PAV[cField];
			_.each(attributeGroups, function(attributeGroup){
				_.each(attributeGroup.productAtributes, function(attributeConfig){
					var currentField = attributeConfig.fieldName;
					// if attribute field exists in the dependent fields for given controlling field:fieldName then apply dependency.
					if(_.contains(dFields, currentField))
					{
						var dPicklistConfig = service.fieldNametoDFRMap[currentField].dPicklistObj;
						PAV[currentField] = null;
						var options = [];
                        if(_.has(dPicklistConfig, selectedPAVValue))
                        {
                        	// do a slice to cline the list.
                        	options = dPicklistConfig[selectedPAVValue].slice();
            				options.splice(0, 0, selectoptionObject(true, '--None--', null, false));
                        }
                        
                        attributeConfig.picklistValues = options;
                        // more than one level-dependency could exist..so recursive call.
                        applyDependedPicklistsOnChange_SingleField(attributeGroups, PAV, currentField);
					}
				})
			})
		}

		// prepare javascript version  of fieldDescribe based on Schema.DescribeFieldResult
		function getFieldDescribe(fdrWrapper){
			var res = {};
			var fieldDescribe = fdrWrapper.fdr;
			var fieldDescribe_addl = fdrWrapper.fdr_additional;

			res['fieldType'] = getFieldType(fieldDescribe.type);
			res['fieldLabel'] = fieldDescribe.label;
			res['picklistValues'] = getPicklistValues(fieldDescribe.picklistValues);
			res['isDependentPicklist'] = fieldDescribe.dependentPicklist;// Returns true if the picklist is a dependent picklist, false otherwise.
			res['controllerName'] = fieldDescribe.controllerName;// Returns the token of the controlling field.
			res['isUpdateable'] = fieldDescribe.updateable;//Returns true if the field can be edited by the current user, or child records in a master-detail relationship field on a custom object can be reparented to different parent records; false otherwise.
			res['isCalculated'] = fieldDescribe.calculated;// Returns true if the field is a custom formula field, false otherwise. Note that custom formula fields are always read-only.
			res['isCreateable'] = fieldDescribe.createable;// Returns true if the field can be created by the current user, false otherwise.
			res['idLookup'] = fieldDescribe.idLookup;// Returns true if the field can be used to specify a record in an upsert method, false otherwise.
			res['isNillable'] = fieldDescribe.nillable;// Returns true if the field is nillable, false otherwise. A nillable field can have empty content. A non-nillable field must have a value for the object to be created or saved.
			res['isUnique'] = fieldDescribe.unique;// Returns true if the value for the field must be unique, false otherwise
			
			// additional map result.
			res['defaultValue'] = fieldDescribe_addl.defaultValue;
			if(res.fieldType== 'picklist')
			{
				var defaultLOV = _.findWhere(res.picklistValues, {defaultValue:true});
				res['defaultValue'] = !_.isUndefined(defaultLOV) ? defaultLOV.value : null;
			}
			return res;
		}

		// return HTML matching fieldtype based on Salesforce field Type.
		function getFieldType(sfdctype){
			var res = 'text';// default.
			if(sfdctype == 'picklist'
				|| sfdctype == 'multiPicklist')
				return 'picklist';
			else if(sfdctype == 'string'
					|| sfdctype == 'textarea'
					|| sfdctype == 'phone'
					|| sfdctype == 'encryptedstring')
				return 'text';
			else if(sfdctype == 'boolean')
				return 'checkbox';
			else if(sfdctype == 'combobox')
				return '';
			else if(sfdctype == 'currency'
					|| sfdctype == 'integer'
					|| sfdctype == 'double'
					|| sfdctype == 'percent')
				return 'number';
			else if(sfdctype == 'date')
				return 'date';
			else if(sfdctype == 'datetime')
				return 'datetime';
			else if(sfdctype == 'email')
				return 'email';
			else if(sfdctype == 'reference')
				return '';
			else if(sfdctype == 'time')
				return 'time';
			else if(sfdctype == 'url')
				return 'url';
			return 'text';
			return res;
		}

		// add '--None--' Options at index 0 for salesforce default config.
		function getPicklistValues(ples){
			var res = [];// defaultValue
			// add a blank option.{--None--}
			res = ples;
			res.splice(0, 0, selectoptionObject(true, '--None--', null, false));
			return res;
		}

		// convert map<String, list<String>> of string to Map<Strin, List<Schema.PicklistEntry>>(JSON).
		function prepareOptionsMap(objResult){
			var res = {};
			_.each(objResult, function(plovs, cLOV){
				res[cLOV] = prepareOptionsList(plovs);
			})
			return res;
		}

		// convert list of string to List<Schema.PicklistEntry>.
		function prepareOptionsList(lovs){
			var res = [];
			res = _.map(lovs, function(lov){
					return selectoptionObject(true, lov, lov, false);
				});
			return res;
		}

		// object structure of Schema.PicklistEntry.
		function selectoptionObject(active, label, value, isdefault){
			return {active:active, label:label, value:value, defaultValue:isdefault};
		}

		function getStructuredDependentFields(dPicklistOptions, cPicklistOptions){
			var res = {};
			var objResult = {};
			//set up the results
			//create the entry with the controlling label
			_.each(cPicklistOptions, function(picklistOption){
				objResult[picklistOption.label] = [];
			})
			//cater for null and empty
			objResult[''] = [];
			objResult[null] = [];

			//if valid for is empty, skip
			_.each(dPicklistOptions, function(dPicklistOption){
				//iterate through the controlling values
				_.each(cPicklistOptions, function(cPicklistOption, cIndex){
					if(testBit(dPicklistOption.validFor, cIndex))
					{
						var cLabel = cPicklistOption.label;
						objResult[cLabel].push(dPicklistOption.label);
					}
				})
			})
			// convert list of values to 'selectoptionObject' format.
			res = prepareOptionsMap(objResult);
			return res;
		}

		// testBit is implemented based on the algorithm :http://titancronus.com/blog/2014/05/01/salesforce-acquiring-dependent-picklists-in-apex/
		function testBit(pValidFor, n){
	        //the list of bytes
	        var pBytes = [];
	        
	        //will be used to hold the full decimal value
	        var pFullValue = 0;
	        
	        //multiply by 6 since base 64 uses 6 bits
	        var bytesBeingUsed = (pValidFor.length * 6)/8;
	        
	        //must be more than 1 byte
	        if(bytesBeingUsed <= 1)
                return false;
	        
	        //calculate the target bit for comparison
	        var bit = 7 - (n % 8);
	        
	        //calculate the octet that has in the target bit
	        var targetOctet = (bytesBeingUsed - 1) - (n >> bytesBeingUsed);
	        
	        //the number of bits to shift by until we find the bit to compare for true or false
	        var shiftBits = (targetOctet * 8) + bit;
	        
	        //get the base64bytes
	        _.each(pValidFor.split(""), function(eachchar){
	        	//get current character value
                pBytes.push(Base64Value(eachchar));
	        })
	        
	        for(var i=0; i < pBytes.length; i++){
                var pShiftAmount = (pBytes.length - (i+1)) * 6;
                pFullValue = pFullValue + (pBytes[i] << (pShiftAmount));
	        }
	        
	        var powVal = Math.pow(2, shiftBits);
	       	powVal = powVal > 2147483647 ? 2147483647 : powVal;
	       	powVal = powVal < -2147483647 ? -2147483647 : powVal;
	        var tBitVal = (powVal & pFullValue) >> shiftBits;
	        return tBitVal == 1;
        }
		
		var Base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        function Base64Value(char){
        	return Base64Chars.indexOf(char);
        }

        // Salesforce algorithm (Sample Java Code for Dependent Picklists)https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_calls_describesobjects_describesobjectresult.htm#i1427932
		// not working so commenting.
		/*function getStructuredDependentFields(dPicklistOptions, cPicklistOptions){
			var res = {};
			var objResult = {};
			//set up the results
			//create the entry with the controlling label
			_.each(cPicklistOptions, function(picklistOption){
				objResult[picklistOption.label] = [];
			})
			//cater for null and empty
			objResult[''] = [];
			objResult[null] = [];

			_.each(dPicklistOptions, function(picklistOption){
				var validFor = Bitset(picklistOption.validFor);
				for (var k = 0; k < validFor.size(); k++) {
					if (validFor.testBit(k)) {
					// if bit k is set, this entry is valid for the
					// for the controlling entry at index k
					var dLabel = picklistOption.label;
					var cLabel = cPicklistOptions[k].label;
					objResult[cLabel].push(dLabel);
					}
				}
			})
			res = prepareOptionsMap(objResult);
			return res;
		}

		function Bitset(str){
			var data = [];

			_.each(str.split(""), function(eachchar){
				data.push(Base64Value(eachchar));
			})
			return{
				testBit : function(n){
					return (data[n >> 3] & (0x80 >> n % 8)) != 0;
				},
				size : function(){
			      return data.length * 8;
			    }
			};
		}*/
	}
})();