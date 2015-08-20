(function() {
	angular.module('APTPS_ngCPQ').service('PAVConfigService', PAVConfigService); 
	PAVConfigService.$inject = ['$q', '$log', 'BaseService', 'RemoteService'];
	function PAVConfigService($q, $log, BaseService, RemoteService) {
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
			service.isvalid = true;
			_.each(response, function(rawfieldDescribe, fieldName){
				service.fieldNametoDFRMap[fieldName] = getFieldDescribe(rawfieldDescribe);
			})
		}

		function getFieldDescribe(fieldDescribe){
			var res = {};
			res[fieldType] = getFieldType(fieldDescribe.type);
			res[fieldLabel] = fieldDescribe.label;
			res[picklistValues] = getPicklistValues(fieldDescribe.picklistValues);
			//res[] = ;
			//res[] = ;
			//res[] = ;
			return res;
		}

		function getFieldType(sfdctype){
			var res = 'text';// default.
			if(sfdctype == 'picklist'
				|| sfdctype == 'multiPicklist')
				return 'picklist';
			else if(sfdctype == 'string'
					|| sfdctype == 'textarea'
					|| sfdctype == 'phone'
					|| sfdctype == 'encryptedstring')
				return 'text';
			else if(sfdctype == 'boolean')
				return 'checkbox';
			else if(sfdctype == 'combobox')
				return '';
			else if(sfdctype == 'currency'
					|| sfdctype == 'integer'
					|| sfdctype == 'double'
					|| sfdctype == 'percent')
				return 'number';
			else if(sfdctype == 'date')
				return 'date';
			else if(sfdctype == 'datetime')
				return 'datetime';
			else if(sfdctype == 'email')
				return 'email';
			else if(sfdctype == 'reference')
				return '';
			else if(sfdctype == 'time')
				return 'time';
			else if(sfdctype == 'url')
				return 'url';
			return 'text';
			return res;
		}

		function getPicklistValues(ples){
			var res = [];// defaultValue
			/*_.each(ples, function(ple){
				if(ple.active == true)
				{
					res.push({label:ple.label, value:ple.value});
				}
			});*/
			res = ples;
			return res;
		}
	}
})();