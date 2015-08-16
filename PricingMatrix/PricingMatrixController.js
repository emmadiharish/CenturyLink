(function() {
    var PricingMatrixController;

    PricingMatrixController = function($scope, $filter, $log, QuoteDataService, ProductAttributeValueDataService, PricingMatrixDataService) {
        /*Initialize Scope Variables*/
        $scope.pricingMatrixService = PricingMatrixDataService;
	    $scope.PAVService = ProductAttributeValueDataService;
	    $scope.quoteService = QuoteDataService;

	    $scope.reverse = false;                
	    $scope.filteredItems = [];
	    $scope.itemsPerPage = 21;
	    $scope.pagedItems = [];
	    $scope.currentPage = 0;
	    
	    $scope.imagesbaseURL = $scope.quoteService.getCAPResourcebaseURL()+'/Images';
	    $scope.paginationLinksTemplateURL = $scope.quoteService.getCAPResourcebaseURL()+'/Templates/PaginationLinksView.html';
	    $scope.pricingMatrixService.getPricingMatrix().then(function(result) {
	        $scope.items = result.lines;		
			$scope.fieldapis = _.keys(result.pricingFieldsMap);
			$scope.fieldsmap = result.pricingFieldsMap;
			$scope.currentPage = 0;   
	    	
	    	// functions have been describe process the data for display
		    $scope.search();
		})

	    //Initialize the Search Filters 
	    $scope.search = function () {
	        
	        var selectedAttrValues = $scope.PAVService.getbundleproductattributevalues();
	        var fieldapis_nonbalnk = [];
	        j$.each($scope.fieldapis, function(index, field) {
	            if(selectedAttrValues[field] != undefined
	                && selectedAttrValues[field] != null
	                && selectedAttrValues[field] != '')
	            {
	                fieldapis_nonbalnk.push(field);
	            }
	        });
	        $scope.filteredItems = $filter('filter')($scope.items, function (item) {
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
	    
	    $scope.$watchCollection('PAVService.getbundleproductattributevalues()', function(newValue){
    		if($scope.items != undefined
    			&& $scope.items.length > 0)
    		{
    			$scope.search();// perform search when bundle PAV is changed.
    		}
	    });

	    // Calculate Total Number of Pages based on Records Queried 
	    $scope.groupToPages = function () {
	        $scope.pagedItems = [];
	        for (var i = 0; i < $scope.filteredItems.length; i++) {
	            if (i % $scope.itemsPerPage === 0) {
	                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [$scope.filteredItems[i]];
	            } else {
	                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
	            }
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

    PricingMatrixController.$inject = ['$scope', '$filter', '$log', 'QuoteDataService', 'ProductAttributeValueDataService', 'PricingMatrixDataService'];
    angular.module('APTPS_ngCPQ').controller('PricingMatrixController', PricingMatrixController);
}).call(this);