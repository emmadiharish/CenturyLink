/*
    This service should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
;(function() {
    'use strict';
    angular.module('APTPS_ngCPQ').service('OptionGroupDataService', OptionGroupDataService); 
    OptionGroupDataService.$inject = ['$q', 
                                        '$log', 
                                        'BaseService', 
                                        'BaseConfigService', 
                                        'RemoteService', 
                                        'MessageService', 
                                        'ProductDataService', 
                                        'OptionGroupCache',
                                        'LocationDataService'];
    function OptionGroupDataService($q, $log, BaseService, BaseConfigService, RemoteService, MessageService, ProductDataService, OptionGroupCache, LocationDataService) {
        var service = this;
        
        var Selectedoptionproduct = {};// to render option attributes.
        var currentproductoptiongroups = {};
        var rerenderHierarchy = false;// to render option group hierarchy whenever product is added/removed from option groups.
        var slectedOptionGroupProdId;// to render option groups based on group hierarchy traversal.
        var showConfigureOptionstab = true;// used to hide the 'Configure Options' tab if no option group exists.
        var currentSubBundleLevel = 0;
        var maxSubBundleLevel = 5;// constant to limit the option group recursive remote call.
        
        // option group methods.
        service.getallOptionGroups = getallOptionGroups;
        service.getOptionGroup = getOptionGroup;
        service.getSelectedoptionproduct = getSelectedoptionproduct;
        service.setSelectedoptionproduct = setSelectedoptionproduct;
        service.getcurrentproductoptiongroups = getcurrentproductoptiongroups;
        service.getrerenderHierarchy = getrerenderHierarchy;
        service.setrerenderHierarchy = setrerenderHierarchy;
        service.getslectedOptionGroupProdId = getslectedOptionGroupProdId;
        service.setslectedOptionGroupProdId = setslectedOptionGroupProdId;
        
        function getallOptionGroups(){
            return OptionGroupCache.getOptionGroups();
        }
        
        /* recurvive function to query all option groups on page load
           will load upto 5 levels */
        function getOptionGroups(productIds, deferred) {
            if (!deferred) {
                deferred = $q.defer();
            }

            var optionGroupRequest = {
                                      productIds: productIds
                                      , cartId: BaseConfigService.cartId  
                                      , lineNumber: BaseConfigService.lineItem.lineNumber
                                    };
            var requestPromise = RemoteService.getProductoptiongroupsData(optionGroupRequest);
            requestPromise.then(function(response) {
                OptionGroupCache.initializeOptionGroups(response);
                var cachedOptionGroups = OptionGroupCache.getOptionGroups();
                var alloptionProductIds_hasOptions = OptionGroupCache.getProductIdsofBundles();
                var prodIds_filtered = _.difference(alloptionProductIds_hasOptions, _.keys(cachedOptionGroups)); 
                if (prodIds_filtered.length > 0
                    && currentSubBundleLevel < maxSubBundleLevel) {
                    getOptionGroups(prodIds_filtered, deferred);
                    currentSubBundleLevel++;    
                }
                else{
                    deferred.resolve();
                    BaseService.setOptionGroupLoadComplete();
                    return deferred.promise;
                }
            });

            deferred.notify();
            return deferred.promise;
        }

        function getOptionGroup(productId) {
            var cachedOptionGroups = OptionGroupCache.getOptionGroups();
            if (OptionGroupCache.isValid
                && _.has(cachedOptionGroups, productId)){
                setcurrentproductoptiongroups(cachedOptionGroups[productId]);
                return $q.when(true);
            }

            var bundleproductIds = [];
            bundleproductIds.push(productId);
            return getOptionGroups(bundleproductIds).then(function(response){
                cachedOptionGroups = OptionGroupCache.getOptionGroups();
                setcurrentproductoptiongroups(cachedOptionGroups[productId]);
                return true;
            })
        }

        function getSelectedoptionproduct() {
            return Selectedoptionproduct;
        }

        function setSelectedoptionproduct(optionComponent) {
            if(_.isObject(optionComponent)
                && !_.isEmpty(optionComponent))
                Selectedoptionproduct = {'productId':optionComponent.productId, 'productName': optionComponent.productName, 'componentId':optionComponent.componentId};
            else
                Selectedoptionproduct = {};
        }

        function getcurrentproductoptiongroups(){
            return currentproductoptiongroups;
        }

        function setcurrentproductoptiongroups(result){
            var availableProductIds = LocationDataService.getAvailableOptionProducts();
            var hasLocations = LocationDataService.gethasServicelocations();
            currentproductoptiongroups = result;
            // mark if product is available for selected location or not. 
            _.each(currentproductoptiongroups, function(group){
                _.each(group.productOptionComponents, function(component){
                    /*if(!hasLocations
                        ||(_.size(availableProductIds) > 0
                            && _.contains(availableProductIds, component.productId)))
                    {
                        component['isAvailableonSLocation'] = true;
                    }else{
                        component['isAvailableonSLocation'] = false;
                    }*/
                    // mark all as avaialable...just for testing. - H.E 1028
                    component['isAvailableonSLocation'] = true;
                })
            })
        }

        // util method. a: option groups, b: field name to access product components, c:field to identify if product is bundle or not, d: field name to access product Id within product component.
        function getAllBundleProductsinCurrentOptiongroups(a, b, c, d){
            // return a list of bundle product Id's. based on flag provided.
            var res = [];
            _.each(a, function (g) {
                res.push.apply(res, _.pluck(_.filter(g[b], function(h){
                    return h[c];
                }), d));
            });
            return res;
        }

        function getrerenderHierarchy(){
            return rerenderHierarchy;
        }

        function setrerenderHierarchy(val){
            rerenderHierarchy = val;
        }

        function getslectedOptionGroupProdId(){
            return slectedOptionGroupProdId;
        }

        function setslectedOptionGroupProdId(val){
            slectedOptionGroupProdId = val;
        }
    }
})();