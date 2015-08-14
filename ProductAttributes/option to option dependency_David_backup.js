$scope.$watchCollection('Selectedoptionproduct.pav', function(newValue){
	$scope.optionLevelAttributeChange();
});

$scope.optionLevelAttributeChange = function(){
	if($scope.Selectedoptionproduct != ''){
					
	if($scope.Selectedoptionproduct.pav.hasOwnProperty('Ethernet_Local_Access_Speed__c')){
		$scope.dependencyAttributes['Ethernet_Local_Access_Speed__c'] = $scope.Selectedoptionproduct.pav['Ethernet_Local_Access_Speed__c'];
	}
	if($scope.Selectedoptionproduct.pav.hasOwnProperty('Billing_Type__c')){
		$scope.dependencyAttributes['Billing_Type__c'] = $scope.Selectedoptionproduct.pav['Billing_Type__c'];
	}

	if($scope.dependencyAttributes.hasOwnProperty('Ethernet_Local_Access_Speed__c') && $scope.dependencyAttributes.hasOwnProperty('Billing_Type__c')){
		var requestPromise = RemoteService.getDependencyAttributes($scope.dependencyAttributes['Ethernet_Local_Access_Speed__c'],$scope.dependencyAttributes['Billing_Type__c']);
		requestPromise.then(function(result){
			if(result.hasOwnProperty('Bandwidth__c') && result.hasOwnProperty('Circuit_Speed__c')){
				var Bandwidth = [];
				var CircuitSpeed = [];
				var BandwidthSplitted = [];
				var CircuitSpeedSplitted = [];						
				
				BandwidthSplitted = result['Bandwidth__c'].split(', ');
				CircuitSpeedSplitted = result['Circuit_Speed__c'].split(', ');
				
				
				_.each(BandwidthSplitted, function(item){
					Bandwidth.push({key:item, value:item});
				});
				_.each(CircuitSpeedSplitted, function(item){
					CircuitSpeed.push({key:item, value:item});
				});
				
				_.each($scope.selectedoptionattributegroups, function(groups){
					_.each(groups.productAtributes, function(attributes){
						if(attributes.fieldName == 'Bandwidth__c'){
							attributes.selectOptions = Bandwidth;
							$scope.selectedoptionpricingattributes['Bandwidth__c'] = Bandwidth[0].value;
						}
						if(attributes.fieldName == 'Access_Speed__c'){
							attributes.selectOptions = CircuitSpeed;
							$scope.selectedoptionpricingattributes['Access_Speed__c'] = CircuitSpeed[0].value;
						}
					});
				});							
			}
	});
}