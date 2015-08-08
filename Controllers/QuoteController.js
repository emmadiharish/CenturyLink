(function() {
    var QuoteController;

    QuoteController = function($scope, QuoteDataService, MiniCartDataService) {
    	$scope.init = function(){
    		$scope.quoteService = QuoteDataService;
            $scope.miniCartService = MiniCartDataService;

            $scope.lineItem = $scope.quoteService.getlineItem();
    		$scope.QuoteId = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__c;
    		$scope.QuoteName = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_Proposal__Proposal_Name__c;
        	$scope.QuoteNumber = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Name;
        	$scope.ApprovalStatus = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_QPApprov__Approval_Status__c;
        }
    	
        // get the minicart count and apply to header.
        $scope.$watch('miniCartService.getminiCartLinesCount()', function(newVal, oldVal) {
            $scope.lineCount = $scope.miniCartService.getminiCartLinesCount();
        });
        $scope.init();
    };

    QuoteController.$inject = ['$scope', 'QuoteDataService'];
    angular.module('APTPS_ngCPQ').controller('QuoteController', QuoteController);
}).call(this);