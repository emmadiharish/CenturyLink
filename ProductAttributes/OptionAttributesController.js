(function() {
    var OptionAttributesController;

    OptionAttributesController = function($scope, $log, RemoteService, LocationDataService, OptionGroupDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService) {
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
            $scope.dependencyAttributes = [];
        }
        
        // Option Attribute load on location selection.
        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && !_.isEmpty($scope.Selectedoptionproduct))
            {   
                var optionProductId = $scope.Selectedoptionproduct.productId;
                $scope.retrieveproductattributeGroupData(optionProductId);
            }    
        });

        // Option Attribute load on option selection.
        $scope.$watch('optionGroupService.getSelectedoptionproduct()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal))
            {
                $scope.Selectedoptionproduct = newVal;
                var optionProductId = newVal.productId;
                $scope.retrieveproductattributeGroupData(optionProductId);
            }
        });

        // Cascading of bundle attributes to options.
        $scope.$watchCollection('PAVService.getbundleproductattributevalues()', function(newValue){ 
            if(!_.isEmpty(newValue))
            {
                $scope.CascadeBunleAttributestoOptions();
                //$scope.safeApply();
            }
        });

        $scope.CascadeBunleAttributestoOptions = function(){
            var bundlePAV = $scope.PAVService.getbundleproductattributevalues()
            $scope.productAttributeValues = _.extend($scope.productAttributeValues, bundlePAV);
        }
            

        $scope.retrieveproductattributeGroupData = function(productId){
            // collect all products at this level and make a remote call for attributes.
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlocationId = LocationDataService.getselectedlpaId();
            $scope.PAVConfigService.getPAVFieldMetaData().then(function(fieldDescribeMap){
                if(_.isEmpty($scope.pavfieldDescribeMap))
                {
                    $scope.pavfieldDescribeMap = fieldDescribeMap;
                }
                $scope.PAConfigService.getProductAttributesConfig(productId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                    $scope.PAVService.getProductAttributeValues(productId).then(function(pavresult)
                    {
                        var res = $scope.PAVConfigService.loadPicklistDropDowns(attributeconfigresult, pavresult);
                        $scope.renderOptionAttributes(res.pavConfigGroups, res.PAVObj);
                    })
                })
            })
        }

        $scope.renderOptionAttributes = function(attrgroups, pav){
            // clear the previous option attribute groups.
            $scope.AttributeGroups = attrgroups;
            $scope.productAttributeValues = pav;
            $scope.CascadeBunleAttributestoOptions();
            $scope.optionLevelAttributeChange();
            $scope.safeApply();   
        }

        $scope.PAVPicklistChange = function(fieldName){
            $scope.renderOptionAttributes($scope.AttributeGroups, $scope.productAttributeValues);
            var res = $scope.PAVConfigService.applyDependedPicklistsOnChange($scope.AttributeGroups, $scope.productAttributeValues, fieldName);    
        }

        $scope.optionLevelAttributeChange = function(){
            var optionAttributes = $scope.productAttributeValues;
            if(optionAttributes.hasOwnProperty('Ethernet_Local_Access_Speed__c') && optionAttributes['Ethernet_Local_Access_Speed__c'] != null){
                $scope.dependencyAttributes['Ethernet_Local_Access_Speed__c'] = optionAttributes['Ethernet_Local_Access_Speed__c'];
            }
            
            if(optionAttributes.hasOwnProperty('Billing_Type__c') && optionAttributes['Billing_Type__c'] != null){
                $scope.dependencyAttributes['Billing_Type__c'] = optionAttributes['Billing_Type__c'];
            }
            
            if($scope.dependencyAttributes.hasOwnProperty('Ethernet_Local_Access_Speed__c') && $scope.dependencyAttributes.hasOwnProperty('Billing_Type__c')){
                var requestPromise = RemoteService.getDependencyAttributes($scope.dependencyAttributes['Ethernet_Local_Access_Speed__c'],$scope.dependencyAttributes['Billing_Type__c']);
                requestPromise.then(function(result){
                    if(result.hasOwnProperty('Bandwidth__c') && result.hasOwnProperty('Circuit_Speed__c')){
                        var Bandwidth = [];
                        var CircuitSpeed = [];
                        var BandwidthSplitted = [];
                        var CircuitSpeedSplitted = [];
                        
                        BandwidthSplitted = result['Bandwidth__c'].split(', ');
                        CircuitSpeedSplitted = result['Circuit_Speed__c'].split(', ');                      
                        
                        _.each(BandwidthSplitted, function(item){
                            Bandwidth.push({value:item, label:item, active:true, defaultValue:false});
                        });
                        _.each(CircuitSpeedSplitted, function(item){
                            CircuitSpeed.push({value:item, label:item, active:true, defaultValue:false});
                        });
                        
                        _.each($scope.AttributeGroups, function(groups){
                            _.each(groups.productAtributes, function(attributes){
                                if(attributes.fieldName == 'Bandwidth__c'){
                                    attributes.picklistValues = Bandwidth;
                                    $scope.productAttributeValues['Bandwidth__c'] = Bandwidth[0].value;
                                }
                                
                                if(attributes.fieldName == 'Access_Speed__c'){
                                    attributes.picklistValues = CircuitSpeed;
                                    $scope.productAttributeValues['Access_Speed__c'] = CircuitSpeed[0].value;
                                }
                            });
                        });
                        
                    }
                    $scope.safeApply();
                });
            }
        }

        $scope.init();
    }
    OptionAttributesController.$inject = ['$scope', '$log', 'RemoteService', 'LocationDataService', 'OptionGroupDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVObjConfigService'];
    angular.module('APTPS_ngCPQ').controller('OptionAttributesController', OptionAttributesController);
}).call(this);