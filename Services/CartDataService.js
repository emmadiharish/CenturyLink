;(function() {
    'use strict';
    
    angular.module('APTPS_ngCPQ').service('CartDataService', CartDataService); 
    CartDataService.$inject = [ '$q', 
                                  '$log', 
                                  'BaseService', 
                                  'BaseConfigService', 
                                  'RemoteService',
                                  'OptionGroupDataService' 
                                ];
    function CartDataService($q, $log, BaseService, BaseConfigService, RemoteService, OptionGroupDataService){
        var service = this;
        var nsPrefix = 'Apttus_Config2__';

        service.addToBundle = addToBundle;
        service.addToCart = addToCart;
        service.removeFromBundle = removeFromBundle;
        //service.removeFromCart = removeFromCart;
        service.getLineItems = getLineItems;

        service.autoIncludeOptions = autoIncludeOptions;
        service.disableOptionSelections = disableOptionSelections;
        /**
         * Add option line items to bundle based on product id.
         * @param targetBundleNumber primary line number of the target bundle
         * @param productDO productSO wrapper which is an option
         */
        function addToBundle(productDO) {
            //Ensure array of product DOs
            var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(productcomponent.productId == productDO.Id)
                        {
                            // apply rule only if option is selected.
                            if(!isProdSelected(productcomponent))
                            {    
                                
                                // if product is radio then include using group by setting selectedproduct.
                                if(optiongroup.ischeckbox == false)
                                {
                                   optiongroup.selectedproduct = productcomponent.productId;
                                }
                                else{
                                    // if product is checkbox then include it.
                                    productcomponent.isselected = true;
                                }
                            }
                            //break;
                        }
                    })
                })
            })
        }

        /**
         * Add one or more products to the cart and return the new line items.
         * A product wrapper just needs the properties "productSO" and "quantity",
         *  which is made to fit with how products are wrapped by the category directive.
         * If the input is exactly one product object instead of an array, the promise
         *  resolves with one line item instead of an array of line items. May change
         *  this for consistency.
         *  
         * @param {object/array}        productWrappers 
         * @return {promise}    promise that resolves with the collection of new line items
         */
        function addToCart(productWrappers) {
            $log.info('adding products to Cart.'+productWrappers);
            //Ensure array structure
            var allProductWrappers = [].concat(productWrappers);
            var AddProductstoCartRequestDO = getAddProductstoCartRequestDO(allProductWrappers);
            var requestPromise = RemoteService.addProductstoCart(AddProductstoCartRequestDO);
            var deferred = $q.defer();
            requestPromise.then(function(result){

            });
            return deferred.promise;
        }

        /**
         * Remove an option on a particluar bundle. 
         * @param targetBundleNumber primary line number of the target bundle
         * @param productDO productSO wrapper which is an option
         * @return {[type]}                    [description]
         */
        function removeFromBundle(productDOs) {
            //Ensure array of product DOs
            var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(productcomponent.productId == productDO.Id)
                        {
                            // apply rule only if option is selected.
                            if(isProdSelected(productcomponent))
                            {
                                // if disabled product is selected as radio then remove it.
                                if(optiongroup.ischeckbox == false)
                                {
                                   optiongroup.selectedproduct = null;
                                }
                                else{
                                    // if disabled product is selected as checkbox then remove it.
                                    productcomponent.isselected = false;
                                }
                            }
                            // productcomponent['isDisabled'] = true;
                            //break;
                        }
                    })
                })
            })
        }

        /**
         * Remove an array of line items from cart. These items can be
         *  from the server or temporary items -- the cache handles 
         *  organizing what to delete.
         *  
         * @param  {array}  lineItems 
         * @return {promise}    promise that resolves with the cart line
         *                    items either immediately or after the 
         *                    delete has ben sync'd
         */
        /*function removeFromCart(lineItems) {
            lineItems = [].concat(lineItems);
            //Set line action
            //Remove all items that haven't been sync'd
            var needSync = LineItemCache.removeLineItems(lineItems);
            FieldExpressionCache.updateCacheAfterItemDelete(LineItemCache.getLineItemsByPrimaryLineNumber());
            refreshItemsFromCache();
            if (needSync) {
                return ActionQueueService.scheduleAction(['update', 'finish']);

            }
            return $q.when(lineItemArray);
        }*/

        function autoIncludeOptions(productIds){
            //Ensure array of product DOs
            var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(_.contains(productIds, productcomponent.productId))
                        {
                            // apply rule only if option is selected.
                            if(!isProdSelected(productcomponent))
                            {    
                                
                                // if product is radio then include using group by setting selectedproduct.
                                if(optiongroup.ischeckbox == false)
                                {
                                   optiongroup.selectedproduct = productcomponent.productId;
                                }
                                else{
                                    // if product is checkbox then include it.
                                    productcomponent.isselected = true;
                                }
                            }
                            //break;
                        }
                    })
                })
            })
        }

        function disableOptionSelections(productIds){
            var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        if(_.contains(productIds, productcomponent.productId))
                        {
                            // apply rule only if option is selected.
                            if(isProdSelected(productcomponent))
                            {
                                // if disabled product is selected as radio then remove it.
                                if(optiongroup.ischeckbox == false)
                                {
                                   optiongroup.selectedproduct = null;
                                }
                                else{
                                    // if disabled product is selected as checkbox then remove it.
                                    productcomponent.isselected = false;
                                }
                            }
                            productcomponent['isDisabled'] = true;
                            //break;
                        }
                    })
                })
            })
        }

        function isProdSelected(productcomponent){
            if(productcomponent.isselected)
                return true;
            return false;
        }
        
        function getLineItems(primaryNumber){
            // return all option products under this bundle primaryNumber
            return [];
        }

        function getCartHeader() {
            var cartHeader = {
                "cartId": BaseConfigService.cartId,
                "configRequestId": BaseConfigService.configRequestId,
                "flowName": BaseConfigService.flowName
            };

            return cartHeader;
        }

        function getAddProductstoCartRequestDO(productWrapList){
            var requestDO = {
                "cartHeader":getCartHeader(),
                "productWrapList":productWrapList
            };
            return requestDO;
        }
    }                                  
})();