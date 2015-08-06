(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, $log, QuoteDataService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;

            $scope.AttributeGroups = [];// attribute config groups for main bundle.
            $scope.productAttributeValues = {};
        }

        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal))
            {   
                $scope.retrieveproductattributeGroupData();
            }    
        });

        $scope.$watch('locationService.getisRemotecallComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true)
            {   
                $scope.retrieveproductattributeGroupData();
            }    
        });
        
        $scope.retrieveproductattributeGroupData = function(){
            var alllocationIdSet = $scope.locationService.getalllocationIdSet();
            var selectedlocationId = $scope.locationService.getselectedlpaId();
            var bundleProductId = QuoteDataService.getbundleproductId();
            ProductAttributeConfigDataService.getProductAttributesConfig(bundleProductId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                $scope.PAVService.getProductAttributeValues(bundleProductId).then(function(pavresult)
                {
                    $scope.renderBundleAttributes(attributeconfigresult, pavresult);
                })
            })
        }

        $scope.renderBundleAttributes = function(attrgroups, pav){
            // clear the previous option attribute groups.
            $scope.AttributeGroups = attrgroups;
            $scope.PAVService.setbundleproductattributevalues(pav);
            $scope.productAttributeValues = $scope.PAVService.getbundleproductattributevalues();
            $scope.safeApply();   
        }
        
        $scope.init();
	};

    BundleAttributesController.$inject = ['$scope', '$log', 'QuoteDataService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);