(function() {
    var OptionAttributesController;

    OptionAttributesController = function($scope, $log, LocationDataService, OptionGroupDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService) {
        $scope.init = function(){
            // all variable intializations.
            $scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;
            $scope.PAConfigService = ProductAttributeConfigDataService;
            $scope.optionGroupService = OptionGroupDataService;

            $scope.AttributeGroups = [];
            $scope.productAttributeValues = {};
            $scope.Selectedoptionproduct = {};
        }
        
        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && !_.isEmpty($scope.Selectedoptionproduct))
            {   
                var optionProductId = $scope.Selectedoptionproduct.productId;
                $scope.retrieveproductattributeGroupData(optionProductId);
            }    
        });

        $scope.$watch('optionGroupService.getSelectedoptionproduct()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal))
            {
                $scope.Selectedoptionproduct = newVal;
                var optionProductId = newVal.productId;
                $scope.retrieveproductattributeGroupData(optionProductId);
            }
        });
            

        $scope.retrieveproductattributeGroupData = function(productId){
            // collect all products at this level and make a remote call for attributes.
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlocationId = LocationDataService.getselectedlpaId();
            $scope.PAConfigService.getProductAttributesConfig(productId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                $scope.PAVService.getProductAttributeValues(productId).then(function(pavresult)
                {
                    $scope.renderOptionAttributes(attributeconfigresult, pavresult);
                })
            })
        }

        $scope.renderOptionAttributes = function(attrgroups, pav){
            // clear the previous option attribute groups.
            $scope.AttributeGroups = attrgroups;
            $scope.productAttributeValues = pav;
            $scope.safeApply();   
        }
        
    $scope.init();
    }
    OptionAttributesController.$inject = ['$scope', '$log', 'LocationDataService', 'OptionGroupDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService'];
    angular.module('APTPS_ngCPQ').controller('OptionAttributesController', OptionAttributesController);
}).call(this);
