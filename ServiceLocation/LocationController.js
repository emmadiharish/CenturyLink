(function() {
    var LocationController;

    LocationController = function($scope, $log, QuoteDataService, LocationDataService) {
        // all variable intializations.
        $scope.init = function(){
            LocationDataService.getlocItems().then(function(result) {
                $scope.locItems = result;
                $scope.selectedlpa = LocationDataService.getselectedlpa();
                $scope.displaylocations = LocationDataService.gethasServicelocations();
            })
            
            $scope.newserviceLocationURL = QuoteDataService.getnewLocationURL();
        }
        $scope.init();

        $scope.setSelectedlocation = function(la){
            LocationDataService.setselectedlpa(la);
        }
    };
    
    LocationController.$inject = ['$scope', '$log', 'QuoteDataService', 'LocationDataService'];
    angular.module('APTPS_ngCPQ').controller('LocationController', LocationController);
}).call(this);