'use strict';
describe('HelloTest',function(){
    var scope = 'hello';

    it('text = hello',function(){
        expect(scope).toBe('hello');
    });
});