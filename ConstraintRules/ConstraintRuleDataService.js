(function() {
    angular.module('APTPS_ngCPQ').service('ConstraintRuleDataService', ConstraintRuleDataService); 
    ConstraintRuleDataService.$inject = [];
    function ConstraintRuleDataService(){
        var service = this;
        
        var recommendedproductsMap = {};

        service.getrecommendedproductsMap = getrecommendedproductsMap;
        service.setrecommendedproductsMap = setrecommendedproductsMap;
        service.omitrecommendedproduct = omitrecommendedproduct;

        function getrecommendedproductsMap(){
            return recommendedproductsMap;
        }

        function getrecommendedproductsMap(productIds){
            recommendedproductsMap = productIds;
        }

        function omitrecommendedproduct(productId){
            recommendedproductsMap = _.omit(recommendedproductsMap, productId);
        }
    }
})();