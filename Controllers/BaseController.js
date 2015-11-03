/*
    Save of the option groups should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
(function() {
    'use strict';
    var BaseController;

    BaseController.$inject = ['$scope', 
                               '$q', 
                               '$log', 
                               '$window', 
                               '$timeout', 
                               '$dialogs', 
                               'SystemConstants', 
                               'BaseService', 
                               'BaseConfigService',
                               'RemoteService',
                               'SaveConfigService'];

    BaseController = function($scope, $q, $log, $window, $timeout, $dialogs, SystemConstants, BaseService, BaseConfigService, RemoteService, SaveConfigService) {
        // all variable intializations.
        var baseCtrl = this;
        
        function init(){
            $scope.baseService = BaseService;
            
            baseCtrl.constants = SystemConstants;
            baseCtrl.baseUrl = SystemConstants.baseUrl;
            baseCtrl.ProgressBartinprogress = false;
            //baseCtrl.ProgressBartinprogress = BaseService.getProgressBartinprogress();
        }

        $scope.$watch('baseService.getProgressBartinprogress()', function(newVal, oldVal){
            baseCtrl.ProgressBartinprogress = newVal;
        });

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

        baseCtrl.launch = function(which){
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
                        Abandon();
                    },function(btn){
                        
                });
                break;

                // Remove Item Confirm Dialog
                case 'confirmRemoveItem':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to remove the current Line item?');
                    dlg.result.then(function(btn){
                        removeItemFromCart();
                    },function(btn){
                    
                });
                break;
            }; // end switch
        }; // end launch

        baseCtrl.addMoreProducts = function(){
            // apply timeout if saveCall is in progress.
            $timeout(function() {
                SaveConfigService.saveinformation().then(function(response){
                    if(response == true)
                    {
                        var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName;
                        var requestPromise = RemoteService.addMoreProducts(cartId, configRequestId, flowName);
                        return requestPromise.then(function(response){
                            parsenRedirect(response);
                        });
                    }
                })
            }, gettimeinmillis());
        }

        baseCtrl.GoToPricing = function(){
            // apply timeout if saveCall is in progress.
            $timeout(function() {
                SaveConfigService.saveinformation().then(function(response){
                    if(response == true)
                    {
                        var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName;
                        var requestPromise = RemoteService.goToPricing(cartId, configRequestId, flowName);
                        return requestPromise.then(function(response){
                            parsenRedirect(response);
                        });
                    }
                })
            }, gettimeinmillis());
        }

        /*@Validate
            Save Config and run constraint rules.
        */
        baseCtrl.ValidateConfig = function(){
            SaveConfigService.saveinformation().then(function(response){
                if(response == true)
                {
                    
                }
            })
        }

        function Abandon(){
            var cartId = BaseConfigService.cartId, quoteId = BaseConfigService.proposal.Id;
            var requestPromise = RemoteService.doAbandonCart(cartId, quoteId);
            return requestPromise.then(function(response){
                parsenRedirect(response);
            });
        }

        function removeItemFromCart(){
            var cartId = BaseConfigService.cartId, configRequestId = BaseConfigService.configRequestId, flowName = BaseConfigService.flowName, primaryLineNumber = BaseConfigService.lineItem.lineNumber, bundleProdId = BaseConfigService.lineItem.bundleProdId;
            var requestPromise = RemoteService.removeBundleLineItem(cartId, configRequestId, flowName, primaryLineNumber, bundleProdId);
            return requestPromise.then(function(response){
                parsenRedirect(response);
            });
        }

        function parsenRedirect(pgReference){
            if(!_.isNull(pgReference)
                && !_.isEmpty(pgReference))
                $window.location.href = _.unescape(pgReference);
        };

        function gettimeinmillis(){
            if(BaseService.getisSaveCallinProgress() == true)
                return 5000;
            else
                return 100;
        }

        init();
    };
    
    angular.module('APTPS_ngCPQ').controller('BaseController', BaseController);
}).call(this);