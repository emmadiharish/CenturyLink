(function() {
	angular.module('APTPS_ngCPQ').service('DependentPicklistDataService', DependentPicklistDataService); 
	DependentPicklistDataService.$inject = ['$q', '$log', 'RemoteService'];
	function DependentPicklistDataService($q, $log, RemoteService){
		var service = this;

		service.isValid = false;
		service.PAVDependentPicklistResult = {};

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
			_.each(response, function(dpwrapper){
				// service.PAVDependentPicklistResult.push(dpwrapper.pControllingFieldName, );
			})
		}
	}
})();