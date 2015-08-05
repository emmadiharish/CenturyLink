(function() {
	angular.module('APTPS_ngCPQ').service('LocationDataService', LocationDataService); 
	LocationDataService.$inject = ['$q', '$log', 'LocationCache', 'QuoteDataService', 'RemoteService'];
	function LocationDataService($q, $log, LocationCache, QuoteDataService, RemoteService) {
		var service = this;

		service.locationIdSet = [];
		service.selectedlpa = {};
		service.isRemotecallComplete = false;
		service.hasServicelocations = false;

		// location methods.
		service.getlocItems = getlocItems;
		service.getselectedlpa = getselectedlpa;
		service.setselectedlpa = setselectedlpa;
		service.getselectedlpaId = getselectedlpaId;
		service.getalllocationIdSet = getalllocationIdSet;
		service.getisRemotecallComplete = getisRemotecallComplete;
		
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
				service.isRemotecallComplete = true;
				if(response.locations.length > 0)
				{
					service.hasServicelocations = true;
					setalllocationIdSet(_.pluck(response.locations, 'Id'));
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

		function setselectedlpa(selectedlpa) {
			service.selectedlpa = selectedlpa;
		}
		
		function getselectedlpa() {
			return service.selectedlpa;
		}

		function getselectedlpaId() {
			return _.isObject(service.selectedlpa) ? service.selectedlpa.Id : '';
		}

		function setalllocationIdSet(locIds){
			service.locationIdSet = locIds;
		}

		function getalllocationIdSet(){
			return service.locationIdSet;
		}

		function getisRemotecallComplete(){
			return service.isRemotecallComplete;
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