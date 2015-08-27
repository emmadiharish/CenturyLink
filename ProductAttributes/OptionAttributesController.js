(function() {
    var OptionAttributesController;

    OptionAttributesController = function($scope, $log, $timeout, LocationDataService, OptionGroupDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService) {
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
            // commenting cascade.....its breaking dependency.
            // $scope.productAttributeValues = _.clone(bundlePAV);
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
            $scope.safeApply();   
        }

        $scope.PAVPicklistChange = function(fieldName){
            var res = $scope.PAVConfigService.applyDependedPicklistsOnChange($scope.AttributeGroups, $scope.productAttributeValues, fieldName);    
            $scope.renderOptionAttributes(res.pavConfigGroups, res.PAVObj);
        }

        /*$scope.PAVPicklistChange = function(fieldName){
            var selectedPAVValue = $scope.productAttributeValues[fieldName];
            var dFieldDefinations = $scope.PAVDPicklistService.getStructuredDependentFields(fieldName);
            var dFields = _.keys(dFieldDefinations);
            // Iterate over all dependent fields and change its dropdown values according to controlling field value selected.
            _.each($scope.AttributeGroups, function(attributeGroup){
                _.each(attributeGroup.productAtributes, function(attributeConfig){
                    // dependent field existing in the attribute group configuration.
                    // change the selectOptions of depenedent picklist fields.
                    var dField = attributeConfig.fieldName;
                    if(_.indexOf(dFields, dField) != -1)
                    {
                        var dPicklistConfig = dFieldDefinations[dField];
                        var options = [];
                        $scope.productAttributeValues[dField] = null;
                        options.push({key:'--None--', value:null});
                        _.each(dPicklistConfig[selectedPAVValue], function(lov){
                            options.push({key:lov, value:lov});
                        })
                        attributeConfig.selectOptions = options;
                        $scope.PAVPicklistChange(dField);// more than one level-dependency could exist.
                    }
                })    
            })    
        }*/
        
        $scope.init();
    }
    OptionAttributesController.$inject = ['$scope', '$log', '$timeout', 'LocationDataService', 'OptionGroupDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVObjConfigService'];
    angular.module('APTPS_ngCPQ').controller('OptionAttributesController', OptionAttributesController);
}).call(this);