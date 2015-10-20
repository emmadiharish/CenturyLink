(function() {
	angular.module('APTPS_ngCPQ').service('LocationDataService', LocationDataService); 
	LocationDataService.$inject = ['$q', 'BaseService', 'BaseConfigService', 'RemoteService'];
	function LocationDataService($q, BaseService, BaseConfigService, RemoteService) {
		var service = this;

		var locationIdSet = [];
		var isValid = false;
		var locations = [];
		var selectedlpa = {};
		var hasServicelocations = false;
		
		var processQueue = {
	        isRunning: [],
	        promises: []
	    };

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

			/*var requestPromise = RemoteService.getServiceLocations(BaseConfigService.lineItem.bundleProdId, BaseConfigService.opportunityId);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializeLocations(response);
				BaseService.setLocationLoadComplete();
				return locations;
			});*/

			var requestPromise = RemoteService.getServiceLocations(BaseConfigService.lineItem.bundleProdId, BaseConfigService.opportunityId);
			BaseService.startprogress();// start progress bar.
			var methodName = 'ServiceLocationsRequest';
            var defer = $q.defer();
            if (processQueue.isRunning.indexOf(methodName) == -1) {
                processQueue.isRunning.push(methodName);
                requestPromise.then(function(response){
                    
                    initializeLocations(response);
					BaseService.setLocationLoadComplete();
                    
                    _.each(
                        _.filter(processQueue.promises, function (value, index) {
                            return value.method == methodName;
                        }), function (value, index) {
                            processQueue.promises.splice(_.indexOf(processQueue, { id: value.id }));
                            value.promise.resolve(response);
                        });
                    processQueue.isRunning.splice(processQueue.isRunning.indexOf(methodName));
                	return locations;
                });
            }

            processQueue.promises.push({
                method: methodName,
                promise: defer,
                id: Date.now()
 
            });

            return defer.promise;
	    }

		function initializeLocations(response) {
			locations = response.locations;
			isValid = true;
			
			if(locations.length > 0)
			{
				hasServicelocations = true;
				setalllocationIdSet(_.pluck(locations, 'Id'));
			}

			var locationId = BaseConfigService.lineItem.serviceLocationId;
            if(!_.isUndefined(locationId)
            	&& !_.isNull(locationId))
            {
                setselectedlpa(_.findWhere(locations, {Id:locationId}));
            }
		}

		function gethasServicelocations(){
			return hasServicelocations;
		}
		function setselectedlpa(loc) {
			selectedlpa = loc;
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