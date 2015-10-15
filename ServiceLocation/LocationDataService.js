(function() {
	angular.module('APTPS_ngCPQ').service('LocationDataService', LocationDataService); 
	LocationDataService.$inject = ['$q', 'BaseService', 'BaseConfigService', 'RemoteService'];
	function LocationDataService($q, BaseService, BaseConfigService, RemoteService) {
		var service = this;

		var locationIdSet = [];
		var isValid = false;
		var locations = [];

		service.selectedlpa = {};
		service.hasServicelocations = false;
		
		// location methods.
		service.gethasServicelocations = gethasServicelocations;
		service.getlocItems = getlocItems;
		service.getselectedlpa = getselectedlpa;
		service.setselectedlpa = setselectedlpa;
		service.getselectedlpaId = getselectedlpaId;
		service.getalllocationIdSet = getalllocationIdSet;
		
		function getlocItems() {
			if (isValid) {
				var cachedLocations = locations;
				// logTransaction(cachedLocations);
				return $q.when(cachedLocations);
			}

			var requestPromise = RemoteService.getServiceLocations(BaseConfigService.lineItem.bundleProdId, BaseConfigService.opportunityId);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializeLocations(response);
				BaseService.setLocationLoadComplete();
				
				// logTransaction(response, categoryRequest);
				var locationId = BaseConfigService.lineItem.serviceLocationId;
                if(!_.isUndefined(locationId)
                	&& !_.isNull(locationId))
                {
                    setselectedlpa(_.findWhere(locations, {Id:locationId}));
                }
				return locations;
			});
		}

		function initializeLocations(response) {
			locations = response.locations;
			isValid = true;
			
			if(locations.length > 0)
			{
				hasServicelocations = true;
				setalllocationIdSet(_.pluck(locations, 'Id'));
			}
		}

		function gethasServicelocations(){
			return hasServicelocations;
		}
		function setselectedlpa(loc) {
			service.selectedlpa = loc;
		}
		
		function getselectedlpa() {
			return service.selectedlpa;
		}

		function getselectedlpaId() {
			return _.isObject(service.selectedlpa) ? service.selectedlpa.Id : '';
		}

		function setalllocationIdSet(locIds){
			locationIdSet = locIds;
		}

		function getalllocationIdSet(){
			return locationIdSet;
		}
	}
})();