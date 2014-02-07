'use strict';

angular.module('clientApp').controller('MainCtrl', function ($scope) {
  $scope.host = {};
  $scope.login = function () {
    var form = $scope['vnc-form'];
    if (form.$invalid) {
      form.$setDirty();
      return;
    }
    console.log($scope['vnc-form']);
  };
});
