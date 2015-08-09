(function() {
    var MiniCartController = function($scope, $dialogs, QuoteDataService, MiniCartDataService)
    {
        $scope.init = function(){
            // Initialize Scope Variables
            $scope.miniCartService = MiniCartDataService;
            $scope.quoteService = QuoteDataService;
            $scope.remoteService = QuoteDataService;
            
            $scope.reverse = false;                
            $scope.itemsPerPage = 5;
            $scope.pagedItems = [];
            $scope.currentPage = 0;
            
            $scope.miniCartTemplateURL = $scope.quoteService.getCAPResourcebaseURL()+'/Templates/MiniCartView.html';
            $scope.paginationLinksTemplateURL = $scope.quoteService.getCAPResourcebaseURL()+'/Templates/PaginationLinksView.html';
            $scope.imagesbaseURL = $scope.quoteService.getCAPResourcebaseURL()+'/Images';
            $scope.lineCount = 0;

            // Group by pages
            $scope.groupToPages();
        }

        // Calculate Total Number of Pages based on Records Queried 
        $scope.groupToPages = function () {
            $scope.currentPage = 0;
            $scope.miniCartService.getMiniCartLines().then(function(result) {
                $scope.items = result;        
                $scope.lineCount = $scope.items.length;
                $scope.pagedItems = [];
                for (var i = 0; i < $scope.items.length; i++) {
                    if (i % $scope.itemsPerPage === 0) {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [$scope.items[i]];
                    } else {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.items[i]);
                    }
                }
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
        
        $scope.invokeDoConfigure = function(lineItemId){
            $scope.miniCartService.configureLineItem(lineItemId).then(function(result){

            })
        };

        $scope.deleteLineItemFromCart = function(lineNumber_tobedeleted){
            $scope.miniCartService.deleteLineItemFromCart(lineNumber_tobedeleted).then(function(result){
                // mark minicart as dirty and reload minicart.
                $scope.miniCartService.setMinicartasDirty();
                $scope.groupToPages();
            })
        };
        
        $scope.launch = function(which, productName, lineNumber){
            var dlg = null;
            switch(which){
                // Delete Line Item Confirm Dialog
                case 'confirmRemoveLine':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to Delete "'+productName+ '" from cart ?');
                    dlg.result.then(function(btn){
                        $scope.deleteLineItemFromCart(lineNumber);
                    },function(btn){
                        
                });
                break;
            }; // end switch
        }; // end launch

        $scope.init();
    };
    MiniCartController.$inject = ['$scope', '$dialogs', 'QuoteDataService', 'MiniCartDataService'];
    angular.module('APTPS_ngCPQ').controller('MiniCartController', MiniCartController);
})();         