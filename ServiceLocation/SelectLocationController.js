(function() {
    var SelectLocationController;

    SelectLocationController = function($scope, $log, LocationDataService) {
        // all variable intializations.
        $scope.init = function(){
            $scope.selectedlpa = {};
            $scope.locationService = LocationDataService;
        }
        $scope.init();

        $scope.$watch('locationService.getselectedlpa()', function(newVal) {
            if(newVal)
            {
                $scope.selectedlpa = newVal;
            }    
        });
    };
    
    SelectLocationController.$inject = ['$scope', '$log', 'LocationDataService'];
    angular.module('APTPS_ngCPQ').controller('SelectLocationController', SelectLocationController);
}).call(this);