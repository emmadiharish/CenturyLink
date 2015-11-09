;(function() {
    'use strict';
    
    angular.module('APTPS_ngCPQ').service('SaveConfigService', SaveConfigService); 
    SaveConfigService.$inject = [ '$q', 
                                  '$log', 
                                  'BaseService', 
                                  'BaseConfigService', 
                                  'RemoteService', 
                                  'MessageService', 
                                  'LocationDataService', 
                                  'PricingMatrixDataService', 
                                  'OptionGroupDataService', 
                                  'ProductAttributeValueDataService', 
                                  'ConstraintRuleDataService'];
    
    function SaveConfigService($q, $log, BaseService, BaseConfigService, RemoteService, MessageService, LocationDataService, PricingMatrixDataService, OptionGroupDataService, ProductAttributeValueDataService, ConstraintRuleDataService) {
        var service = this;

        var productIdtoComponentMap = {};
        var productIdtoGroupMap = {};

        service.saveinformation = saveinformation;
        
        function saveinformation(){
            var deferred = $q.defer();
            
            if(runClientValidations())
            {
                // if save call is in progress then do not proceed.
                if(BaseService.getisSaveCallinProgress() == true)
                    return;
                else// set the savecallprogress so next request will be denied.
                   BaseService.setisSaveCallinProgress();
                
                BaseService.startprogress();// start progress bar.
                $log.info('saving config to DB.');

                // selected service location Id.
                var servicelocationId = LocationDataService.getselectedlpaId();
                
                // get the firstPMRecordId from PricingMatrixDataService and set PriceMatrixEntry__c on bundle.
                var pricingmatrixId = PricingMatrixDataService.getfirstPMRecordId();
                
                // prepare the bundleLine item to be passed to Remote actions.
                var bundleLine = BaseConfigService.lineItem;
                var cartID = BaseConfigService.cartId;
                var bundleLineId = bundleLine.Id;
                var mainBundleProdId = bundleLine.bundleProdId;
                var bundleLineNumber = bundleLine.lineNumber;
                var bundlePrimaryNumber = bundleLine.primaryLineNumber;

                var bundleLineItem ={Id:bundleLineId, 
                                        Apttus_Config2__ConfigurationId__c:cartID,
                                        Service_Location__c:servicelocationId,
                                        Apttus_Config2__ProductId__c:mainBundleProdId, 
                                        Apttus_Config2__LineNumber__c:parseInt(bundleLineNumber),
                                        PriceMatrixEntry__c:pricingmatrixId, 
                                        Apttus_Config2__PrimaryLineNumber__c:parseInt(bundlePrimaryNumber)};

                var productcomponentstobeUpserted = [];
                var productcomponentstobeDeleted = [];
                var componentIdtoPAVMap = {};
                var allOptionGroups = OptionGroupDataService.getallOptionGroups();
                var allcomponentIdToOptionPAVMap = ProductAttributeValueDataService.getoptionproductattributevalues();
                
                _.each(allOptionGroups, function(optiongroups, bundleprodId){
                    _.each(optiongroups, function(optiongroup){
                        var parentId = optiongroup.parentId;
                        //if parent is bundle productId or selected then proceed.
                        if(parentId == mainBundleProdId
                            || (_.has(productIdtoComponentMap, parentId)
                                && _.has(productIdtoGroupMap, parentId)
                                && isProdSelected(productIdtoComponentMap[parentId])))
                        {
                            _.each(optiongroup.productOptionComponents, function(productcomponent){
                                // if(productcomponent['isUpdatedLocal'] == true)
                                // {
                                    // productcomponent = _.omit(productcomponent, ['$$hashKey', 'isDisabled', 'isUpdatedLocal']);
                                    productcomponent = _.omit(productcomponent, ['$$hashKey', 'isDisabled', 'isAvailableonSLocation']);
                                    if(isProdSelected(productcomponent))
                                    {
                                        productcomponent.isselected = true;

                                        var componentId = productcomponent.componentId;
                                        var otherSelected = false;
                                        if(_.has(allcomponentIdToOptionPAVMap, componentId))
                                        {
                                            var optionPAV = allcomponentIdToOptionPAVMap[componentId];
                                            // Other picklist is selected then set OtherSelected to true.
                                            if(!_.isUndefined(_.findKey(optionPAV, function(value, pavField){return value == 'Other' && pavField.endsWith('Other');}))){
                                                otherSelected = true;
                                            }
                                            // clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
                                            componentIdtoPAVMap[componentId] = formatPAVBeforeSave(optionPAV);
                                        }
                                        productcomponent.customFlag = otherSelected;
                                        productcomponentstobeUpserted.push(productcomponent);
                                    }
                                    /*else{// prod is unselected then option lines should be deleted from server.
                                        productcomponentstobeDeleted.push(productcomponent);
                                    }*/
                                // }
                            })
                        }// end of if - only if parent component is selected.
                    })
                })
                
                // add bundleLine PAV.
                var otherSelected_bundle = false;
                var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
                // Other picklist is selected then set OtherSelected to true.
                if(!_.isUndefined(_.findKey(bundlePAV, function(value, pavField){return pavField.endsWith('Other');}))){
                    otherSelected_bundle = true;
                }

                // clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
                // bundle product can exist without options.
                bundlePAV = formatPAVBeforeSave(bundlePAV);
                if(!_.isEmpty(bundlePAV))
                {
                    componentIdtoPAVMap[mainBundleProdId] = bundlePAV;
                }

                bundleLineItem = _.extend(bundleLineItem, {Custom__c:otherSelected_bundle});

                // remote call to save Quote Config.
                //var requestPromise = RemoteService.saveQuoteConfig(bundleLineItem, productcomponentstobeUpserted, productcomponentstobeDeleted, componentIdtoPAVMap);
                var saveRequest = {
                                    bundleLineItem:bundleLineItem
                                    , productOptionComponents: productcomponentstobeUpserted
                                    , componentIdtoPAVMap: componentIdtoPAVMap};
                var requestPromise = RemoteService.saveQuoteConfig(saveRequest);
                requestPromise.then(function(saveresult){
                    if(saveresult.isSuccess)// if save call is successfull.
                    {
                        runConstraintRules().then(function(constraintsResult){
                            if(constraintsResult.numRulesApplied > 0)
                            {
                                // render Hierarchy Once Constraint rules are run.
                                OptionGroupDataService.setrerenderHierarchy(true);
                                deferred.reject('Constraint rules Error.');    
                            }
                            else{
                                // resolve the save promise after constraint remote call is complete with no constraint actions.
                                deferred.resolve(true);
                            }
                            BaseService.completeSaveProgress();// end progress bar.
                        })
                    }// end of saveresult.isSuccess check.
                    else{
                        MessageService.addMessage('danger', 'Save call is Failing: '+saveresult.errorMessage);
                        BaseService.completeSaveProgress();// end progress bar.
                        // $scope.safeApply();
                        deferred.reject('Save Failed.');
                        return deferred.promise;
                    }
                })// end of saveQuoteConfig remote call.
            }// end of validateonsubmit.
            else{
                // $scope.safeApply();
                BaseService.completeSaveProgress();// end progress bar.
                deferred.reject('Validations Failed.');
                return deferred.promise;
            }
            return deferred.promise;
        }

        function runConstraintRules(){
            $log.info('running Constraint rules.');
            // remote call to save Quote Config.
            var deferred = $q.defer();
            var hasLocations = LocationDataService.gethasServicelocations();
            var availableProductIds = LocationDataService.getAvailableOptionProducts();
            var constraintRuleRequest = {
                                        cartId: BaseConfigService.cartId
                                        , lineNumber: BaseConfigService.lineItem.lineNumber
                                        };
            var requestPromise = RemoteService.runConstraintRules(constraintRuleRequest);
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
                ConstraintRuleDataService.updateRuleActions(constraintActionDoList);
                var numRulesApplied = 0; //constraintActionDoList.length;
                /*var allOptionGroups = OptionGroupDataService.getallOptionGroups();
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
                    SuggestedProductIds = _.filter(SuggestedProductIds, function(productId){return hasLocations == false || _.contains(availableProductIds, productId);});

                    // this is for exclusion and inclusion.
                    if(ActionType == 'Inclusion'
                        || ActionType == 'Exclusion')
                    {
                        _.each(SuggestedProductIds, function(productId){
                            productIdtoActionDOMap[productId] = {'ActionType': ActionType, 'ActionIntent': ActionIntent, 'Message':Message, 'MessageType':MessageType};
                        })    
                    }

                    // Just for testing - adding here as recommendations are not firing.
                    recommendedProductIds.push(SuggestedProductIds);

                    // for Validations, Recommendation and Replacement
                    if(ActionType == 'Validation'
                        || ActionType == 'Recommendation')
                        // || ActionType == 'Replacement')
                    {
                        switch(ActionIntent)
                        {
                            case 'Prompt':
                                if(ActionType == 'Recommendation'){
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
                recommendedProductIds = _.flatten(recommendedProductIds);
                if(_.size(recommendedProductIds) > 0)
                {
                    ProductDataService.getProducts(recommendedProductIds).then(function(result){
                        ConstraintRuleDataService.setrecommendedproductsMap(result);
                    });
                }*/
                
                var res = {isSuccess:true, numRulesApplied:numRulesApplied};
                deferred.resolve(res);
            })// end of runConstraintRules remote call.
            return deferred.promise;
        }

        function runClientValidations(){
            $log.info('running Client Validations.');
            MessageService.clearAll();
            // Validation 1 : Service location has to be selected.
            var res = true;
            var servicelocation = LocationDataService.getselectedlpa();
            var hasLocations = LocationDataService.gethasServicelocations();
            if(_.isEmpty(servicelocation)
                && hasLocations)
            {
                // alert('Please select service location to proceed.');
                MessageService.addMessage('danger', 'Please select location to Proceed.');
                res = false;
            }
            
            // Validation 2 : validate Min/Max options on option groups.
            var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            var mainBundleProdId = BaseConfigService.lineItem.bundleProdId;
            productIdtoGroupMap = {};
            productIdtoComponentMap = {};
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        var productId = productcomponent.productId;
                        if(!_.isNull(productId))
                        {
                            productIdtoGroupMap[productId] = optiongroup;
                            productIdtoComponentMap[productId] = productcomponent;
                        }
                    })
                })
            })

            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    var parentId = optiongroup.parentId;
                    //if parent is bundle productId or selected then validate min max.
                    if(parentId == mainBundleProdId
                        || (_.has(productIdtoComponentMap, parentId)
                            && _.has(productIdtoGroupMap, parentId)
                            && isProdSelected(productIdtoComponentMap[parentId])))
                    {
                        var minOptions = optiongroup.minOptions;
                        var maxOptions = optiongroup.maxOptions;
                        var selectedOptionsCount = 0;
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if(isProdSelected(productcomponent))
                            {
                                selectedOptionsCount++;
                            }
                        })
                        if(minOptions > 0
                            && selectedOptionsCount < minOptions)
                        {
                            MessageService.addMessage('danger', 'Minimum of '+minOptions+' options have to be selected in '+optiongroup.groupName);
                            res = false;
                        }
                        if(maxOptions > 0
                            && selectedOptionsCount > maxOptions)
                        {
                            MessageService.addMessage('danger', 'Maximum of '+maxOptions+' options can to be selected from '+optiongroup.groupName);
                            res = false;
                        }
                    }
                })
            })
            return res;
        }
        
        function isProdSelected(productcomponent){
            if(productcomponent.isselected) 
                return true;
            return false;
        }

        function formatPAVBeforeSave(pav){
            //// set the other picklist to original fields.
            // pav = _.omit(pav, 'isDefaultLoadComplete', 'isUpdatedLocal');
            pav = _.omit(pav, 'isDefaultLoadComplete');
            _.each(_.filter(_.keys(pav), function(pavField){
                            return pavField.endsWith('Other');
                        }), 
                function(key){
                    var keywithnoother = key.slice( 0, key.lastIndexOf( "Other" ) );
                    if(pav[keywithnoother] == 'Other')    
                        pav[keywithnoother] = pav[key]+'**';
                    pav = _.omit(pav, key);// remove Other field from PAV before sending to Server.
            })
            return pav;
        }
    }
})();