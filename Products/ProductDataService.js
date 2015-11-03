;(function() {
	'use strict';
	
	angular.module('APTPS_ngCPQ').service('ProductDataService', ProductDataService); 
	ProductDataService.$inject = ['$q', '$log', 'RemoteService'];
	function ProductDataService($q, $log, RemoteService){
		var service = this;

		var productIdtoProductMap = {};
		var isValid = false;
		
		service.getProducts = getProducts;

		function getProducts(ProductIds){
			var res = {};
			
			var existingproductIds = _.keys(productIdtoProductMap);
			var ProductIds_filtered = _.filter(ProductIds, function(Id){return !_.contains(existingproductIds, Id);});

			if(isValid
				&& _.size(ProductIds_filtered) < 1)
			{
				_.each(ProductIds, function(prodId){
					res[prodId] = productIdtoProductMap[prodId];
				})
				return $q.when(res);
			}

			var productsRequest ={productIds : ProductIds_filtered};
			var requestPromise = RemoteService.getProducts(productsRequest);
			return requestPromise.then(function(response){
				initializeproductIdtoProductMap(response);
				_.each(ProductIds, function(prodId){
					res[prodId] = productIdtoProductMap[prodId];
				})
				return res;
			});
		}

		function initializeproductIdtoProductMap(products){
			isValid = true;
			productIdtoProductMap = _.object(_.map(products, function(p){return [p.Id, p];}));
		}
	}
})();