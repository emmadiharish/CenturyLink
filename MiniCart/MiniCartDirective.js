/**
 * Directive: MiniCartDirective 
 */
;(function() {
	'use strict';

	angular.module('APTPS_ngCPQ').directive('miniCart', MiniCart);

	MiniCartCtrl.$inject = ['$window', '$dialogs', 'SystemConstants', 'QuoteDataService', 'BaseService', 'MiniCartDataService'];
	
	function MiniCartCtrl($window, $dialogs, SystemConstants, QuoteDataService, BaseService, MiniCartDataService){
		var cartCtrl = this;
		cartCtrl.itemsPerPage = 5;
        cartCtrl.pagedItems = [];
        cartCtrl.currentPage = 0;
        cartCtrl.lineCount = 0;

		function init(){
            // Initialize Scope Variables
            cartCtrl.miniCartService = MiniCartDataService;
            cartCtrl.quoteService = QuoteDataService;
            cartCtrl.baseService = BaseService;
            
            cartCtrl.miniCartTemplateURL = SystemConstants.baseUrl+'/Templates/MiniCartView.html';
            cartCtrl.paginationLinksTemplateURL = SystemConstants.baseUrl+'/Templates/PaginationLinksView.html';
            cartCtrl.imagesbaseURL = SystemConstants.baseUrl+'/Images';
            
            // Group by pages
            groupToPages();
        }

        // Calculate Total Number of Pages based on Records Queried 
        function groupToPages() {
            cartCtrl.currentPage = 0;
            cartCtrl.miniCartService.getMiniCartLines().then(function(result) {
                cartCtrl.items = result;        
                cartCtrl.lineCount = cartCtrl.items.length;
                cartCtrl.pagedItems = [];
                for (var i = 0; i < cartCtrl.items.length; i++) {
                    if (i % cartCtrl.itemsPerPage === 0) {
                        cartCtrl.pagedItems[Math.floor(i / cartCtrl.itemsPerPage)] = [cartCtrl.items[i]];
                    } else {
                        cartCtrl.pagedItems[Math.floor(i / cartCtrl.itemsPerPage)].push(cartCtrl.items[i]);
                    }
                }
            })
        };
            
        cartCtrl.firstPage = function () {
            cartCtrl.currentPage = 0;
        };
        
        cartCtrl.lastPage = function () {
            cartCtrl.currentPage = cartCtrl.pagedItems.length-1;
        };
        
        cartCtrl.prevPage = function () {
            if (cartCtrl.currentPage > 0) {
                cartCtrl.currentPage--;
            }
        };
        
        cartCtrl.nextPage = function () {
            if (cartCtrl.currentPage < cartCtrl.pagedItems.length - 1) {
                cartCtrl.currentPage++;
            }
        };
        
        cartCtrl.setPage = function () {
            cartCtrl.currentPage = this.n;
        };
        
        cartCtrl.invokeDoConfigure = function(lineItemId){
            cartCtrl.miniCartService.configureLineItem(lineItemId).then(function(result){
                // redirect the page to config URL.
                var configUrl = parsePagereference(result);
                if(!_.isNull(configUrl))
                    $window.location.href = configUrl;
            })
        };

        function deleteLineItemFromCart(lineNumber_tobedeleted){
            cartCtrl.baseService.startprogress();// start page level progress bar. 
            cartCtrl.miniCartService.deleteLineItemFromCart(lineNumber_tobedeleted).then(function(result){
                var retUrl = parsePagereference(result);
                if(!_.isNull(retUrl))
                    $window.location.href = retUrl;
                // mark minicart as dirty and reload minicart.
                cartCtrl.miniCartService.setMinicartasDirty();
                groupToPages();
                cartCtrl.baseService.completeprogress();// stop page level progress bar.
            })
        };
        
        cartCtrl.launch = function(which, productName, lineNumber){
            var dlg = null;
            switch(which){
                // Delete Line Item Confirm Dialog
                case 'confirmRemoveLine':
                    dlg = $dialogs.confirm('Please Confirm','Are you sure you want to Delete "'+productName+ '" from cart ?');
                    dlg.result.then(function(btn){
                        cartCtrl.deleteLineItemFromCart(lineNumber);
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

        return cartCtrl;
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
			//link: function(cartCtrl, iElm, iAttrs, controller) {
			//}
			bindToController: true
		};
	}
}).call(this);