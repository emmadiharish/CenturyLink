/**
 * Directive: MiniCartDirective 
 */
;(function() {
	'use strict';

	function MiniCartController($scope, $window, $dialogs, SystemConstants, BaseService, MiniCartDataService)
    {
        var miniCtrl = this;

        function init(){
             
            // Initialize  Variables
            miniCtrl.reverse = false;                
            miniCtrl.itemsPerPage = 5;
            miniCtrl.pagedItems = [];
            miniCtrl.currentPage = 0;
            
            miniCtrl.baseUrl = SystemConstants.baseUrl;
            miniCtrl.lineCount = 0;
            
            // Group by pages
            miniCtrl.groupToPages();
        }

        // Calculate Total Number of Pages based on Records Queried 
        miniCtrl.groupToPages = function () {
            miniCtrl.currentPage = 0;
            MiniCartDataService.getMiniCartLines().then(function(result) {
                miniCtrl.items = result;        
                miniCtrl.lineCount = miniCtrl.items.length;
                miniCtrl.pagedItems = [];
                for (var i = 0; i < miniCtrl.items.length; i++) {
                    if (i % miniCtrl.itemsPerPage === 0) {
                        miniCtrl.pagedItems[Math.floor(i / miniCtrl.itemsPerPage)] = [miniCtrl.items[i]];
                    } else {
                        miniCtrl.pagedItems[Math.floor(i / miniCtrl.itemsPerPage)].push(miniCtrl.items[i]);
                    }
                }
            })
        };
            
        miniCtrl.firstPage = function () {
            miniCtrl.currentPage = 0;
        };
        
        miniCtrl.lastPage = function () {
            miniCtrl.currentPage = miniCtrl.pagedItems.length-1;
        };
        
        miniCtrl.prevPage = function () {
            if (miniCtrl.currentPage > 0) {
                miniCtrl.currentPage--;
            }
        };
        
        miniCtrl.nextPage = function () {
            if (miniCtrl.currentPage < miniCtrl.pagedItems.length - 1) {
                miniCtrl.currentPage++;
            }
        };
        
        miniCtrl.setPage = function () {
            miniCtrl.currentPage = this.n;
        };
        
        miniCtrl.invokeDoConfigure = function(lineItemId){
            MiniCartDataService.configureLineItem(lineItemId).then(function(result){
                // redirect the page to config URL.
                var configUrl = parsePagereference(result);
                if(!_.isNull(configUrl))
                    $window.location.href = configUrl;
            })
        };

        miniCtrl.deleteLineItemFromCart = function(lineNumber_tobedeleted){
            BaseService.startprogress();// start page level progress bar. 
            MiniCartDataService.deleteLineItemFromCart(lineNumber_tobedeleted).then(function(result){
                var retUrl = parsePagereference(result);
                if(!_.isNull(retUrl))
                    $window.location.href = retUrl;
                // mark minicart as dirty and reload minicart.
                MiniCartDataService.setMinicartasDirty();
                miniCtrl.groupToPages();
                BaseService.completeprogress();// stop page level progress bar.
            })
        };
        
        miniCtrl.launch = function(which, productName, lineNumber){
            var dlg = null;
            switch(which){
                // Delete Line Item Confirm Dialog
                case 'confirmRemoveLine':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to Delete "'+productName+ '" from cart ?');
                    dlg.result.then(function(btn){
                        miniCtrl.deleteLineItemFromCart(lineNumber);
                    },function(btn){
                        
                });
                break;
            }; // end switch
        }; // end launch

        function parsePagereference(pgReference){
            var res = null;
            if(!_.isNull(pgReference)
                && !_.isEmpty(pgReference))
                res = _.unescape(pgReference);
            return res;
        };

        init();
    };
    MiniCartController.$inject = ['$scope', 
    								'$window', 
    								'$dialogs', 
    								'SystemConstants', 
    								'BaseService', 
    								'MiniCartDataService'];

	angular.module('APTPS_ngCPQ').directive('miniCart', MiniCart);

	MiniCart.$inject = ['SystemConstants'];
	function MiniCart(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: MiniCartController,
			controllerAs: 'Ctrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/MiniCartView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function(cartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);