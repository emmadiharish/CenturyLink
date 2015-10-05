(function() {
	angular.module('APTPS_ngCPQ').service('MiniCartDataService', MiniCartDataService); 
	MiniCartDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService', 'RemoteService'];
	function MiniCartDataService($q, $log, BaseService, BaseConfigService, RemoteService){
		var service = this;
		var miniCartLines = [];
		var miniCartLinesCount = 0;

		service.isValid = false;
		
		service.getMiniCartLines = getMiniCartLines;
		service.getminiCartLinesCount = getminiCartLinesCount;
		service.setMinicartasDirty = setMinicartasDirty;
		service.configureLineItem = configureLineItem;
		service.deleteLineItemFromCart = deleteLineItemFromCart;
		
		
		function getMiniCartLines() {
			if (service.isValid) {
				return $q.when(miniCartLines);
			}
			
			var requestPromise = RemoteService.getMiniCartLines(BaseConfigService.cartId);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				service.isValid = true;
				BaseService.setMiniCartLoadComplete();
				miniCartLines = response;
				miniCartLinesCount = response.length;
				return miniCartLines;
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
            var requestPromise = RemoteService.deleteLineItemFromCart(cartId, configRequestId, flowName, lineNumber_tobedeleted, currentlineNumber);
			return requestPromise.then(function(response){
				return response;
			});
		}

		function setMinicartasDirty(){
			service.isValid = false;
		}

		function getminiCartLinesCount(){
			return miniCartLinesCount;
		}
	}
})();