(function() {
	angular.module('APTPS_ngCPQ').service('PricingMatrixDataService', PricingMatrixDataService); 
	PricingMatrixDataService.$inject = ['$q', '$log', 'QuoteDataService', 'RemoteService'];
	function PricingMatrixDataService($q, $log, QuoteDataService, RemoteService) {
		var service = this;

		service.pricingMatrixSearchRes = {};
		service.isValid = false;
		
		// Pricing Methods.
		service.getPricingMatrix = getPricingMatrix;
		
		function getPricingMatrix() {
			if (service.isValid) {
				// logTransaction(cachedLocations);
				return $q.when(service.pricingMatrixSearchRes);
			}
			
			var requestPromise = RemoteService.getPricingMatrixData(QuoteDataService.getbundleproductId());
			return requestPromise.then(function(response){
				service.isValid = true;
				service.pricingMatrixSearchRes = response;
				// logTransaction(response, categoryRequest);
				return service.pricingMatrixSearchRes;
			});
		}
		
	}
})();