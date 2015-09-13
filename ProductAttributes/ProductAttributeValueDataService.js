(function() {
	angular.module('APTPS_ngCPQ').service('ProductAttributeValueDataService', ProductAttributeValueDataService); 
	ProductAttributeValueDataService.$inject = ['$q', '$log', 'BaseService', 'QuoteDataService','RemoteService'];
	function ProductAttributeValueDataService($q, $log, BaseService, QuoteDataService, RemoteService) {
		var service = this;

		var bundleproductattributevalues = {};
		var componentIdtoOptionPAVMap = {};
		
		service.isValid = false;
		service.getProductAttributeValues = getProductAttributeValues;
		service.setbundleproductattributevalues = setbundleproductattributevalues;
		service.getbundleproductattributevalues = getbundleproductattributevalues;
		service.getoptionproductattributevalues = getoptionproductattributevalues;

		function getProductAttributeValues_bulk(){
			var requestPromise = RemoteService.getProductAttributeValueData(QuoteDataService.getcartId(), QuoteDataService.getcontextLineNumber());
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializeProductAttributeValues(response);
				// logTransaction(response, categoryRequest);
				BaseService.setPAVLoadComplete();
				return componentIdtoPAVMap;
			});
		}

		function getProductAttributeValues(componentId){
			if(service.isValid == true)
			{
				if(!_.has(componentIdtoPAVMap, componentId))
					componentIdtoPAVMap[componentId] = {};
				return $q.when(componentIdtoPAVMap[componentId]);
			}

			return getProductAttributeValues_bulk().then(function(result){
				if(!_.has(componentIdtoPAVMap, componentId))
					componentIdtoPAVMap[componentId] = {};
				return componentIdtoPAVMap[componentId];
			})
		}

		function setbundleproductattributevalues(pav){
        	if(_.isEmpty(bundleproductattributevalues))
        	{
        		bundleproductattributevalues = pav;
        	}
        }

        function getbundleproductattributevalues(){
        	return bundleproductattributevalues;
        }

        function getoptionproductattributevalues(){
			return componentIdtoOptionPAVMap;
		}

		function initializeProductAttributeValues(response){
			service.isValid = true;
			_.each(response, function(pavwrapper){
				// bundle pav if Apttus_Config2__OptionId__c is null.
				if(_.isNull(pavwrapper.lineItem.Apttus_Config2__OptionId__c))
				{
					setbundleproductattributevalues(pavwrapper.pav);
				}// option line
				else{
					componentIdtoOptionPAVMap[pavwrapper.lineItem.Apttus_Config2__ProductOptionId__c] = pavwrapper.pav;
				}
			})
		}
	}
})();