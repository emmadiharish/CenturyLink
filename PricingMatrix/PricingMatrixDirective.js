/**
 * Directive: PricingMatrixDirective 
 */
;(function() {
	'use strict';


	function PricingMatrixController($scope, $filter, $log, SystemConstants, BaseService, PAVObjConfigService, ProductAttributeValueDataService, PricingMatrixDataService) {
        /*Initialize Scope Variables*/
        var pmCtrl = this;
        var filteredItems = [];
        
        function init(){
    		$scope.baseService = BaseService;
    		$scope.PAVService = ProductAttributeValueDataService;

		    pmCtrl.itemsPerPage = 20;
		    pmCtrl.pagedItems = [];
		    pmCtrl.currentPage = 0;
		    pmCtrl.pavfieldDescribeMap = {};
		    pmCtrl.displayPricingMatrix = false;
        	pmCtrl.baseUrl = SystemConstants.baseUrl;
        }
        
	    
		$scope.$watch('baseService.getPAVObjConfigLoadComplete()', function(newVal, oldVal) {
	        if(newVal != oldVal
                && newVal == true)
            {
	            PricingMatrixDataService.getPricingMatrix().then(function(result) {
			        pmCtrl.items = result.lines;		
					pmCtrl.dimensions = result.dimensions;
					pmCtrl.pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
					pmCtrl.currentPage = 0;   
			    	pmCtrl.displayPricingMatrix = PricingMatrixDataService.gethasPricingMatrix();

			    	// functions have been describe process the data for display
				    pmCtrl.search();
				})  
        	}
        });

		$scope.$watchCollection('PAVService.getbundleproductattributevalues()', function(newValue){
    		if(!_.isUndefined(pmCtrl.items)
    			&& _.size(pmCtrl.items) > 0)
    		{
    			pmCtrl.search();// perform search when bundle PAV is changed.
    		}
	    });

	    //Initialize the Search Filters 
	    pmCtrl.search = function () {
	        var selectedAttrValues = ProductAttributeValueDataService.getbundleproductattributevalues();
	        var dimensions_nonblank = [];
	        _.each(pmCtrl.dimensions, function(field) {
	            if(!_.isUndefined(selectedAttrValues[field])
	                && !_.isNull(selectedAttrValues[field])
	                && selectedAttrValues[field] != '')
	            {
	                dimensions_nonblank.push(field);
	            }
	        });
	        filteredItems = $filter('filter')(pmCtrl.items, function (item) {
	            for (var i = 0; i < dimensions_nonblank.length;  i++) {
	            var prodattvalue = selectedAttrValues[dimensions_nonblank[i]];
	                var pricingmatrixvalue = item[dimensions_nonblank[i]];
	                if(prodattvalue != pricingmatrixvalue)
	                {
	                   return false;
	                }
	            }
	            return true;
	        });
	        pmCtrl.currentPage = 0;
	        
	        // Group by pages
	        pmCtrl.groupToPages();
	    };
	    
	    // Calculate Total Number of Pages based on Records Queried 
	    pmCtrl.groupToPages = function () {
	        pmCtrl.pagedItems = [];
	        for (var i = 0; i < filteredItems.length; i++) {
	            if (i % pmCtrl.itemsPerPage === 0) {
	                pmCtrl.pagedItems[Math.floor(i / pmCtrl.itemsPerPage)] = [filteredItems[i]];
	            } else {
	                pmCtrl.pagedItems[Math.floor(i / pmCtrl.itemsPerPage)].push(filteredItems[i]);
	            }
	        }
	        // set the first pricing matrix record from filtered records which will be saved to bundle line item.
	        if(pmCtrl.pagedItems.length > 0
	        	&& pmCtrl.pagedItems[0].length > 0){
				PricingMatrixDataService.setfirstPricingMatrixRecord(pmCtrl.pagedItems[0][0].Pricing_Matrix_Id__c);
			}
			
			//$scope.safeApply();
	    };
	    
	    /*$scope.safeApply = function(fn) {
	        var phase = this.$root.$$phase;
	        if(phase == '$apply' || phase == '$digest') {
	            if(fn && (typeof(fn) === 'function')) {
	                fn();
	            }
	        } else {
	            this.$apply(fn);
	        }
	    };*/

	    pmCtrl.firstPage = function () {
	        pmCtrl.currentPage = 0;
	    };
	    
	    pmCtrl.lastPage = function () {
	        pmCtrl.currentPage = pmCtrl.pagedItems.length-1;
	    };
	    pmCtrl.prevPage = function () {
	        if (pmCtrl.currentPage > 0) {
	            pmCtrl.currentPage--;
	        }
	    };
	    
	    pmCtrl.nextPage = function () {
	        if (pmCtrl.currentPage < pmCtrl.pagedItems.length - 1) {
	            pmCtrl.currentPage++;
	        }
	    };
	    pmCtrl.setPage = function () {
	        pmCtrl.currentPage = this.n;
	    };

	    init();
    };

    PricingMatrixController.$inject = ['$scope', 
    									'$filter', 
    									'$log', 
    									'SystemConstants', 
    									'BaseService', 
    									'PAVObjConfigService', 
    									'ProductAttributeValueDataService', 
    									'PricingMatrixDataService'];

	angular.module('APTPS_ngCPQ').directive('pricingMatrix', PricingMatrix);

	PricingMatrix.$inject = ['SystemConstants'];
	function PricingMatrix(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: PricingMatrixController,
			controllerAs: 'Ctrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/PricingMatrixView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function(cartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);