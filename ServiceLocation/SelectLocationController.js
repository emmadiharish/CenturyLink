(function() {
    var SelectLocationController;

    SelectLocationController = function($scope, $log, LocationDataService) {
        // all variable intializations.
        $scope.init = function(){
            $scope.locationService = LocationDataService;
        }
        
        $scope.init();
    };
    
    SelectLocationController.$inject = ['$scope', '$log', 'LocationDataService'];
    angular.module('APTPS_ngCPQ').controller('SelectLocationController', SelectLocationController);
}).call(this);