(function() {
    angular.module('APTPS_ngCPQ').service('BaseService', BaseService); 
    BaseService.$inject = ['$log','ngProgress'];
    function BaseService($log, ngProgress) {
    	var service = this;
        var pageloadComplete = false;
        var ProgressBartinprogress = false;
    	var isLocationLoadComplete = false;
        var isPricingMatrixLoadComplete = false;
        var isOptionGroupLoadComplete = false;
        var isPAVObjConfigLoadComplete = false;
        var isPAConfigLoadComplete = false;
        var isPAVLoadComplete = false;

    	service.startprogress = startprogress;
    	service.completeprogress = completeprogress;
        service.getProgressBartinprogress = getProgressBartinprogress;

        service.setLocationLoadComplete = function(){
            service.isLocationLoadComplete = true;
            completeprogress();
        }
        service.setPricingMatrixLoadComplete = function(){
            service.isPricingMatrixLoadComplete = true;
            completeprogress();
        }
        service.setOptionGroupLoadComplete = function(){
            service.isOptionGroupLoadComplete = true;
            completeprogress();
        }
        service.setPAVObjConfigLoadComplete = function(){
            service.isPAVObjConfigLoadComplete = true;
            completeprogress();
        }
        service.setPAConfigLoadComplete = function(){
            service.isPAConfigLoadComplete = true;
            completeprogress();
        }
        service.setPAVLoadComplete = function(){
            service.isPAVLoadComplete = true;
            completeprogress();
        }

        service.getLocationLoadComplete = function(){
            return isLocationLoadComplete;
        }
        service.getPricingMatrixLoadComplete = function(){
            return isPricingMatrixLoadComplete;
        }
        service.getOptionGroupLoadComplete = function(){
            return isOptionGroupLoadComplete;
        }
        service.getPAVObjConfigLoadComplete = function(){
            return isPAVObjConfigLoadComplete;
        }
        service.getPAConfigLoadComplete = function(){
            return isPAConfigLoadComplete;
        }
        service.getPAVLoadComplete = function(){
            return isPAVLoadComplete;
        }

    	function init(){
            // set the color and height for status bar.
            ngProgress.color('#5c8427');
            ngProgress.height('4px');
        }
        
        // start the page level progress bar.
        function startprogress(){
            if(service.ProgressBartinprogress == false)
            {
                $log.log('inside startprogress');
                service.ProgressBartinprogress = true;
                ngProgress.reset();// reset the progress bar if not completed by previous methids.
                ngProgress.start(); // start progress.
            }
        }
        
        // complete the page level progress bar.
        function completeprogress(){
            // complete progress only after all loads are complete.
            if(service.isLocationLoadComplete
                && service.isPricingMatrixLoadComplete
                && service.isOptionGroupLoadComplete
                && service.isPAVObjConfigLoadComplete
                && service.isPAConfigLoadComplete
                && service.isPAVLoadComplete)
            {
                $log.log('inside completeprogress');
                ngProgress.complete();
                service.ProgressBartinprogress = false;
            }
        }

        function getProgressBartinprogress(){
            return service.ProgressBartinprogress;
        }

        init();
    }
})();