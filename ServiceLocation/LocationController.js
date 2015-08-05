(function() {
    var LocationController;

    LocationController = function($scope, $log, QuoteDataService, LocationDataService) {
        // all variable intializations.
        $scope.init = function(){
            LocationDataService.getlocItems().then(function(result) {
                $scope.locItems = result;
            })
            
            $scope.newserviceLocationURL = QuoteDataService.getnewLocationURL();
            // set the color and height for status bar.
            //ngProgress.color('#5c8427');
            //ngProgress.height('4px');
        }
        $scope.init();

        $scope.setSelectedlocation = function(la){
            LocationDataService.setselectedlpa(la);
        }
    };
    
    LocationController.$inject = ['$scope', '$log', 'QuoteDataService', 'LocationDataService'];
    angular.module('APTPS_ngCPQ').controller('LocationController', LocationController);
}).call(this);