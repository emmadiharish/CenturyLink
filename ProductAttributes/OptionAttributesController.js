(function() {
    var OptionAttributesController;

    OptionAttributesController = function($scope, $log, RemoteService, LocationDataService, OptionGroupDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService) {
        var depattributes = {};
        $scope.init = function(){
            // all variable intializations.
            $scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;
            $scope.PAConfigService = ProductAttributeConfigDataService;
            $scope.optionGroupService = OptionGroupDataService;
            $scope.PAVConfigService = PAVObjConfigService;

            $scope.AttributeGroups = [];
            $scope.pavfieldDescribeMap = {};
            $scope.productAttributeValues = {};
            $scope.Selectedoptionproduct = {};
        }
        
        // Option Attribute load on location selection.
        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && !_.isEmpty($scope.Selectedoptionproduct))
            {   
                var optionProductId = $scope.Selectedoptionproduct.productId;
                var componentId = $scope.Selectedoptionproduct.componentId;
                $scope.retrieveproductattributeGroupData(optionProductId, componentId);
            }    
        });

        // Option Attribute load on option selection.
        $scope.$watch('optionGroupService.getSelectedoptionproduct()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)){
                $scope.Selectedoptionproduct = newVal;
                var optionProductId = newVal.productId;
                var componentId = newVal.componentId;
                $scope.retrieveproductattributeGroupData(optionProductId, componentId);
            }
        });

        // Cascading of bundle attributes to options.
        $scope.$watchCollection('PAVService.getbundleproductattributevalues()', function(newValue){ 
            if(!_.isEmpty(newValue))
            {
                $scope.CascadeBunleAttributestoOptions();
            }
        });

        $scope.CascadeBunleAttributestoOptions = function(){
            // get attribute config fields for bundle product and clone them.
            var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
            var bunleAttributeFields = $scope.PAConfigService.getBundleAttributeFields();
            var optionPAV = $scope.productAttributeValues;
            _.each(bunleAttributeFields, function(field){
                optionPAV[field] = bundlePAV[field];
            });
            var res = $scope.PAVConfigService.configurePAVFields($scope.AttributeGroups, optionPAV);
            optionPAV = res.PAVObj;
        }
            

        $scope.retrieveproductattributeGroupData = function(productId, componentId){
            // collect all products at this level and make a remote call for attributes.
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlocationId = LocationDataService.getselectedlpaId();
            $scope.pavfieldDescribeMap = $scope.PAVConfigService.fieldNametoDFRMap;
            $scope.PAConfigService.getProductAttributesConfig(productId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                $scope.PAVService.getProductAttributeValues(componentId).then(function(pavresult)
                {
                    var res = $scope.PAVConfigService.configurePAVFields(attributeconfigresult, pavresult);
                    // $scope.optionDynamicAttributeValidation(res.pavConfigGroups);
                    renderOptionAttributes(res.pavConfigGroups, res.PAVObj);
                })
            })
        }

        //Removing Dynamic Attributes Group if it has no values
        /*$scope.optionDynamicAttributeValidation = function(AttrGroups){
            _.each(AttrGroups,function(group){
                if(group.groupName == 'Dynamic attributes'){
                    _.each(group.productAtributes, function(attrItems){
                        if(attrItems.picklistValues.length == 1 && attrItems.picklistValues[0].label == '--None--'){
                            group.productAtributes.remove(attrItems);
                        }
                    });
                }
                if(group.groupName == 'Dynamic attributes' && group.productAtributes.length == 0){
                    AttrGroups.remove(group);
                }
            });
        }*/

        function renderOptionAttributes(attrgroups, pav){
            // clear the previous option attribute groups.
            $scope.AttributeGroups = attrgroups;
            $scope.productAttributeValues = pav;
            $scope.CascadeBunleAttributestoOptions();
            $scope.optionLevelAttributeChange();
            $scope.seatTypeExpressions(attrgroups, pav);
            $scope.safeApply();
        }

        $scope.PAVPicklistChange = function(fieldName){
            var res = $scope.PAVConfigService.applyDependedPicklistsOnChange($scope.AttributeGroups, $scope.productAttributeValues, fieldName);    
            renderOptionAttributes(res.pavConfigGroups, res.PAVObj);
        }

        $scope.optionLevelAttributeChange = function(){
            var optionAttributes = $scope.productAttributeValues;
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
                var portOptions = $scope.PAVConfigService.getPortOptions();
                var filteredPortOption = _.findWhere(portOptions, {'Local_Access_Speed__c': depattributes.AccessSpeed, 'Billing_Type__c': depattributes.BillingType});
                if(_.has(filteredPortOption, 'Bandwidth__c') 
                    && _.has(filteredPortOption, 'Circuit_Speed__c')){
                    
                    var Bandwidth = [];
                    var CircuitSpeed = [];
                    var BandwidthSplitted = [];
                    var CircuitSpeedSplitted = [];

                    BandwidthSplitted = filteredPortOption['Bandwidth__c'].split(', ');
                    CircuitSpeedSplitted = filteredPortOption['Circuit_Speed__c'].split(', ');                      
                    
                    Bandwidth = $scope.PAVConfigService.getPicklistValues($scope.PAVConfigService.prepareOptionsList(BandwidthSplitted));
                    CircuitSpeed = $scope.PAVConfigService.getPicklistValues($scope.PAVConfigService.prepareOptionsList(CircuitSpeedSplitted));
                    
                    _.each($scope.AttributeGroups, function(eachgroup){
                        _.each(eachgroup.productAtributes, function(eachattribute){
                            if(eachattribute.fieldName == 'Bandwidth__c'){
                                eachattribute.picklistValues = Bandwidth;
                                $scope.productAttributeValues['Bandwidth__c'] = null;
                            }
                            
                            if(eachattribute.fieldName == 'Access_Speed__c'){
                                eachattribute.picklistValues = CircuitSpeed;
                                $scope.productAttributeValues['Access_Speed__c'] = null;
                            }
                        });
                    });
                }
            }
        }

        $scope.seatTypeExpressions = function(attributes){
            var count = $scope.optionGroupService.seatTypeCount;
            _.each($scope.AttributeGroups, function(attrGroups){
                _.each(attrGroups.productAtributes, function(item){
                    if(item.fieldName == 'Total_Seats__c'){
                        item.isReadOnly = true;
                        $scope.productAttributeValues['Total_Seats__c'] = count;
                    }
                });
            });
        }
        
        $scope.init();
    }
    OptionAttributesController.$inject = ['$scope', '$log', 'RemoteService', 'LocationDataService', 'OptionGroupDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVObjConfigService'];
    angular.module('APTPS_ngCPQ').controller('OptionAttributesController', OptionAttributesController);
}).call(this);