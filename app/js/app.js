/**
 * Created by jiezhao on 2015/7/24.
 */
var app = angular.module("stockApp",["ngRoute","firebase","chart.js","ngAnimate"]);
app.config(function($routeProvider){
    $routeProvider
        .when('/main',
        {
            controller:'mainController',
            templateUrl:'view/mainInfo.html'
        })
        .when('/Stock Price/:stockCode/:sellFlag',{
            controller:'priceController',
            templateUrl:'view/stockPrice.html'
        })
        .when('/Stock Follow',{
            controller:'stockFollowController',
            templateUrl:'view/stockFollow.html'
        })
        .when('/Stock Value',{
            controller:'stockInfoController',
            templateUrl:'view/stockInfo.html'
        })
        .when('/Trade History/:rowStyle',{
            controller:'tradeHistoryController',
            templateUrl:'view/tradeHistory.html'
        })
        .otherwise({redirectTo:'/main'});
});
