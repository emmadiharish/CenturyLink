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
		var locIdtolocAvlsMap = {};
		var locIdtoOptionProductsMap = {};
		var availableOptionProducts = [];

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
		service.getLocationAvailabilityforBundle = getLocationAvailabilityforBundle;
		service.getLocationAvailabilityforOption = getLocationAvailabilityforOption;
		service.getAvailableOptionProducts = getAvailableOptionProducts;

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
	
			// chain the location call and location availability calls.
			var requestPromise = RemoteService.getServiceLocations(BaseConfigService.lineItem.bundleProdId, BaseConfigService.opportunityId);
			BaseService.startprogress();// start progress bar.
			var methodName = 'ServiceLocationsRequest';
            var defer = $q.defer();
            if (processQueue.isRunning.indexOf(methodName) == -1) {
                processQueue.isRunning.push(methodName);
                requestPromise.then(function(response){
                    initializeLocations(response);
					BaseService.setLocationLoadComplete();
                    requestPromise = RemoteService.getLocationAvailabilities(locationIdSet, BaseConfigService.lineItem.bundleProdId);
						return requestPromise.then(function(laresponse){
							initializelocationAvailabilities(laresponse);
							
						_.each(
	                        _.filter(processQueue.promises, function (value, index) {
	                            return value.method == methodName;
	                        }), function (value, index) {
	                            processQueue.promises.splice(_.indexOf(processQueue, { id: value.id }));
	                            value.promise.resolve(locations);
	                        });
	                    processQueue.isRunning.splice(processQueue.isRunning.indexOf(methodName));
					});
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

		function initializelocationAvailabilities(response){
			service.isValid = true;
			_.each(response.locAvailabilities, function(la){
				var las = [];
				var locId = la.Service_Location__c;
				if(_.has(locIdtolocAvlsMap, locId))
				{
					las = locIdtolocAvlsMap[locId];
				}
				las.push(la);
				locIdtolocAvlsMap[locId] = las;
				
				// if option product exits then add them to locIdtoOptionProductsMap.
				if(_.has(la, 'Option_Product__c')){
					var optionProd = la.Option_Product__c;
					var pIds = [];
					if(_.has(locIdtolocAvlsMap, locId))
					{
						pIds = locIdtoOptionProductsMap[locId];
					}
					pIds.push(optionProd);
					locIdtoOptionProductsMap[locId] = pIds;
				}
			});
		}

		function getLocationAvailabilityforBundle(locId, productId){
			// find the location availability record where location matches with service location and productId matches with bundle product and option product = null
			var res = [];
			if(_.has(locIdtolocAvlsMap, locId))
			{
				_.each(_.where(locIdtolocAvlsMap[locId], {Bundle_Product__c: productId}), 
					function(la){
					if(!_.has(la, 'Option_Product__c'))
						res.push(la);
				});
			}
			return res;
		}

		function getLocationAvailabilityforOption(locId, productId){
			// find the location availability record where location matches with service location and option product = productId
			var res = [];
			if(_.has(locIdtolocAvlsMap, locId))
			{
				res = _.where(locIdtolocAvlsMap[locId], {Option_Product__c: productId});
			}
			return res;
		}

		function setAvailableOptionProductsforLocation(locId){
			if(_.has(locIdtoOptionProductsMap, locId))
				availableOptionProducts = locIdtoOptionProductsMap[locId];
			else
				availableOptionProducts = [];
		}

		function getAvailableOptionProducts(){
			return availableOptionProducts;
		}

		function gethasServicelocations(){
			return hasServicelocations;
		}
		function setselectedlpa(loc) {
			selectedlpa = loc;
			setAvailableOptionProductsforLocation(getselectedlpaId());
		}
		
		function getselectedlpa() {
			return selectedlpa;
		}

		function getselectedlpaId(){
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