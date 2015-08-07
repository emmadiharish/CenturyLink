(function() {
    var MiniCartController = function($scope, QuoteDataService, MiniCartDataService)
    {
        $scope.init = function(){
            // Initialize Scope Variables
            $scope.miniCartService = MiniCartDataService;
            $scope.quoteService = QuoteDataService;
            
            $scope.reverse = false;                
            $scope.itemsPerPage = 5;
            $scope.pagedItems = [];
            $scope.currentPage = 0;
            $scope.imagesbaseURL = $scope.quoteService.getimagesbaseURL();    
            // Group by pages
            $scope.groupToPages();
        }

        // Calculate Total Number of Pages based on Records Queried 
        $scope.groupToPages = function () {
            $scope.currentPage = 0;
            $scope.miniCartService.getMiniCartLines().then(function(result) {
                $scope.items = result;        
                $scope.pagedItems = [];
                for (var i = 0; i < $scope.items.length; i++) {
                    if (i % $scope.itemsPerPage === 0) {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [$scope.items[i]];
                    } else {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.items[i]);
                    }
                }
                $scope.safeApply();
            })
        };
            
        $scope.firstPage = function () {
            $scope.currentPage = 0;
        };
        
        $scope.lastPage = function () {
            $scope.currentPage = $scope.pagedItems.length-1;
        };
        
        $scope.prevPage = function () {
            if ($scope.currentPage > 0) {
                $scope.currentPage--;
            }
        };
        
        $scope.nextPage = function () {
            if ($scope.currentPage < $scope.pagedItems.length - 1) {
                $scope.currentPage++;
            }
        };
        
        $scope.setPage = function () {
            $scope.currentPage = this.n;
        };
        
        $scope.init();
    };
    MiniCartController.$inject = ['$scope', 'QuoteDataService', 'MiniCartDataService'];
    angular.module('APTPS_ngCPQ').controller('MiniCartController', MiniCartController);
})();         