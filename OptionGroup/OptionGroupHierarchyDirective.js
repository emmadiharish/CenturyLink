/**
 * Directive: OptionGroupHierarchyDirective 
 */
 /*
    OptionGroupHierarchyController controller should be changed later because this was build under assumotion that one product can only belong to one option group.
    componentId should be used instead of productId for parentId to create hierarchy or rendering sub option groups.
*/
;(function() {
	'use strict';

	function OptionGroupHierarchyController($scope, $log, BaseConfigService, OptionGroupDataService) {
    	// all variable intializations.
        var ghCtrl  = this;

        function init(){
			$scope.optionGroupService = OptionGroupDataService;

			ghCtrl.productGroupList =[];// to load hierarchy
			// renderhierarchy();
		}

		$scope.$watch('optionGroupService.getrerenderHierarchy()', function(newVal, oldVal) {
			// rerender Hierarchy whenever rerenderHierarchy flag changes on OptionGroupDataService.
			if(newVal != oldVal
				&& newVal == true)
			{
				renderhierarchy();
				OptionGroupDataService.setrerenderHierarchy(false);
			}
		});

		ghCtrl.rendercurrentproductoptiongroups = function(arg1, arg2, arg3){
			OptionGroupDataService.setslectedOptionGroupProdId(arg1);
		}

    	function renderhierarchy(){
            var selectedproducts = [BaseConfigService.lineItem.bundleProdId];
            var allOptionGroups = OptionGroupDataService.getallOptionGroups();

            var  productGroupList = [
                { "groupName" : BaseConfigService.lineItem.bundleProdName, "groupId" : BaseConfigService.lineItem.bundleProdId, "Parent": "", "isproduct" : true}];
            _.each(allOptionGroups, function(optiongroups, bundleprodId){
                if(selectedproducts.indexOf(bundleprodId) > -1)
                {
                    _.each(optiongroups, function(optiongroup){
                        productGroupList.push({"groupName" : optiongroup.groupName, "groupId" : optiongroup.groupId, "Parent": optiongroup.parentId, "isproduct" : false});
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            if(productcomponent.isselected)
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
                var found = false;
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

            ghCtrl.productGroupList = target;
        }
   		
   		init();
   	};

   	OptionGroupHierarchyController.$inject = ['$scope', 
   												'$log', 
   												'BaseConfigService', 
   												'OptionGroupDataService'];

	angular.module('APTPS_ngCPQ').directive('optionGroupsHierarchy', OptionGroupHierarchy);

	OptionGroupHierarchy.$inject = ['SystemConstants'];
	function OptionGroupHierarchy(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: OptionGroupHierarchyController,
			controllerAs: 'ghCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/OptionGroupHierarchyView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function(cartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);