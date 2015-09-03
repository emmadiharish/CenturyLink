(function() {
	angular.module('APTPS_ngCPQ').service('OptionGroupDataService', OptionGroupDataService); 
	OptionGroupDataService.$inject = ['$q', '$log', 'BaseService', 'QuoteDataService', 'RemoteService', 'MessageService', 'OptionGroupCache'];
	function OptionGroupDataService($q, $log, BaseService, QuoteDataService, RemoteService, MessageService, OptionGroupCache) {
		var service = this;

		service.quoteService = QuoteDataService;
		service.Selectedoptionproduct = {};
		service.currentproductoptiongroups = {};
		service.rerenderHierarchy = false;
		service.slectedOptionGroupProdId;

		// option group methods.
		service.getallOptionGroups = getallOptionGroups;
		service.getOptionGroup = getOptionGroup;
		service.runConstraintRules = runConstraintRules;
		service.getSelectedoptionproduct = getSelectedoptionproduct;
		service.setSelectedoptionproduct = setSelectedoptionproduct;
		service.getcurrentproductoptiongroups = getcurrentproductoptiongroups;
		service.getrerenderHierarchy = getrerenderHierarchy;
		service.setrerenderHierarchy = setrerenderHierarchy;
		service.getslectedOptionGroupProdId = getslectedOptionGroupProdId;
		service.setslectedOptionGroupProdId = setslectedOptionGroupProdId;
		
		function getallOptionGroups(){
			return OptionGroupCache.getOptionGroups();
		}

		function getOptionGroups(productIds) {
			// check if cachedOptionGroups has products requested for else make a remote call.
			var cachedOptionGroups = OptionGroupCache.getOptionGroups();
			var prodIds_filtered = _.filter(productIds, function(Id){ return !cachedOptionGroups.hasOwnProperty(Id); });
			if (OptionGroupCache.isValid
				&& prodIds_filtered.length < 1) {
				// logTransaction(cachedOptionGroups);
				return $q.when(cachedOptionGroups);
			}

			// locationRequest = createOptionGroupRequestDO(prodIds_filtered, QuoteDataService.getcartId(), QuoteDataService.getcontextLineNumber());
			var requestPromise = RemoteService.getproductoptiongroupsData(prodIds_filtered, QuoteDataService.getcartId(), QuoteDataService.getcontextLineNumber());
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				OptionGroupCache.initializeOptionGroups(response);
				// run constraint rules on each load of OptionGroups.
				// runConstraintRules should be refacotored lated to apply constraint rules only once.
				return runConstraintRules().then(function(constraintsResult){
                	BaseService.setOptionGroupLoadComplete();    
                    return OptionGroupCache.getOptionGroups();
                })
				// logTransaction(response, categoryRequest);
				// return OptionGroupCache.getOptionGroups();
			});
		}

		function getOptionGroup(productId) {
			var cachedOptionGroups = OptionGroupCache.getOptionGroups();
			if (OptionGroupCache.isValid
				&& _.has(cachedOptionGroups, productId)){
				setcurrentproductoptiongroups(cachedOptionGroups[productId]);
				return $q.when(true);
			}

			var bundleproductIds = [];
            if(!_.isEmpty(service.currentproductoptiongroups))
            {
                bundleproductIds = getAllBundleProductsinCurrentOptiongroups(service.currentproductoptiongroups, 'productOptionComponents', 'hasOptions', 'productId');
            }else{
                bundleproductIds.push(productId);
            }
			
			return getOptionGroups(bundleproductIds).then(function(response){
				var optionGroups = response;
				setcurrentproductoptiongroups(optionGroups[productId]);
				return true;
			}); 
		}

		function getSelectedoptionproduct() {
			return service.Selectedoptionproduct;
		}

		function setSelectedoptionproduct(optionComponent) {
			service.Selectedoptionproduct = {'productId':optionComponent.productId, 'productName': optionComponent.productName};
		}

        function getcurrentproductoptiongroups(){
        	return service.currentproductoptiongroups;
        }

        function setcurrentproductoptiongroups(result){
        	service.currentproductoptiongroups = result;
        }

        // util method. a: option groups, b: field name to access product components, c:field to identify if product is bundle or not, d: field name to access product Id within product component.
        function getAllBundleProductsinCurrentOptiongroups(a, b, c, d){
            // return a list of bundle product Id's. based on flag provided.
            var res = [];
            _.each(a, function (g) {
                res.push.apply(res, _.pluck(_.filter(g[b], function(h){
                    return h[c];
                }), d));
            });
            return res;
        }

        function getrerenderHierarchy(){
        	return service.rerenderHierarchy;
        }

        function setrerenderHierarchy(val){
        	service.rerenderHierarchy = val;
        }

        function getslectedOptionGroupProdId(){
        	return service.slectedOptionGroupProdId;
        }

        function setslectedOptionGroupProdId(val){
        	service.slectedOptionGroupProdId = val;
        }

        function runConstraintRules(){
            // remote call to save Quote Config.
            var deferred = $q.defer();
            var cartId = service.quoteService.getcartId();
            var lineNumber = service.quoteService.getcontextLineNumber();
            requestPromise = RemoteService.runConstraintRules(cartId, lineNumber);
            requestPromise.then(function(result){
                /*appliedActionDOList is a List<Apttus_CPQApi.CPQ.AppliedActionDO>.
                IsPending                       :  Indicates Whether the rule action is pending user action.
                ########################Message Related##########################
                TriggeringProductIds (List<Id>) :  The list of triggering product ids that are in the cart.

                MessageType  (String)           :  Indicates whether the message is of warning type or error 
                                                   type.(Error/Warning/Info)
                Message     (String)            :  This is the message to be displayed when the rule action is
                                                   in pending state.
                IsShowPrompt                    :  This shows the message as a prompt. If the user cancels
                                                   the prompt instead of taking action, marks the rule as
                                                   ignored.
                ########################Auto inclusion/auto exclusion related########################
                IsAutoExecuted                  :  Indicates whether inclusion was performed by the system.
                                                   if true, dont worry - Ignore - products will be auto-included.
                                                   if false, process the rule and include SuggestedProductIds.
                ActionType  (String)            :  This is the type of rule action.(Inclusion/Exclusion/Validation/Recommendation/Replacement)
                ActionIntent                    :  Picklist on Constraint rule action. action intent depends on action type and SuggestedProductIds.
                                                   This is the intent of the rule action whether to auto include or disable selection and so on.(Auto Include/Prompt/Show Message/Check on Finalization/Disable Selection)
                SuggestedProductIds (List<Id>)  :  The list of product ids suggested by the rule action to be
                                                   included or excluded.
                AffectedProductIds (List<Id>)   :  list of products being included/excluded by auto-executed = true;
                                                   The list of product ids added by auto inclusion or flagged
                                                   by exclusion.
                */
                var constraintActionDoList = result.appliedActionDOList;
                var numRulesApplied = 0; //constraintActionDoList.length;
                MessageService.clearAll();
                var allOptionGroups = getallOptionGroups();
                var productIdtoActionDOMap = {};
                
                _.each(constraintActionDoList, function(ActionDo){
                    // get all error messages and add to MessageService.
                    var TriggeringProductIds = ActionDo.TriggeringProductIds;
                    var Message = ActionDo.Message;
                    // possible message types : danger, warning, info, success.
                    var MessageType = ActionDo.MessageType == 'Error' ? 'danger' : ActionDo.MessageType;
                    var ActionType = ActionDo.ActionType;
                    var ActionIntent = ActionDo.ActionIntent;
                    var SuggestedProductIds = ActionDo.SuggestedProductIds;
                    _.each(SuggestedProductIds, function(productId){
                        productIdtoActionDOMap[productId] = {'ActionType': ActionType, 'ActionIntent': ActionIntent, 'Message':Message, 'MessageType':MessageType};
                    })
                })

                // exclude or include products according to productIdtoActionDOMap.
                _.each(allOptionGroups, function(optiongroups, bundleprodId){
                    _.each(optiongroups, function(optiongroup){
                        _.each(optiongroup.productOptionComponents, function(productcomponent){
                            // Enable all previously disabled options.
                            if(_.has(productcomponent, 'isDisabled')
                                && productcomponent['isDisabled'] == true)
                            {
                                productcomponent['isDisabled'] = false;
                            }
                            var productId = productcomponent.productId;
                            if(_.has(productIdtoActionDOMap, productId))
                            {
                                var ActionDO = productIdtoActionDOMap[productId];
                                var ActionType = ActionDO.ActionType;
                                var ActionIntent = ActionDO.ActionIntent;
                                var Message = ActionDO.Message;
                                var MessageType = ActionDO.MessageType
                                // possible values : Auto Include/Prompt/Show Message/Check on Finalization/Disable Selection
                                switch(ActionIntent)
                                {
                                    case 'Auto Include':
                                        if(ActionType == 'Inclusion')
                                        {
                                            // apply only if option is not selected.
                                            if(!isProdSelected(productcomponent, optiongroup))
                                            {    
                                                productcomponent.isselected = true;
                                                numRulesApplied++;
                                            }
                                        }
                                        break;
                                    case 'Prompt':
                                        break;
                                    case 'Show Message':
                                        if(ActionType == 'Inclusion'
                                            || ActionType == 'Exclusion'
                                            || ActionType == 'Validation'
                                            || ActionType == 'Recommendation'
                                            || ActionType == 'Replacement')
                                        {
                                            MessageService.addMessage(MessageType, Message);
                                            numRulesApplied++;
                                        }
                                        break;
                                    case 'Check on Finalization':
                                        break;
                                    case 'Disable Selection':
                                        if(ActionType == 'Exclusion')
                                        {
                                            // apply rule only if option is selected.
                                            if(isProdSelected(productcomponent, optiongroup))
                                            {
                                                // MessageService.addMessage(MessageType, Message);
                                                numRulesApplied++;
                                                
                                                // if disabled product is selected as radio then remove it.
                                                if(optiongroup.ischeckbox == false)
                                                {
                                                   optiongroup.selectedproduct = null;
                                                }
                                                else{
                                                    // if disabled product is selected as checkbox then remove it.
                                                    productcomponent.isselected = false;
                                                }
                                            }
                                            productcomponent['isDisabled'] = true;
                                        }
                                        break;
                                };
                            }
                        })
                    })
                })
                
                res = {isSuccess:true, numRulesApplied:numRulesApplied};
                deferred.resolve(res);
            })// end of runConstraintRules remote call.
            return deferred.promise;
        }

        function isProdSelected(productcomponent, optiongroup){
            if((productcomponent.isselected && optiongroup.ischeckbox)
                || (productcomponent.productId == optiongroup.selectedproduct && !optiongroup.ischeckbox))
            return true;
            return false;
        }
	}
})();
