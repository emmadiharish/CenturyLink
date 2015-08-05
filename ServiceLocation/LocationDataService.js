(function() {
	angular.module('APTPS_ngCPQ').service('LocationDataService', LocationDataService); 
	LocationDataService.$inject = ['$q', '$log', 'LocationCache', 'QuoteDataService', 'RemoteService'];
	function LocationDataService($q, $log, LocationCache, QuoteDataService, RemoteService) {
		var service = this;

		service.selectedlpa = {};
		service.hasServicelocations = false;
		service.locationIdSet = [];

		// location methods.
		service.getlocItems = getlocItems;
		service.getselectedlpa = getselectedlpa;
		service.setselectedlpa = setselectedlpa;
		service.getalllocationIdSet = getalllocationIdSet;
		
		function getlocItems() {
			if (LocationCache.isValid) {
				var cachedLocations = LocationCache.getLocations();
				// logTransaction(cachedLocations);
				return $q.when(cachedLocations);
			}

			// locationRequest = createlocationRequestDO(QuoteDataService.getbundleproductId(), QuoteDataService.getopportunityId());
			var requestPromise = RemoteService.getServiceLocations(QuoteDataService.getbundleproductId(), QuoteDataService.getopportunityId());
			return requestPromise.then(function(response){
				LocationCache.initializeLocations(response.locations);
				if(response.locations.length > 0)
				{
					service.hasServicelocations = true;
				}
				// logTransaction(response, categoryRequest);
				var locationId = QuoteDataService.getbundleServiceLocation();
                if(locationId)
                {
                    _.each(response.locations , function(la){
                        if(la.Id == locationId)
                        {
                            setselectedlpa(la);
                        }
                    })
                }
				return LocationCache.getLocations();
			});
		}

		function getselectedlpa() {
			return service.selectedlpa;
		}

		function setselectedlpa(selectedlpa) {
			service.selectedlpa = selectedlpa;
		}

		function getalllocationIdSet(){
			if(_.isEmpty(service.locationIdSet))
			{
				service.getlocItems().then(function(result) {
	            	service.locationIdSet = _.pluck(result, 'Id');
	            })
			}
			return service.locationIdSet;
		}

		/*function createlocationRequestDO(){
			var request = [];
			$log.log('argument count inside createlocationRequestDO is: '+arguments.length);
			for (var argIndex = 0; argIndex < arguments.length; argIndex++) {
				request.push(arguments[argIndex]);
			}
			return request;
		}*/
	}
})();