/**
 * Directive: MiniCartDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('miniCart', MiniCart);

	MiniCartCtrl.$inject = ['$window', '$dialogs', 'SystemConstants', 'QuoteDataService', 'BaseService', 'MiniCartDataService'];
	
	function MiniCartCtrl($window, $dialogs, SystemConstants, QuoteDataService, BaseService, MiniCartDataService){
		var miniCartCtrl = this;
		miniCartCtrl.reverse = false;                
        miniCartCtrl.itemsPerPage = 5;
        miniCartCtrl.pagedItems = [];
        miniCartCtrl.currentPage = 0;
        miniCartCtrl.lineCount = 0;

		function init(){
            // Initialize Scope Variables
            miniCartCtrl.miniCartService = MiniCartDataService;
            miniCartCtrl.quoteService = QuoteDataService;
            miniCartCtrl.baseService = BaseService;
            
            miniCartCtrl.miniCartTemplateURL = SystemConstants.baseUrl+'/Templates/MiniCartView.html';
            miniCartCtrl.paginationLinksTemplateURL = SystemConstants.baseUrl+'/Templates/PaginationLinksView.html';
            miniCartCtrl.imagesbaseURL = SystemConstants.baseUrl+'/Images';
            
            // Group by pages
            groupToPages();
        }

        // Calculate Total Number of Pages based on Records Queried 
        function groupToPages() {
            miniCartCtrl.currentPage = 0;
            miniCartCtrl.miniCartService.getMiniCartLines().then(function(result) {
                miniCartCtrl.items = result;        
                miniCartCtrl.lineCount = miniCartCtrl.items.length;
                miniCartCtrl.pagedItems = [];
                for (var i = 0; i < miniCartCtrl.items.length; i++) {
                    if (i % miniCartCtrl.itemsPerPage === 0) {
                        miniCartCtrl.pagedItems[Math.floor(i / miniCartCtrl.itemsPerPage)] = [miniCartCtrl.items[i]];
                    } else {
                        miniCartCtrl.pagedItems[Math.floor(i / miniCartCtrl.itemsPerPage)].push(miniCartCtrl.items[i]);
                    }
                }
            })
        };
            
        miniCartCtrl.firstPage = function () {
            miniCartCtrl.currentPage = 0;
        };
        
        miniCartCtrl.lastPage = function () {
            miniCartCtrl.currentPage = miniCartCtrl.pagedItems.length-1;
        };
        
        miniCartCtrl.prevPage = function () {
            if (miniCartCtrl.currentPage > 0) {
                miniCartCtrl.currentPage--;
            }
        };
        
        miniCartCtrl.nextPage = function () {
            if (miniCartCtrl.currentPage < miniCartCtrl.pagedItems.length - 1) {
                miniCartCtrl.currentPage++;
            }
        };
        
        miniCartCtrl.setPage = function () {
            miniCartCtrl.currentPage = this.n;
        };
        
        miniCartCtrl.invokeDoConfigure = function(lineItemId){
            miniCartCtrl.miniCartService.configureLineItem(lineItemId).then(function(result){
                // redirect the page to config URL.
                var configUrl = parsePagereference(result);
                if(!_.isNull(configUrl))
                    $window.location.href = configUrl;
            })
        };

        function deleteLineItemFromCart(lineNumber_tobedeleted){
            miniCartCtrl.baseService.startprogress();// start page level progress bar. 
            miniCartCtrl.miniCartService.deleteLineItemFromCart(lineNumber_tobedeleted).then(function(result){
                var retUrl = parsePagereference(result);
                if(!_.isNull(retUrl))
                    $window.location.href = retUrl;
                // mark minicart as dirty and reload minicart.
                miniCartCtrl.miniCartService.setMinicartasDirty();
                groupToPages();
                miniCartCtrl.baseService.completeprogress();// stop page level progress bar.
            })
        };
        
        miniCartCtrl.launch = function(which, productName, lineNumber){
            var dlg = null;
            switch(which){
                // Delete Line Item Confirm Dialog
                case 'confirmRemoveLine':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to Delete "'+productName+ '" from cart ?');
                    dlg.result.then(function(btn){
                        deleteLineItemFromCart(lineNumber);
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

        return miniCartCtrl;
	}

	MiniCart.$inject = ['SystemConstants'];
	function MiniCart(SystemConstants){
		// Runs during compile
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: MiniCartCtrl,
			controllerAs: 'MiniCart',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
			//template: '<div>pageHeader</div>',
			templateUrl: SystemConstants.baseUrl + "/Templates/MiniCartView.html",
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			//link: function(miniCartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);