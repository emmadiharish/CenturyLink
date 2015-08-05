(function() {
    angular.module('APTPS_ngCPQ').service('MessageService', MessageService); 
    MessageService.$inject = ['$log'];
    function MessageService($log) {
        var service = this;
        service.messages = [];

        service.getMessages = getMessages;
        service.addMessage = addMessage;
        service.removeMessage = removeMessage;

        function getMessages(){
            return service.messages;
        }
        function addMessage(type, msg){
            service.messages.push({'type':type, 'text':msg});
        }

        function removeMessage(index)
        {
            service.messages.splice(index, 1);
        }
    }
})();