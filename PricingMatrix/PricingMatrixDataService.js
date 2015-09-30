(function() {
	angular.module('APTPS_ngCPQ').service('PricingMatrixDataService', PricingMatrixDataService); 
	PricingMatrixDataService.$inject = ['$q', '$log', 'BaseService', 'BaseConfigService', 'PAVObjConfigService', 'RemoteService'];
	function PricingMatrixDataService($q, $log, BaseService, BaseConfigService, PAVObjConfigService, RemoteService) {
		var service = this;

		var pricingMatrixSearchResult = {};
		var isValid = false;
		var firstPMRecordId = null;
		
		// Pricing Methods.
		service.getPricingMatrix = getPricingMatrix;
		service.setfirstPricingMatrixRecord = setfirstPricingMatrixRecord;
		service.getfirstPMRecordId  = getfirstPMRecordId;

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
			var dimensions = [];
			var PAVlines = [];
			var pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;

			var priceListItems = response.priceListItems;
			var priceMatrices = response.priceMatrices;
			_.each(priceListItems, function(pli){
				_.each(priceMatrices, function(pm){
					var dimension1 = pm.Apttus_Config2__Dimension1Id__r.Apttus_Config2__Datasource__c;
					var dimension2 = pm.Apttus_Config2__Dimension2Id__r.Apttus_Config2__Datasource__c;
					var dimension3 = pm.Apttus_Config2__Dimension3Id__r.Apttus_Config2__Datasource__c;
					var dimension4 = pm.Apttus_Config2__Dimension4Id__r.Apttus_Config2__Datasource__c; 
					var dimension5 = pm.Apttus_Config2__Dimension5Id__r.Apttus_Config2__Datasource__c;
					var dimension6 = pm.Apttus_Config2__Dimension6Id__r.Apttus_Config2__Datasource__c;
					if(!_.isUndefined(dimension1) 
						&& _.isNull(dimension1) 
						&& !_.contains(dimensions, dimension1)
						&& _.has(pavfieldDescribeMap, dimension1))
							dimensions.push(dimension1);
					else
						dimension1 = null;
					if(!_.isUndefined(dimension2) 
						&& _.isNull(dimension2) 
						&& !_.contains(dimensions, dimension2)
						&& _.has(pavfieldDescribeMap, dimension2))
							dimensions.push(dimension2);
					else
						dimension2 = null;
					if(!_.isUndefined(dimension3) 
						&& _.isNull(dimension3) 
						&& !_.contains(dimensions, dimension3)
						&& _.has(pavfieldDescribeMap, dimension3))
							dimensions.push(dimension3);
					else
						dimension3 = null;
					if(!_.isUndefined(dimension4) 
						&& _.isNull(dimension4) 
						&& !_.contains(dimensions, dimension4)
						&& _.has(pavfieldDescribeMap, dimension4))
							dimensions.push(dimension4);
					else
						dimension4 = null;
					if(!_.isUndefined(dimension5) 
						&& _.isNull(dimension5) 
						&& !_.contains(dimensions, dimension5)
						&& _.has(pavfieldDescribeMap, dimension5))
							dimensions.push(dimension5);
					else
						dimension5 = null;
					if(!_.isUndefined(dimension6) 
						&& _.isNull(dimension6) 
						&& !_.contains(dimensions, dimension6)
						&& _.has(pavfieldDescribeMap, dimension6))
							dimensions.push(dimension6);
					else
						dimension6 = null;
					var pmEntries = pm.Apttus_Config2__MatrixEntries__r;
					_.each(pmEntries, function(pme){
						if(!_.isNull(dimension1))
							PMEntry[dimension1] = pme.Apttus_Config2__Dimension1Value__c;
						if(!_.isNull(dimension2))
							PMEntry[dimension2] = pme.Apttus_Config2__Dimension2Value__c;
						if(!_.isNull(dimension3))
							PMEntry[dimension3] = pme.Apttus_Config2__Dimension3Value__c;
						if(!_.isNull(dimension4))
							PMEntry[dimension4] = pme.Apttus_Config2__Dimension4Value__c;
						if(!_.isNull(dimension5))
							PMEntry[dimension5] = pme.Apttus_Config2__Dimension5Value__c;
						if(!_.isNull(dimension6))
							PMEntry[dimension6] = pme.Apttus_Config2__Dimension6Value__c;
						PMEntry['Price__c'] = pme.Apttus_Config2__AdjustmentAmount__c;
						PMEntry['Pricing_Matrix_Id__c'] = pme.Id;
						PMEntry['PMEntryName'] = pme.Name;

						PAVlines.push(PMEntry);
					})
				})
			})

			if(_.size(dimensions) > 0)
				dimensions.push('Price__c');
			pricingMatrixSearchResult = {lines:PAVlines, dimensions:dimensions};
			isValid = true;
		}

		/*function initializePricingMatrix(response){
			var PAVlines = [];
			var dimensions = [];// PAV field Names.
			var pricingMatrixMap = response.pricingMatrixMap;
			var pavfieldDescribeMap = PAVObjConfigService.fieldNametoDFRMap;
			if(_.size(pricingMatrixMap) > 0)
			{
				// Assumption: first row would always be fields.	
				var attributeFieldNames = _.keys(getattributefieldlabeltoPMlabelMap(_.first(pricingMatrixMap)));
				pricingMatrixMap.splice(0, 1);// remove the first row....
				
				// if dimension names doesn't match with PAV fields then columns will be hidden from pricing matrix on UI.
				_.each(attributeFieldNames, function(fieldName){
					if(_.has(pavfieldDescribeMap, fieldName))
					{
						dimensions.push(fieldName);	
					}
				})

				_.each(pricingMatrixMap, function(priceMatrixEntry){
					var PMEntry = {};
					_.each(dimensions, function(dimension){
						PMEntry[dimension] = priceMatrixEntry[dimension];
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
			if(_.size(dimensions) > 0)
				dimensions.push('Price__c');
			pricingMatrixSearchResult = {lines:PAVlines, dimensions:dimensions};
			isValid = true;
		}*/

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