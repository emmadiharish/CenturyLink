(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, $log, SystemConstants, BaseService, BaseConfigService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.locationService = LocationDataService;
            $scope.constants = SystemConstants;
            $scope.BaseConfig = BaseConfigService;
            $scope.baseService = BaseService;

            $scope.AttributeGroups = [];// attribute config groups for main bundle.
            $scope.pavfieldDescribeMap = {};
            $scope.productAttributeValues = {};
            $scope.remotecallinitiated = false;
        }

        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && $scope.remotecallinitiated == false)
            {   
                retrieveproductattributeGroupData();
            }    
        });

        $scope.$watch('baseService.getLocationLoadComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true
                && $scope.remotecallinitiated == false)
            {   
                retrieveproductattributeGroupData();
            }    
        });
        
        // Note : this method should be invoked only when remotecallinitiated flag is false;
        function retrieveproductattributeGroupData(){
            // run only if location remote call is complete.
            if(BaseService.getLocationLoadComplete() == true)
            {
                $scope.remotecallinitiated = true;
                var alllocationIdSet = $scope.locationService.getalllocationIdSet();
                var selectedlocationId = $scope.locationService.getselectedlpaId();
                var bundleProductId = BaseConfigService.bundleProdId;
                PAVObjConfigService.getPAVFieldMetaData().then(function(fieldDescribeMap){
                    if(_.isEmpty($scope.pavfieldDescribeMap))
                    {
                        $scope.pavfieldDescribeMap = fieldDescribeMap;
                    }
                    ProductAttributeConfigDataService.getProductAttributesConfig(bundleProductId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                        ProductAttributeValueDataService.getProductAttributeValues(bundleProductId).then(function(result)
                        {
                            ProductAttributeConfigDataService.setBundleAttributeFields(attributeconfigresult);
                            var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
                            // var res = PAVObjConfigService.configurePAVFields(attributeconfigresult, bundlePAV);
                            renderBundleAttributes(attributeconfigresult, bundlePAV);
                            $scope.remotecallinitiated = false;
                        })
                    })
                })
            }
        }

        function renderBundleAttributes(attrgroups, pav){
            // clear the previous option attribute groups.
            $scope.AttributeGroups = attrgroups;
            $scope.productAttributeValues = pav;
            PAVObjConfigService.configurePAVFields($scope.AttributeGroups, $scope.productAttributeValues);
            ProductAttributeValueDataService.setbundleproductattributevalues($scope.productAttributeValues);
            // $scope.productAttributeValues = ProductAttributeValueDataService.getbundleproductattributevalues();
            $scope.safeApply();   
        }
        
        $scope.PAVPicklistChange = function(fieldName){
            // var res = PAVObjConfigService.applyDependedPicklistsOnChange($scope.AttributeGroups, $scope.productAttributeValues, fieldName);    
            renderBundleAttributes($scope.AttributeGroups, $scope.productAttributeValues);
        }

        $scope.init();
	};

    BundleAttributesController.$inject = ['$scope', '$log', 'SystemConstants', 'BaseService', 'BaseConfigService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVObjConfigService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);
