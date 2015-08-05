(function() {
	angular.module('APTPS_ngCPQ').service('OptionGroupCache', OptionGroupCache); 
	OptionGroupCache.$inject = ['$log'];
	function OptionGroupCache($log) {
		var service = this;
		service.prodIdtoOptionGroupsMap = {};
		service.isValid = false;

		// Option Group Cache methods.
		service.getOptionGroups = getOptionGroups;
		
		service.initializeOptionGroups = initializeOptionGroups;

		function getOptionGroups() {
			return service.prodIdtoOptionGroupsMap;
		}

		function initializeOptionGroups(prodIdtoOptionGroupsMap) {
			_.map(prodIdtoOptionGroupsMap, (function(optionGroups, prodId){
                service.prodIdtoOptionGroupsMap[prodId] = optionGroups;
            }));
			service.isValid = true;
		}
	}
})();