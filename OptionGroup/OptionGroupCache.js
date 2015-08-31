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
                 /* removal of special characters*/
                _.each(optionGroups, function(group){
                	group.groupName = characterRepace(group.groupName);
                	_.each(group.productOptionComponents, function(component){
                		component.productName = characterRepace(component.productName);
                	})
                })
                service.prodIdtoOptionGroupsMap[prodId] = optionGroups;
            }));
			service.isValid = true;
		}

		function characterRepace(item){
            var changedItem = item;
            changedItem = changedItem.split("&#39;").join("'");
            // unescape : replaces &amp;, &lt;, &gt;, &quot;, &#96; and &#x27; with their unescaped counterparts.
            changedItem = _.unescape(changedItem);          
            return changedItem;
        }
	}
})();