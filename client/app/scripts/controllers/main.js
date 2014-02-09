'use strict';

angular.module('clientApp')
  .controller('MainCtrl',
  function ($scope, $location, VNCClient) {

    $scope.host = {};
    $scope.host.proxyUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port();

    $scope.login = function () {
      var form = $scope['vnc-form'];
      if (form.$invalid) {
        form.$setDirty();
      } else {
        VNCClient.connect($scope.host)
        .then(function () {
          $location.path('/vnc')
        }, function () {
          $scope.errorMessage = 'Connection timeout. Please, try again.';
        });
      }
    };

  });
