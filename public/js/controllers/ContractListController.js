angular.module('BlocksApp').controller('ContractListController', function($stateParams, $rootScope, $scope, $http) {
  $scope.$on('$viewContentLoaded', function() {   
      // initialize core components
      App.initAjax();
  });

  $http({
    method: 'POST',
    url: '/contractListData',
    data: {"ERC": -1}
  }).success(function(repData) {
    $scope.contracts = repData;
  });
})