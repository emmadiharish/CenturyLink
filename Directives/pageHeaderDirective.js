;(function() {
	angular.module('APTPS_ngCPQ').directive('PageHeader', PageHeader);

	PageHeaderCtrl.$inject = ['$scope', 'QuoteDataService', 'MiniCartDataService'];
	
	function PageHeaderCtrl($scope, QuoteDataService, MiniCartDataService){
		$scope.init = function(){
    		$scope.quoteService = QuoteDataService;
            $scope.miniCartService = MiniCartDataService;

            $scope.lineItem = $scope.quoteService.getlineItem();
    		$scope.QuoteId = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__c;
    		$scope.QuoteName = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_Proposal__Proposal_Name__c;
        	$scope.QuoteNumber = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Name;
        	$scope.ApprovalStatus = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_QPApprov__Approval_Status__c;
        
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
})call(this);