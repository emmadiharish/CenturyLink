(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, $log, SystemConstants, BaseConfigService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVObjConfigService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.locationService = LocationDataService;
            $scope.constants = SystemConstants;
            $scope.attributeUrl = SystemConstants.baseUrl+'/Templates/ProductAttributesView.html';
            $scope.PAVService = ProductAttributeValueDataService;
            $scope.PAConfigService = ProductAttributeConfigDataService;
            $scope.PAVConfigService = PAVObjConfigService;

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
                $scope.retrieveproductattributeGroupData();
            }    
        });

        $scope.$watch('locationService.getisRemotecallComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true
                && $scope.remotecallinitiated == false)
            {   
                $scope.retrieveproductattributeGroupData();
            }    
        });
        
        // Note : this method should be invoked only when remotecallinitiated flag is false;
        $scope.retrieveproductattributeGroupData = function(){
            // run only if location remote call is complete.
            if($scope.locationService.getisRemotecallComplete() == true)
            {
                $scope.remotecallinitiated = true;
                var alllocationIdSet = $scope.locationService.getalllocationIdSet();
                var selectedlocationId = $scope.locationService.getselectedlpaId();
                var bundleProductId = BaseConfigService.bundleProdId;
                $scope.PAVConfigService.getPAVFieldMetaData().then(function(fieldDescribeMap){
                    if(_.isEmpty($scope.pavfieldDescribeMap))
                    {
                        $scope.pavfieldDescribeMap = fieldDescribeMap;
                    }
                    $scope.PAConfigService.getProductAttributesConfig(bundleProductId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                        $scope.PAVService.getProductAttributeValues(bundleProductId).then(function(result)
                        {
                            $scope.PAConfigService.setBundleAttributeFields(attributeconfigresult);
                            var bundlePAV = $scope.PAVService.getbundleproductattributevalues();
                            var res = $scope.PAVConfigService.configurePAVFields(attributeconfigresult, bundlePAV);
                            renderBundleAttributes(res.pavConfigGroups, res.PAVObj);
                            $scope.remotecallinitiated = false;
                        })
                    })
                })
            }
        }

        function renderBundleAttributes(attrgroups, pav){
            // clear the previous option attribute groups.
            $scope.AttributeGroups = attrgroups;
            $scope.PAVService.setbundleproductattributevalues(pav);
            $scope.productAttributeValues = $scope.PAVService.getbundleproductattributevalues();
            $scope.safeApply();   
        }
        
        $scope.PAVPicklistChange = function(fieldName){
            var res = $scope.PAVConfigService.applyDependedPicklistsOnChange($scope.AttributeGroups, $scope.productAttributeValues, fieldName);    
            renderBundleAttributes(res.pavConfigGroups, res.PAVObj);
        }

        // delete unwanted fields from PAV which are not configured at product attributes.
        /*function cleanupPAV(attrgroups, pav){
            var res = {};
            // get all fieldValues from attrgroups
            var allattrGroupFields = [];
            _.each(attrgroups, function(attrgroup){
                allattrGroupFields.push(_.pluck(attrgroup.productAtributes, 'fieldName'));
            })
            allattrGroupFields = _.flatten(allattrGroupFields);

            res = _.omit(pav, function(value, key, object) {
                    return !_.contains(allattrGroupFields, key);
                });
            return res;
        }*/

        $scope.init();
	};

    BundleAttributesController.$inject = ['$scope', '$log', 'SystemConstants', 'BaseConfigService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVObjConfigService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);
