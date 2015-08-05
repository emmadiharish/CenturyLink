(function() {
	angular.module('APTPS_ngCPQ').service('ProductAttributeValueCache', ProductAttributeValueCache); 
	ProductAttributeValueCache.$inject = ['$log'];
	function ProductAttributeValueCache($log) {
		var service = this;

		service.isValid = false;
		service.productIdtoPAVMap = {};

		service.getProductAttributeValues = getProductAttributeValues;
		service.initializeProductAttributeValues = initializeProductAttributeValues;

		function getProductAttributeValues(){
			return service.productIdtoPAVMap;
		}

		function initializeProductAttributeValues(response){
			service.isValid = true;
			_.each(response, function(pavwrapper){
				service.productIdtoPAVMap[pavwrapper.productId] = pavwrapper.pav;
			})
		}
	}
})();