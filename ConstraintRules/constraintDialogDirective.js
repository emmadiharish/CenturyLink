/**
 * Directive: constraintDialog
 * 	used to display constraint rule prompt
 */
;(function() {
	'use strict';
	angular.module('APTPS_ngCPQ').directive('constraintDialog', ConstraintDialog);

	ConstraintDialog.$inject = ['SystemConstants'];

	ConstraintDialogCtrl.$inject = [
	                           '$log',                            
	                           '$scope',
	                           'ConstraintRuleDataService',
	                           'ProductDataService',
	                           'SaveConfigService'
	                           ];

	
	/**
	 * Modal Dialog Directive
	 */	
	function ConstraintDialog(SystemConstants) {
		return {
			restrict: 'AE',
			controller: ConstraintDialogCtrl,
			controllerAs: 'ctrl',
			bindToController: true,
			templateUrl: SystemConstants.baseUrl + "/Templates/constraint-dialog.html"
		};

	}

	/**
	 * Constraint Dialog controller
	 */ 
	function ConstraintDialogCtrl($log, $scope, ConstraintRuleDataService, ProductDataService, SaveConfigService) {
		var nsPrefix = 'Apttus_Config2__';
		var ctrl = this;
		ctrl.visible = false;
		ctrl.selectedProducts = [];
		ctrl.promptItems = [];
		ctrl.addedItems = {};
		// ctrl.promptMessage;

		ctrl.close = function() {
			ctrl.visible = false;
			ctrl.promptItems.length = 0;
			ctrl.selectedProducts.length = 0;			
			ctrl.addedItems = {};
			ctrl.activePrompt = ConstraintRuleDataService.getNextPrompt();
			if (angular.isDefined(ctrl.activePrompt)) {
				ctrl.visible = true;
			}
			return ctrl.activePrompt;
		};

		/** Perform rule action based on action type */
		ctrl.performRuleAction = function() {
			var actionType = ctrl.activePrompt['ConstraintRuleActionId']['ActionType'];
			if (actionType === ConstraintRuleDataService.ACTIONTYPE_INCLUDE) {
				ctrl.addSelectedProducts();

			} else if (actionType === ConstraintRuleDataService.ACTIONTYPE_EXCLUDE) {
				ctrl.removeSelectedProducts();

			}

		}; 

		ctrl.addSelectedProducts = function() {
			var targetBundleNumber = ctrl.activePrompt['TargetBundleNumber'];
			if (!targetBundleNumber) { //add as primary line
				SaveConfigService.addToCart(angular.copy(ctrl.selectedProducts));
				
			} else { //add to bundle
				SaveConfigService.addToBundle(targetBundleNumber, ctrl.selectedProducts);
				
			}
			
			/*if (ctrl.minSelected()) {
				ConstraintRuleDataService.markAsProcessed(ctrl.activePrompt);

			}*/
			//TODO: keep it open until min-required is met, refresh the dialog content
			ctrl.close();
			
		};

		ctrl.removeSelectedProducts = function() {
			var targetBundleNumber = ctrl.activePrompt['TargetBundleNumber'];
			if (!targetBundleNumber) {
				//Find affected primary lines with matching products and remove them.
				var selectedProductIds = {};
				_.forEach(ctrl.selectedProducts, function(product) {
					selectedProductIds[product.Id] = true;
				});

				var affectedPrimaryNumbers = ctrl.activePrompt['AffectedPrimaryNumbers'].split(/,\W*/);
				CartDataService.getLineItems(affectedPrimaryNumbers).then(function(result) {
					//Filter to find only lines with matching products
					lineItemsToDelete = _.filter(result, function(nextLineItem) {
						return selectedProductIds[nextLineItem.productId()];

					});
					SaveConfigService.removeFromCart(lineItemsToDelete);
					
				});	

			} else {
				//Handle remove of options from bundle
				SaveConfigService.removeFromBundle(targetBundleNumber, ctrl.selectedProducts);
				
			}

			/*if (ctrl.minSelected()) {
				ConstraintRuleDataService.markAsProcessed(ctrl.activePrompt);

			}*/
			//TODO: keep it open until min-required is met, refresh the dialog content
			ctrl.close();

		};

		ctrl.ignoreRuleAction = function() {
			ConstraintRuleDataService.ignoreRuleAction(ctrl.activePrompt);
			ctrl.close();
		};

		ctrl.open = function() {
			ctrl.visible = true;
			return ctrl.visible;
		};

		ctrl.prompt = function() {
			ctrl.addedItems = {};
			//ctrl.selectedProducts.length = 0;
			ctrl.activePrompt = ConstraintRuleDataService.getNextPrompt();
			return ctrl.activePrompt;
		};

		ctrl.minSelected = function() {
			if (ctrl.activePrompt) {
				return ctrl.selectedProducts.length >= ctrl.activePrompt[nsPrefix + 'RequiredMin__c'];

			} else {
				return false;

			}

		};

		ctrl.selectProduct = function(product) {
			if (_.includes(ctrl.selectedProducts, product)) {
				return _.pull(ctrl.selectedProducts, product);

			} else {
				return ctrl.selectedProducts.push(product);

			}
		};

		function dialogWatchExpression() {
			return ctrl.prompt();

		}

		function dialogWatchListener(newValue, oldValue) {
			if (newValue) {
				var activePrompt = ctrl.prompt();
				if (activePrompt == null) {
					return ctrl.close();

				}
				ctrl.promptMessage = activePrompt['Message'];
				var actionType = activePrompt['ConstraintRuleActionId']['ActionType'];
				var promptProductIds = [];
				
				if (actionType == ConstraintRuleDataService.ACTIONTYPE_INCLUDE) {
					//Inclusion type rules
					var suggestedIdString = activePrompt['SuggestedProductIds'];
					var suggestedProductIds = suggestedIdString != null ? suggestedIdString.split(/,\W*/) : [];
					promptProductIds = suggestedProductIds;
					
					var affectedIdString = activePrompt['AffectedProductIds'];
					if (affectedIdString != null) {
						var affectedProductIds = affectedIdString.split(/,\W*/);
						promptProductIds = _.difference(suggestedProductIds, affectedProductIds);

					}
					if (activePrompt['TargetBundleNumber']) {
						ctrl.ruleActionLabel = 'Add To Bundle';
					
					} else {
						ctrl.ruleActionLabel = 'Add To Cart';	

					}
					
				} else if (actionType == ConstraintRuleDataService.ACTIONTYPE_EXCLUDE) {
					//Exclusion type rules
					var actionIdString = activePrompt[nsPrefix + 'ActionProductIds__c'];
					var actionProductIds = actionIdString != null ? actionIdString.split(/,\W*/) : [];
					promptProductIds = actionProductIds;

					if (activePrompt['TargetBundleNumber']) {
						ctrl.ruleActionLabel = 'Remove Option';
					
					} else {
						ctrl.ruleActionLabel = 'Remove From Cart';	
						
					}
				
				}
				
				return ProductDataService.getProducts(promptProductIds).then(function(resp) {
					angular.forEach(resp.products, function(value, key){
						//TODO: check why we get a number, also make sure we only get array not array of array
						if (angular.isObject(value)) { 
							if (angular.isArray(value)) {
								angular.forEach(value, function(value2, key2){
									if (ctrl.addedItems[value2.Id] !== true) {
										ctrl.promptItems.push(value2);
										ctrl.addedItems[value2.Id] = true;
									}	
								});
							} else {
								if (ctrl.addedItems[value.Id] !== true) {
									ctrl.promptItems.push(value);
									ctrl.addedItems[value.Id] = true;
								}
							}
						}

					});
					return ctrl.open();

				});
			} else {
				return ctrl.close();

			}

		}

		$scope.$watch(dialogWatchExpression, dialogWatchListener);

		return ctrl;

	}

}).call(this);