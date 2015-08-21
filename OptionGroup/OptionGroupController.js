(function() {
    var OptionGroupController;

    OptionGroupController = function($scope, $log, $location, QuoteDataService, OptionGroupDataService) {
		// all variable intializations.
        $scope.init = function(){
        	$scope.quoteService = QuoteDataService;
            
            $scope.imagesbaseURL = $scope.quoteService.getCAPResourcebaseURL()+'/Images';
            $scope.currentbundleproductId = '';
            
            $scope.productGroupList =[];// to load hierarchy
            $scope.rendercurrentproductoptiongroups(QuoteDataService.getbundleproductId(), null, null);
        }

        $scope.rendercurrentproductoptiongroups = function(bundleproductId, prodcomponent, groupindex){
            // $scope.selectOptionProduct(prodcomponent, groupindex, true);
            var productId = bundleproductId != null ? bundleproductId : prodcomponent.productId;
            if($scope.currentbundleproductId != productId)
            {
                $scope.currentbundleproductId = productId;
                // var allOptionGroups = OptionGroupDataService.getallOptionGroups(); 
                // make a remote call to get option groups for all bundles in current option groups.
                OptionGroupDataService.getOptionGroup(productId).then(function(result) {
                    $scope.selectOptionProduct(prodcomponent, groupindex);
                    $scope.renderhierarchy();
                    $scope.currentproductoptiongroups = OptionGroupDataService.getcurrentproductoptiongroups();
                    // As the official documentation states "The remote method call executes synchronously, but it doesn’t wait for the response to return. When the response returns, the callback function handles it asynchronously."
                    $scope.safeApply();
                })
            }
        }

        $scope.selectOptionProduct = function(prodcomponent, groupindex){
            if(prodcomponent != null)
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
        
        $scope.renderhierarchy = function(){
            var selectedproducts = [QuoteDataService.getbundleproductId()];
            var allOptionGroups = OptionGroupDataService.getallOptionGroups();
            var  productGroupList = [
                { "groupName" : QuoteDataService.getbundleproductName(), "groupId" : QuoteDataService.getbundleproductId(), "Parent": "", "isproduct" : true}];
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                if(selectedproducts.indexOf(bundleprodId) > -1)
                {
                    _.each(optiongroups, function(optiongroup){
                        productGroupList.push({"groupName" : optiongroup.groupName, "groupId" : optiongroup.groupId, "Parent": optiongroup.parentId, "isproduct" : false});
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if((productcomponent.isselected && optiongroup.ischeckbox)
                                || (productcomponent.productId == optiongroup.selectedproduct && !optiongroup.ischeckbox))
                            {
                                productGroupList.push({"groupName" : productcomponent.productName, "groupId" : productcomponent.productId, "Parent": optiongroup.groupId, "isproduct" : true});
                                selectedproducts.push(productcomponent.productId);
                            }
                        });
                    });
                }
            });

            Array.prototype.insertChildAtId = function (strId, objChild)
            {
                // Beware, here there be recursion
                found = false;
                _.each(this, function(node){
                    if (node.groupId == strId)
                    {
                        // Insert children
                        node.children.push(objChild);
                        return true;
                    }
                    else if (node.children)
                    {
                        // Has children, recurse!
                        found = node.children.insertChildAtId(strId, objChild);
                        if (found) return true;
                    }
                });
                return false;
            };

            // Build the array according to requirements (object in value key, always has children array)
            var target = [];
            _.each(productGroupList, function(productGroup){
                target.push ({"groupName" : productGroup.groupName, "groupId" : productGroup.groupId, "Parent": productGroup.Parent, "isproduct" : productGroup.isproduct,"children": []});
            });

            var i = 0;
            while (target.length>i)
            {
                if (target[i].Parent)
                {
                    // Call recursion to search for parent id
                    target.insertChildAtId(target[i].Parent, target[i]); 
                    // Remove node from array (it's already been inserted at the proper place)
                    target.splice(i, 1); 
                }
                else
                {
                    // Just skip over root nodes, they're no fun
                    i++; 
                }
            }

            $scope.productGroupList = target;
        }

        $scope.selectProductrenderoptionproductattributes = function(prodcomponent, groupindex){
            // select the product and add to tree.
            $scope.selectOptionProduct(prodcomponent, groupindex);
            $scope.renderhierarchy();
            
            // set selected option product which has watch with option Attribute Controller.
            OptionGroupDataService.setSelectedoptionproduct(prodcomponent);
        }

        $scope.renderoptionproductattributes = function(prodcomponent, groupindex){
            // select the product and add to tree.
            $scope.renderhierarchy();
            // do not render attributes when option product is unchecked or product does not have attributes.
            if(prodcomponent != null
                && ( (prodcomponent.isselected == false 
                        && $scope.currentproductoptiongroups[groupindex].ischeckbox)
                      || !prodcomponent.hasAttributes))
            {
                return;
            }

            // set selected option product which has watch with option Attribute Controller.
            OptionGroupDataService.setSelectedoptionproduct(prodcomponent);
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