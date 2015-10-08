/**
 * Directive: PageMessagesDirective 
 */
;(function() {
            'use strict';

            function MessageController($scope, MessageService) {
                
                function init(){
                    $scope.messages = MessageService.messages;
                };

                $scope.closeMsg = function(index) {
                    //$scope.messages[index].remove();
                    MessageService.removeMessage(index);
                };

                $scope.closeAlert = function(index) {
                    MessageService.removeMessage(index);
                };

                init();
            };

            MessageController.$inject = ['$scope', 'MessageService'];

            angular.module('APTPS_ngCPQ').directive('pageMessages', PageMessages);

            PageMessages.$inject = ['SystemConstants'];
            function PageMessages(SystemConstants){
                // Runs during compile
                return {
                    // name: '',
                    // priority: 1,
                    // terminal: true,
                    scope: {}, // {} = isolate, true = child, false/undefined = no change
                    controller: MessageController,
                    // controllerAs: 'msgCtrl',
                    // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
                    restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
                    //template: '<div>pageHeader</div>',
                    templateUrl: SystemConstants.baseUrl + "/Templates/MessagesView.html",
                    // replace: true,
                    // transclude: true,
                    // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
                    //link: function($scope, iElm, iAttrs, controller) {
                    //}
                    bindToController: true
                };
            }
        }).call(this);