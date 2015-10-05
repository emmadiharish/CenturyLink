/**
 * Directive: PageBodyDirective 
 */
;(function() {
	'use strict';
	
	function PageBodyCtrl(){

	};
	
	angular.module('APTPS_ngCPQ').directive('pageBody', PageBody);
	PageBody.$inject = ['SystemConstants'];
	function PageBody(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: PageBodyCtrl,
			// controllerAs: 'baseCon',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/PageBodyView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			// link: function($scope, iElm, iAttrs, controller) {
			// }
			// bindToController: true
		};
	}
}).call(this);