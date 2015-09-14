(function() {
    var BaseController;

    BaseController = function($scope, $q, $log, $window, $dialogs, BaseService, BaseConfigService, QuoteDataService, MessageService, RemoteService, LocationDataService, PricingMatrixDataService, OptionGroupDataService, ProductAttributeValueDataService) {
        // all variable intializations.
        $scope.quoteService = QuoteDataService;
        $scope.baseService = BaseService;
        $scope.locationService = LocationDataService;
        $scope.pricingMatrixService = PricingMatrixDataService;
        $scope.optionGroupService = OptionGroupDataService;
        $scope.PAVService = ProductAttributeValueDataService;
        $scope.ProgressBartinprogress = false;

        $scope.imagesbaseURL = $scope.quoteService.getCAPResourcebaseURL()+'/Images';
        
        $scope.$watch('baseService.getProgressBartinprogress()', function(newVal, oldVal){
            $scope.ProgressBartinprogress = newVal;
        });

        $scope.validateonsubmit = function(){
            MessageService.clearAll();
            // Validation 1 : Service location has to be selected.
            var res = true;
            var servicelocation = $scope.locationService.getselectedlpa();
            var hasLocations = $scope.locationService.gethasServicelocations();
            if(_.isEmpty(servicelocation)
                && hasLocations)
            {
                // alert('Please select service location to proceed.');
                MessageService.addMessage('danger', 'Please select location to Proceed.');
                res = false;
            }
            
            // Validation 2 : validate Min/Max options on option groups.
            var allOptionGroups = $scope.optionGroupService.getallOptionGroups();
            var productIdtoComponentMap = {};
            var bundleProdId = BaseConfigService.bundleProdId;
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    _.each(optiongroup.productOptionComponents, function(productcomponent){
                        var productId = productcomponent.productId;
                        if(!_.isNull(productId))
                            productIdtoComponentMap[productId] = productcomponent;
                    })
                })
            })

            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                _.each(optiongroups, function(optiongroup){
                    var parentId = optiongroup.parentId;
                    //if parent is bundle productId or selected then validate min max.
                    if(parentId == bundleProdId
                        || (_.has(productIdtoComponentMap, parentId)
                            && isProdSelected(productIdtoComponentMap[parentId], optiongroup)))
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
            var cartId = BaseConfigService.cartId, quoteId = BaseConfigService.quoteId;
            var requestPromise = RemoteService.doAbandonCart(cartId, quoteId);
            return requestPromise.then(function(response){
                var URL = parsePagereference(response);
                if(!_.isNull(URL))
                    $window.location.href = URL;
            });
        }

        $scope.removeItemFromCart = function(){
            var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName, primaryLineNumber = BaseConfigService.bundleLineNumber, bundleProdId = BaseConfigService.bundleProdId;
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
                var servicelocationId = $scope.locationService.getselectedlpaId();
                
                // get the firstPMRecordId from PricingMatrixDataService and set PriceMatrixEntry__c on bundle.
                var pricingmatrixId = $scope.pricingMatrixService.firstPMRecordId;
                
                // prepare the bundleLine item to be passed to Remote actions.
                var bundleLine = $scope.quoteService.getlineItem();
                var bundleLineItem ={Id:bundleLine.Id, Apttus_Config2__ConfigurationId__c:bundleLine.Apttus_Config2__ConfigurationId__c, Service_Location__c:servicelocationId, Apttus_Config2__ProductId__c:bundleLine.Apttus_Config2__ProductId__c, Apttus_Config2__LineNumber__c:bundleLine.Apttus_Config2__LineNumber__c, PriceMatrixEntry__c:pricingmatrixId};
                var bundleProdId = bundleLine.Apttus_Config2__ProductId__c;

                var productcomponents = [];
                var componentIdtoPAVMap = {};
                var allOptionGroups = $scope.optionGroupService.getallOptionGroups();
                var allcomponentIdToOptionPAVMap = $scope.PAVService.getoptionproductattributevalues();
                
                _.each(allOptionGroups, function(optiongroups, bundleprodId){
                    _.each(optiongroups, function(optiongroup){
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if(isProdSelected(productcomponent,optiongroup))
                            {
                                productcomponent.isselected = true;
                                productcomponent = _.omit(productcomponent, ['$$hashKey', 'isDisabled']);
                                
                                var componentId = productcomponent.componentId;
                                var otherSelected = false;
                                if(_.has(allcomponentIdToOptionPAVMap, componentId))
                                {
                                    var optionPAV = allcomponentIdToOptionPAVMap[componentId];
                                    // Other picklist is selected then set OtherSelected to true.
                                    if(!_.isUndefined(_.findKey(optionPAV, function(value, pavField){return pavField.endsWith('Other');}))){
                                        otherSelected = true;
                                    }
                                    // clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
                                    componentIdtoPAVMap[componentId] = formatPAVBeforeSave(optionPAV);
                                }
                                productcomponent.customFlag = otherSelected;
                                productcomponents.push(productcomponent);
                            }
                        })
                    })
                })
                
                // add bundleLine PAV.
                var otherSelected_bundle = false;
                var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
                // Other picklist is selected then set OtherSelected to true.
                if(!_.isUndefined(_.findKey(bundlePAV, function(value, pavField){return pavField.endsWith('Other');}))){
                    otherSelected_bundle = true;
                }

                // clone Other Picklist values to regular Dropdowns and delete Other Field from PAV.
                componentIdtoPAVMap[bundleProdId] = formatPAVBeforeSave(bundlePAV);
                bundleLineItem = _.extend(bundleLineItem, {Custom__c:otherSelected_bundle});

                // remote call to save Quote Config.
                var requestPromise = RemoteService.saveQuoteConfig(bundleLineItem, productcomponents, componentIdtoPAVMap);
                requestPromise.then(function(saveresult){
                    if(saveresult.isSuccess)// if save call is successfull.
                    {
                        $scope.optionGroupService.runConstraintRules().then(function(constraintsResult){
                            if(constraintsResult.numRulesApplied > 0)
                            {
                                // render Hierarchy Once Constraint rules are run.
                                $scope.optionGroupService.setrerenderHierarchy(true);
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
            if((productcomponent.isselected && optiongroup.ischeckbox)
                || (productcomponent.productId == optiongroup.selectedproduct && !optiongroup.ischeckbox))
            return true;
            return false;
        }

        function formatPAVBeforeSave(pav){
            // set the other picklist to original fields.
            pav = _.omit(pav, 'isDefaultLoadComplete');
            _.each(_.filter(_.keys(pav), function(pavField){
                            return pavField.endsWith('Other');
                        }), 
                function(key){
                    var keywithnoother = key.slice( 0, key.lastIndexOf( "Other" ) );
                    pav[keywithnoother] = pav[key];
                    pav = _.omit(pav, key);
            })
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
    
    BaseController.$inject = ['$scope', '$q', '$log', '$window', '$dialogs', 'BaseService', 'BaseConfigService', 'QuoteDataService', 'MessageService', 'RemoteService', 'LocationDataService', 'PricingMatrixDataService', 'OptionGroupDataService', 'ProductAttributeValueDataService'];
    angular.module('APTPS_ngCPQ').controller('BaseController', BaseController);
}).call(this);