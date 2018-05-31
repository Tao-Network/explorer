angular.module('BlocksApp').controller('AddressController', function($stateParams, $rootScope, $scope, $http, $location) {
    $scope.$on('$viewContentLoaded', function() {   
        // initialize core components
        App.initAjax();
    });
    var activeTab = $location.url().split('#');
    if (activeTab.length > 1)
      $scope.activeTab = activeTab[1];

    $rootScope.$state.current.data["pageSubTitle"] = $stateParams.hash;
    $scope.addrHash = $stateParams.hash;
    $scope.addr = {"balance": 0, "count": 0};

    //fetch web3 stuff
    $http({
      method: 'POST',
      url: '/web3relay',
      data: {"addr": $scope.addrHash, "options": ["balance", "count", "bytecode"]}
    }).success(function(data) {
      $scope.addr = data;
      fetchTxs($scope.addr.count);
      if (data.isContract) {
        $rootScope.$state.current.data["pageTitle"] = "Contract Address";
        //fetchInternalTxs();
        $http({
          method: 'POST',
          url: '/tokenrelay',
          data: {"action": "info", "address": $scope.addrHash}
        }).success(function(tokenData) {
          $scope.token = tokenData;
          $scope.token.address = $scope.addrHash;
        });
      }
    });

    // fetch ethf balance 
    $http({
      method: 'POST',
      url: '/fiat',
      data: {"addr": $scope.addrHash}
    }).success(function(data) {
      $scope.addr.ethfiat = data.balance;
    });

    //fetch transactions
    var fetchTxs = function(count) {
      $("#table_txs").DataTable({
        processing: true,
        serverSide: true,
        paging: true,
        ajax: {
          url: '/addr',
          type: 'POST',
          data: { "addr": $scope.addrHash, "count": count }
        },
        "lengthMenu": [
                    [10, 20, 50, 100, 150, -1],
                    [10, 20, 50, 100, 150, "All"] // change per page values here
                ],
        "pageLength": 20, 
        "order": [
            [6, "desc"]
        ],
        "language": {
          "lengthMenu": "_MENU_ transactions",
          "zeroRecords": "No transactions found",
          "infoEmpty": ":(",
          "infoFiltered": "(filtered from _MAX_ total txs)"
        },
        "columnDefs": [ 
          { "targets": [ 5 ], "visible": false, "searchable": false },
          {"type": "date", "targets": 6},
          {"orderable": false, "targets": [0,2,3]},
          { "render": function(data, type, row) {
                        if (data != $scope.addrHash)
                          return '<a href="/addr/'+data+'">'+data+'</a>'
                        else
                          return data
                      }, "targets": [2,3]},
          { "render": function(data, type, row) {
                        return '<a href="/block/'+data+'">'+data+'</a>'
                      }, "targets": [1]},
          { "render": function(data, type, row) {
                        if(row[7]==0)
                          return '<span ng-show="false"  alt="transaction fail"><font color="#ff0000">  ！ </font></span>'+'<a href="/tx/'+data+'">'+data+'</a>'
                        else
                          return '<a href="/tx/'+data+'">'+data+'</a>'
                      }, "targets": [0]},
          { "render": function(data, type, row) {
                        return getDuration(data).toString();
                      }, "targets": [6]},
          ]
      });
    }

    
    $scope.internalPage = 0;
    $scope.internalTransaction=function(internalPage) {
      $http({
        method: 'POST',
        url: '/internalTX',
        data: {"action": "tokenTransfer", "address": $scope.addrHash, "internalPage":internalPage, 'fromAccount':$scope.acc}
      }).success(function(repData) {
        repData.forEach(function(record){
          record.amount = record.amount/10**parseInt($scope.token.decimals);
        })
        $scope.internalDatas = repData;
      });
    }
   
})


.directive('contractSource', function($http) {
  return {
    restrict: 'E',
    templateUrl: '/views/contract-source.html',
    scope: false,
    link: function(scope, elem, attrs){
        //fetch contract stuff
        $http({
          method: 'POST',
          url: '/compile',
          data: {"addr": scope.addrHash, "action": "find"}
        }).success(function(data) {
          console.log(data);
          scope.contract = data;
        });
      }
  }
})
