angular.module('APTPS_ngCPQ').constant('RemoteActions',{
	getLineItem: 'APTPS_CAP_RA.getLineItem',
	getServiceLocations: 'APTPS_CAP_RA.getServiceLocations',
	getPricingMatrixData: 'APTPS_CAP_RA.getpricingMatrix',
	getMiniCartLines: 'APTPS_CAP_RA.getMiniCartLines',
	getproductoptiongroupsData: 'APTPS_CAP_RA.getproductoptiongroupsData',
	getattributeGroupsConfigData: 'APTPS_CAP_RA.getattributeGroupsConfigData',
	getProductAttributeValueData: 'APTPS_CAP_RA.getProductAttributeValueData',
	saveoptionsandattributes: 'APTPS_CAP_RA.saveQuoteConfig',
	configureLineItem: 'APTPS_CAP_RA.configureLineItem',
	deleteLineItemFromCart: 'APTPS_CAP_RA.deleteLineItemFromCart',
	getPAVDependentPickListsConfig: 'APTPS_CAP_RA.getPAVDependentPickListsConfig',
	getPAVFieldMetaData: 'APTPS_CAP_RA.getPAVFieldMetaData'
});