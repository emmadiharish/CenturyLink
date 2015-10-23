/**
 * Directive: ServiceLocationsDirective 
 */
;(function() {
	'use strict';

	function LocationController(BaseConfigService, LocationDataService) {
        // all variable intializations.
        var locCtrl = this;
        function init(){
            LocationDataService.getlocItems().then(function(result) {
                locCtrl.locItems = result;
                locCtrl.selectedlpaId = LocationDataService.getselectedlpaId();
                locCtrl.displaylocations = LocationDataService.hasServicelocations;
            })
            
            locCtrl.newserviceLocationURL = BaseConfigService.newLocationURL;
        }
        
        init();

        locCtrl.setSelectedlocation = function(la){
            LocationDataService.setselectedlpa(la);
        }
    };
    
    LocationController.$inject = ['BaseConfigService', 
    							   'LocationDataService'];

	angular.module('APTPS_ngCPQ').directive('serviceLocations', ServiceLocations);

	ServiceLocations.$inject = ['SystemConstants'];
	function ServiceLocations(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: LocationController,
			controllerAs: 'locCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/ServiceLocationsView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function(cartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);