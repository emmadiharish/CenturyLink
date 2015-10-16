/*
    Save of the option groups should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    var BaseController;

    BaseController = function($scope, $q, $log, $window, $dialogs, SystemConstants, BaseService, BaseConfigService, MessageService, RemoteService, LocationDataService, PricingMatrixDataService, OptionGroupDataService, ProductAttributeValueDataService) {
        // all variable intializations.
        $scope.constants = SystemConstants;
        $scope.baseService = BaseService;
        $scope.optionGroupService = OptionGroupDataService;
        $scope.ProgressBartinprogress = false;
        $scope.showOptionsTab = true;

        $scope.imagesbaseURL = $scope.constants.baseUrl+'/Images';
        
        $scope.$watch('baseService.getProgressBartinprogress()', function(newVal, oldVal){
            $scope.ProgressBartinprogress = newVal;
        });

        $scope.$watch('optionGroupService.showOptions', function(newVal, oldVal){
            if($scope.optionGroupService.showOptions == false){
                $scope.showOptionsTab= false;
            }
        });

        $scope.validateonsubmit = function(){
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
            var productIdtoComponentMap = {};
            var productIdtoGroupMap = {};
            var bundleProdId = BaseConfigService.lineItem.bundleProdId;
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
                    if(parentId == bundleProdId
                        || (_.has(productIdtoComponentMap, parentId)
                            && _.has(productIdtoGroupMap, parentId)
                            && isProdSelected(productIdtoComponentMap[parentId], productIdtoGroupMap[parentId])))
                    {
                        var minOptions = optiongroup.minOptions;
                        var maxOptions = optiongroup.maxOptions;
                        var selectedOptionsCount = 0;
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if(isProdSelected(productcomponent,optiongroup))
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
            var cartId = BaseConfigService.cartId, quoteId = BaseConfigService.proposal.Id;
            var requestPromise = RemoteService.doAbandonCart(cartId, quoteId);
            return requestPromise.then(function(response){
                var URL = parsePagereference(response);
                if(!_.isNull(URL))
                    $window.location.href = URL;
            });
        }

        $scope.removeItemFromCart = function(){
            var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName, primaryLineNumber = BaseConfigService.lineItem.lineNumber, bundleProdId = BaseConfigService.lineItem.bundleProdId;
            var requestPromise = RemoteService.removeBundleLineItem(cartId, configRequestId, flowName, primaryLineNumber, bundleProdId);
            return requestPromise.then(function(response){
                var URL = parsePagereference(response);
                if(!_.isNull(URL))
                    $window.location.href = URL;
            });
        }

        $scope.addMoreProducts = function(){
            $scope.saveinformation().then(function(response){
                if(response == true)
                {
                    var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName;
                    var requestPromise = RemoteService.addMoreProducts(cartId, configRequestId, flowName);
                    return requestPromise.then(function(response){
                        var URL = parsePagereference(response);
                        if(!_.isNull(URL))
                            $window.location.href = URL;
                    });
                }
            })
        }

        $scope.GoToPricing = function(){
            $scope.saveinformation().then(function(response){
                if(response == true)
                {
                    var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName;
                    var requestPromise = RemoteService.goToPricing(cartId, configRequestId, flowName);
                    return requestPromise.then(function(response){
                        var URL = parsePagereference(response);
                        if(!_.isNull(URL))
                            $window.location.href = URL;
                    });
                }
            })
        }

        /*@Validate
            Save Config and run constraint rules.
        */
        $scope.Validate = function(){
            $scope.saveinformation().then(function(response){
                if(response == true)
                {
                    
                }
            })
        }

        $scope.saveinformation = function(){
            var deferred = $q.defer();
            $scope.baseService.startprogress();// start progress bar.
            if($scope.validateonsubmit())
            {
                // selected service location Id.
                var servicelocationId = LocationDataService.getselectedlpaId();
                
                // get the firstPMRecordId from PricingMatrixDataService and set PriceMatrixEntry__c on bundle.
                var pricingmatrixId = PricingMatrixDataService.getfirstPMRecordId();
                
                // prepare the bundleLine item to be passed to Remote actions.
                var bundleLine = BaseConfigService.lineItem;
                var cartID = BaseConfigService.cartId;
                var bundleLineId = bundleLine.Id;
                var bundleProdId = bundleLine.bundleProdId;
                var bundleLineNumber = bundleLine.lineNumber;
                var bundlePrimaryNumber = bundleLine.primaryLineNumber;

                var bundleLineItem ={Id:bundleLineId, 
                                        Apttus_Config2__ConfigurationId__c:cartID,
                                        Service_Location__c:servicelocationId,
                                        Apttus_Config2__ProductId__c:bundleProdId, 
                                        Apttus_Config2__LineNumber__c:bundleLineNumber, 
                                        PriceMatrixEntry__c:pricingmatrixId, 
                                        Apttus_Config2__PrimaryLineNumber__c:bundlePrimaryNumber};

                var productcomponentstobeUpserted = [];
                var productcomponentstobeDeleted = [];
                var componentIdtoPAVMap = {};
                var allOptionGroups = OptionGroupDataService.getallOptionGroups();
                var allcomponentIdToOptionPAVMap = ProductAttributeValueDataService.getoptionproductattributevalues();
                
                var productIdtoComponentMap = {};
                var productIdtoGroupMap = {};
                var bundleProdId = BaseConfigService.lineItem.bundleProdId;
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
                        //if parent is bundle productId or selected then proceed.
                        if(parentId == bundleProdId
                            || (_.has(productIdtoComponentMap, parentId)
                                && _.has(productIdtoGroupMap, parentId)
                                && isProdSelected(productIdtoComponentMap[parentId], productIdtoGroupMap[parentId])))
                        {
                            _.each(optiongroup.productOptionComponents, function(productcomponent){
                                if(productcomponent['isUpdatedLocal'] == true)
                                {
                                    productcomponent = _.omit(productcomponent, ['$$hashKey', 'isDisabled', 'isUpdatedLocal']);

                                    if(isProdSelected(productcomponent,optiongroup))
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
                                    else{// prod is unselected then option lines should be deleted from server.
                                        productcomponentstobeDeleted.push(productcomponent);
                                    }
                                }
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
                    componentIdtoPAVMap[bundleProdId] = bundlePAV;
                }

                bundleLineItem = _.extend(bundleLineItem, {Custom__c:otherSelected_bundle});

                // remote call to save Quote Config.
                var requestPromise = RemoteService.saveQuoteConfig(bundleLineItem, productcomponentstobeUpserted, productcomponentstobeDeleted, componentIdtoPAVMap);
                requestPromise.then(function(saveresult){
                    if(saveresult.isSuccess)// if save call is successfull.
                    {
                        OptionGroupDataService.runConstraintRules().then(function(constraintsResult){
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
                            $scope.baseService.completeprogress();// end progress bar.
                        })
                    }// end of saveresult.isSuccess check.
                    else{
                        MessageService.addMessage('danger', 'Save call is Failing: '+saveresult.errorMessage);
                        $scope.baseService.completeprogress();// end progress bar.
                        $scope.safeApply();
                        deferred.reject('Save Failed.');
                        return deferred.promise;
                    }
                })// end of saveQuoteConfig remote call.
            }// end of validateonsubmit.
            else{
                $scope.safeApply();
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
        
        function isProdSelected(productcomponent, optiongroup){
            if((productcomponent.isselected 
                 && optiongroup.ischeckbox)
                    || (productcomponent.productId == optiongroup.selectedproduct 
                        && !optiongroup.ischeckbox))
            return true;
            return false;
        }

        function formatPAVBeforeSave(pav){
            //// set the other picklist to original fields.
            pav = _.omit(pav, 'isDefaultLoadComplete', 'isUpdatedLocal');
            _.each(_.filter(_.keys(pav), function(pavField){
                            return pavField.endsWith('Other');
                        }), 
                function(key){
                    var keywithnoother = key.slice( 0, key.lastIndexOf( "Other" ) );
                    if(pav[keywithnoother] == 'Other')    
                        pav[keywithnoother] = pav[key]+'**';
                    pav = _.omit(pav, key);
            })
            
            // remove Otherdb field.
            /*_.each(_.filter(_.keys(pav), function(pavField){
                            return pavField.endsWith('Otherdb');
                        }), 
                function(key){
                   pav = _.omit(pav, key);
            })*/
            return pav;
        }

        function parsePagereference(pgReference){
            var res = null;
            if(!_.isNull(pgReference)
                && !_.isEmpty(pgReference))
                res = _.unescape(pgReference);
            return res;
        };
    };
    
    BaseController.$inject = ['$scope', '$q', '$log', '$window', '$dialogs', 'SystemConstants', 'BaseService', 'BaseConfigService', 'MessageService', 'RemoteService', 'LocationDataService', 'PricingMatrixDataService', 'OptionGroupDataService', 'ProductAttributeValueDataService'];
    angular.module('APTPS_ngCPQ').controller('BaseController', BaseController);
}).call(this);