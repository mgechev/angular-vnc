
'use strict';

angular.module('clientApp', ['ngRoute'])
.config(function ($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'views/main.html',
    controller: 'MainCtrl'
  })
  .when('/vnc', {
    templateUrl: 'views/vnc.html',
    controller: 'VncCtrl'
  })
});
