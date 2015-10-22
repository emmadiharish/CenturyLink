/**
 * Directive: OptionGroupDirective 
 */
 /*
    OptionGroupController controller should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
;(function() {
	'use strict';
	
	function OptionGroupController($scope, $location, $anchorScroll, SystemConstants, BaseService, BaseConfigService, OptionGroupDataService, LocationDataService) {
		var grpCtrl = this;
        var currentbundleproductId = '';
        var remotecallinitiated = false;

        // all variable intializations.
        function init(){
        	$scope.optionGroupService = OptionGroupDataService;
            $scope.locationService = LocationDataService;
            $scope.baseService = BaseService;

            grpCtrl.constants = SystemConstants;
        }

        // reload the optionGroups when location section is changed.
        $scope.$watch('locationService.getselectedlpa()', function(newVal, oldVal) {
            if(!_.isEmpty(newVal)
                && !_.isEqual(newVal, oldVal)
                && remotecallinitiated == false)
            {   
                currentbundleproductId = null;// make it null so option groups will be reloaded.
                grpCtrl.rendercurrentproductoptiongroups(BaseConfigService.lineItem.bundleProdId, null, null);
            }    
        });

        // Load option Groups of Main bundle Product on location load complete.
        $scope.$watch('baseService.getLocationLoadComplete()', function(newVal, oldVal) {
            if(newVal != oldVal
                && newVal == true
                && remotecallinitiated == false)
            {   
                grpCtrl.rendercurrentproductoptiongroups(BaseConfigService.lineItem.bundleProdId, null, null);
            }    
        });

        $scope.$watch('optionGroupService.getslectedOptionGroupProdId()', function(newVal, oldVal) {
            // rerender Hierarchy whenever rerenderHierarchy flag changes on OptionGroupDataService.
            if(newVal != oldVal
                && !_.isUndefined(newVal)
                && !_.isNull(newVal))
            {
                grpCtrl.rendercurrentproductoptiongroups(newVal, null, null);
                OptionGroupDataService.setslectedOptionGroupProdId(null);// set the selectedOptionGroup to null so tree Tree traversal would work fine. 
            }
        });

        grpCtrl.rendercurrentproductoptiongroups = function(bundleproductId, prodcomponent, groupindex){
            // run only if location remote call is complete.
            if(BaseService.getLocationLoadComplete() == true)
            {
                remotecallinitiated = true;

                var productId = bundleproductId != null ? bundleproductId : prodcomponent.productId;
                if(currentbundleproductId != productId)
                {
                    currentbundleproductId = productId;
                    
                    // make a remote call to get option groups for all bundles in current option groups.
                    OptionGroupDataService.getOptionGroup(productId).then(function(result) {
                        selectOptionProduct(prodcomponent, groupindex);
                        
                        // OptionGroupDataService.setrerenderHierarchy(true);
                        grpCtrl.currentproductoptiongroups = OptionGroupDataService.getcurrentproductoptiongroups();
                        
                        remotecallinitiated = false;
                    })
                }
            }
        }

        grpCtrl.selectProductrenderoptionproductattributes = function(prodcomponent, groupindex){
            // setisUpdatedLocal(prodcomponent);

            // select the product and add to tree.
            selectOptionProduct(prodcomponent, groupindex);
            
            // set selected option product which has watch with option Attribute Controller.
            OptionGroupDataService.setSelectedoptionproduct(prodcomponent);
        }

        grpCtrl.renderoptionproductattributes = function(prodcomponent, groupindex){
            // setisUpdatedLocal(prodcomponent);

            // rerender the tree so Add/remove of line item will be applied to tree.
            OptionGroupDataService.setrerenderHierarchy(true);

            // do not render attributes when option product is unchecked or product does not have attributes.
            if(isProdSelected(prodcomponent, grpCtrl.currentproductoptiongroups[groupindex])
                && prodcomponent.hasAttributes == true)
            {
                // set selected option product which has watch with option Attribute Controller.
                OptionGroupDataService.setSelectedoptionproduct(prodcomponent);
            }    
        }

        // anchor links in option groups.
        grpCtrl.gotosection = function(x) {
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

        /*function setisUpdatedLocal(pComponent){
            // Set isUpdatedLocal flag to true for whenever its seleceted or unselected.
            pComponent['isUpdatedLocal'] = true;
        }*/

        function selectOptionProduct(prodcomponent, groupindex){
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

            // rerender the tree so Add/remove of line item will be applied to tree.
            OptionGroupDataService.setrerenderHierarchy(true);
        }

        function isProdSelected(productcomponent, optiongroup){
            if((productcomponent.isselected 
                 && optiongroup.ischeckbox)
                    || (productcomponent.productId == optiongroup.selectedproduct 
                        && !optiongroup.ischeckbox))
            return true;
            return false;
        }

        init();
	};

	OptionGroupController.$inject = ['$scope', 
									  '$location',
                                      '$anchorScroll', 
									  'SystemConstants',
                                      'BaseService', 
									  'BaseConfigService', 
									  'OptionGroupDataService',
                                      'LocationDataService'];

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