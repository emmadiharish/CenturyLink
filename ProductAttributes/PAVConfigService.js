(function() {
	angular.module('APTPS_ngCPQ').service('PAVConfigService', PAVConfigService); 
	PAVConfigService.$inject = ['$q', '$log', 'BaseService', 'RemoteService'];
	function PAVConfigService($q, $log, BaseService, RemoteService) {
		var service = this;
		service.isvalid = false;
		service.fieldNametoDFRMap = {};
		service.PAVcFieldtodFieldDefinationMap = {};

		service.getPAVFieldMetaData = getPAVFieldMetaData;
		service.loadPicklistDropDowns = loadPicklistDropDowns;
		service.getStructuredDependentFields = getStructuredDependentFields;

		function getPAVFieldMetaData(){
			if(service.isvalid == true)
			{
				return $q.when(service.fieldNametoDFRMap);
			}

			var requestPromise = RemoteService.getPAVFieldMetaData();
			return requestPromise.then(function(response_FieldDescribe){
				initializefieldNametoDFRMap(response_FieldDescribe);
				RemoteService.getPAVDependentPickListsConfig().then(function(response_depPicklists){
					initializePAVDependentPicklistResult(response_depPicklists);
				})
				return service.fieldNametoDFRMap;
			});
		}

		function loadPicklistDropDowns(attributeGroups, PAV){
			var res = {};
			loadNormalLOVSfromConfig(attributeGroups, PAV);
			applyDependentLOVSfromConfig_AllFields(attributeGroups, PAV);

			_.each(attributeGroups, function(attributeGroup){
				// configure only on page load.
                if(_.has(attributeGroup, 'isPicklistConfigComplete')
                	&& attributeGroup.isPicklistConfigComplete == false)
                {
	                _.each(attributeGroup.productAtributes, function(attributeConfig){
	                    var fieldName = attributeConfig.fieldName;
	                    if(service.fieldNametoDFRMap[fieldName].fieldType == 'picklist')
	                    {
	                    	// if other option doesn't exist in the options then add it.
		                    var selectedvalue = PAV[fieldName];
		                    if(!_.isUndefined(selectedvalue)
		                    	&& !_.contains(_.pluck(attributeConfig.picklistValues, 'value'), selectedvalue) )
		                    {
		                    	attributeConfig.picklistValues.push(selectoptionObject(true, selectedvalue, selectedvalue, false));
		                    }  		
	                    	
	                    	// apply default dropdown value from salesforce configuration.
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

		function getStructuredDependentFields(cField){
			var res = [];
			if(_.has(service.PAVcFieldtodFieldDefinationMap, cField))
			{
				res = service.PAVcFieldtodFieldDefinationMap[cField];
			}
			return res;	
		}

		// ###################### private methods.###############################
		function initializefieldNametoDFRMap(response){
			service.isvalid = true;
			_.each(response, function(rawfieldDescribe, fieldName){
				service.fieldNametoDFRMap[fieldName] = getFieldDescribe(rawfieldDescribe);
			})
		}

		function initializePAVDependentPicklistResult(response){
			service.isValid = true;
			_.each(response, function(dpwrapper){
				var cField = dpwrapper.pControllingFieldName;
				var dField = dpwrapper.pDependentFieldName;
				
				var dFieldDefinations = {};
            	if(_.has(service.PAVcFieldtodFieldDefinationMap, cField))
            	{
            		dFieldDefinations = service.PAVcFieldtodFieldDefinationMap[cField];
            	}
            	dFieldDefinations[dField] = prepareOptionsMap(dpwrapper.objResult);
            	service.PAVcFieldtodFieldDefinationMap[cField] = dFieldDefinations;
            });
		}

		function loadNormalLOVSfromConfig(attributeGroups, PAV){
			_.each(attributeGroups, function(attributeGroup){
                _.each(attributeGroup.productAtributes, function(attributeConfig){
                    var fieldName = attributeConfig.fieldName;
                    if(service.fieldNametoDFRMap[fieldName].fieldType == 'picklist')
                    {
                    	attributeConfig['picklistValues'] = service.fieldNametoDFRMap[fieldName].picklistValues;
                	}
				})
            })
		}

		function applyDependentLOVSfromConfig_AllFields(attributeGroups, PAV){
			var res = {};
			var allCFields = [];
			// get the intersection of fields in attribute groups and controlling fields from PAV object.
			_.each(attributeGroups, function(attributeGroup){
                allCFields.push.apply(allCFields, _.intersection(_.keys(service.PAVcFieldtodFieldDefinationMap), _.pluck(attributeGroup.productAtributes, 'fieldName')));
            })

			// if config field is controlling field then apply dependencies.
            _.each(allCFields, function(fieldName){
            	applyDependentLOVSfromConfig_singleField(attributeGroups, PAV, fieldName);
			})
            //res = {pavConfigGroups: attributeGroups, PAVObj: PAV};
			//return res;
		}

		function applyDependentLOVSfromConfig_singleField(attributeGroups, PAV, fieldName){
            var selectedPAVValue = _.has(PAV, fieldName) ? PAV[fieldName] : '';
            var dFieldDefinations = getStructuredDependentFields(fieldName);
            var dFields = _.keys(dFieldDefinations);
            // Iterate over all dependent fields and change its dropdown values according to controlling field value selected.
            _.each(attributeGroups, function(attributeGroup){
                _.each(attributeGroup.productAtributes, function(attributeConfig){
                    // dependent field existing in the attribute group configuration.
                    // change the selectOptions of depenedent picklist fields.
                    var dField = attributeConfig.fieldName;
                    if(_.contains(dFields, dField))
                    {
                        // var dPicklistConfig = dFieldDefinations[dField];
                        var options = [];
                        PAV[dField] = null;
                        // options.push({label:'--None--', value:null});
                        options = dFieldDefinations[dField][selectedPAVValue];
                        options.splice(0, 0, selectoptionObject(true, '--None--', null, false));
                        attributeConfig.picklistValues = options;
                    }
                })
            })    
        }

        function getFieldDescribe(fieldDescribe){
			var res = {};
			res['fieldType'] = getFieldType(fieldDescribe.type);
			res['fieldLabel'] = fieldDescribe.label;
			res['picklistValues'] = getPicklistValues(fieldDescribe.picklistValues);
			//res[] = ;
			//res[] = ;
			//res[] = ;
			return res;
		}

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

		function getPicklistValues(ples){
			var res = [];// defaultValue
			// add a blank option.{--None--}
			res = ples;
			res.splice(0, 0, selectoptionObject(true, '--None--', null, false));
			return res;
		}

		function prepareOptionsMap(objResult){
			var res = {};
			_.each(_.keys(objResult), function(cLOV){
				res[cLOV] = _.map(objResult[cLOV], function(dlov){
			                        	return selectoptionObject(true, dlov, dlov, false);
			                });
			})
			return res;
		}

		function selectoptionObject(active, label, value, isdefault){
			return {active:active, label:label, value:value, defaultValue:isdefault};
		}
	}
})();