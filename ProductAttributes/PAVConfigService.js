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

		function getPAVFieldMetaData(){
			if(service.isvalid == true)
			{
				return $q.when(service.fieldNametoDFRMap);
			}

			var requestPromise = RemoteService.getPAVFieldMetaData();
			return requestPromise.then(function(response_FieldDescribe){
				RemoteService.getPAVFieldMetaData().then(function(response_depPicklists){
					initializePAVDependentPicklistResult(response_depPicklists);
					initializefieldNametoDFRMap(response_FieldDescribe);
					return service.fieldNametoDFRMap;
				})
			});
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
            	dFieldDefinations[dField] = dpwrapper.objResult;
            	service.PAVcFieldtodFieldDefinationMap[cField] = dFieldDefinations;
            });
		}

		function initializefieldNametoDFRMap(response){
			service.isvalid = true;
			_.each(response, function(rawfieldDescribe, fieldName){
				service.fieldNametoDFRMap[fieldName] = getFieldDescribe(rawfieldDescribe);
			})
		}

		function loadPicklistDropDowns(attributeGroups, PAV){
			//var res = $scope.PAVDPicklistService.applyDependency_AllField(attributeconfigresult, pavresult);
            //res = $scope.PAVDPicklistService.addOtherPicklisttoDropDowns(res.pavConfigGroups, res.PAVObj);
			var res = {};
			_.each(attributeGroups, function(attributeGroup){
                _.each(attributeGroup.productAtributes, function(attributeConfig){
                    var fieldName = attributeConfig.fieldName;
                    var selectedvalue = PAV[fieldName];
                    if(service.fieldNametoDFRMap[fieldName].fieldType == 'picklist')
                    {
                    	attributeConfig['picklistValues'] = service.fieldNametoDFRMap[fieldName].picklistValues;
                		// if other option doesn't exist in the options then add it.
	                    if(!_.contains(_.pluck(attributeConfig.picklistValues, 'value'), selectedvalue) )
	                    {
	                    	attributeConfig.picklistValues.push({active:true, label:selectedvalue, value:selectedvalue, defaultValue: false});
	                    }    		
                    }
                })
            })
            res = {pavConfigGroups: attributeGroups, PAVObj: PAV};
			return res;
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
			res.splice(0, 0, {active:true, label:'--None--', value:null, defaultValue: false});
			return res;
		}
	}
})();