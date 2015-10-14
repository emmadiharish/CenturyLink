/*
    This service should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    angular.module('APTPS_ngCPQ').service('OptionGroupDataService', OptionGroupDataService); 
    OptionGroupDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService', 'RemoteService', 'MessageService', 'ProductDataService', 'OptionGroupCache'];
    function OptionGroupDataService($q, $log, BaseService, BaseConfigService, RemoteService, MessageService, ProductDataService, OptionGroupCache) {
        var service = this;
        
        var Selectedoptionproduct = {};// to render option attributes.
        var currentproductoptiongroups = {};
        var rerenderHierarchy = false;// to render option group hierarchy whenever product is added/removed from option groups.
        var slectedOptionGroupProdId;// to render option groups based on group hierarchy traversal.
        var showConfigureOptionstab = true;// used to hide the 'Configure Options' tab if no option group exists.
        var recommendedproductsMap = {};

        // option group methods.
        service.getallOptionGroups = getallOptionGroups;
        service.getOptionGroup = getOptionGroup;
        service.runConstraintRules = runConstraintRules;
        service.getSelectedoptionproduct = getSelectedoptionproduct;
        service.setSelectedoptionproduct = setSelectedoptionproduct;
        service.getcurrentproductoptiongroups = getcurrentproductoptiongroups;
        service.getrerenderHierarchy = getrerenderHierarchy;
        service.setrerenderHierarchy = setrerenderHierarchy;
        service.getslectedOptionGroupProdId = getslectedOptionGroupProdId;
        service.setslectedOptionGroupProdId = setslectedOptionGroupProdId;
        service.getrecommendedproductsMap = getrecommendedproductsMap;
        
        function getallOptionGroups(){
            return OptionGroupCache.getOptionGroups();
        }
        
        /* recurvive function to query all option groups on page load
           will load upto 5 levels */
        function getOptionGroups(productIds, deferred) {
            if (!deferred) {
                deferred = $q.defer();
            }

            var cartId = BaseConfigService.cartId;
            var lineNumber = BaseConfigService.lineItem.lineNumber;
            var requestPromise = RemoteService.getProductoptiongroupsData(productIds, cartId, lineNumber);
            var currentSubBundleLevel = 0;
            var maxSubBundleLevel = 5;// constant to limit the option group recursive remote call.
            requestPromise.then(function(response) {
                OptionGroupCache.initializeOptionGroups(response);
                var cachedOptionGroups = OptionGroupCache.getOptionGroups();
                var alloptionProductIds_hasOptions = OptionGroupCache.getProductIdsofBundles();
                var prodIds_filtered = _.difference(alloptionProductIds_hasOptions, _.keys(cachedOptionGroups)); 
                if (prodIds_filtered.length > 0
                    && currentSubBundleLevel < maxSubBundleLevel) {
                    getOptionGroups(prodIds_filtered, deferred);    
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
            Selectedoptionproduct = {'productId':optionComponent.productId, 'productName': optionComponent.productName, 'componentId':optionComponent.componentId};
        }

        function getcurrentproductoptiongroups(){
            return currentproductoptiongroups;
        }

        function setcurrentproductoptiongroups(result){
            currentproductoptiongroups = result;
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

        function getrecommendedproductsMap(){
            return recommendedproductsMap;
        }

        function runConstraintRules(){
            // remote call to save Quote Config.
            var deferred = $q.defer();
            var cartId = BaseConfigService.cartId;
            var lineNumber = BaseConfigService.lineItem.lineNumber;
            requestPromise = RemoteService.runConstraintRules(cartId, lineNumber);
            requestPromise.then(function(result){
                /*appliedActionDOList is a List<Apttus_CPQApi.CPQ.AppliedActionDO>.
                IsPending                       :  Indicates Whether the rule action is pending user action.
                ########################Message Related##########################
                TriggeringProductIds (List<Id>) :  The list of triggering product ids that are in the cart.

                MessageType  (String)           :  Indicates whether the message is of warning type or error 
                                                   type.(Error/Warning/Info)
                Message     (String)            :  This is the message to be displayed when the rule action is
                                                   in pending state.
                IsShowPrompt                    :  This shows the message as a prompt. If the user cancels
                                                   the prompt instead of taking action, marks the rule as
                                                   ignored.
                ########################Auto inclusion/auto exclusion related########################
                IsAutoExecuted                  :  Indicates whether inclusion was performed by the system.
                                                   if true, dont worry - Ignore - products will be auto-included.
                                                   if false, process the rule and include SuggestedProductIds.
                ActionType  (String)            :  This is the type of rule action.(Inclusion/Exclusion/Validation/Recommendation/Replacement)
                ActionIntent                    :  Picklist on Constraint rule action. action intent depends on action type and SuggestedProductIds.
                                                   This is the intent of the rule action whether to auto include or disable selection and so on.(Auto Include/Prompt/Show Message/Check on Finalization/Disable Selection)
                SuggestedProductIds (List<Id>)  :  The list of product ids suggested by the rule action to be
                                                   included or excluded.
                AffectedProductIds (List<Id>)   :  list of products being included/excluded by auto-executed = true;
                                                   The list of product ids added by auto inclusion or flagged
                                                   by exclusion.
                */
                var constraintActionDoList = result.appliedActionDOList;
                var numRulesApplied = 0; //constraintActionDoList.length;
                var allOptionGroups = getallOptionGroups();
                var productIdtoActionDOMap = {};
                var recommendedProductIds = [];

                _.each(constraintActionDoList, function(ActionDo){
                    // get all error messages and add to MessageService.
                    var TriggeringProductIds = ActionDo.TriggeringProductIds;
                    var Message = ActionDo.Message;
                    // possible message types : danger, warning, info, success.
                    var MessageType = ActionDo.MessageType == 'Error' ? 'danger' : ActionDo.MessageType;
                    var ActionType = ActionDo.ActionType;
                    var ActionIntent = ActionDo.ActionIntent;
                    var SuggestedProductIds = ActionDo.SuggestedProductIds;

                    // this is for exclusion and inclusion.
                    if(ActionType == 'Inclusion'
                        || ActionType == 'Exclusion')
                    {
                        _.each(SuggestedProductIds, function(productId){
                            productIdtoActionDOMap[productId] = {'ActionType': ActionType, 'ActionIntent': ActionIntent, 'Message':Message, 'MessageType':MessageType};
                        })    
                    }

                    // Just for testing as recommendations are not firing.
                    recommendedProductIds.push(SuggestedProductIds);

                    // for Validations, Recommendation and Replacement
                    if(ActionType == 'Validation'
                        || ActionType == 'Recommendation')
                        // || ActionType == 'Replacement')
                    {
                        switch(ActionIntent)
                        {
                            case 'Auto Include':
                                break;
                            case 'Prompt':
                                if(ActionType == 'Validation'){
                                    MessageService.addMessage(MessageType, Message);
                                }
                                else if(ActionType == 'Recommendation'){
                                    recommendedProductIds.push(SuggestedProductIds);
                                    MessgeService.addMessage('notice', Message);
                                }
                                numRulesApplied++;
                                break;
                            case 'Show Message':
                                if(ActionType == 'Validation'){
                                    MessageService.addMessage(MessageType, Message);
                                }
                                else if(ActionType == 'Recommendation'){
                                    recommendedProductIds.push(SuggestedProductIds);
                                    MessgeService.addMessage('notice', Message);
                                }
                                numRulesApplied++;
                                break;
                            case 'Check on Finalization':
                                break;
                        }
                    }
                })

                // exclude or include products according to productIdtoActionDOMap.
                _.each(allOptionGroups, function(optiongroups, bundleprodId){
                    _.each(optiongroups, function(optiongroup){
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            // Enable all previously disabled options. and exclude/include based on constraint rule action info's.
                            if(_.has(productcomponent, 'isDisabled')
                                && productcomponent['isDisabled'] == true)
                            {
                                productcomponent['isDisabled'] = false;
                            }
                            var productId = productcomponent.productId;
                            if(_.has(productIdtoActionDOMap, productId))
                            {
                                var ActionDO = productIdtoActionDOMap[productId];
                                var ActionType = ActionDO.ActionType;
                                var ActionIntent = ActionDO.ActionIntent;
                                var Message = ActionDO.Message;
                                var MessageType = ActionDO.MessageType
                                // possible values : Auto Include/Prompt/Show Message/Check on Finalization/Disable Selection
                                switch(ActionIntent)
                                {
                                    case 'Auto Include':
                                        if(ActionType == 'Inclusion')
                                        {
                                            // apply only if option is not selected.
                                            if(!isProdSelected(productcomponent, optiongroup))
                                            {    
                                                
                                                numRulesApplied++;

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
                                        }
                                        break;
                                    case 'Prompt':
                                        break;
                                    case 'Show Message':
                                        if(ActionType == 'Inclusion'
                                            || ActionType == 'Exclusion')
                                        {
                                            MessageService.addMessage(MessageType, Message);
                                            numRulesApplied++;
                                        }
                                        break;
                                    case 'Check on Finalization':
                                        break;
                                    case 'Disable Selection':
                                        if(ActionType == 'Exclusion')
                                        {
                                            // apply rule only if option is selected.
                                            if(isProdSelected(productcomponent, optiongroup))
                                            {
                                                // MessageService.addMessage(MessageType, Message);
                                                numRulesApplied++;
                                                
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
                                        }
                                        break;
                                };
                            }
                        })
                    })
                })
                
                // query the recommended products using productDataService.
                ProductDataService.getProducts(recommendedProductIds).then(function(result){
                    recommendedproductsMap = result;
                });
                
                res = {isSuccess:true, numRulesApplied:numRulesApplied};
                deferred.resolve(res);
            })// end of runConstraintRules remote call.
            return deferred.promise;
        }

        function isProdSelected(productcomponent, optiongroup){
            if((productcomponent.isselected && optiongroup.ischeckbox)
                || (productcomponent.productId == optiongroup.selectedproduct && !optiongroup.ischeckbox))
            return true;
            return false;recommendedProductIds
        }
    }
})();