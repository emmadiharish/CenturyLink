(function() {
    var OptionAttributesController;

    OptionAttributesController = function($scope, $log, LocationDataService, OptionGroupDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService) {
		$scope.init = function(){
	    	// all variable intializations.

	    	// to manage option attribute groups.
	        $scope.selectedoptionattributegroups = [];
	        $scope.selectedoptionpricingattributes = {};
	        
	        $scope.optionGroupService = OptionGroupDataService;
	        $scope.Selectedoptionproduct = {};
        }
        
        $scope.$watch('optionGroupService.getSelectedoptionproduct()', function(newVal) {
            if(_.isObject(newVal)
                && !_.isEmpty(newVal))
            {
                $scope.Selectedoptionproduct = newVal;
                $scope.retrieveproductattributeGroupData(newVal.productId);    
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
            $scope.selectedoptionattributegroups = attrgroups;
            $scope.selectedoptionpricingattributes = pav;
            $scope.safeApply();   
        }
		
		$scope.init();
    }
    OptionAttributesController.$inject = ['$scope', '$log', 'LocationDataService', 'OptionGroupDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService'];
	angular.module('APTPS_ngCPQ').controller('OptionAttributesController', OptionAttributesController);
}).call(this);