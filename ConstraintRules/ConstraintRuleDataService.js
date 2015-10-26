(function() {
    angular.module('APTPS_ngCPQ').service('ConstraintRuleDataService', ConstraintRuleDataService); 
    ConstraintRuleDataService.$inject = [];
    function ConstraintRuleDataService(){
        var service = this;

        var recommendedproductsMap = {};
        var linesWithMessage = {};
        var ruleTypes = ['Error', 'Warning', 'Info'];
        var processedIds = {};

        //targetBundleNumder to message map
        var messages = {
                
        };

        var messageTemplate = {
                page: {
                    error: [],
                    warning: [],
                    info: []
                },
                prompt: []
        };

        var actionRulesMapTemplate = {
            Error:[],
            Warning:[],
            Info:[]
        }

        // Constant action types
        service.ACTIONTYPE_INCLUDE = 'Inclusion';
        service.ACTIONTYPE_EXCLUDE = 'Exclusion';
        service.ACTIONTYPE_RECOMMEND = 'Recommendation';
        service.ACTIONTYPE_VALIDATE = 'Validation';
        service.ACTIONTYPE_REPLACE = 'Replacement';

        service.getrecommendedproductsMap = getrecommendedproductsMap;
        service.setrecommendedproductsMap = setrecommendedproductsMap;
        service.omitrecommendedproduct = omitrecommendedproduct;

        function getrecommendedproductsMap(){
            return recommendedproductsMap;
        }

        function setrecommendedproductsMap(productIds){
            recommendedproductsMap = productIds;
        }

        function omitrecommendedproduct(productId){
            recommendedproductsMap = _.omit(recommendedproductsMap, productId);
        }

        /**
         * @return 0 or context bundles primary line number
         */ 
        service.getContextBundleNumber = function() {
            return BaseConfigService.lineItem.primaryLineNumber;
        }

        /**
         * @return {Object} message structure
         */
        service.getMessages = function() {
            var contextBundleNumber = service.getContextBundleNumber();
            if (angular.isUndefined(messages[contextBundleNumber])) {
                messages[contextBundleNumber] = angular.copy(messageTemplate);
            }
            return messages[contextBundleNumber];

        };

        /**
         * returns all prompts with target bundle number as zero. 
         * used in options page to display primary prompt in addition to its own prompts
         */
        var getPrimaryPrompts = function() {
            var contextBundleNumber = 0;
            if (angular.isUndefined(messages[contextBundleNumber])) {
                messages[contextBundleNumber] = angular.copy(messageTemplate);
            }
            return messages[contextBundleNumber].prompt;

        };

        /**
         * returns next active prompt
         */
        service.getNextPrompt = function(){
            //display all primary prompts in all pages
            var primaryPrompts = getPrimaryPrompts();
            var activePrompt;
            var i, prompt;
            for (i = 0; i < primaryPrompts.length; i++) {
                prompt = primaryPrompts[i];
                if (processedIds[prompt.Id] !== true && prompt['Apttus_Config2__Ignored__c'] !== true) {
                    activePrompt = primaryPrompts[i];
                    break;
                }
            }
            if (angular.isUndefined(activePrompt)) {
                var optionPrompts = service.getMessages().prompt;
                for (i = 0; i < optionPrompts.length; i++) {
                    prompt = optionPrompts[i];
                    if (processedIds[prompt.Id] !== true && prompt['Apttus_Config2__Ignored__c'] !== true) {
                        activePrompt = optionPrompts[i];
                        break;
                    }
                }
                
            }
            return activePrompt;
            
        };

        /**
         * @return [Object] list of warnings 
         */
        service.getCommonErrorLines = function() {
            var contextBundleNumber = service.getContextBundleNumber();
            var errorLines = [];
            angular.forEach(linesWithMessage, function(value, key){
                if(value === 'error') {
                    if (key != contextBundleNumber) {
                        errorLines.push(key);
                    }
                }
                
            });
            return errorLines;
            
        };

        /**
         * Insert new rule actions into stored actions.
         * Currently just overwrites, maybe should merge?
         * 
         * @param  {Object} newActions Actions structure
         * @return {Object}            Reference to rule actions 
         */
        service.updateRuleActions = function(newActions) {
            //cleanup all messages
            messages = {};
            messages[0] = angular.copy(messageTemplate);
            linesWithMessage = {};
            
            var ruleTypetoActionsMap = angular.copy(actionRulesMapTemplate);
            _.each(newActions, function(Action){
                ruleTypetoActionsMap[Action.MessageType] = Action;
            })

            //do nothing if there are no messages.
            if (!newActions) {
                return;

            }
            // messages.prompt = [];
            _.each(ruleTypes, function (ruleType) {
                var ruleActions = ruleTypetoActionsMap[ruleType];
                _.each(ruleActions, function (ruleAction) {
                    var targetBundleNumber = ruleAction['Apttus_Config2__TargetBundleNumber__c'];//TODO: set as zero for null
                    linesWithMessage[targetBundleNumber] = ruleType;
                    
                    if (angular.isUndefined(messages[targetBundleNumber])) {
                        messages[targetBundleNumber] = angular.copy(messageTemplate);
                    }
                    var targetMessages = messages[targetBundleNumber];
                    
                    if (ruleAction['Apttus_Config2__IsPrompt__c'] && !ruleAction['Apttus_Config2__Ignored__c']) {
                        targetMessages.prompt.push(ruleAction);
                        
                    } else {
                        targetMessages.page[ruleType].push(ruleAction);
                        
                    }
                    
                });

            });

            $log.debug('Updated constraint rule messages: ', messages);
            return messages;

        };

        /**
         * flag as processed. TODO: handle min-required
         */
        service.markAsProcessed = function(activePrompt) {
            processedIds[activePrompt.Id] = true;
            
        };

        /**
         * @param [RuleAction] activePrompt
         * @return {[type]} [description]
         */
        service.ignoreRuleAction = function(activePrompt) {
            var ruleActionId = activePrompt.Id;
            processedIds[activePrompt.Id] = true;
            activePrompt['Apttus_Config2__Ignored__c'] = true;
            
            ConfigurationDataService.createCartRequestDO().then(function(cartRequest) {
                cartRequest.ruleActionId = ruleActionId;
                RemoteService.ignoreRuleAction(cartRequest).then(function(result) {
                    service.updateRuleActions(result.ruleActions);              
                });
            });
            
        }
    }
})();