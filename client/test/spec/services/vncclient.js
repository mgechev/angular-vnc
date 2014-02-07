'use strict';

describe('Service: Vncclient', function () {

  // load the service's module
  beforeEach(module('clientApp'));

  // instantiate service
  var Vncclient;
  beforeEach(inject(function (_Vncclient_) {
    Vncclient = _Vncclient_;
  }));

  it('should do something', function () {
    expect(!!Vncclient).toBe(true);
  });

});
