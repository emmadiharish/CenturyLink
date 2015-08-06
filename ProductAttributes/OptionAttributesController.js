(function() {
    var OptionAttributesController;

    OptionAttributesController = function($scope, $log, LocationDataService, OptionGroupDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService) {
		$scope.init = function(){
	    	// all variable intializations.

	    	// to manage option attribute groups.
	        $scope.AttributeGroups = [];
	        $scope.productAttributeValues = {};
	        
	        $scope.optionGroupService = OptionGroupDataService;
	        $scope.Selectedoptionproduct = {};
        }
        
        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && !_.isEmpty($scope.Selectedoptionproduct))
            {   
                var optionProductId = $scope.Selectedoptionproduct.productId;
                $scope.retrieveproductattributeGroupData(newVal.productId);
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
            ProductAttributeConfigDataService.getProductAttributesConfig(productId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                ProductAttributeValueDataService.getProductAttributeValues(productId).then(function(pavresult)
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
