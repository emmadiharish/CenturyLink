(function() {
	angular.module('APTPS_ngCPQ').service('DependentPicklistDataService', DependentPicklistDataService); 
	DependentPicklistDataService.$inject = ['$q', '$log', 'RemoteService'];
	function DependentPicklistDataService($q, $log, RemoteService){
		var service = this;

		service.isValid = false;
		service.PAVcFieldtodFieldDefinationMap = {};
		
		service.getDependentPicklistInformation = getDependentPicklistInformation;
		service.applyDependency_singleField = applyDependency_singleField;
		service.applyDependency_AllField = applyDependency_AllField;
		service.getStructuredDependentFields = getStructuredDependentFields;

		function getDependentPicklistInformation(){
			var requestPromise = RemoteService.getPAVDependentPickListsConfig();
			return requestPromise.then(function(response){
				initializePAVDependentPicklistResult(response);
				return response;
			});
		}

		function initializePAVDependentPicklistResult(response){
			var res = {};
			_.each(response, function(dpwrapper){
				var cField = dpwrapper.pControllingFieldName;
				var dField = dpwrapper.pDependentFieldName;
				
				var dFieldDefinations = {};
            	if(_.has(service.PAVcFieldtodFieldDefinationMap, cField))
            	{
            		dFieldDefinations = service.PAVcFieldtodFieldDefinationMap[cField];
            	}
            	dFieldDefinations[dField] = dpwrapper.objResult;
            	service.PAVcFieldtodFieldDefinationMap[cField] = dFieldDefinations;
            });
		}

		function getStructuredDependentFields(cField){
			var res = [];
			if(_.has(service.PAVcFieldtodFieldDefinationMap, cField))
			{
				res = service.PAVcFieldtodFieldDefinationMap[cField];
			}
			return res;	
		}

		function applyDependency_AllField(attributeGroups, PAV){
			var res = {};
			var allCFields = _.keys(service.PAVcFieldtodFieldDefinationMap);
			var allCFields_selectedPAV = [];
			_.each(attributeGroups, function(attributeGroup){
                var fieldsinAttributeGroup = _.pluck(attributeGroup.productAtributes, 'fieldName');
                var ajsdbas = _.intersection(allCFields, fieldsinAttributeGroup);
                allCFields_selectedPAV.push.apply(ajsdbas);
            })

			// if config field is controlling field then apply dependencies.
            _.each(allCFields_selectedPAV, function(fieldName){
            	applyDependency_singleField(attributeGroups, PAV, fieldName);
			})
            res = {pavConfigGroups: attributeGroups, PAVObj: PAV};
			return res;
		}

		function applyDependency_singleField(attributeGroups, PAV, fieldName){
            var selectedPAVValue = PAV[fieldName];
            var dFieldDefinations = getStructuredDependentFields(fieldName);
            var dFields = _.keys(dFieldDefinations);
            // Iterate over all dependent fields and change its dropdown values according to controlling field value selected.
            _.each(attributeGroups, function(attributeGroup){
                _.each(attributeGroup.productAtributes, function(attributeConfig){
                    // dependent field existing in the attribute group configuration.
                    // change the selectOptions of depenedent picklist fields.
                    var dField = attributeConfig.fieldName;
                    if(_.indexOf(dFields, dField) != -1)
                    {
                        var dPicklistConfig = dFieldDefinations[dField];
                        var options = [];
                        PAV[dField] = null;
                        options.push({key:'--None--', value:null});
                        _.each(dPicklistConfig[selectedPAVValue], function(lov){
                            options.push({key:lov, value:lov});
                        })
                        attributeConfig.selectOptions = options;
                    }
                })
            })    
        }
	}
})();