/**
 * Directive: MiniCartDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('miniCart', MiniCart);

	MiniCart.$inject = ['SystemConstants', 'MiniCartController'];
	function MiniCart(SystemConstants, MiniCartController){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: 'MiniCartController',
			// controllerAs: 'MiniCart',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/MiniCartView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function(cartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);