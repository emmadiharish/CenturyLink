(function() {
	angular.module('APTPS_ngCPQ').service('MiniCartDataService', MiniCartDataService); 
	MiniCartDataService.$inject = ['$q', '$log', 'QuoteDataService', 'RemoteService'];
	function MiniCartDataService($q, $log, QuoteDataService, RemoteService){
		var service = this;

		service.isValid = false;
		service.miniCartLines = [];
		service.miniCartLinesCount = 0;
				
		// Pricing Methods.
		service.getMiniCartLines = getMiniCartLines;
		service.getminiCartLinesCount = getminiCartLinesCount;
		service.setMinicartasDirty = setMinicartasDirty;

		
		function getMiniCartLines() {
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

		function setMinicartasDirty(){
			service.isValid = false;
		}

		function getminiCartLinesCount(){
			return service.miniCartLines.length;
		}
	}
})();