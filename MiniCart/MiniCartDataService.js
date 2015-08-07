(function() {
	angular.module('APTPS_ngCPQ').service('MiniCartDataService', MiniCartDataService); 
	MiniCartDataService.$inject = ['$q', '$log', 'QuoteDataService', 'RemoteService'];
	function MiniCartDataService($q, $log, QuoteDataService, RemoteService){
		var service = this;

		service.isValid = false;
		service.miniCartLines = {};
				
		// Pricing Methods.
		service.getPricingMatrix = getPricingMatrix;
		
		function getPricingMatrix() {
			if (service.isValid) {
				return $q.when(service.miniCartLines);
			}
			
			var requestPromise = RemoteService.getMiniCartLines(QuoteDataService.getcartId());
			return requestPromise.then(function(response){
				service.isValid = true;
				service.miniCartLines = response;
				return service.miniCartLines;
			});
		}
	}
})();