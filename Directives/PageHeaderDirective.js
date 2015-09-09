/**
 * Directive: PageHeaderDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('pageHeader', PageHeader);

	PageHeaderCtrl.$inject = ['QuoteDataService'];
	
	function PageHeaderCtrl(QuoteDataService){
		var headerCtrl = this;

		var lineItem = QuoteDataService.getlineItem();
		headerCtrl.QuoteId = lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__c;
		headerCtrl.QuoteName = lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_Proposal__Proposal_Name__c;
    	headerCtrl.QuoteNumber = lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Name;
    	headerCtrl.ApprovalStatus = lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_QPApprov__Approval_Status__c;

		$scope.init = function(){
    		
        }
    	
        $scope.init();

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
			template: '<div>header</div>',
			//templateUrl: systemConstants.baseUrl + "/Templates/PageHeaderView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function($scope, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);