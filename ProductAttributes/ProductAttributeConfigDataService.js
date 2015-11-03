;(function() {
	'use strict';
    
    angular.module('APTPS_ngCPQ').service('ProductAttributeConfigDataService', ProductAttributeConfigDataService); 
	ProductAttributeConfigDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService', 'RemoteService', 'OptionGroupDataService', 'ProductAttributeConfigCache'];
	function ProductAttributeConfigDataService($q, $log, BaseService, BaseConfigService, RemoteService, OptionGroupDataService, ProductAttributeConfigCache) {
		var service = this;
		
		var bundleAttribueFields = [];

		// product attribute methods.
		service.getProductAttributesConfig = getProductAttributesConfig;
		service.getDynamicGroups = getDynamicGroups;
		service.getBundleAttributeFields = getBundleAttributeFields;
		service.setBundleAttributeFields = setBundleAttributeFields;
		
		function getProductAttributesConfig_bulk(servicelocationIdSet, productIds, groupIds) {
			// check if cachedProductAttributes has products requested for else make a remote call.
			var cachedProductAttributes = ProductAttributeConfigCache.getProductAttributesConfig();
			var existingproductIds = _.keys(cachedProductAttributes.prodductIdtoattributegroupsMap);
			var productIds_filtered = _.filter(productIds, function(Id){ return !_.contains(existingproductIds, Id); });
			if (ProductAttributeConfigCache.isValid
				&& productIds_filtered.length < 1) {
				// logTransaction(cachedProductAttributes);
				return $q.when(cachedProductAttributes);
			}

			// locationRequest = createOptionGroupRequestDO(productIds_filtered, BaseConfigService.getcartId(), BaseConfigService.getcontextLineNumber());
			var attributeGroupRequest = {servicelocationIds:servicelocationIdSet
                                        , bundleprodId: BaseConfigService.lineItem.bundleProdId
                                        , productIdsList: productIds_filtered
                                        , allgroupIds: groupIds
                                        };
            var requestPromise = RemoteService.getAttributeGroups(attributeGroupRequest);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				ProductAttributeConfigCache.initializeProductAttributes(response);
				// logTransaction(response, categoryRequest);
				BaseService.setPAConfigLoadComplete();
				return ProductAttributeConfigCache.getProductAttributesConfig();
			});
		}

		function getProductAttributesConfig( productId, alllocationIdSet, selectedlocationId) {
			var productIdset = [], allgroupIds = [];
			var currentproductoptiongroups = OptionGroupDataService.getcurrentproductoptiongroups();
            var prodattributeResult = ProductAttributeConfigCache.getProductAttributesConfig();
			var dynamicgroupId = selectedlocationId != '' ? productId+selectedlocationId : '';
			if (ProductAttributeConfigCache.isValid
				&& prodattributeResult != null
				&& prodattributeResult.prodductIdtoattributegroupsMap != null
				&& _.has(prodattributeResult.prodductIdtoattributegroupsMap, productId))
			{
				var res = buildattributegroups(prodattributeResult.prodductIdtoattributegroupsMap, productId, prodattributeResult.productIdtodynamicattributegroupMap,
															dynamicgroupId);
				return $q.when(res);
			}

			productIdset = getAllProductsinCurrentOptiongroups(currentproductoptiongroups, 'productOptionComponents', 'productId');
            productIdset.push(productId);
            
            return getProductAttributesConfig_bulk(alllocationIdSet, productIdset, allgroupIds).then(function(result) {
            	var res = buildattributegroups(result.prodductIdtoattributegroupsMap, productId, result.productIdtodynamicattributegroupMap,
                                                        dynamicgroupId);
            	return res;
            });
		}

		function getDynamicGroups(groupId){
			var res = [];
			var prodattributeResult = ProductAttributeConfigCache.getProductAttributesConfig();
			if(_.has(prodattributeResult.productIdtodynamicattributegroupMap, groupId))
            {
                var dynamicgroup = prodattributeResult.productIdtodynamicattributegroupMap[groupId];
                res.push(dynamicgroup);
            }
            return res;
		}

		// Util methid. a: product Id to attribute groups map, b: productId, c: product to dynamic group map., d: dynamic group Id.
        function buildattributegroups(a, b, c, d){
            var res = [];
            if(_.has(a, b))
            {
                _.each(a[b], function(g) {
                    res.push(g);
                })
            }
            
            if(_.isObject(c)
            	&& _.has(c, d))
            {
                res.push(c[d]);
            }
            return res;
        }

        // Util methid. a: product Id to attribute groups map, b: productId, c: product to dynamic group map., d: dynamic group Id.
        /*function buildattributegroups(prodIdtoattributegroups, prodId, prodIdtodynamicattributegroups, dynamicgroupId){
            var res = [];
            
            // collect all dynamic attributes if exists.
            var dynamicAttributes = {};
            if(_.isObject(prodIdtodynamicattributegroups)
            	&& _.has(prodIdtodynamicattributegroups, dynamicgroupId))
            {
                _.each(prodIdtodynamicattributegroups[dynamicgroupId].productAtributes, function(dynamicattribute){
                	dynamicAttributes[dynamicattribute.fieldName] = dynamicattribute;
                })
            }

            // get attributes configured at product level.
            if(_.has(prodIdtoattributegroups, prodId))
            {
                _.each(prodIdtoattributegroups[prodId], function(g) {
                    res.push(g);
                })
            }

            // replace attributes(product level) values with dynamic attributes from location availability.
            if(!_.isEmpty(dynamicAttributes))
            {
            	_.each(res, function(attrGroup){
	            	_.each(attrGroup.productAtributes, function(prodAttribute){
	            		if(_.has(dynamicAttributes, prodAttribute.fieldName))
	            		{
	            			prodAttribute.lovs = dynamicAttributes[prodAttribute.fieldName].lovs;
	            			// unhide dynamic attribute if lov's exists.
	            			prodAttribute.isHidden = _.size(prodAttribute.lovs) > 0 ? false : prodAttribute.isHidden;
	            			prodAttribute.isDynamicAttr = true;
	            		}
	            	})
	            })	
            }
            return res;
        }*/

		// util method. a: option groups, b: field name to access product components, c: field name to access product Id within product component.
        function getAllProductsinCurrentOptiongroups(a, b, c){
            // return a list of bundle product Id's. based on flag provided.
            var res = [];
            _.each(a, function (group) {
                res.push(_.pluck(group[b], c));
            });
            res = _.flatten(res);// Flattens a nested array.
            res = _.filter(res, function(prodId){return !_.isUndefined(prodId)});
            return res;
        }

        function setBundleAttributeFields(attrgroups){
        	_.each(attrgroups, function(attrgroup){
                bundleAttribueFields.push(_.pluck(attrgroup.productAtributes, 'fieldName'));
            })
            bundleAttribueFields = _.flatten(bundleAttribueFields);
        }

        function getBundleAttributeFields(){
        	return bundleAttribueFields;
        }
    }
})();