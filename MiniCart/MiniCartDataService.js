(function() {
	angular.module('APTPS_ngCPQ').service('MiniCartDataService', MiniCartDataService); 
	MiniCartDataService.$inject = ['$q', '$log', 'QuoteDataService', 'RemoteService'];
	function MiniCartDataService($q, $log, QuoteDataService, RemoteService){
		var service = this;
		$scope.quoteService = QuoteDataService;
		
		service.isValid = false;
		service.miniCartLines = [];
		service.miniCartLinesCount = 0;
				
		// Pricing Methods.
		service.getMiniCartLines = getMiniCartLines;
		service.getminiCartLinesCount = getminiCartLinesCount;
		service.setMinicartasDirty = setMinicartasDirty;
		service.configureLineItem = configureLineItem;
		service.deleteLineItemFromCart = deleteLineItemFromCart;
		
		
		function getMiniCartLines() {
			if (service.isValid) {
				return $q.when(service.miniCartLines);
			}
			
			var requestPromise = RemoteService.getMiniCartLines(QuoteDataService.getcartId());
			return requestPromise.then(function(response){
				service.isValid = true;
				service.miniCartLines = response;
				service.miniCartLinesCount = response.length;
				return service.miniCartLines;
			});
		}

		function configureLineItem(lineItemId){
			var cartId = $scope.quoteService.getcartId(), configRequestId = $scope.quoteService.getconfigRequestId();
			var requestPromise = RemoteService.configureLineItem(cartId, configRequestId, lineItemId);
			return requestPromise.then(function(response){
				return response;
			});
		}

		function deleteLineItemFromCart(lineNumber_tobedeleted){
			var cartId = $scope.quoteService.getcartId(), configRequestId = $scope.quoteService.getconfigRequestId(), currentlineNumber = $scope.quoteService.getcontextLineNumber();
            var requestPromise = RemoteService.configureLineItem(cartId, configRequestId, lineNumber_tobedeleted, currentlineNumber);
			return requestPromise.then(function(response){
				return response;
			});
		}

		function setMinicartasDirty(){
			service.isValid = false;
		}

		function getminiCartLinesCount(){
			return service.miniCartLinesCount;
		}
	}
})();