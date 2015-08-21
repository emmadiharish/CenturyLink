(function() {
    var BundleAttributesController;

    BundleAttributesController = function($scope, $log, QuoteDataService, LocationDataService, ProductAttributeConfigDataService, ProductAttributeValueDataService, PAVConfigService, DependentPicklistDataService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.locationService = LocationDataService;
            $scope.PAVService = ProductAttributeValueDataService;
            $scope.PAConfigService = ProductAttributeConfigDataService;
            $scope.PAVDPicklistService = DependentPicklistDataService;
            $scope.PAVConfigService = PAVConfigService;

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
        
        $scope.retrieveproductattributeGroupData = function(){
            $scope.remotecallinitiated = true;
            var alllocationIdSet = $scope.locationService.getalllocationIdSet();
            var selectedlocationId = $scope.locationService.getselectedlpaId();
            var bundleProductId = QuoteDataService.getbundleproductId();
            $scope.PAVDPicklistService.getDependentPicklistInformation().then(function(fieldDescribeMap){
                if(_.isEmpty($scope.pavfieldDescribeMap))
                {
                    $scope.pavfieldDescribeMap = fieldDescribeMap;
                }
                $scope.PAConfigService.getProductAttributesConfig(bundleProductId, alllocationIdSet, selectedlocationId).then(function(attributeconfigresult) {
                    $scope.PAVService.getProductAttributeValues(bundleProductId).then(function(pavresult)
                    {
                        var res = $scope.PAVConfigService.loadPicklistDropDowns(attributeconfigresult, pavresult);
                        $scope.renderBundleAttributes(res.pavConfigGroups, res.PAVObj);
                        $scope.remotecallinitiated = false;
                    })
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
        
        $scope.PAVPicklistChange = function(fieldName){
            var selectedPAVValue = $scope.productAttributeValues[fieldName];
            var dFieldDefinations = $scope.PAVDPicklistService.getStructuredDependentFields(fieldName);
            var dFields = _.keys(dFieldDefinations);
            // Iterate over all dependent fields and change its dropdown values according to controlling field value selected.
            _.each($scope.AttributeGroups, function(attributeGroup){
                _.each(attributeGroup.productAtributes, function(attributeConfig){
                    // dependent field existing in the attribute group configuration.
                    // change the selectOptions of depenedent picklist fields.
                    var dField = attributeConfig.fieldName;
                    if(_.indexOf(dFields, dField) != -1)
                    {
                        var dPicklistConfig = dFieldDefinations[dField];
                        var options = [];
                        $scope.productAttributeValues[dField] = null;
                        options.push({key:'--None--', value:null});
                        _.each(dPicklistConfig[selectedPAVValue], function(lov){
                            options.push({key:lov, value:lov});
                        })
                        attributeConfig.selectOptions = options;
                        $scope.PAVPicklistChange(dField);// more than one level-dependency could exist.
                    }
                })    
            })    
        }
        $scope.init();
	};

    BundleAttributesController.$inject = ['$scope', '$log', 'QuoteDataService', 'LocationDataService', 'ProductAttributeConfigDataService', 'ProductAttributeValueDataService', 'PAVConfigService', 'DependentPicklistDataService'];
	angular.module('APTPS_ngCPQ').controller('BundleAttributesController', BundleAttributesController);
}).call(this);
