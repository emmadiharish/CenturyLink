(function() {
    var OptionGroupController;

    OptionGroupController = function($scope, $log, $location, QuoteDataService, OptionGroupDataService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.quoteService = QuoteDataService;
            $scope.optionGroupService = OptionGroupDataService;

            $scope.imagesbaseURL = $scope.quoteService.getCAPResourcebaseURL()+'/Images';
            $scope.currentbundleproductId = '';
            
            $scope.rendercurrentproductoptiongroups(QuoteDataService.getbundleproductId(), null, null);
        }

        $scope.$watch('optionGroupService.getslectedOptionGroupProdId()', function(newVal, oldVal) {
            // rerender Hierarchy whenever rerenderHierarchy flag changes on OptionGroupDataService.
            if(newVal != oldVal
                && !_.isUndefined(newVal))
            {
                $scope.rendercurrentproductoptiongroups(newVal, null, null);
            }
        });

        $scope.rendercurrentproductoptiongroups = function(bundleproductId, prodcomponent, groupindex){
            // $scope.selectOptionProduct(prodcomponent, groupindex, true);
            var productId = bundleproductId != null ? bundleproductId : prodcomponent.productId;
            if($scope.currentbundleproductId != productId)
            {
                $scope.currentbundleproductId = productId;
                // var allOptionGroups = $scope.optionGroupService.getallOptionGroups(); 
                // make a remote call to get option groups for all bundles in current option groups.
                $scope.optionGroupService.getOptionGroup(productId).then(function(result) {
                    $scope.selectOptionProduct(prodcomponent, groupindex);
                    $scope.optionGroupService.setrerenderHierarchy(true);
                    $scope.currentproductoptiongroups = $scope.optionGroupService.getcurrentproductoptiongroups();
                    // As the official documentation states "The remote method call executes synchronously, but it doesn’t wait for the response to return. When the response returns, the callback function handles it asynchronously."
                    $scope.safeApply();
                })
            }
        }

        $scope.selectOptionProduct = function(prodcomponent, groupindex){
            if(prodcomponent != null
                && groupindex != null)
            {
                if($scope.currentproductoptiongroups[groupindex].ischeckbox == false)// radio button
                {
                    $scope.currentproductoptiongroups[groupindex].selectedproduct = prodcomponent.productId;
                }
                else {// checkbox.
                     prodcomponent.isselected = true;
                }
            }
        }
        
        

        $scope.selectProductrenderoptionproductattributes = function(prodcomponent, groupindex){
            // select the product and add to tree.
            $scope.selectOptionProduct(prodcomponent, groupindex);
            $scope.optionGroupService.setrerenderHierarchy(true);
            
            // set selected option product which has watch with option Attribute Controller.
            $scope.optionGroupService.setSelectedoptionproduct(prodcomponent);
        }

        $scope.renderoptionproductattributes = function(prodcomponent, groupindex){
            // select the product and add to tree.
            $scope.optionGroupService.setrerenderHierarchy(true);
            // do not render attributes when option product is unchecked or product does not have attributes.
            if(prodcomponent != null
                && ( (prodcomponent.isselected == false 
                        && $scope.currentproductoptiongroups[groupindex].ischeckbox)
                      || !prodcomponent.hasAttributes))
            {
                return;
            }

            // set selected option product which has watch with option Attribute Controller.
            $scope.optionGroupService.setSelectedoptionproduct(prodcomponent);
        }
        
        // anchor links in option groups.
        $scope.gotosection = function(sectionId) {
            // set the location.hash to the id of
            // the element you wish to scroll to.
            $location.hash(sectionId);

            // call $anchorScroll()
            $anchorScroll();
        };
        
        // quantity cannot be negative.
        $scope.changeQuantity = function(pcomponent){
            if(pcomponent.quantity < 1)
            {
                pcomponent.quantity = 1;
            }
        }
        
        $scope.init();
	};

    OptionGroupController.$inject = ['$scope', '$log', '$location', 'QuoteDataService', 'OptionGroupDataService'];
	angular.module('APTPS_ngCPQ').controller('OptionGroupController', OptionGroupController);
}).call(this);
