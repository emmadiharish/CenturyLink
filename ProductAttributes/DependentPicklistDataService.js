(function() {
	angular.module('APTPS_ngCPQ').service('DependentPicklistDataService', DependentPicklistDataService); 
	DependentPicklistDataService.$inject = ['$q', '$log', 'RemoteService'];
	function DependentPicklistDataService($q, $log, RemoteService){
		var service = this;

		service.isValid = false;
		service.PAVControllingfieldtoDependentfieldsMap = {};
		service.PAVFieldCombinationtoDependentOptionsMap = {};

		service.getProductAttributeValues = getProductAttributeValues;

		function getProductAttributeValues(){
			if (service.isValid){
				return $q.when(service.PAVDependentPicklistResult);
			}

			var requestPromise = RemoteService.(productIds_filtered, QuoteDataService.getcartId(), QuoteDataService.getcontextLineNumber());
			return requestPromise.then(function(response){
				service.initializePAVDependentPicklistResult(response);
				return service.PAVDependentPicklistResult;
			});
		}

		function initializePAVDependentPicklistResult(response){
			var res = {};
			_.each(response, function(dpwrapper){
				var cField = dpwrapper.pControllingFieldName;
				var dField = dpwrapper.pDependentFieldName;
				var dependentFields = _.has(res, cField) ?  _.propertyOf(res)('cField') : [];
            	dependentFields.push(dField);
            	res[cField] = dependentFields;
            });
            service.PAVFieldCombinationtoDependentOptionsMap[cField+dField] = dpwrapper.objResult;
			service.PAVControllingfieldtoDependentfieldsMap = res;
		}
	}
})();