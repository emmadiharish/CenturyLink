/*
	This Service should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
	new variable should be introduced to prepare a componentId to optionGroups Map along with optionId to optionGroups Map
	or there is chance to save wrong configuration(sub bundle config of one productA option group 1 will be saved to productA in option group 2) and Hierarchial tree will be effected.
*/
(function() {
	angular.module('APTPS_ngCPQ').service('OptionGroupCache', OptionGroupCache); 
	OptionGroupCache.$inject = ['$log', 'BaseConfigService'];
	function OptionGroupCache($log, BaseConfigService) {
		var service = this;
		var prodIdtoOptionGroupsMap = {};
		var productIdtoComponentId_hasOptions = {};

		service.isValid = false;

		// Option Group Cache methods.
		service.getProductIdsofBundles = getProductIdsofBundles;
		service.getOptionGroups = getOptionGroups;
		service.initializeOptionGroups = initializeOptionGroups;

        function init(){
            // initalize with bundle prodId to bundle prod componentId.
            productIdtoComponentId_hasOptions[BaseConfigService.lineItem.bundleProdId] = BaseConfigService.lineItem.bundleProductOptionId;
        }

		function getOptionGroups() {
			return prodIdtoOptionGroupsMap;
		}

		function initializeOptionGroups(results) {
			_.map(results, (function(optionGroups, prodId){
                 /* removal of special characters*/
                _.each(optionGroups, function(group){
                	//group.groupName = characterRepace(group.groupName);
                	_.each(group.productOptionComponents, function(component){
                		//component.productName = characterRepace(component.productName);
                		if(_.has(productIdtoComponentId_hasOptions, prodId))
                		{
                			component['parentComponentId'] = productIdtoComponentId_hasOptions[prodId];
                		}
                		if(component.hasOptions == true)
                		{
                			productIdtoComponentId_hasOptions[component.productId] = component.componentId;
                		}
                	})
                })
                prodIdtoOptionGroupsMap[prodId] = optionGroups;
            }));
			service.isValid = true;
		}

		/*function characterRepace(item){
            var changedItem = item;
            changedItem = changedItem.split("&#39;").join("'");
            // unescape : replaces &amp;, &lt;, &gt;, &quot;, &#96; and &#x27; with their unescaped counterparts.
            changedItem = _.unescape(changedItem);          
            return changedItem;
        }*/

        function getProductIdsofBundles(){
        	return _.keys(productIdtoComponentId_hasOptions);	
        };

        init();
	}
})();