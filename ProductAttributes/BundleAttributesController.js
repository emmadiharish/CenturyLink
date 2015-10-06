(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, SystemConstants, BaseService, BaseConfigService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService) {
		// all variable intializations.
        var remotecallinitiated = false;
        var attrCtrl = this;
        
        function init(){
        	attrCtrl.locationService = LocationDataService;
            attrCtrl.constants = SystemConstants;
            attrCtrl.baseService = BaseService;
            attrCtrl.baseConfig = BaseConfigService;

            attrCtrl.AttributeGroups = [];// attribute config groups for main bundle.
            attrCtrl.pavfieldDescribeMap = {};
            attrCtrl.productAttributeValues = {};
        }

        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && remotecallinitiated == false)
            {   
                retrieveproductattributeGroupData();
            }    
        });

        $scope.$watch('baseService.getLocationLoadComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true
                && remotecallinitiated == false)
            {   
                retrieveproductattributeGroupData();
            }    
        });
        
        // Note : this method should be invoked only when remotecallinitiated flag is false;
        function retrieveproductattributeGroupData(){
            // run only if location remote call is complete.
            if(BaseService.getLocationLoadComplete() == true)
            {
                remotecallinitiated = true;
                var alllocationIdSet = attrCtrl.locationService.getalllocationIdSet();
                var selectedlocationId = attrCtrl.locationService.getselectedlpaId();
                var bundleProductId = BaseConfigService.lineItem.bundleProdId;
                PAVObjConfigService.getPAVFieldMetaData().then(function(fieldDescribeMap){
                    if(_.isEmpty(attrCtrl.pavfieldDescribeMap))
                    {
                        attrCtrl.pavfieldDescribeMap = fieldDescribeMap;
                    }
                    ProductAttributeConfigDataService.getProductAttributesConfig(bundleProductId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                        ProductAttributeValueDataService.getProductAttributeValues(bundleProductId).then(function(result)
                        {
                            ProductAttributeConfigDataService.setBundleAttributeFields(attributeconfigresult);
                            var bundlePAV = ProductAttributeValueDataService.getbundleproductattributevalues();
                            // var res = PAVObjConfigService.configurePAVFields(attributeconfigresult, bundlePAV);
                            renderBundleAttributes(attributeconfigresult, bundlePAV);
                            remotecallinitiated = false;
                        })
                    })
                })
            }
        }

        function renderBundleAttributes(attrgroups, pav){
            // clear the previous option attribute groups.
            attrCtrl.AttributeGroups = attrgroups;
            attrCtrl.productAttributeValues = pav;
            PAVObjConfigService.configurePAVFields(attrCtrl.AttributeGroups, attrCtrl.productAttributeValues);
            ProductAttributeValueDataService.setbundleproductattributevalues(attrCtrl.productAttributeValues);
            // attrCtrl.productAttributeValues = ProductAttributeValueDataService.getbundleproductattributevalues();
            attrCtrl.safeApply();   
        }
        
        attrCtrl.PAVPicklistChange = function(fieldName){
            renderBundleAttributes(attrCtrl.AttributeGroups, attrCtrl.productAttributeValues);
        }

        init();
	};

    BundleAttributesController.$inject = ['$scope', 'SystemConstants', 'BaseService', 'BaseConfigService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVObjConfigService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);