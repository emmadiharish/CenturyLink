/**
 * Directive: OptionAttributesDirective 
 */
;(function() {
    'use strict';

    function OptionAttributesController($scope, $log, $sce, SystemConstants, LocationDataService, OptionGroupDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService) {
        var depattributes = {};
        var attrCtrl = this;

        function init(){
            // all variable intializations.
            $scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;
            $scope.optionGroupService = OptionGroupDataService;
            
            attrCtrl.constants = SystemConstants;
            attrCtrl.AttributeGroups = [];
            attrCtrl.pavfieldDescribeMap = {};
            attrCtrl.productAttributeValues = {};
            attrCtrl.Selectedoptionproduct = {};
        }
        
        // Option Attribute load on location selection.
        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && !_.isEmpty(attrCtrl.Selectedoptionproduct))
            {   
                var optionProductId = attrCtrl.Selectedoptionproduct.productId;
                var componentId = attrCtrl.Selectedoptionproduct.componentId;
                retrieveproductattributeGroupData(optionProductId, componentId);
            }    
        });

        // Option Attribute load on option selection.
        $scope.$watch('optionGroupService.getSelectedoptionproduct()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)){
                attrCtrl.Selectedoptionproduct = newVal;
                var optionProductId = newVal.productId;
                var componentId = newVal.componentId;
                retrieveproductattributeGroupData(optionProductId, componentId);
            }
            else{
                // clear the option attributes.
                clearAttributes();
            }
        });

        // Cascading of bundle attributes to options.
        $scope.$watchCollection('PAVService.getbundleproductattributevalues()', function(newValue){ 
            if(!_.isEmpty(newValue))
            {
                attrCtrl.CascadeBunleAttributestoOptions();
                PAVObjConfigService.configurePAVFields(attrCtrl.AttributeGroups, attrCtrl.productAttributeValues);
            }
        });

        attrCtrl.CascadeBunleAttributestoOptions = function(){
            // get attribute config fields for bundle product and clone them.
            var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
            var bunleAttributeFields = ProductAttributeConfigDataService.getBundleAttributeFields();
            var optionPAV = attrCtrl.productAttributeValues;
            _.each(bunleAttributeFields, function(field){
                optionPAV[field] = bundlePAV[field];
            });
            // var res = PAVObjConfigService.configurePAVFields(attrCtrl.AttributeGroups, optionPAV);
            // optionPAV = res.PAVObj;
        }
            

        function retrieveproductattributeGroupData(productId, componentId){
            // collect all products at this level and make a remote call for attributes.
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlocationId = LocationDataService.getselectedlpaId();
            attrCtrl.pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
            ProductAttributeConfigDataService.getProductAttributesConfig(productId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                ProductAttributeValueDataService.getProductAttributeValues(componentId).then(function(pavresult)
                {
                    // var res = PAVObjConfigService.configurePAVFields(attributeconfigresult, pavresult);
                    // $scope.optionDynamicAttributeValidation(res.pavConfigGroups);
                    setOptionAttributes(attributeconfigresult, pavresult);
                    renderOptionAttributes();
                })
            })
        }

        function setOptionAttributes(attrgroups, pav){
            attrCtrl.AttributeGroups = attrgroups;
            attrCtrl.productAttributeValues = pav;
        }

        function renderOptionAttributes(){
            // clear the previous option attribute groups.
            attrCtrl.CascadeBunleAttributestoOptions();
            PAVObjConfigService.configurePAVFields(attrCtrl.AttributeGroups, attrCtrl.productAttributeValues);
            attrCtrl.optionLevelAttributeChange();
            attrCtrl.seatTypeExpressions();
            //$scope.safeApply();
        }

        attrCtrl.PAVPicklistChange = function(fieldName){
            renderOptionAttributes();
        }

        attrCtrl.optionLevelAttributeChange = function(){
            var optionAttributes = attrCtrl.productAttributeValues;
            if(_.has(optionAttributes, 'Ethernet_Local_Access_Speed__c')
                && !_.isNull(optionAttributes['Ethernet_Local_Access_Speed__c'])){
                depattributes['AccessSpeed'] = optionAttributes['Ethernet_Local_Access_Speed__c'];
            }
            
            if(_.has(optionAttributes, 'Billing_Type__c') 
                && !_.isNull(optionAttributes['Billing_Type__c'])){
                depattributes['BillingType'] = optionAttributes['Billing_Type__c'];
            }
            
            if(_.has(depattributes, 'AccessSpeed') 
                && _.has(depattributes, 'BillingType')){
                var portOptions = PAVObjConfigService.getPortOptions();
                var filteredPortOption = _.findWhere(portOptions, {'Local_Access_Speed__c': depattributes.AccessSpeed, 'Billing_Type__c': depattributes.BillingType});
                if(_.has(filteredPortOption, 'Bandwidth__c') 
                    && _.has(filteredPortOption, 'Circuit_Speed__c')){
                    
                    var Bandwidth = [];
                    var CircuitSpeed = [];
                    var BandwidthSplitted = [];
                    var CircuitSpeedSplitted = [];

                    BandwidthSplitted = filteredPortOption['Bandwidth__c'].split(', ');
                    CircuitSpeedSplitted = filteredPortOption['Circuit_Speed__c'].split(', ');                      
                    
                    Bandwidth = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(BandwidthSplitted));
                    CircuitSpeed = PAVObjConfigService.getPicklistValues(PAVObjConfigService.prepareOptionsList(CircuitSpeedSplitted));
                    
                    _.each(attrCtrl.AttributeGroups, function(eachgroup){
                        _.each(eachgroup.productAtributes, function(eachattribute){
                            if(eachattribute.fieldName == 'Bandwidth__c'){
                                eachattribute.picklistValues = Bandwidth;
                                attrCtrl.productAttributeValues['Bandwidth__c'] = null;
                            }
                            
                            if(eachattribute.fieldName == 'Access_Speed__c'){
                                eachattribute.picklistValues = CircuitSpeed;
                                attrCtrl.productAttributeValues['Access_Speed__c'] = null;
                            }
                        });
                    });
                }
            }
        }

        attrCtrl.seatTypeExpressions = function(){
            var count = OptionGroupDataService.seatTypeCount;
            _.each(attrCtrl.AttributeGroups, function(attrGroups){
                _.each(attrGroups.productAtributes, function(item){
                    if(item.fieldName == 'Total_Seats__c'){
                        item.isReadOnly = true;
                        attrCtrl.productAttributeValues['Total_Seats__c'] = count;
                    }
                });
            });
        }

        attrCtrl.trustAsHtml = function(value) {
            return $sce.trustAsHtml(value);
        };

        function clearAttributes(){
            attrCtrl.AttributeGroups = [];
            attrCtrl.Selectedoptionproduct = {};       
            attrCtrl.productAttributeValues = {};
        }

        init();
    }

    OptionAttributesController.$inject = ['$scope', 
                                            '$log',
                                            '$sce',
                                            'SystemConstants', 
                                            'LocationDataService', 
                                            'OptionGroupDataService', 
                                            'ProductAttributeConfigDataService', 
                                            'ProductAttributeValueDataService', 
                                            'PAVObjConfigService'];

    
    angular.module('APTPS_ngCPQ').directive('optionAttributes', OptionAttributes);

    OptionAttributes.$inject = ['SystemConstants'];
    function OptionAttributes(SystemConstants){
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {}, // {} = isolate, true = child, false/undefined = no change
            controller: OptionAttributesController,
            controllerAs: 'attrCtrl',
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
            //template: '<div>pageHeader</div>',
            templateUrl: SystemConstants.baseUrl + "/Templates/OptionAttributesView.html",
            // replace: true,
            // transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
            link: function(cartCtrl, iElm, iAttrs, controller) {
                /*var top = 100;//$('.thisone').offset().top;
                    
                $(document).scroll(function(){
                    $('.thisone').css('position','');
                    top = $('.thisone').offset().top;
                    $('.thisone').css('position','absolute');
                    $('.thisone').css('top', Math.max(top, $(document).scrollTop()));
                });*/
            },
            bindToController: true
        };
    }
}).call(this);