(function(){
	'use strict';
	/*
    This is our main launch point from Angular. 
    We'll put anything to do with the
    general well being of our app in this file. 
    
    Our module will be called 'APTPS_ngCPQ'.
 	*/
	angular.module('APTPS_ngCPQ',
		['ngProgress', 
		'ui.bootstrap', 
		'dialogs', 
		'ui.select',
		'dirPagination']
		).constant('moment', moment)
			.config(configBlock);

	configBlock.$inject = [
		'systemConstants',
		'paginationTemplateProvider',
	];
	
	function configBlock(systemConstants, paginationTemplateProvider) {
		var baseUrl = systemConstants.baseUrl;

		//A single pagination-controls template is used throught the app. This may be limiting.
		paginationTemplateProvider.setPath(baseUrl + '/Templates/pagination.html');

	}
}).call(this);

// angular.module('APTPS_ngCPQ', ['ngProgress']);
// angular.module('APTPS_ngCPQ').config(['',function() {
	
// }])