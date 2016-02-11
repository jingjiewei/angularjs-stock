/**
 * Created by jiezhao on 2015/10/2.
 */
"use strict";
describe("indexController function",function(){
    var scope;
    var indexController;
    var mockWindow;

    beforeEach(function(){
        module(function($provide) {
            $provide.service('$window', function(){
                this.location = jasmine.createSpy("location");
            });
        });
        module('stockApp')
    });
    beforeEach(inject(function($rootScope,$controller,$window){
        scope = $rootScope.$new();
        indexController = $controller('indexController',{$scope:scope});
        mockWindow = $window;
    }));

    describe('remote server response',function(){
        beforeEach(inject(function($httpBackend){
            var result = [{name:'index1',price:'1000',arrow:'↑',percent:'0.021'},{name:'index2',price:'2000',arrow:'↑',percent:'0.041'},{name:'index3',price:'3000',arrow:'↑',percent:'0.051'}];
            $httpBackend.when("JSONP","http://api.money.126.net/data/feed/0000001,1399001,1399606?callback=JSON_CALLBACK")
                .respond(200,result);
            $httpBackend.flush();
        }));
        it('should display three index when ',function(){
             expect(scope.stockList.length).toBe(3);
             expect(scope.stockList[1].name).toEqual("index2");
        });

        it('should display in red color when index get up and color in green when index get down',function(){
            var stock={percent:0.021};
            expect(scope.floatTitleColor).toBeDefined();
            expect(scope.floatTitleColor(stock)).toEqual("sellcolor");
            stock={percent:-0.021};
            expect(scope.floatTitleColor(stock)).toEqual("buycolor");
        });

        describe('when user search the code',function(){

            it('should change title to Stock Quotation ',function(){
                expect(scope.gotoStockPrice).toBeDefined();
                scope.stockCode = "0600000";
                scope.gotoStockPrice();
                expect(scope.title).toEqual('Stock Quotation');
                expect(mockWindow.location).toEqual("#/Stock Price/0600000/b");

            });
        })
    });

    describe('remote server down',function(){
        it('should display the error message when remote server is down',inject(function($httpBackend){
            var result = "";
            $httpBackend.when("JSONP","http://api.money.126.net/data/feed/0000001,1399001,1399606?callback=JSON_CALLBACK")
                .respond(200,result);
            $httpBackend.flush();
            expect(scope.stockList).toEqual('');
        }));
    });

});