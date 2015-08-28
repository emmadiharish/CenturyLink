(function() {
	angular.module('APTPS_ngCPQ').service('OptionGroupDataService', OptionGroupDataService); 
	OptionGroupDataService.$inject = ['$q', '$log', 'BaseService', 'QuoteDataService', 'RemoteService', 'OptionGroupCache'];
	function OptionGroupDataService($q, $log, BaseService, QuoteDataService, RemoteService, OptionGroupCache) {
		var service = this;

		service.Selectedoptionproduct = {};
		service.currentproductoptiongroups = {};
		service.rerenderHierarchy = false;
		service.slectedOptionGroupProdId;

		// option group methods.
		service.getallOptionGroups = getallOptionGroups;
		service.getOptionGroup = getOptionGroup;
		service.getSelectedoptionproduct = getSelectedoptionproduct;
		service.setSelectedoptionproduct = setSelectedoptionproduct;
		service.getcurrentproductoptiongroups = getcurrentproductoptiongroups;
		service.getrerenderHierarchy = getrerenderHierarchy;
		service.setrerenderHierarchy = setrerenderHierarchy;
		service.getslectedOptionGroupProdId = getslectedOptionGroupProdId;
		service.setslectedOptionGroupProdId = setslectedOptionGroupProdId;
		
		function getallOptionGroups(){
			return OptionGroupCache.getOptionGroups();
		}

		function getOptionGroups(productIds) {
			// check if cachedOptionGroups has products requested for else make a remote call.
			var cachedOptionGroups = OptionGroupCache.getOptionGroups();
			var prodIds_filtered = _.filter(productIds, function(Id){ return !cachedOptionGroups.hasOwnProperty(Id); });
			if (OptionGroupCache.isValid
				&& prodIds_filtered.length < 1) {
				// logTransaction(cachedOptionGroups);
				return $q.when(cachedOptionGroups);
			}

			// locationRequest = createOptionGroupRequestDO(prodIds_filtered, QuoteDataService.getcartId(), QuoteDataService.getcontextLineNumber());
			var requestPromise = RemoteService.getproductoptiongroupsData(prodIds_filtered, QuoteDataService.getcartId(), QuoteDataService.getcontextLineNumber());
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				OptionGroupCache.initializeOptionGroups(response);
				BaseService.setOptionGroupLoadComplete();
				// logTransaction(response, categoryRequest);
				return OptionGroupCache.getOptionGroups();
			});
		}

		function getOptionGroup(productId) {
			var cachedOptionGroups = OptionGroupCache.getOptionGroups();
			if (OptionGroupCache.isValid
				&& _.has(cachedOptionGroups, productId)){
				setcurrentproductoptiongroups(cachedOptionGroups[productId]);
				return $q.when(true);
			}

			var bundleproductIds = [];
            if(!_.isEmpty(service.currentproductoptiongroups))
            {
                bundleproductIds = getAllBundleProductsinCurrentOptiongroups(service.currentproductoptiongroups, 'productOptionComponents', 'hasOptions', 'productId');
            }else{
                bundleproductIds.push(productId);
            }
			
			return getOptionGroups(bundleproductIds).then(function(response){
				var optionGroups = response;
				setcurrentproductoptiongroups(optionGroups[productId]);
				return true;
			}); 
		}

		function getSelectedoptionproduct() {
			return service.Selectedoptionproduct;
		}

		function setSelectedoptionproduct(optionComponent) {
			service.Selectedoptionproduct = {'productId':optionComponent.productId, 'productName': optionComponent.productName};
		}

        function getcurrentproductoptiongroups(){
        	return service.currentproductoptiongroups;
        }

        function setcurrentproductoptiongroups(result){
        	service.currentproductoptiongroups = result;
        }

        // util method. a: option groups, b: field name to access product components, c:field to identify if product is bundle or not, d: field name to access product Id within product component.
        function getAllBundleProductsinCurrentOptiongroups(a, b, c, d){
            // return a list of bundle product Id's. based on flag provided.
            var res = [];
            _.each(a, function (g) {
                res.push.apply(res, _.pluck(_.filter(g[b], function(h){
                    return h[c];
                }), d));
            });
            return res;
        }

        function getrerenderHierarchy(){
        	return service.rerenderHierarchy;
        }

        function setrerenderHierarchy(val){
        	service.rerenderHierarchy = val;
        }

        function getslectedOptionGroupProdId(){
        	return service.slectedOptionGroupProdId;
        }

        function setslectedOptionGroupProdId(val){
        	service.slectedOptionGroupProdId = val;
        }
	}
})();
