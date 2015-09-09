;(function() {
	angular.module('APTPS_ngCPQ').directive('PageHeader', PageHeader);

	PageHeaderCtrl.$inject = ['$scope', 'QuoteDataService'];
	
	function PageHeaderCtrl($scope, QuoteDataService){
		$scope.init = function(){
    		var headerCtrl = this;

    		PageHeader.lineItem = QuoteDataService.getlineItem();
    		PageHeader.QuoteId = PageHeader.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__c;
    		PageHeader.QuoteName = PageHeader.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_Proposal__Proposal_Name__c;
        	PageHeader.QuoteNumber = PageHeader.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Name;
        	PageHeader.ApprovalStatus = PageHeader.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_QPApprov__Approval_Status__c;
        }
    	
        $scope.init();
	}

	PageHeader.$inject = ['SystemConstants'];
	function PageHeader(){
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
			// template: '',
			templateUrl: systemConstants.baseUrl + "/Templates/PageHeaderView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function($scope, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);