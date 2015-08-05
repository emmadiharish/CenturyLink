(function() {
	angular.module('APTPS_ngCPQ').service('ProductAttributeConfigCache', ProductAttributeConfigCache); 
	ProductAttributeConfigCache.$inject = ['$log'];
	function ProductAttributeConfigCache($log) {
		var service = this;
		//service.productIdtoproductgroupIdsMap = {};
		//service.groupIdtoattributegroupMap = {};
		service.prodductIdtoattributegroupsMap = {};
		service.productIdtodynamicattributegroupMap = {};
		service.isValid = false;
		
		// Product Attribute Cache methods.
		service.getProductAttributesConfig = getProductAttributesConfig;
		service.initializeProductAttributes = initializeProductAttributes;
		
		function getProductAttributesConfig() {
			var attributeResult = {'prodductIdtoattributegroupsMap' : service.prodductIdtoattributegroupsMap};
			return attributeResult;
		}

		function initializeProductAttributes(result) {
			_.each(result.productIdtoproductgroupIdsMap, function (groupIdsSet, prodId) {
                var attributeGroups = [];
                _.each(groupIdsSet, function(groupId){
            		attributeGroups.push(result.groupIdtoattributegroupMap[groupId]);
                });
                service.prodductIdtoattributegroupsMap[prodId] = attributeGroups;
            });
            
            // dynamic attribute groups.
			_.each(result.productIdtodynamicattributegroupMap, function (attributeGroup, prodpluslocationId) {
            	service.productIdtodynamicattributegroupMap[prodpluslocationId] = attributeGroup;
            });
			service.isValid = true;
		}
	}
})();