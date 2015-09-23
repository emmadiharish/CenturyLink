(function() {
	angular.module('APTPS_ngCPQ').service('PricingMatrixDataService', PricingMatrixDataService); 
	PricingMatrixDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService', 'PAVObjConfigService', 'RemoteService'];
	function PricingMatrixDataService($q, $log, BaseService, BaseConfigService, PAVObjConfigService, RemoteService) {
		var service = this;

		pricingMatrixSearchResult = {};
		isValid = false;
		firstPMRecordId = null;
		
		// Pricing Methods.
		service.getPricingMatrix = getPricingMatrix;
		service.setfirstPricingMatrixRecord = setfirstPricingMatrixRecord;

		function getPricingMatrix() {
			if (isValid) {
				return $q.when(pricingMatrixSearchResult);
			}
			
			var requestPromise = RemoteService.getPricingMatrixData(BaseConfigService.bundleProdId);
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializePricingMatrix(response);
				BaseService.setPricingMatrixLoadComplete();
				return pricingMatrixSearchResult;
			});
		}

		function initializePricingMatrix(response){
			var PAVlines = [];
			var fieldNametofieldLabelMap = {};
			var pricingMatrixMap = response.pricingMatrixMap;
			if(_.size(pricingMatrixMap) > 0)
			{
				var attributeFieldLabels = _.keys(getattributefieldlabeltoPMlabelMap(_.first(pricingMatrixMap)));
				pricingMatrixMap.splice(0, 1);// remove the first row....Assumption: first row would always be fields.	
				fieldNametofieldLabelMap = PAVObjConfigService.getFieldMap_ForLabels(attributeFieldLabels);
				_.each(pricingMatrixMap, function(singlePricingMatrix){
					var PAVLine = {};
					_.each(fieldNametofieldLabelMap, function(fieldLabel, FieldName){
						PAVLine[FieldName] = singlePricingMatrix[fieldLabel];
					})
					
					// Add Price.
					if(_.has(singlePricingMatrix, 'Price')){
		                PAVLine['Price__c'] = singlePricingMatrix.Price;
		            }else{
		                PAVLine['Price__c'] = 0; 
		            }

		            // add Pricing matrix Id.
		            if(_.has(singlePricingMatrix, 'Id')){
		                PAVLine['Pricing_Matrix_Id__c'] = singlePricingMatrix.Id;
		            }else{
		                PAVLine['Pricing_Matrix_Id__c'] =  null; 
		            }   
					PAVlines.push(PAVLine);
				})
			}
			pricingMatrixSearchResult = {lines:PAVlines, fieldsmap: fieldNametofieldLabelMap};
			isValid = true;
		}

		function setfirstPricingMatrixRecord(pmId){
			firstPMRecordId = pmId;
		}

		function getfirstPMRecordId(){
			return firstPMRecordId;
		}
		
		function getattributefieldlabeltoPMlabelMap(priceMatrixrawheaders){
	        var res = {};
	        for(var i = 1; i< 7;i++){
	            var key = 'Dimension'+i;
	            if(_.has(priceMatrixrawheaders, key)){
	                res[priceMatrixrawheaders[key]] = key;
	            }
	        }
	        return res;
	    }
	}
})();