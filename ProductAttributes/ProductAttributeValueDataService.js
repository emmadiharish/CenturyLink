;(function() {
	'use strict';
	
	angular.module('APTPS_ngCPQ').service('ProductAttributeValueDataService', ProductAttributeValueDataService); 
	ProductAttributeValueDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService','RemoteService'];
	function ProductAttributeValueDataService($q, $log, BaseService, BaseConfigService, RemoteService) {
		var service = this;
		var bundleproductattributevalues = {};
		var componentIdtoOptionPAVMap = {};
		
		service.isValid = false;
		service.getProductAttributeValues = getProductAttributeValues;
		service.setbundleproductattributevalues = setbundleproductattributevalues;
		service.getbundleproductattributevalues = getbundleproductattributevalues;
		service.getoptionproductattributevalues = getoptionproductattributevalues;

		function getProductAttributeValues_bulk(){
			var productAttributeValueDataRequest = {cartId: BaseConfigService.cartId
													, lineNumber: BaseConfigService.lineItem.lineNumber};
			var requestPromise = RemoteService.getProductAttributeValueData(productAttributeValueDataRequest);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializeProductAttributeValues(response);
				// logTransaction(response, categoryRequest);
				BaseService.setPAVLoadComplete();
				return componentIdtoOptionPAVMap;
			});
		}

		function getProductAttributeValues(componentId){
			if(service.isValid == true)
			{
				if(!_.has(componentIdtoOptionPAVMap, componentId))
					componentIdtoOptionPAVMap[componentId] = {};
				return $q.when(componentIdtoOptionPAVMap[componentId]);
			}

			return getProductAttributeValues_bulk().then(function(result){
				if(!_.has(componentIdtoOptionPAVMap, componentId))
					componentIdtoOptionPAVMap[componentId] = {};
				return componentIdtoOptionPAVMap[componentId];
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
			_.each(response.pavWrapList, function(pavwrapper){
				// bundle pav if Apttus_Config2__OptionId__c is null.
				if(!_.has(pavwrapper.lineItem, 'Apttus_Config2__OptionId__c')
					|| _.isNull(pavwrapper.lineItem.Apttus_Config2__OptionId__c))
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