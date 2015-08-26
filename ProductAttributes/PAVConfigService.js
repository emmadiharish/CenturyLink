(function() {
	angular.module('APTPS_ngCPQ').service('PAVConfigService', PAVConfigService); 
	PAVConfigService.$inject = ['$q', '$log', 'BaseService', 'RemoteService'];
	function PAVConfigService($q, $log, BaseService, RemoteService) {
		var service = this;
		service.isvalid = false;
		service.fieldNametoDFRMap = {};
		service.dependentFieltoControllingFieldMap = {};
		service.PAVcFieldtodFieldDefinationMap = [];
		// service.PAVcFieldtodFieldDefinationMap_ang = [];

		service.getPAVFieldMetaData = getPAVFieldMetaData;
		service.loadPicklistDropDowns = loadPicklistDropDowns;
		service.applyDependedPicklistsOnChange = applyDependedPicklistsOnChange;

		function getPAVFieldMetaData(){
			if(service.isvalid == true)
			{
				return $q.when(service.fieldNametoDFRMap);
			}

			var requestPromise = RemoteService.getPAVFieldMetaData();
			return requestPromise.then(function(response_FieldDescribe){
				initializefieldNametoDFRMap(response_FieldDescribe);
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
			var res = {};
			_.each(attributeGroups, function(attributeGroup){
				// configure only on page load.
                if(!_.has(attributeGroup, 'isPicklistConfigComplete')
                	|| attributeGroup.isPicklistConfigComplete == false)
                {
	                _.each(attributeGroup.productAtributes, function(attributeConfig){
	                    var fieldName = attributeConfig.fieldName;
	                    if(service.fieldNametoDFRMap[fieldName].fieldType == 'picklist')
	                    {
	                    	// load Normal picklist LOV's from Salesforce config.
	                    	attributeConfig['picklistValues'] = service.fieldNametoDFRMap[fieldName].picklistValues;

	                    	// load dependent picklists if current field is dependentField.
	                    	if(_.has(service.dependentFieltoControllingFieldMap, fieldName))
	                    	{
	                    		var controllingField = service.dependentFieltoControllingFieldMap[fieldName];
	                    		applyDependentLOVSConfig(attributeConfig, PAV, fieldName, controllingField);	
	                    	}
	                    	
							// if 'Other' LOV option exists in the database then add the previously selected value....Applicable only for loading configured quote.
		                    var selectedvalue = PAV[fieldName];
		                    if(!_.isUndefined(selectedvalue)
		                    	&& !_.contains(_.pluck(attributeConfig.picklistValues, 'value'), selectedvalue) 
		                    	&& _.contains(_.pluck(attributeConfig.picklistValues, 'value'), 'Other'))
		                    {
		                    	attributeConfig.picklistValues.push(selectoptionObject(true, selectedvalue, selectedvalue, false));
		                    }  		
	                    	
	                    	// apply default dropdown value from salesforce configuration. based on custom setting : APTPS_Picklist_Dependencies__c
	                    	if(_.isUndefined(selectedvalue))// set the PAV to null if undefined. - To avoid extra dropdown.
		                    {
		                    	PAV[fieldName] = null;
		                    }
		                    var defaultLOV = _.findWhere(attributeConfig.picklistValues, {defaultValue:true});
							PAV[fieldName] = !_.isUndefined(defaultLOV) && _.isNull(PAV[fieldName]) ? defaultLOV.value : PAV[fieldName];
	                    }
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
				var fieldDescribe = getFieldDescribe(fdrWrapper.fdr);
				var dPicklistObj = {};
				if(fieldDescribe.fieldType == 'picklist'
					&& fieldDescribe.isDependentPicklist == true)
				{
					var controller = fieldDescribe.controllerName;
					var controllingpicklistOptions = response[controller].picklistOptions;
					dPicklistObj = getStructuredDependentFields(fdrWrapper.picklistOptions, controllingpicklistOptions);	
					
					service.dependentFieltoControllingFieldMap[fieldName] = controller;
				}

				service.fieldNametoDFRMap[fieldName] = {fieldDescribe:fieldDescribe, dPicklistObj:dPicklistObj};
			})
		}

		// load dropdown values of all dependent fields based on controlling field value selected..applicable on initial load of attributes.
		function applyDependentLOVSConfig(attributeConfig, PAV, dependentField, controllingField){
            var selectedPAVValue = _.has(PAV, dependentField) ? PAV[dependentField] : '';
            PAV[dependentField] = null;// set the dependentFile PAV to null.
            var options = [];
            var dFieldDefination = _.findWhere(service.PAVcFieldtodFieldDefinationMap, {dField:dependentField, cField:controllingField});
            if(_.isUndefined(dFieldDefination))
            {
            	if(_.has(dFieldDefination.objResult, selectedPAVValue))
	            {
	            	options = dFieldDefination.objResult[selectedPAVValue].slice();
				}
            }
            
            options.splice(0, 0, selectoptionObject(true, '--None--', null, false));
            attributeConfig.picklistValues = options;
		}
		
		// reload all dependent dropdowns on controlling field change.
		function applyDependedPicklistsOnChange_SingleField(attributeGroups, PAV, fieldName){
			var selectedPAVValue = PAV[fieldName];
			var dFieldDefinations = _.where(service.PAVcFieldtodFieldDefinationMap, {cField:fieldName});
            if(_.isEmpty(dFieldDefinations))
            {
            	return;
            }
            _.each(attributeGroups, function(attributeGroup){
				_.each(attributeGroup.productAtributes, function(attributeConfig){
                    // dependent field existing in the attribute group configuration.
                    // change the selectOptions of depenedent picklist fields.
                    var dField = attributeConfig.fieldName;
                    var dFieldDefination = _.findWhere(dFieldDefinations, {dField:dField});
                    if(!_.isUndefined(dFieldDefination))
                    {
                    	var dPicklistConfig = dFieldDefination.objResult;
                    	PAV[dField] = null;
                        var options = [];
                        if(_.has(dPicklistConfig, selectedPAVValue))
                        {
                        	options = dPicklistConfig[selectedPAVValue].slice();
            				options.splice(0, 0, selectoptionObject(true, '--None--', null, false));
                        }
                        
                        attributeConfig.picklistValues = options;
                        applyDependedPicklistsOnChange_SingleField(attributeGroups, PAV, dField);// more than one level-dependency could exist.
                    }
                })
			})
		}

		// prepare javascript version  of fieldDescribe based on Schema.DescribeFieldResult
		function getFieldDescribe(fieldDescribe){
			var res = {};
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

		// 
		function getStructuredDependentFields(dPicklistOptions, cPicklistOptions){
			var res = {};
			_.each(dPicklistOptions, function(picklistOption){
				var validFor = Bitset(picklistOption.validFor);
				for (int k = 0; k < validFor.size(); k++) {
					if (validFor.testBit(k)) {
					// if bit k is set, this entry is valid for the
					// for the controlling entry at index k

					}
				}
			})
			return res;
		}

		function Bitset(data){
			this.data = [];

			for (var i = 0; i < data.length; ++i) {
			    this.data.push(data.charCodeAt(i));
			}

			function testBit(n){
				return (this.data[n >> 3] & (0x80 >> n % 8)) != 0;
			}

			function size(){
		      return this.data.length * 8;
		    }
		}

		// convert list of string to List<Schema.PicklistEntry>.
		function prepareOptionsMap(objResult){
			var res = {};
			_.each(_.keys(objResult), function(cLOV){
				res[cLOV] = _.map(objResult[cLOV], function(dlov){
                    return selectoptionObject(true, dlov, dlov, false);
                });
			})
			return res;
		}

		// object structure of Schema.PicklistEntry.
		function selectoptionObject(active, label, value, isdefault){
			return {active:active, label:label, value:value, defaultValue:isdefault};
		}
	}
})();