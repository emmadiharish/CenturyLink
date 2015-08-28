(function() {
    var BaseController;

    BaseController = function($scope, $q, $log, $dialogs, BaseService, QuoteDataService, MessageService, RemoteService, LocationDataService, OptionGroupDataService, ProductAttributeValueDataService) {
        // all variable intializations.
        $scope.quoteService = QuoteDataService;
        $scope.baseService = BaseService;
        $scope.locationService = LocationDataService;
        $scope.optionGroupService = OptionGroupDataService;
        $scope.PAVService = ProductAttributeValueDataService;


        $scope.imagesbaseURL = $scope.quoteService.getCAPResourcebaseURL()+'/Images';
        
        $scope.validateonsubmit = function(){
            // Validation 1 : Service location has to be selected.
            var servicelocation = $scope.locationService.getselectedlpa();
            var hasLocations = $scope.locationService.gethasServicelocations();
            if(_.isEmpty(servicelocation)
                && hasLocations)
            {
                // alert('Please select service location to proceed.');
                MessageService.addMessage('danger', 'Please select location to Proceed.');
                return false;
            }
            return true;
        }

        $scope.launch = function(which){
            var dlg = null;
            switch(which){

                /*// Error Dialog
                case 'error':
                dlg = $dialogs.error('This is my error message');
                break;

                // Wait / Progress Dialog
                case 'wait':
                dlg = $dialogs.wait(msgs[i++],progress);
                fakeProgress();
                break;

                // Notify Dialog
                case 'notify':
                dlg = $dialogs.notify('Something Happened!','Something happened that I need to tell you.');
                break;*/

                // Abandon Confirm Dialog
                case 'confirmAbandon':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to abandon the current cart?');
                    dlg.result.then(function(btn){
                        $scope.Abandon();
                    },function(btn){
                        
                });
                break;

                // Remove Item Confirm Dialog
                case 'confirmRemoveItem':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to remove the current Line item?');
                    dlg.result.then(function(btn){
                        $scope.removeItemFromCart();
                    },function(btn){
                    
                });
                break;
            }; // end switch
        }; // end launch

      

        $scope.Abandon = function(){
            AbandonAF();
        }

        $scope.removeItemFromCart = function(){
            removeItemFromCartAF();
        }

        $scope.AddMoreProducts = function(){
            $scope.saveinformation().then(function(response){
                if(response == true)
                {
                    AddMoreProductsAF();
                }
            })
        }

        $scope.GoToPricing = function(){
            $scope.saveinformation().then(function(response){
                if(response == true)
                {
                    GoToPricingAF();
                }
            })
        }

        $scope.saveinformation = function(){
            var deferred;
            deferred = $q.defer();
            $scope.baseService.startprogress();// start progress bar.
            if($scope.validateonsubmit())
            {
                // selected service location Id.
                var servicelocationId = null;
                var servicelocation = $scope.locationService.getselectedlpa();
                if(servicelocation)
                {
                    servicelocationId = servicelocation.Id;    
                }

                var bundleLine = $scope.quoteService.getlineItem();
                var bundleLineItem ={Id:bundleLine.Id, Apttus_Config2__ConfigurationId__c:bundleLine.Apttus_Config2__ConfigurationId__c, Service_Location__c:servicelocationId, Apttus_Config2__ProductId__c:bundleLine.Apttus_Config2__ProductId__c, Apttus_Config2__LineNumber__c:bundleLine.Apttus_Config2__LineNumber__c};
                var bundleProdId = bundleLine.Apttus_Config2__ProductId__c;

                var productcomponents = [];
                var productIdtoPAVMap = {};
                var allOptionGroups = $scope.optionGroupService.getallOptionGroups();
                var allproductIdtoPAVMap = $scope.PAVService.getAllProductAttributeValues();
                
                _.each(allOptionGroups, function(optiongroups, bundleprodId){
                    _.each(optiongroups, function(optiongroup){
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if((productcomponent.isselected && optiongroup.ischeckbox)
                                || (productcomponent.productId == optiongroup.selectedproduct && !optiongroup.ischeckbox))
                            {
                                productcomponent.isselected = true;
                                productcomponent = _.omit(productcomponent, '$$hashKey');
                                productcomponents.push(productcomponent);
                                var productId = productcomponent.productId;
                                if(_.has(allproductIdtoPAVMap, productId))
                                {
                                   productIdtoPAVMap[productId] = allproductIdtoPAVMap[productId]; 
                                }
                            }
                        })
                    })
                })
                
                // add bundleLine PAV.
                productIdtoPAVMap[bundleProdId] = allproductIdtoPAVMap[bundleProdId];

                var requestPromise = RemoteService.saveQuoteConfig(bundleLineItem, productcomponents, productIdtoPAVMap);
                requestPromise.then(function(result){
                    if(result.isSuccess)// if save call is successfull.
                    {
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
                        var numErrors = constraintActionDoList.length;
                        MessageService.clearAll();
                        var productIdtoActionDOMap = {};
                        
                        _.each(constraintActionDoList, function(ActionDo){
                            // get all error messages and add to MessageService.
                            var TriggeringProductIds = ActionDo.TriggeringProductIds;
                            var Message = ActionDo.Message;
                            // possible message types : danger, warning, info, success.
                            var MessageType = ActionDo.MessageType == 'Error' ? 'danger' : ActionDo.MessageType;
                            var ActionType = ActionDo.ActionType;
                            var ActionIntent = ActionDo.ActionIntent;
                            var SuggestedProductIds = ActionDo.SuggestedProductIds;
                            _.each(SuggestedProductIds, function(productId){
                                productIdtoActionDOMap[productId] = {'ActionType': ActionType, 'ActionIntent': ActionIntent, 'Message':Message, 'MessageType':MessageType};
                            })
                        })

                        // exclude or include products according to productIdtoActionDOMap.
                        _.each(allOptionGroups, function(optiongroups, bundleprodId){
                            _.each(optiongroups, function(optiongroup){
                                _.each(optiongroup.productOptionComponents, function(productcomponent){
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
                                                    productcomponent.isselected = true;
                                                }
                                                break;
                                            case 'Prompt':
                                                break;
                                            case 'Show Message':
                                                if(ActionType == 'Inclusion'
                                                    || ActionType == 'Exclusion'
                                                    || ActionType == 'Validation'
                                                    || ActionType == 'Recommendation'
                                                    || ActionType == 'Replacement')
                                                {
                                                    MessageService.addMessage(MessageType, Message);
                                                }
                                                break;
                                            case 'Check on Finalization':
                                                break;
                                            case 'Disable Selection':
                                                if(ActionType == 'Exclusion')
                                                {
                                                    productcomponent.isselected = false;
                                                    productcomponent['isDisabled'] = true;
                                                }
                                                break;
                                        };
                                    }
                                })
                            })
                        })

                        if(numErrors > 0)
                        {
                            $scope.safeApply();
                            $scope.baseService.completeprogress();// end progress bar.
                            deferred.reject('Constraint rules Error.');
                            return deferred.promise;
                        }
                    }
                    else{
                        MessageService.addMessage('danger', 'Save call is Failing.');
                        $scope.baseService.completeprogress();// end progress bar.
                        $scope.safeApply();
                        deferred.reject('Save Failed.');
                        return deferred.promise;
                    }
                    // resolver the promise after remote call is complete.
                    $scope.baseService.completeprogress();// end progress bar.
                    deferred.resolve(true);
                })
            }
            else{
                $scope.baseService.completeprogress();// end progress bar.
                deferred.reject('Validations Failed.');
                return deferred.promise;
            }
            return deferred.promise;
        }
        
        $scope.safeApply = function(fn) {
            var phase = this.$root.$$phase;
            if(phase == '$apply' || phase == '$digest') {
                if(fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };
    };

    BaseController.$inject = ['$scope', '$q', '$log', '$dialogs', 'BaseService', 'QuoteDataService', 'MessageService', 'RemoteService', 'LocationDataService', 'OptionGroupDataService', 'ProductAttributeValueDataService'];
    angular.module('APTPS_ngCPQ').controller('BaseController', BaseController);
}).call(this);