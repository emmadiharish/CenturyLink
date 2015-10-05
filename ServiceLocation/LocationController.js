(function() {
    var LocationController;

    LocationController = function($scope, BaseConfigService, LocationDataService) {
        // all variable intializations.
        function init(){
            LocationDataService.getlocItems().then(function(result) {
                $scope.locItems = result;
                $scope.selectedlpa = LocationDataService.getselectedlpa();
                $scope.displaylocations = LocationDataService.gethasServicelocations();
            })
            
            $scope.newserviceLocationURL = BaseConfigService.newLocationURL;
        }
        init();

        $scope.setSelectedlocation = function(la){
            LocationDataService.setselectedlpa(la);
        }
    };
    
    LocationController.$inject = ['$scope', 'BaseConfigService', 'LocationDataService'];
    angular.module('APTPS_ngCPQ').controller('LocationController', LocationController);
}).call(this);