(function() {
	angular.module('APTPS_ngCPQ').service('RemoteService', RemoteService); 
	RemoteService.$inject = ['$q', '$log', 'RemoteActions'];
	function RemoteService($q, $log, RemoteActions) {
		var service = this;
		var lastTransaction = {};

		/**
		* Each method passes its fully-qualified name and its
		* 
		arguments to invokeRemoteAction. The arguments passed
		* 
		to this function should just match the signature of 
		* 
		the Apex method. 
		* @return {promise} resolves with the result of the remote action
		*/
		service.getMiniCartLines = function getMiniCartLines() {
			return invokeRemoteAction(RemoteActions.getMiniCartLines, arguments);

		};
		service.configureLineItem = function configureLineItem() {
			return invokeRemoteAction(RemoteActions.configureLineItem, arguments);

		};
		service.deleteLineItemFromCart = function deleteLineItemFromCart() {
			return invokeRemoteAction(RemoteActions.deleteLineItemFromCart, arguments);

		};
		service.getServiceLocations = function getServiceLocations() {
			return invokeRemoteAction(RemoteActions.getServiceLocations, arguments);

		};
		service.getPricingMatrixData = function getPricingMatrixData() {
			return invokeRemoteAction(RemoteActions.getPricingMatrixData, arguments);

		};
		service.getproductoptiongroupsData = function getproductoptiongroupsData() {
			return invokeRemoteAction(RemoteActions.getproductoptiongroupsData, arguments);

		};
		service.getPAVFieldMetaData = function getPAVFieldMetaData() {
			return invokeRemoteAction(RemoteActions.getPAVFieldMetaData, arguments);
		
		};
		service.getProductAttributeConfigData = function getProductAttributeConfigData() {
			return invokeRemoteAction(RemoteActions.getProductAttributeConfigData, arguments);

		};
		service.getProductAttributeValueData = function getProductAttributeValueData(){
			return invokeRemoteAction(RemoteActions.getProductAttributeValueData, arguments);
		
		};
		service.saveQuoteConfig = function saveQuoteConfig() {
			return invokeRemoteAction(RemoteActions.saveQuoteConfig, arguments);

		};
		service.getProducts = function getProducts() {
			return invokeRemoteAction(RemoteActions.getProducts, arguments);
		
		};
		
		
		//Expose general-purpose method
		service.invokeRemoteAction = invokeRemoteAction;
		/**
		* Helper for calling visualforce remoting. May want to pull this out into another service,
		* or a method on the RemoteActions constant object.
		*  
		* @param 
		{string} actionName the remote action to invoke
		* @param 
		{array} actionParams
		any number of parameters to pass to remote
		*          
		action before callback 
		* @return {promise} a $q promise that resolves with result of remote action
		*
		* Example: 
		* 
		<code>
		* 
		var thenable = invokeRemoteAction(RemoteActions.getCartLineItems, [cartRequest]);
		* 
		</code>
		* Here, thenable will be a promise that gets resolved with the result of the remote action 
		*/
		function invokeRemoteAction(actionName, actionParams) {
			//Constuct deferred object for return
			$log.log('invokeRemoteAction for: '+actionName);
			var deferred, errorMessage, remoteActionWithParams, resolver, remotingParams;
			deferred = $q.defer();
			if (!actionName || typeof actionName !== 'string') {
				errorMessage = "Error - Could not invoke remote action: action name invalid!";
				$log.error(errorMessage);
				deferred.reject(errorMessage);
				return deferred.promise;

			}

			//Construct list with aciton name and parameters to pass to invokeAction
			remoteActionWithParams = [actionName];
			for (var argIndex = 0, nextArg; argIndex < actionParams.length; argIndex++) {
				nextArg = actionParams[argIndex];
				if (nextArg == undefined) {
					errorMessage = "Error - Could not construt remote action parameters. Parameter #" + argIndex +" is undefined!";
					$log.error(errorMessage);
					deferred.reject(errorMessage);
					return deferred.promise;

				}
				remoteActionWithParams.push(nextArg);

			}
			//Add the resolve function and remoting params to argument array
			resolver = function resolveRemoteAction(result, event) {
				if (event.status) {
					deferred.resolve(result);
				} else {
					$log.error(event.message);
					deferred.reject(event.message);

				}
			};
			remoteActionWithParams.push(resolver);

			//Add the default parameters for remoting call
			remotingParams = {
				"buffer": false, 
				"escape": true, 
				"timeout": 30000
			};
			remoteActionWithParams.push(remotingParams);

			//Try to call visualforce remoting invokeAction with the parameters we built 
			try {
				Visualforce.remoting.Manager.invokeAction.apply(Visualforce.remoting.Manager, remoteActionWithParams);

			} catch(ex) {
				errorMessage = 'Error - Could not invoke remote action: ' + actionName; 
				$log.error(errorMessage, actionParams, ex);
				deferred.reject(errorMessage);
			}
			return deferred.promise;

		}
	}
})();