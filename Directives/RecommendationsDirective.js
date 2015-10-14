/**
 * Directive: RecommendationsDirective 
 */
;(function() {
	'use strict';

	function RecommendationsController($scope, OptionGroupDataService){
		var recCtrl = this;

		function init(){
			$scope.optionGroupService = OptionGroupDataService;	
		}
		
		$scope.$watchCollection('optionGroupService.getrecommendedproductsMap()', function(newVal){
            if(!_.isUndefined(newVal))
                recCtrl.recommendedproductsMap = newVal;
        });

		recCtrl.addtoCart = function(productId){
			// Identify if product is option or bundle and make respective remote calls.
			var selectedProduct = recCtrl.recommendedproductsMap[productId];
			// if option then auto-include in the option groups and save to server.
			if(product.Apttus_Config2__ConfigurationType__c == 'Option'){
				
			}// if bundle then remote call to add to cart.
			else if(product.Apttus_Config2__ConfigurationType__c == 'Bundle'
					|| product.Apttus_Config2__ConfigurationType__c == 'Standalone'){

			}

			_.omit(recommendedproductsMap, product);
		}

		init();
	}

	RecommendationsController.$inject = ['$scope', 
									  	  'OptionGroupDataService'];

	angular.module('APTPS_ngCPQ').directive('recommendations', recommendations);

	recommendations.$inject = ['SystemConstants'];
	function recommendations(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: RecommendationsController,
			controllerAs: 'recCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/RecommendationsView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function($scope, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);