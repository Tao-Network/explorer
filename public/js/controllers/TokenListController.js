angular.module('BlocksApp').controller('TokenListController', function($stateParams, $rootScope, $scope, $http) {
    $scope.$on('$viewContentLoaded', function() {   
        // initialize core components
        App.initAjax();
    });


      $http({
        method: 'POST',
        url: '/tokenListData',
        data: {"ERC": 0}
      }).success(function(repData) {
        console.log("tokens:", repData);
        $scope.contracts = repData;
      });
    
})