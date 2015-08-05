(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, $log, QuoteDataService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;

            $scope.bundlestaticattributegroups = [];// static attributes for main bundle.
            $scope.bundledynamicattributegroups = [];// to be set using remoteaction function.
            $scope.bundleproductattributevalues = {};
            
            $scope.retrievebundleattributeConfig();// load the bundle attributes on page load.
        }

        $scope.$watch('locationService.getselectedlpa()', function(newVal) {
            if(newVal)
            {   var prodpluslocationId = QuoteDataService.getbundleproductId()+newVal.Id;
                //$scope.bundledynamicattributegroups = ProductAttributeConfigDataService.getDynamicGroups(prodpluslocationId);
                $scope.retrievebundleattributeConfig();
                $scope.safeApply();
            }    
        });
        
        $scope.retrievebundleattributeConfig = function(){
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlpa = LocationDataService.getselectedlpa();
            var selectedlocationId = _.isObject(selectedlpa) ? selectedlpa.Id : '';
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
            $scope.bundlestaticattributegroups = attrgroups;
            $scope.PAVService.setbundleproductattributevalues(pav);
            $scope.bundleproductattributevalues = $scope.PAVService.getbundleproductattributevalues();
            $scope.safeApply();   
        }
        
        $scope.init();
	};

    BundleAttributesController.$inject = ['$scope', '$log', 'QuoteDataService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);