(function() {
	angular.module('APTPS_ngCPQ').service('DependentPicklistDataService', DependentPicklistDataService); 
	DependentPicklistDataService.$inject = ['$q', '$log', 'RemoteService'];
	function DependentPicklistDataService($q, $log, RemoteService){
		var service = this;

		service.isValid = false;
		service.PAVcFieldtodFieldDefinationMap = {};
		service.PAVcFieldtodFieldssMap = {};
		service.PAVFieldDOptionsMap = {};

		service.getDependentPicklistInformation_bulk = getDependentPicklistInformation_bulk;
		service.getDependentPicklistInformation = getDependentPicklistInformation;
		service.getStructuredDependentFields = getStructuredDependentFields;

		function getDependentPicklistInformation(cField){
			if (service.isValid){
				return $q.when(getStructuredDependentFields(cField));
			}

			return getDependentPicklistInformation_bulk().then(function(response){
				return getStructuredDependentFields(cField);
			});
		}

		function getDependentPicklistInformation_bulk(){
			var requestPromise = RemoteService.getPAVDependentPickListsConfig();
			return requestPromise.then(function(response){
				initializePAVDependentPicklistResult(response);
				return response;
			});
		}

		function initializePAVDependentPicklistResult(response){
			var res = {};
			_.each(response, function(dpwrapper){
				var cField = dpwrapper.pControllingFieldName;
				var dField = dpwrapper.pDependentFieldName;
				var dependentFields = _.has(res, cField) ?  _.propertyOf(res)(cField) : [];
            	dependentFields.push(dField);
            	res[cField] = dependentFields;
            	service.PAVFieldDOptionsMap[cField+dField] = dpwrapper.objResult;
            	
            	var dFieldDefination = {};
            	dFieldDefination[dField] = dpwrapper.objResult;
            	var dFieldDefinationList = [];
            	if(_.has(service.PAVcFieldtodFieldDefinationMap, cField))
            	{
            		dFieldDefinationList = service.PAVcFieldtodFieldDefinationMap[cField];
            	}
            	dFieldDefinationList.push(dFieldDefination);
            	service.PAVcFieldtodFieldDefinationMap[cField] = dFieldDefinationList;
            });

            service.PAVcFieldtodFieldssMap = res;
		}

		function getStructuredDependentFields(cField){
			var res = [];
			if(_.has(service.PAVcFieldtodFieldDefinationMap, cField))
			{
				res = service.PAVcFieldtodFieldDefinationMap[cField];
			}
			return res;	
		}

		function getStructuredDependentFields_old(cField){
			var res = {};
			if(_.has(service.PAVcFieldtodFieldssMap, cField))
			{
				var dFields = getListOfDependentFieldsfor(cField);

				res[cField+'DependentFieldsList'] = dFields;

				_.each(dFields, function(dField){
					var fieldcombination = cField+dField;
					if(_.has(service.PAVFieldDOptionsMap, fieldcombination))
					{
						res[fieldcombination] = service.PAVFieldDOptionsMap[fieldcombination];
					}
				});
			}
			return res;	
		}

		function getListOfDependentFieldsfor(cField){
			var res = [];
			if(_.has(service.PAVcFieldtodFieldssMap, cField))
			{
				_.each(service.PAVcFieldtodFieldssMap[cField], function(fields){
					res.push(fields);
				});
				res = _.flatten(res);
			}
			return res;	
		}
	}
})();