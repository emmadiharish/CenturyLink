(function() {
	angular.module('APTPS_ngCPQ').service('ProductDataService', ProductDataService); 
	ProductDataService.$inject = ['$q', '$log', 'RemoteService'];
	function ProductDataService($q, $log, RemoteService){
		var service = this;

		service.isValid = false;
		service.productIdtoProductMap = {};

		service.getProducts = getProducts;

		function getProducts(ProductIds){
			var res = {};
			
			var existingproductIds = _.keys(service.productIdtoProductMap);
			var ProductIds_filtered = _.filter(ProductIds, function(Id){return !_.contains(existingproductIds, Id);});

			if(service.isValid
				&& _.size(ProductIds_filtered) < 1)
			{
				_.each(ProductIds, function(prodId){
					res[prodId] = service.productIdtoProductMap[prodId];
				})
				return $q.when(res);
			}

			var requestPromise = RemoteService.getProducts(ProductIds_filtered);
			return requestPromise.then(function(response){
				initializeproductIdtoProductMap(response);
				_.each(ProductIds, function(prodId){
					res[prodId] = service.productIdtoProductMap[prodId];
				})
				return res;
			});
		}

		function initializeproductIdtoProductMap(products){
			service.isValid = true;
			service.productIdtoProductMap = _.object(_.map(products, function(p){return [p.Id, p];}));
		}
	}
})();