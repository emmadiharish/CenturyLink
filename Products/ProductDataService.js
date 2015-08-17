(function() {
	angular.module('APTPS_ngCPQ').service('ProductDataService', ProductDataService); 
	ProductDataService.$inject = ['$q', '$log', 'QuoteDataService', 'RemoteService'];
	function ProductDataService($q, $log, QuoteDataService, RemoteService){
		var service = this;

		service.isValid = false;
		service.productIdtoProductMap = {};

		service.getProducts = getProducts;

		function getProducts(ProductIds){
			var existingproductIds = _.keys(service.productIdtoProductMap);
			var ProductIds_filtered = _.filter(ProductIds, function(Id){return !_.contains(existingproductIds, Id);});
			if(service.isValid)
			{
				return $q.when(service.productIdtoProductMap);
			}

			var requestPromise = RemoteService.getProducts(ProductIds_filtered);
			requestPromise.then(function(response){
				initializeproductIdtoProductMap(response);
				return service.productIdtoProductMap;
			})
		}

		function initializeproductIdtoProductMap(products){
			service.isValid = true;
			service.productIdtoProductMap = _.object(_.map(products, function(p){return [p.Id, p];}));
		}
	}
})();