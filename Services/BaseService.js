(function() {
    angular.module('APTPS_ngCPQ').service('BaseService', BaseService); 
    BaseService.$inject = ['$log','ngProgress'];
    function BaseService($log, ngProgress) {
    	var service = this;
    	
    	service.startprogress = startprogress;
    	service.completeprogress = completeprogress;

    	function init(){
            // set the color and height for status bar.
            ngProgress.color('#5c8427');
            ngProgress.height('4px');
        }
        
        // start the page level progress bar.
        function startprogress(){
            $log.log('inside startprogress');
            ngProgress.reset();// reset the progress bar if not completed by previous methids.
            ngProgress.start(); // start progress.
        }
        
        // complete the page level progress bar.
        function completeprogress(){
            $log.log('inside startprogress');
            ngProgress.complete();
        }

        init();
    }
})();