/**
 * Directive: OptionGroupHierarchyDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('optionGroupsHierarchy', OptionGroupHierarchy);

	OptionGroupHierarchy.$inject = ['SystemConstants'];
	function OptionGroupHierarchy(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: 'OptionGroupHierarchyController',
			// controllerAs: 'OptionGroup',
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