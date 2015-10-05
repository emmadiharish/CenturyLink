/**
 * Directive: PageHeaderDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('pageHeader', PageHeader);

	PageHeaderCtrl.$inject = ['BaseConfigService'];
	
	function PageHeaderCtrl(BaseConfigService){
		var headerCtrl = this;

		var lineItem = BaseConfigService.lineItem;
		headerCtrl.QuoteId = lineItem.quoteId;
		headerCtrl.QuoteName = lineItem.quoteName;
    	headerCtrl.QuoteNumber = lineItem.quoteNumber;
    	headerCtrl.ApprovalStatus = lineItem.approvalStatus;

		function init(){
    		
        }
    	
        init();

        return headerCtrl;
	}

	PageHeader.$inject = ['SystemConstants'];
	function PageHeader(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: PageHeaderCtrl,
			controllerAs: 'PageHeader',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/PageHeaderView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function($scope, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);