(function() {
	angular.module('APTPS_ngCPQ').service('PAVConfigDataService', PAVConfigDataService); 
	PAVConfigDataService.$inject = ['$q', '$log', 'BaseService', 'RemoteService'];
	function PAVConfigDataService($q, $log, BaseService, RemoteService) {
		var service = this;
		service.isvalid = false;
		service.fieldNametoDFRMap = {};

		service.getPAVFieldMetaData = getPAVFieldMetaData;
		
		function getPAVFieldMetaData(){
			if(service.isvalid == true)
			{
				return $q.when(service.fieldNametoDFRMap);
			}

			var requestPromise = RemoteService.getPAVFieldMetaData();
			return requestPromise.then(function(response){
				initializefieldNametoDFRMap(response);
				return service.fieldNametoDFRMap;
			})
		}

		function initializefieldNametoDFRMap(response){
			service.fieldNametoDFRMap = response;
		}
	}
})();