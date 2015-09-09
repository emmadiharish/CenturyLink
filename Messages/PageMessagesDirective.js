/**
 * Directive: PageMessagesDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('pageMessages', PageMessages);

	PageMessageCtrl.$inject = ['$scope', '$log', 'MessageService'];
	
	function PageMessageCtrl($scope, $log, MessageService){
		var messageCtrl = this;
		messageCtrl.messages = [];
		
		messageCtrl.msgService = MessageService;

		messageCtrl.closeMsg = function(index) {
	        $scope.messages[index].remove();
	    };

	    $scope.$watch('messageCtrl.msgService.getMessages()', function(newVal) {
            if(newVal)
            {
                messageCtrl.messages = newVal;
            }    
        });

		messageCtrl.closeAlert = function(index) {
			messageCtrl.msgService.removeMessage(index);
	  	};

		function init(){
    		
        }
    	
        init();

        return messageCtrl;
	}

	PageMessages.$inject = ['SystemConstants'];
	function PageMessages(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: PageMessageCtrl,
			controllerAs: 'PageMessages',
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