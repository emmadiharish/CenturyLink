(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, $log, QuoteDataService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.locationService = LocationDataService;
            $scope.bundlestaticattributegroups = [];// static attributes for main bundle.
            $scope.bundledynamicattributegroups = [];// to be set using remoteaction function.
            $scope.bundleproductattributevalues = {};
            
            $scope.retrieveStaticbundleattributeGroupData();// load the bundle attributes on page load.
        }

        $scope.$watch('locationService.getselectedlpa()', function(newVal) {
            // $log.log('selected service location change:'+newVal);
            if(newVal)
            {   var prodpluslocationId = QuoteDataService.getbundleproductId()+newVal.Id;
                $scope.bundledynamicattributegroups = ProductAttributeConfigDataService.getDynamicGroups(prodpluslocationId);
                $scope.safeApply();
            }    
        });
        
        $scope.retrieveStaticbundleattributeGroupData = function(){
            var alllocationIdSet = LocationDataService.getalllocationIdSet();
            var selectedlpa = LocationDataService.getselectedlpa();
            var selectedlocationId = _.isObject(selectedlpa) ? selectedlpa.Id : '';
            var bundleProductId = QuoteDataService.getbundleproductId();
            ProductAttributeConfigDataService.getProductAttributesConfig(bundleProductId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                ProductAttributeValueDataService.getProductAttributeValues(bundleProductId).then(function(pavresult)
                {
                    $scope.renderBundleAttributes(attributeconfigresult, pavresult);
                })
            })
        }

        $scope.renderBundleAttributes = function(attrgroups, pav){
            // clear the previous option attribute groups.
            $scope.bundlestaticattributegroups = attrgroups;
            $scope.bundleproductattributevalues = pav;
            $scope.safeApply();   
        }

        $scope.init();
	};

    BundleAttributesController.$inject = ['$scope', '$log', 'QuoteDataService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);