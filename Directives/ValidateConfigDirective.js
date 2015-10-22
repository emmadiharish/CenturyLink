/**
 * Directive: ValidateConfigDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('validateConfig', ValidateConfig);

	ValidateConfig.$inject = ['SystemConstants'];
	function ValidateConfig(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: 'BaseController',
			controllerAs: 'baseCon',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/ValidateConfigView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function($scope, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);