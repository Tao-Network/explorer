angular.module('BlocksApp').controller('TxController', function($stateParams, $rootScope, $scope, $http, $location) {
    $scope.$on('$viewContentLoaded', function() {   
        // initialize core components
        App.initAjax();
    });

    $rootScope.$state.current.data["pageSubTitle"] = $stateParams.hash;
    $scope.hash = $stateParams.hash;
    $scope.tx = {"hash": $scope.hash};

    //fetch web3 stuff
    var isTransfer = false;
    if($location.$$search && $location.$$search.isTransfer)
      isTransfer = true;
    $http({
      method: 'POST',
      url: '/transactionRelay',
      data: {"tx": $scope.hash, "isTransfer": isTransfer}
    }).success(function(data) {
      $scope.tx = data;
      $scope.isTransfer = data.isTransfer;
      if (data.timestamp)
        $scope.tx.datetime = new Date(data.timestamp*1000); 
      if (data.isTrace) // Get internal txs
        fetchInternalTxs();
    });

    var fetchInternalTxs = function() {
      $http({
        method: 'POST',
        url: '/web3relay',
        data: {"tx_trace": $scope.hash}
      }).success(function(data) {
        $scope.internal_transactions = data;
      });      
    }
})
