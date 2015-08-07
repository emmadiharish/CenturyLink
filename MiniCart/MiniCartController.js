(function() {
    var MiniCartController = function($scope, MiniCartDataService)
    {
        $scope.init = function(){
            // Initialize Scope Variables
            $scope.miniCartService = MiniCartDataService;

            $scope.reverse = false;                
            $scope.itemsPerPage = 5;
            $scope.pagedItems = [];
            $scope.currentPage = 0;
                
            // Group by pages
            $scope.groupToPages();
        }

        // Calculate Total Number of Pages based on Records Queried 
        $scope.groupToPages = function () {
            $scope.currentPage = 0;
            $scope.miniCartService.getMiniCartLines().then(function(result) {
                $scope.items = result.miniCartLines;        
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
            
        $scope.firstPagemc = function () {
            $scope.currentPage = 0;
        };
        
        $scope.lastPagemc = function () {
            $scope.currentPage = $scope.pagedItems.length-1;
        };
        
        $scope.prevPagemc = function () {
            if ($scope.currentPage > 0) {
                $scope.currentPage--;
            }
        };
        
        $scope.nextPagemc = function () {
            if ($scope.currentPage < $scope.pagedItems.length - 1) {
                $scope.currentPage++;
            }
        };
        
        $scope.setPagemc = function () {
            $scope.currentPage = this.n;
        };
        
        $scope.init();
    };
    MiniCartController.$inject = ['$scope',];
    angular.module('APTPS_ngCPQ').controller('MiniCartController', MiniCartController);
})();         