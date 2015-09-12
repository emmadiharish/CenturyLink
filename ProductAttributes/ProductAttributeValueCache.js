(function() {
	angular.module('APTPS_ngCPQ').service('ProductAttributeValueCache', ProductAttributeValueCache); 
	ProductAttributeValueCache.$inject = ['$log'];
	function ProductAttributeValueCache($log) {
		var service = this;
		var isValid = false;
		var productIdtoPAVMap = {};

		service.getProductAttributeValues = getProductAttributeValues;
		service.initializeProductAttributeValues = initializeProductAttributeValues;

		function getProductAttributeValues(){
			return productIdtoPAVMap;
		}

		function initializeProductAttributeValues(response){
			isValid = true;
			_.each(response, function(pavwrapper){
				productIdtoPAVMap[pavwrapper.productId] = pavwrapper.pav;
			})
		}
	}
})();