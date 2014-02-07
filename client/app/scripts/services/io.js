'use strict';

angular.module('clientApp').factory('Io', function () {
  return {
    connect: function () {
      return io.connect.apply(io, arguments);
    }
  };
});
