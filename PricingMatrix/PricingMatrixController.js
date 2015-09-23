(function() {
    var PricingMatrixController;

    PricingMatrixController = function($scope, $filter, $log, SystemConstants, BaseService, PAVObjConfigService, ProductAttributeValueDataService, PricingMatrixDataService) {
        /*Initialize Scope Variables*/
        $scope.pricingMatrixService = PricingMatrixDataService;
	    $scope.PAVService = ProductAttributeValueDataService;
	    $scope.baseService = BaseService;

	    var filteredItems = [];
	    $scope.itemsPerPage = 20;
	    $scope.pagedItems = [];
	    $scope.currentPage = 0;
	    $scope.pavfieldDescribeMap = {};
	    $scope.imagesbaseURL = SystemConstants.baseUrl+'/Images';
	    $scope.paginationLinksTemplateURL = SystemConstants.baseUrl+'/Templates/PaginationLinksView.html';
	    
		$scope.$watch('baseService.getPAVObjConfigLoadComplete()', function(newVal, oldVal) {
	        if(newVal != oldVal
                && newVal == true)
            {
	            $scope.pricingMatrixService.getPricingMatrix().then(function(result) {
			        $scope.items = result.lines;		
					$scope.dimentions = result.dimentions;
					$scope.pavfieldDescribeMap = PAVConfigService.fieldNametoDFRMap;
					$scope.currentPage = 0;   
			    	
			    	// functions have been describe process the data for display
				    $scope.search();
				})  
        	}
        });

		$scope.$watchCollection('PAVService.getbundleproductattributevalues()', function(newValue){
    		if(!_.isUndefined($scope.items)
    			&& _.size($scope.items) > 0)
    		{
    			$scope.search();// perform search when bundle PAV is changed.
    		}
	    });

	    //Initialize the Search Filters 
	    $scope.search = function () {
	        
	        var selectedAttrValues = $scope.PAVService.getbundleproductattributevalues();
	        var fieldapis_nonbalnk = [];
	        _.each($scope.fieldapis, function(index, field) {
	            if(selectedAttrValues[field] != undefined
	                && selectedAttrValues[field] != null
	                && selectedAttrValues[field] != '')
	            {
	                fieldapis_nonbalnk.push(field);
	            }
	        });
	        filteredItems = $filter('filter')($scope.items, function (item) {
	            for (var i = 0; i < fieldapis_nonbalnk.length;  i++) {
	            var prodattvalue = selectedAttrValues[fieldapis_nonbalnk[i]];
	                var pricingmatrixvalue = item.pav[fieldapis_nonbalnk[i]];
	                if(prodattvalue != pricingmatrixvalue)
	                {
	                   return false;
	                }
	            }
	            return true;
	        });
	        $scope.currentPage = 0;
	        
	        // Group by pages
	        $scope.groupToPages();
	    };
	    
	    // Calculate Total Number of Pages based on Records Queried 
	    $scope.groupToPages = function () {
	        $scope.pagedItems = [];
	        for (var i = 0; i < filteredItems.length; i++) {
	            if (i % $scope.itemsPerPage === 0) {
	                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [filteredItems[i]];
	            } else {
	                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push(filteredItems[i]);
	            }
	        }
	        // set the first pricing matrix record from filtered records which will be saved to bundle line item.
	        if($scope.pagedItems.length > 0
	        	&& $scope.pagedItems[0].length > 0){
				$scope.pricingMatrixService.setfirstPricingMatrixRecord($scope.pagedItems[0][0].pav.Pricing_Matrix_Id__c);
			}
			
			$scope.safeApply();
	    };
	    
	    $scope.safeApply = function(fn) {
	        var phase = this.$root.$$phase;
	        if(phase == '$apply' || phase == '$digest') {
	            if(fn && (typeof(fn) === 'function')) {
	                fn();
	            }
	        } else {
	            this.$apply(fn);
	        }
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
    };

    PricingMatrixController.$inject = ['$scope', '$filter', '$log', 'SystemConstants', 'BaseService', 'PAVObjConfigService', 'ProductAttributeValueDataService', 'PricingMatrixDataService'];
    angular.module('APTPS_ngCPQ').controller('PricingMatrixController', PricingMatrixController);
}).call(this);