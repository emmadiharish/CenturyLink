(function() {
	angular.module('APTPS_ngCPQ').service('MiniCartDataService', MiniCartDataService); 
	MiniCartDataService.$inject = ['$q', '$log', 'QuoteDataService', 'RemoteService'];
	function MiniCartDataService($q, $log, BaseConfigService, QuoteDataService, RemoteService){
		var service = this;
		service.quoteService = QuoteDataService;

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
			var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName;
			var requestPromise = RemoteService.configureLineItem(cartId, configRequestId, flowValue, lineItemId);
			return requestPromise.then(function(response){
				return response;
			});
		}

		function deleteLineItemFromCart(lineNumber_tobedeleted){
			var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName, currentlineNumber = BaseConfigService.bundleLineNumber;
            var requestPromise = RemoteService.deleteLineItemFromCart(cartId, configRequestId, lineNumber_tobedeleted, currentlineNumber);
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