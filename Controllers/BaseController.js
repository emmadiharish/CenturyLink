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
        
        $scope.filterpricing = function(){
            // angular.element(j$('#MainWrap')).scope().search();
        }

        $scope.validateonsubmit = function(){
            // Validation 1 : Service location has to be selected.
            var servicelocation = $scope.locationService.getselectedlpa();
            var hasLocations = $scope.locationService.gethasServicelocations();
            if(!servicelocation
                && hasLocations)
            {
                alert('Please select service location to proceed.');
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
                        //$scope.Abandon();
                    },function(btn){
                        
                });
                break;

                // Remove Item Confirm Dialog
                case 'confirmRemoveItem':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to remove the current Line item?');
                    dlg.result.then(function(btn){
                        //$scope.removeItemFromCart();
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
            var deferred,res;
            res = true;
            deferred = $q.defer();
            if($scope.validateonsubmit())
            {
                $scope.baseService.startprogress();// start progress bar.
                
                // selected service location Id.
                var servicelocationId = null;
                var servicelocation = $scope.locationService.getselectedlpa();
                if(servicelocation)
                {
                    servicelocationId = servicelocation.Id;    
                }

                var bundleLine = $scope.quoteService.getlineItem();
                var bundleLineItem ={Id:bundleLine.Id, Apttus_Config2__ConfigurationId__c:bundleLine.Apttus_Config2__ConfigurationId__c, Service_Location__c:servicelocationId, Apttus_Config2__ProductId__c:bundleLine.Apttus_Config2__ProductId__c, Apttus_Config2__LineNumber__c:bundleLine.Apttus_Config2__LineNumber__c};

                var productcomponents = [];
                var allOptionGroups = $scope.optionGroupService.getallOptionGroups();
                _.each(allOptionGroups, function(optiongroups, bundleprodId){
                    _.each(optiongroups, function(optiongroup){
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if((productcomponent.isselected && optiongroup.ischeckbox)
                                || (productcomponent.productId == optiongroup.selectedproduct && !optiongroup.ischeckbox))
                            {
                                productcomponent.isselected = true;
                                productcomponent = _.omit(productcomponent, '$$hashKey');
                                productcomponents.push(productcomponent);
                            }
                        })
                    })
                })

                var productIdtoPAVMap = $scope.PAVService.getAllProductAttributeValues();

                var requestPromise = RemoteService.saveoptionsandattributes(bundleLineItem, productcomponents, productIdtoPAVMap);
                requestPromise.then(function(result){
                    if(result.isSuccess)// if save call is successfull.
                    {
                        var prodIdtoErrorMap = result.productIdtoMessageMap;
                        var numErrors = 0;
                        _.each(allOptionGroups, function(optiongroups, bundleprodId){
                            _.each(optiongroups, function(optiongroup){
                                _.each(optiongroup.productOptionComponents, function(productcomponent){
                                    var productId = productcomponent.productId;
                                    if(prodIdtoErrorMap.hasOwnProperty(productId))
                                    {
                                        var message = prodIdtoErrorMap[productId];
                                        optiongroup.isError = true;
                                        optiongroup.errorMessage = message;
                                        MessageService.addMessage('danger', message);
                                        numErrors++;
                                    }
                                })
                            })
                        })
                        $scope.safeApply();
                        $scope.baseService.completeprogress();// end progress bar.
                        if(numErrors > 0)
                        {
                            res = false;
                        }
                    }
                    else{
                        document.getElementById("remoteactionerrors").innerHTML = 
                                event.message + "<br/>\n";
                        deferred.reject(event.message);
                        return deferred.promise;
                    }
                })
            }
            else{
                deferred.reject('Validations Failed.');
                res = false;
                return deferred.promise;
                // baseService.completeprogress();// end progress bar.
            }
            deferred.resolve(res);
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

        $scope.formatPAVBeforeSave = function(pav){
            pav = _.omit(pav, 'attributes');
            
            // set the other picklist to original fields.
            _.each(_.filter(_.keys(pav), function(key){
                            return key.lastIndexOf('Other') != -1;
                        }), 
                function(key){
                    var keywithnoother = key.slice( 0, key.lastIndexOf( "Other" ) );
                    pav[keywithnoother] = pav[key];
                    pav = _.omit(pav, key);
            })
            return pav;
        }
    };

    BaseController.$inject = ['$scope', '$q', '$log', '$dialogs', 'BaseService', 'QuoteDataService', 'MessageService', 'RemoteService', 'LocationDataService', 'OptionGroupDataService', 'ProductAttributeValueDataService'];
    angular.module('APTPS_ngCPQ').controller('BaseController', BaseController);
}).call(this);