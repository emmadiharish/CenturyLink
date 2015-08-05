(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, $log, QuoteDataService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;

            $scope.bundleAttributeGroups = [];// attributes for main bundle.
            $scope.bundleproductattributevalues = {};
            
            $scope.retrievebundleattributes();// load the bundle attributes on page load.
        }

        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldValue) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldValue))
            {   var prodpluslocationId = QuoteDataService.getbundleproductId()+newVal.Id;
                $scope.retrievebundleattributes();
                $scope.safeApply();
            }    
        });
        
        $scope.retrievebundleattributes = function(){
            //var alllocationIdSet = LocationDataService.getalllocationIdSet();
            $scope.locationService.getlocItems().then(function(result) {
                var alllocationIdSet = $scope.locationService.getalllocationIdSet();
                var selectedlpa = LocationDataService.getselectedlpa();
                var selectedlocationId = _.isObject(selectedlpa) ? selectedlpa.Id : '';
                var bundleProductId = QuoteDataService.getbundleproductId();
                ProductAttributeConfigDataService.getProductAttributesConfig(bundleProductId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                    $scope.PAVService.getProductAttributeValues(bundleProductId).then(function(pavresult)
                    {
                        $scope.renderBundleAttributes(attributeconfigresult, pavresult);
                    })
                })
            })
        }

        $scope.renderBundleAttributes = function(attrgroups, pav){
            // clear the previous option attribute groups.
            $scope.bundleAttributeGroups = attrgroups;
            $scope.PAVService.setbundleproductattributevalues(pav);
            $scope.bundleproductattributevalues = $scope.PAVService.getbundleproductattributevalues();
            $scope.safeApply();   
        }
        
        $scope.init();
	};

    BundleAttributesController.$inject = ['$scope', '$log', 'QuoteDataService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);