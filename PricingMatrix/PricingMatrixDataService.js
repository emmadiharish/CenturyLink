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
			var pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
			if(_.size(pricingMatrixMap) > 0)
			{
				// Assumption: first row would always be fields.	
				var attributeFieldNames = _.keys(getattributefieldlabeltoPMlabelMap(_.first(pricingMatrixMap)));
				pricingMatrixMap.splice(0, 1);// remove the first row....
				
				// if dimention names doesn't match with PAV fields then columns will be hidden from pricing matrix on UI.
				_.each(attributeFieldNames, function(fieldName){
					if(_.has(pavfieldDescribeMap, fieldName))
					{
						fieldNametofieldLabelMap[fieldName] = pavfieldDescribeMap[fieldName].fieldDescribe.fieldLabel;	
					}
				})

				_.each(pricingMatrixMap, function(priceMatrixEntry){
					var PMEntry = {};
					_.each(fieldNametofieldLabelMap, function(fieldLabel, FieldName){
						PMEntry[FieldName] = priceMatrixEntry[FieldName];
					})
					
					// Add Price.
					if(_.has(priceMatrixEntry, 'Price')){
		                PMEntry['Price__c'] = priceMatrixEntry.Price;
		            }else{
		                PMEntry['Price__c'] = 0; 
		            }

		            // add Pricing matrix Id.
		            if(_.has(priceMatrixEntry, 'Id')){
		                PMEntry['Pricing_Matrix_Id__c'] = priceMatrixEntry.Id;
		            }else{
		                PMEntry['Pricing_Matrix_Id__c'] =  null; 
		            }

					PAVlines.push(PMEntry);
				})
			}
			fieldNametofieldLabelMap['Price__c'] = 'Price';
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