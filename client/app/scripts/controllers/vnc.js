'use strict';

angular.module('clientApp')
  .controller('VncCtrl', function ($scope, $location, VNCClient) {
    $scope.disconnect = function () {
      VNCClient.disconnect();
      $location.path('/');
    };
    $scope.connected = function () {
      return VNCClient.connected;
    };
  });
