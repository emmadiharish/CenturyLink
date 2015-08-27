(function() {
	angular.module('APTPS_ngCPQ').service('ProductAttributeValueDataService', ProductAttributeValueDataService); 
	ProductAttributeValueDataService.$inject = ['$q', '$log', 'BaseService', 'QuoteDataService','RemoteService', 'OptionGroupDataService', 'ProductAttributeValueCache'];
	function ProductAttributeValueDataService($q, $log, BaseService, QuoteDataService, RemoteService, OptionGroupDataService, ProductAttributeValueCache) {
		var service = this;

		service.bundleproductattributevalues = {};

		service.getAllProductAttributeValues = ProductAttributeValueCache.getProductAttributeValues;
		service.getProductAttributeValues = getProductAttributeValues;
		service.getbundleproductattributevalues = getbundleproductattributevalues;
		service.setbundleproductattributevalues = setbundleproductattributevalues;

		function getProductAttributeValues_bulk(productIds){
			// check if cachedProductAttributes has products requested for else make a remote call.
			var cachedProductAttributeValues = ProductAttributeValueCache.getProductAttributeValues();
			var productIds_filtered = _.filter(productIds, function(Id){ return !cachedProductAttributeValues.hasOwnProperty(Id); });
			if (ProductAttributeValueCache.isValid
				&& _.isEmpty(productIds_filtered)){
				// logTransaction(cachedProductAttributes);
				return $q.when(cachedProductAttributes);
			}

			var requestPromise = RemoteService.getProductAttributeValueData(productIds_filtered, QuoteDataService.getcartId(), QuoteDataService.getcontextLineNumber());
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				ProductAttributeValueCache.initializeProductAttributeValues(response);
				// logTransaction(response, categoryRequest);
				BaseService.setPAVLoadComplete();
				return ProductAttributeValueCache.getProductAttributeValues();
			});
		}

		function getProductAttributeValues(productId){
			var currentproductoptiongroups = OptionGroupDataService.getcurrentproductoptiongroups();
			var cachedPAVSMap = ProductAttributeValueCache.getProductAttributeValues();
			if (ProductAttributeValueCache.isValid
				&& _.has(cachedPAVSMap, productId)) {
				return $q.when(cachedPAVSMap[productId]);
			}

			// collect all current productId's in currentproductoptiongroups.
			var productIds = getAllProductsinCurrentOptiongroups(currentproductoptiongroups, 'productOptionComponents', 'productId');
			productIds.push(productId);
			productIds = _.uniq(productIds);
			return getProductAttributeValues_bulk(productIds).then(function(response){
				var optionGroups = response;
				return optionGroups[productId];
			});
		}

		// util method. a: option groups, b: field name to access product components, c: field name to access product Id within product component.
        function getAllProductsinCurrentOptiongroups(a, b, c){
            // return a list of bundle product Id's. based on flag provided.
            var res = [];
            _.each(a, function (group) {
                res.push(_.pluck(group[b], c));
            });
            res = _.flatten(res);// Flattens a nested array.
            return res;
        }

        function setbundleproductattributevalues(pav){
        	if(_.isEmpty(service.bundleproductattributevalues))
        	{
        		service.bundleproductattributevalues = pav;
        	}
        }

        function getbundleproductattributevalues(){
        	return service.bundleproductattributevalues;
        }
	}
})();