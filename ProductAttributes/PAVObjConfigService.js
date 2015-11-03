;(function() {
	'use strict';
	
	angular.module('APTPS_ngCPQ').service('PAVObjConfigService', PAVObjConfigService); 
	PAVObjConfigService.$inject = ['$q', '$log', 'BaseService', 'RemoteService'];
	function PAVObjConfigService($q, $log, BaseService, RemoteService) {
		var service = this;
		var optionOptionAttributes = {};
		var isOptiontoOptionAttrsvalid = false;
		
		service.isvalid = false;

		service.fieldNametoDFRMap = {};
		service.getPAVFieldMetaData = getPAVFieldMetaData;
		service.configurePAVFields = configurePAVFields;
		service.getPortOptions = getPortOptions;

		// helper methods;
		service.prepareOptionsList = prepareOptionsList;
		service.getPicklistValues = getPicklistValues;

		function getPAVFieldMetaData(){
			if(service.isvalid == true)
			{
				return $q.when(service.fieldNametoDFRMap);
			}

			var requestPromise = RemoteService.getPAVFieldMetaData();
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializefieldNametoDFRMap(response);
				BaseService.setPAVObjConfigLoadComplete();
				return RemoteService.getOptiontoOptionAttributes().then(function(optiontoOptionattrs){
					initializeportOptions(optiontoOptionattrs);
					BaseService.setOptiontoOptionAttributeLoadComplete();
					return service.fieldNametoDFRMap;
			    });
			});
		}
		function getPortOptions(){
			if(isOptiontoOptionAttrsvalid == true)
			{
				return optionOptionAttributes.portOptions;	
			}
			return [];
		}
		
		// this is applicable on page load or first time renedeing of attribute groups.
		// load picklist options from database.
		// apply dependent picklists.
		// apply default values from salesforce on first load.
		function configurePAVFields(attributeGroups, PAV){
			// cleanup PAV before loading picklist Drop Downs.
			_.each(attributeGroups, function(attributeGroup){
				// configure only on page load or first time...use custom property called 'isPicklistConfigComplete'.
                _.each(attributeGroup.productAtributes, function(attributeConfig){
                    var fieldName = attributeConfig.fieldName;
                    var fieldDescribe = service.fieldNametoDFRMap[fieldName].fieldDescribe;
                    if(attributeConfig.isHidden == false
                    	&& fieldDescribe.fieldType == 'picklist')
                    {
                		if(!_.isEmpty(attributeConfig.lovs))
                		{
                			// load picklist LOV's within APTPS_CPQ.productAtribute for dynamic attributes and custom attributes from custom settings: APTPS_ProdSpec_DynAttr__c. 
                			attributeConfig['picklistValues'] = getPicklistValues(prepareOptionsList(attributeConfig.lovs));
                		}
                		else{
                			// load Normal picklist LOV's from Salesforce config.
                    		attributeConfig['picklistValues'] = fieldDescribe.picklistValues;	
                		}
                		
                    	// load Other field value to Other field.
                    	var pavValue = PAV[fieldName];
                    	if((!_.has(PAV, 'isDefaultLoadComplete')
							|| PAV.isDefaultLoadComplete == false)
							&& _.contains(_.pluck(attributeConfig.picklistValues, 'value'), 'Other')
							&& _.isString(pavValue)
							&& pavValue.endsWith('**'))
	                    {
	                    	PAV[fieldName+'Other'] = pavValue.slice( 0, pavValue.lastIndexOf( "**" ));
	                    	PAV[fieldName] = 'Other';
	                    }
	                    	
                    	// load dependent picklists if current field is dependentField.
                    	if(fieldDescribe.isDependentPicklist == true)
                    	{
                    		var controllingField = fieldDescribe.controllerName;
                    		applyDependentLOVSConfig(attributeConfig, PAV, fieldName, controllingField);	
                    	}
                    	
                    	// if 'Other' LOV option exists in the database then add the previously selected value to options.
	                    /*var selectedOtherValue = PAV[fieldName+'Otherdb'];
	                    if(!_.isUndefined(selectedOtherValue)
	                    	&& !_.contains(_.pluck(attributeConfig.picklistValues, 'value'), selectedOtherValue) 
	                    	&& _.contains(_.pluck(attributeConfig.picklistValues, 'value'), 'Other'))
	                    {
	                    	attributeConfig.picklistValues.push(selectoptionObject(true, selectedOtherValue, selectedOtherValue, false));
	                    }*/ 
	                    
                    	// if dependend selected value does not exists in the options then set the PAV to null
						var selectedPAVValue = PAV[fieldName];
						if(!_.contains(_.pluck(attributeConfig.picklistValues,  'value'), selectedPAVValue))
						{
							PAV[fieldName] = null;// set the PAV of field to null.
						}
						
						if(!_.has(PAV, 'isDefaultLoadComplete')
							|| PAV.isDefaultLoadComplete == false)
	                    {
	              			// set the PAV to null if undefined. - To avoid extra dropdown if it is a picklists.
		                    PAV[fieldName] = _.isUndefined(PAV[fieldName]) ? null : PAV[fieldName];
		                	
		                	// set pav to default value from salesforce configuration.
		                	var defaultValue = fieldDescribe.defaultValue;
		                	PAV[fieldName] = !_.isUndefined(defaultValue) && _.isNull(PAV[fieldName]) ? defaultValue : PAV[fieldName];      	
	                    }
                    }
                    // if not picklist.
					else{

						
					}
				});
					
            });
				
			PAV['isDefaultLoadComplete'] = true;
            var res = {pavConfigGroups: attributeGroups, PAVObj: PAV};
			return res;
		}

		// ###################### private methods.###############################
		function initializefieldNametoDFRMap(response){
			service.isvalid = true;
			var fieldNametoFieldDescribeWrapperMap = response.fieldNametoFieldDescribeWrapperMap;
			_.each(fieldNametoFieldDescribeWrapperMap, function(fdrWrapper, fieldName){
				var fieldDescribe = getFieldDescribe(fdrWrapper);
				var dPicklistObj = {};
				if(fieldDescribe.fieldType == 'picklist'
					&& fieldDescribe.isDependentPicklist == true)
				{
					var controller = fieldDescribe.controllerName;
					var controllingpicklistOptions = fieldNametoFieldDescribeWrapperMap[controller].picklistOptions;
					dPicklistObj = getStructuredDependentFields(fdrWrapper.picklistOptions, controllingpicklistOptions);	
				}
				
				service.fieldNametoDFRMap[fieldName] = {fieldDescribe:fieldDescribe, dPicklistObj:dPicklistObj};
			})
		}

		function initializeportOptions(result){
			isOptiontoOptionAttrsvalid = true;
			var portOptions = [];
			_.each(result.portOptions, function(portOption){
				portOptions.push(portOption);
			})
			optionOptionAttributes ={ portOptions: portOptions };
		}
		
		// load dropdown values of all dependent fields based on controlling field value selected..applicable on initial load of attributes.
		function applyDependentLOVSConfig(attributeConfig, PAV, dependentField, controllingField){
            var cSelectedPAVValue = _.has(PAV, controllingField) ? PAV[controllingField] : null;
            var options = [];
            var dPicklistConfig = service.fieldNametoDFRMap[dependentField].dPicklistObj;
            if(_.has(dPicklistConfig, cSelectedPAVValue))
            {
            	options = dPicklistConfig[cSelectedPAVValue].slice();// do a slice to clone the list.
            }
            
            // if dependent fields are loaded from Custom settings then apply dependencies on top of custom settings. else just apply normal dependencies.
            if(!_.isEmpty(attributeConfig.lovs))
            {
            	options = _.filter(options , function(option){return _.contains(attributeConfig.lovs, option.value);})
            }
            
            // add None Option as first in the list.
            // options.splice(0, 0, selectoptionObject(true, '--None--', null, false));
            attributeConfig.picklistValues = options;
        }
		
		// prepare javascript version  of fieldDescribe based on Schema.DescribeFieldResult
		function getFieldDescribe(fdrWrapper){
			var res = {};
			var fieldDescribe = fdrWrapper.fdr;
			var fieldDescribe_addl = fdrWrapper.fdr_additional;

			res['fieldType'] = getFieldType(fieldDescribe.type);
			res['fieldName'] = fieldDescribe.name;
			res['fieldLabel'] = fieldDescribe.label;
			res['picklistValues'] = getPicklistValues(fieldDescribe.picklistValues);
			res['isDependentPicklist'] = fieldDescribe.dependentPicklist;// Returns true if the picklist is a dependent picklist, false otherwise.
			res['controllerName'] = fieldDescribe.controllerName;// Returns the token of the controlling field.
			res['isUpdateable'] = fieldDescribe.updateable;//Returns true if the field can be edited by the current user, or child records in a master-detail relationship field on a custom object can be reparented to different parent records; false otherwise.
			res['isCalculated'] = fieldDescribe.calculated;// Returns true if the field is a custom formula field, false otherwise. Note that custom formula fields are always read-only.
			res['isCreateable'] = fieldDescribe.createable;// Returns true if the field can be created by the current user, false otherwise.
			res['isRequired'] = !fieldDescribe.nillable;// Return false if field is marked as required at object level.
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
			if(sfdctype == 'picklist')
				return 'picklist';
			else if(sfdctype == 'multiPicklist')
				return 'multiPicklist';
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
			// res.splice(0, 0, selectoptionObject(true, '--None--', null, false));
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

		var base64 = new sforce.Base64Binary("");
        function testBit (validFor, pos) {
			validFor = base64.decode(validFor);
			var byteToCheck = Math.floor(pos/8);
			var bit = 7 - (pos % 8);
			return ((Math.pow(2, bit) & validFor.charCodeAt(byteToCheck)) >> bit) == 1;
		}
	}
})();