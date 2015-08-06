(function() {
    var QuoteController;

    QuoteController = function($scope, QuoteDataService) {
    	$scope.init = function(){
    		$scope.lineItem = QuoteDataService.getlineItem();
    		$scope.imagesbaseURL = QuoteDataService.getimagesbaseURL();
            $scope.QuoteId = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__c;
    		$scope.QuoteName = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_Proposal__Proposal_Name__c;
        	$scope.QuoteNumber = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Name;
        	$scope.ApprovalStatus = $scope.lineItem.Apttus_Config2__ConfigurationId__r.Apttus_QPConfig__Proposald__r.Apttus_QPApprov__Approval_Status__c;
        }
    	
    	$scope.init();
    };

    QuoteController.$inject = ['$scope', 'QuoteDataService'];
    angular.module('APTPS_ngCPQ').controller('QuoteController', QuoteController);
}).call(this);