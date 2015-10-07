/**
 * Directive: SlectedServiceLocationDirective 
 */
;(function() {
	'use strict';

	/*function SelectLocationController($scope, LocationDataService) {
        // all variable intializations.
        var slocCtrl = this;

        function init(){
            $scope.locationService = LocationDataService;
        }
        
        init();
    };
    
    SelectLocationController.$inject = ['$scope', 'LocationDataService'];*/

	angular.module('APTPS_ngCPQ').directive('selectedServiceLocation', SelectedServiceLocation);

	SelectedServiceLocation.$inject = ['SystemConstants'];
	function SelectedServiceLocation(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: 'SelectLocationController',
			// controllerAs: 'slocCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/SelectedServiceLocationView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function(cartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);