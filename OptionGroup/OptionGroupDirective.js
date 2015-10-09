/**
 * Directive: OptionGroupDirective 
 */
 /*
    OptionGroupController controller should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
;(function() {
	'use strict';
	
	function OptionGroupController($scope, $location, $anchorScroll, SystemConstants, BaseConfigService, OptionGroupDataService) {
		var grpCtrl = this;
        
        // all variable intializations.
        function init(){
        	$scope.optionGroupService = OptionGroupDataService;
            grpCtrl.constants = SystemConstants;
            
            grpCtrl.currentbundleproductId = '';
            grpCtrl.rendercurrentproductoptiongroups(BaseConfigService.lineItem.bundleProdId, null, null);
        }

        $scope.$watch('optionGroupService.getslectedOptionGroupProdId()', function(newVal, oldVal) {
            // rerender Hierarchy whenever rerenderHierarchy flag changes on OptionGroupDataService.
            if(newVal != oldVal
                && !_.isUndefined(newVal)
                && !_.isNull(newVal))
            {
                grpCtrl.rendercurrentproductoptiongroups(newVal, null, null);
            }
        });

        grpCtrl.rendercurrentproductoptiongroups = function(bundleproductId, prodcomponent, groupindex){
            // grpCtrl.selectOptionProduct(prodcomponent, groupindex, true);
            OptionGroupDataService.setslectedOptionGroupProdId(null);// set the selectedOptionGroup to null so tree Tree traversal would work fine. 
            var productId = bundleproductId != null ? bundleproductId : prodcomponent.productId;
            if(OptionGroupDataService.currentbundleproductId != productId)
            {
                grpCtrl.currentbundleproductId = productId;
                // var allOptionGroups = OptionGroupDataService.getallOptionGroups(); 
                // make a remote call to get option groups for all bundles in current option groups.
                OptionGroupDataService.getOptionGroup(productId).then(function(result) {
                    grpCtrl.selectOptionProduct(prodcomponent, groupindex);
                    OptionGroupDataService.setrerenderHierarchy(true);
                    grpCtrl.currentproductoptiongroups = OptionGroupDataService.getcurrentproductoptiongroups();
                    // As the official documentation states "The remote method call executes synchronously, but it doesn’t wait for the response to return. When the response returns, the callback function handles it asynchronously."
                    // $scope.safeApply();
                })
            }
        }

        grpCtrl.selectOptionProduct = function(prodcomponent, groupindex){
            if(prodcomponent != null
                && groupindex != null)
            {
                if(grpCtrl.currentproductoptiongroups[groupindex].ischeckbox == false)// radio button
                {
                    grpCtrl.currentproductoptiongroups[groupindex].selectedproduct = prodcomponent.productId;
                }
                else {// checkbox.
                     prodcomponent.isselected = true;
                }
            }
        }
        
        grpCtrl.selectProductrenderoptionproductattributes = function(prodcomponent, groupindex){
            // select the product and add to tree.
            grpCtrl.selectOptionProduct(prodcomponent, groupindex);
            OptionGroupDataService.setrerenderHierarchy(true);
            
            // set selected option product which has watch with option Attribute Controller.
            OptionGroupDataService.setSelectedoptionproduct(prodcomponent);
        }

        grpCtrl.renderoptionproductattributes = function(prodcomponent, groupindex){
            // select the product and add to tree.
            OptionGroupDataService.setrerenderHierarchy(true);
            // do not render attributes when option product is unchecked or product does not have attributes.
            if(prodcomponent != null
                && ( (prodcomponent.isselected == false 
                        && grpCtrl.currentproductoptiongroups[groupindex].ischeckbox)
                      || !prodcomponent.hasAttributes))
            {
                return;
            }

            // set selected option product which has watch with option Attribute Controller.
            OptionGroupDataService.setSelectedoptionproduct(prodcomponent);
        }
        
        
        /*grpCtrl.gotosection = function(sectionId) {
            // set the location.hash to the id of
            // the element you wish to scroll to.
            $location.hash(sectionId);

            // call $anchorScroll()
            $anchorScroll();
        };*/

        // anchor links in option groups.
        $scope.gotosection = function(x) {
            var newHash = 'anchor' + x;
            if ($location.hash() !== newHash) {
                // set the $location.hash to `newHash` and
                // $anchorScroll will automatically scroll to it
                $location.hash('anchor' + x);
            } else {
                // call $anchorScroll() explicitly,
                // since $location.hash hasn't changed
                $anchorScroll();
            }
        };
        
        // quantity cannot be negative.
        grpCtrl.changeQuantity = function(pcomponent){
            if(pcomponent.quantity < 1)
            {
                pcomponent.quantity = 1;
            }
        }

        init();
	};

	OptionGroupController.$inject = ['$scope', 
									  '$location',
                                      '$anchorScroll', 
									  'SystemConstants', 
									  'BaseConfigService', 
									  'OptionGroupDataService'];

	angular.module('APTPS_ngCPQ').directive('optionGroups', OptionGroup);

	OptionGroup.$inject = ['SystemConstants'];
	function OptionGroup(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: OptionGroupController,
			controllerAs: 'grpCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/OptionGroupView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function(cartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);