(function() {
	angular.module('APTPS_ngCPQ').service('LocationDataService', LocationDataService); 
	LocationDataService.$inject = ['$q', 'BaseService', 'BaseConfigService', 'LocationCache', 'RemoteService'];
	function LocationDataService($q, BaseService, BaseConfigService, LocationCache, RemoteService) {
		var service = this;
		var locationIdSet = [];
		var selectedlpa = {};
		var hasServicelocations = false;

		// location methods.
		service.gethasServicelocations = gethasServicelocations;
		service.getlocItems = getlocItems;
		service.getselectedlpa = getselectedlpa;
		service.setselectedlpa = setselectedlpa;
		service.getselectedlpaId = getselectedlpaId;
		service.getalllocationIdSet = getalllocationIdSet;
		
		function getlocItems() {
			if (LocationCache.isValid) {
				var cachedLocations = LocationCache.getLocations();
				// logTransaction(cachedLocations);
				return $q.when(cachedLocations);
			}

			var requestPromise = RemoteService.getServiceLocations(BaseConfigService.lineItem.bundleProdId, BaseConfigService.opportunityId);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				LocationCache.initializeLocations(response.locations);
				BaseService.setLocationLoadComplete();
				if(response.locations.length > 0)
				{
					hasServicelocations = true;
					setalllocationIdSet(_.pluck(response.locations, 'Id'));
				}
				
				// logTransaction(response, categoryRequest);
				var locationId = BaseConfigService.lineItem.serviceLocationId;
                if(!_.isUndefined(locationId)
                	&& !_.isNull(locationId))
                {
                    setselectedlpa(_.findWhere(response.locations, {Id:locationId}));
                }
				return LocationCache.getLocations();
			});
		}

		function gethasServicelocations(){
			return hasServicelocations;
		}
		function setselectedlpa(selectedlpa) {
			selectedlpa = selectedlpa;
		}
		
		function getselectedlpa() {
			return selectedlpa;
		}

		function getselectedlpaId() {
			return _.isObject(selectedlpa) ? selectedlpa.Id : '';
		}

		function setalllocationIdSet(locIds){
			locationIdSet = locIds;
		}

		function getalllocationIdSet(){
			return locationIdSet;
		}
	}
})();