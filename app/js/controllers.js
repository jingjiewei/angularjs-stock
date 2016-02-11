/**
 * Created by wjj on 2015/7/24.
 */
app.controller("indexController",["$scope","$location","$window","$interval","dataRetriever",function($scope,$location,$window,$interval,dataRetriever){
    var timer;
    $scope.title = "China Stock App";

    dataRetriever.get().then(function(data){
        $scope.stockList = data["data"];
        //console.log("+++++++++++++++++++++++"+$scope.stockList["0000001"].name);
    });
    timer = $interval(function(){
        dataRetriever.get().then(function(data){
            $scope.stockList = data["data"];
        });
    },5000);


    $scope.floatTitleColor = function(stock){
        if(stock.percent>0){
            return "sellcolor";
        }
        else if(stock.percent<0){
            return "buycolor";
        }
    };
    $scope.gotoStockPrice = function(){
       $scope.title ="Stock Quotation";
       $window.location = "#/Stock Price/"+$scope.stockCode+"/"+"b";
    };

    $scope.isActive = function(path){
        return  $location.path().indexOf(path) === 0;
    };
    $scope.stockCodeInputFocus = function(){
        $scope.stockCode = '';
    };
    $scope.toggleNav = function(){
        $scope.isBig = $scope.isBig===true ? false: true;
        if($scope.isBig === true){
            $scope.title = "China Stock App";
        }
    };
    $scope.linkClick = function(title){
        $scope.isBig = false;
        $scope.title = title;
    };

    $scope.$on("destroy",
        function(){
            if(angular.isDefined(timer)){
                $interval.cancel((timer));
                timer = undefined;
            }
        });
}]);


app.controller("mainController",function($scope,$http,$firebaseObject,$firebaseArray,stockService,$q,$interval){
    var stock_cash_ref = new Firebase("https://stock-show.firebaseio.com/stock_data");
    var stock_data_obj = $firebaseObject(stock_cash_ref);
    var stock_hold_ref = new Firebase("https://stock-show.firebaseio.com/stock_hold");
    var stock_data_array = $firebaseArray(stock_hold_ref);
    var timer;


    init();
    function init(){
        var deferred = $q.defer();
        var promise = deferred.promise;
        stock_data_array.$loaded().then(function() {
            stock_data_obj.$loaded().then(function() {
                //calculate the stock_value according to the real-time price and init the chart
                stockService.calculateStockValue($scope,$http,stock_data_array,stock_data_obj,deferred);
                promise.then(function(message){      //must be excuted after the $save function in calculateStockValue
                    console.log(message);
                    $scope.principal = stock_data_obj.principal;
                    $scope.marketValue = stock_data_obj.cash + stock_data_obj.stock_value;
                    $scope.profitLoss = $scope.marketValue - $scope.principal;
                    $scope.yields = $scope.profitLoss/$scope.principal;
                },function(error){
                    console.log("Error"+ error);
                });

            });
        });
    }
    $scope.colorDisplayChoose = function(){
        if($scope.yields){
            if($scope.yields<0){
                return "buycolor";
            }
            else if($scope.yields>0){
                return "sellcolor";
            }
        }
    };
    timer = $interval(function(){init();},
        10000);
    //release the timer when destroy the scope
    $scope.$on(
        "$destroy",
        function(){
            if(angular.isDefined(timer)){
                $interval.cancel((timer));
                timer = undefined;
            }
        }
    );
});

app.controller("priceController",function($scope,$http,$routeParams,$firebaseObject,$firebaseArray,$interval){
    var stock_cash_ref = new Firebase("https://stock-show.firebaseio.com/stock_data");
    var stock_data_obj = $firebaseObject(stock_cash_ref);
    var stock_hold_ref = new Firebase("https://stock-show.firebaseio.com/stock_hold");
    var stock_data_array = $firebaseArray(stock_hold_ref);
    var stock_trade_history_ref = new Firebase("https://stock-show.firebaseio.com/trade_history");
    var stock_trade_history_array = $firebaseArray(stock_trade_history_ref);
    var stock_follow_ref = new Firebase("https://stock-show.firebaseio.com/stock_follow");
    var stock_follow_array = $firebaseArray(stock_follow_ref);
    var timer;
    var chart_timer;
    var stockCode;
    $scope.canFollow = true;
    init();
    function init(){
        stockCode = $routeParams.stockCode;
        if (stockCode) {
            if(stockCode[0]==='6'){
                $scope.chartCode = "sh"+stockCode;
                stockCode = "0" + stockCode;
            }
            else if(stockCode[0]==='0'|| stockCode[0]==='3'){
                $scope.chartCode = "sz"+stockCode;
                stockCode = "1" + stockCode;
            }
            else{
                //输入有误
                console.log("wrong input"+stockCode);
                return;
            }
            if($routeParams.sellFlag ==="s"){//enter from stock_info page,show the  sell button
                $scope.showSellButton = true;
            }
            $scope.buySellShow = true;
            $scope.showBuyButton = true;
            $scope.chartType = "Timely";      //show the timely chart by default

            stock_follow_array.$loaded().then(function(){
                    for(var item = 0;item<stock_follow_array.length;item++){
                        if(stock_follow_array[item].stock_code === stockCode){
                            $scope.canFollow = false;
                            break;
                        }
                    }
            },function(error){
                console.error("[Error]:load data from stock_follow  "+ error);
            });

            stock_data_obj.$loaded().then(function() {
                var url = "http://api.money.126.net/data/feed/"+ stockCode +"?callback=JSON_CALLBACK";

                //obtain the stock data using JSONP
                var quoteStockPrice = function() {
                    $http({method: "JSONP", url: url}).
                        success(function (data, status) {
                            console.log("JSON data fetch from: " + url);
                            $scope.status = status;

                            //$scope.price_show = true;

                            $scope.cash = stock_data_obj.cash;
                            var stock_data;
                            for (var stock in data) {
                                stock_data = data[stock];
                            }
                            if(!stock_data){
                                $scope.wrong_code_flag = true;
                                return;  // code not exist
                            }
                            $scope.stock = stock_data;

                            $scope.stock_max_buy = (Math.floor($scope.cash / stock_data.price / 100)) * 100;
                            //alert($scope.stock_max_buy);
                        }).
                        error(function (data, status) {
                            $scope.stock_para = data || "Request failed";
                            $scope.status = status;
                        });
                };
                timer = $interval(function(){
                    quoteStockPrice();

                },5000);

                chart_timer = $interval(function(){
                    chart_init();
                },15000);
                //setInterval(chart_init,5000);
                quoteStockPrice();
                chart_init();
            },
            function(error){
                console.error("Error in init()" + error);
            });
        }
    }
    function chart_init(){
        $scope.timelyPath = "http://image.sinajs.cn/newchart/min/n/"+$scope.chartCode+".gif?"+new Date().getTime();
        console.log($scope.timelyPath + "  update at " + new Date().getTime());
    }

    $scope.buyStock = function(){
        $scope.buySellShow = false;
        $scope.showBuyInfo = true;
    };
    $scope.sellStock = function(){
        $scope.buySellShow = false;
        $scope.showSellInfo = true;
        if(stock_data_array.length>0){
            for(var item=0; item<stock_data_array.length; item++){
                if(stock_data_array[item].buy_stock_code === $scope.stock.code){
                    $scope.stock_max_sell = stock_data_array[item].buy_stock_amount;
                }
            }
        }
    };

    $scope.confirmBuyStock = function(){
        //var buy_cost = $scope.stock_buy_amount * $scope.stock_para[$scope.stock_code];
        var buy_stock_code = $scope.stock.code;
        var buy_stock_name = $scope.stock.name;
        var buy_stock_amount = parseInt($scope.stock_buy_amount);
        var buy_stock_price = parseFloat($scope.stock.price);
        var stock_found_flag = false;

        //console.log("stock_data_array length:"+stock_data_array.length);

        if(stock_data_array.length>0){
            for(var item = 0;item < stock_data_array.length; item++){
                if(stock_data_array[item].buy_stock_code === buy_stock_code){
                    stock_found_flag = true;       //set the flag to invoid add a new record
                    console.log("Buying______found data in DB: code:  "+stock_data_array[item].buy_stock_code +"   db" +
                        " price:   " + stock_data_array[item].buy_stock_price + "   db amount: " + stock_data_array[item].buy_stock_amount);
                    stock_data_array[item].buy_stock_price =  (stock_data_array[item].buy_stock_price*stock_data_array[item].buy_stock_amount +buy_stock_amount*buy_stock_price)/(stock_data_array[item].buy_stock_amount+buy_stock_amount);
                    stock_data_array[item].buy_stock_amount += buy_stock_amount;
                    stock_data_array.$save(item).then(function() {
                        console.log("+++++++++++++++++item:"+item +"  update ok" );
                    });
                }
            }
            if(stock_found_flag == false){
                addNewStockHold();
            }
        }
        else{
            addNewStockHold();
        }
        function addNewStockHold(){
            stock_data_array.$add(               //add a stock info to firebase
                {
                    buy_stock_code:buy_stock_code,
                    buy_stock_name:buy_stock_name,
                    buy_stock_amount:buy_stock_amount,
                    buy_stock_price:buy_stock_price
                }
            ).then(function(stock_hold_ref) {
                    var id = stock_hold_ref.key();
                    console.log("add record with id " + id);
                });
        };

        stock_data_obj.cash -= buy_stock_amount*buy_stock_price;//change the cash and stock_value in firebase
        stock_data_obj.stock_value += buy_stock_amount*buy_stock_price;
        stock_data_obj.$save().then(function(stock_cash_ref) {
            stock_cash_ref.key() === stock_data_obj.$id; // true
        }, function(error) {
            console.log("Error:", error);
        });

        $scope.cash = stock_data_obj.cash;
        $scope.stock_max_buy = (Math.floor($scope.cash/buy_stock_price/100))*100;
        $scope.stock_buy_amount = "";

        stock_trade_history_array.$add(
            {
                trade_code:buy_stock_code,
                trade_name:buy_stock_name,
                trade_amount:buy_stock_amount,
                trade_price:buy_stock_price,
                trade_time:new Date().getTime(),
                trade_type:"Buy"
            }
        ).then(function(){
                window.location = "#/Trade History/colored";
                console.log("add Buy record to trade_history");
            },function(error){
                console.log("Error in add record to trade_history:   "+error);
            });
    };

    $scope.confirmSellStock = function(){
        var sell_stock_code = $scope.stock.code;
        var sell_stock_name = $scope.stock.name;
        var sell_stock_amount = parseInt($scope.stock_sell_amount);
        var sell_stock_price = parseFloat($scope.stock.price);
        if(stock_data_array.length>0){
            for(var item=0; item<stock_data_array.length; item++){
                if(stock_data_array[item].buy_stock_code === sell_stock_code){
                    if(stock_data_array[item].buy_stock_amount != sell_stock_amount) {//sell part of the stock_hold
                        stock_data_array[item].buy_stock_price = (stock_data_array[item].buy_stock_price * stock_data_array[item].buy_stock_amount - sell_stock_price * sell_stock_amount) / (stock_data_array[item].buy_stock_amount - sell_stock_amount);
                        stock_data_array[item].buy_stock_amount -= sell_stock_amount;
                        stock_data_array.$save(item).then(function () {
                            $scope.stock_max_sell -= sell_stock_amount;
                            console.log("sell part of stock successfully! code: " + sell_stock_code + "  name:" + sell_stock_name);
                        }, function (error) {
                            console.error("[Error] in process sell stock: " + error);
                        });
                    }
                    else{       //sell all the hold of a stock
                        stock_data_array.$remove(item).then(function(){
                            $scope.stock_max_sell -= sell_stock_amount;
                            console.log("sell all the stock successfully! code: " + sell_stock_code + "  name:" + sell_stock_name);
                        })
                    }
                }
            }
        }
        stock_data_obj.cash += sell_stock_amount*sell_stock_price;//change the cash and stock_value in firebase
        stock_data_obj.stock_value -= sell_stock_amount*sell_stock_price;
        stock_data_obj.$save().then(function(stock_cash_ref) {
            stock_cash_ref.key() === stock_data_obj.$id; // true
        }, function(error) {
            console.log("[Error] in update the cash and stock_value", error);
        });

        stock_trade_history_array.$add(
            {
                trade_code:sell_stock_code,
                trade_name:sell_stock_name,
                trade_amount:sell_stock_amount,
                trade_price:sell_stock_price,
                trade_time:new Date().getTime(),
                trade_type:"Sell"
            }
        ).then(function(){
                window.location = "#/Trade History/colored";
                console.log("add Sell record to trade_history");
            },function(error){
                console.log("Error in add record to trade_history:   "+error);
            });

    };

    $scope.chooseChartType = function(type){  //chart tab click
        $scope.chartType = type;
    };

    $scope.isActive = function(type){//chart tab active or not
        return $scope.chartType === type;
    };

    $scope.stockColor = function(){
        //console.log($scope.stock.arrow==="↓");
        if($scope.stock) {
            if ($scope.stock.arrow === "↓") {
                return "buycolor";
            }
            else if ($scope.stock.arrow === "↑") {
                return "sellcolor";
            }
        };
    };

    $scope.addFollow = function(){
        if($scope.stock.code) {
            stock_follow_array.$add({stock_code:$scope.stock.code}).then(
                function () {
                    console.log("[Success] ]add " + $scope.stock.code + " to follow list!");
                    $scope.canFollow = false;
                },
                function () {
                    console.error("[Error]: add " + $scope.stock.code + " to follow list!");
                }
            );
        }
    };

    $scope.removeFollow = function(){
        for(var item = 0;item<stock_follow_array.length;item++){
            if(stock_follow_array[item].stock_code === $scope.stock.code){
                stock_follow_array.$remove(item).then(function(){
                    console.log("[Success] remove " + $scope.stock.code + " from follow list!");
                    $scope.canFollow = true;
                },function(error){
                    console.error("[Error] remove" + $scope.stock.code + " from follow list!  " + error);
                })
            }
        }
    };

    //release the timer when destroy the scope
    $scope.$on(
        "$destroy",
            function(){
                if(angular.isDefined(timer)){
                    $interval.cancel(timer);
                    timer=undefined;
                }
                if(angular.isDefined(chart_timer)){
                    $interval.cancel(chart_timer);
                    chart_timer=undefined;
                }
            });
});

app.controller("stockInfoController",function($scope,$http,$firebaseArray){
    var stock_hold_ref = new Firebase("https://stock-show.firebaseio.com/stock_hold");
    var stock_data_array = $firebaseArray(stock_hold_ref);
    $scope.stocks = [];
    $scope.totalProfit = 0;
    init();
    function init(){
        stock_data_array.$loaded().then(function(){
            angular.forEach(stock_data_array,function(stock_item){
                var url = "http://api.money.126.net/data/feed/"+ stock_item.buy_stock_code +"?callback=JSON_CALLBACK";
                var current_price;
                $http({method:"JSONP",url:url}).
                    success(function(data,status){
                        console.log("JSON data fetch from: "+ url);
                        var stock_data;
                        for (var stock in data) {
                            stock_data = data[stock];
                        }
                        current_price = stock_data.price;
                        var code = stock_item.buy_stock_code;
                        var name = stock_item.buy_stock_name;
                        var quantity = stock_item.buy_stock_amount;
                        var buying_price = stock_item.buy_stock_price;
                        var yields = (current_price-buying_price)/buying_price;
                        var market_value = current_price*quantity;
                        var profit = (current_price-buying_price)*quantity;
                        $scope.stocks.push(
                            {
                                code:code,//used for jump to the "stock_price" page
                                name:name,
                                quantity:quantity,
                                buying_price:buying_price,
                                current_price:current_price,
                                yields:yields,
                                market_value:market_value,
                                profit:profit
                            }
                        );
                        $scope.totalProfit += profit;
                    }).
                    error(function(data,status){
                        console.error("[Error]JSON data fetch from: "+ url +status);
                    });

            });

        },function(){
            console.error("load stock data from 'stock_hold' failed");
        });
    }
    $scope.stockInfoView = function(stock){
        window.location = "#/Stock Price/"+stock.code.substring(1,stock.code.length)+"/s";
    };

    $scope.colorDisplayChoose = function(stock){
        if(stock.yields){
            if(stock.yields>0){
                return "sellcolor";
            }
            else if(stock.yields<0){
                return "buycolor";
            }
        }
    }
});

app.controller("tradeHistoryController",function($scope,$firebaseArray,$routeParams){
    var stock_trade_history_ref = new Firebase("https://stock-show.firebaseio.com/trade_history");
    var stock_trade_history_array = $firebaseArray(stock_trade_history_ref);
    var rowStyle;
    init();
    function init(){
        rowStyle = $routeParams.rowStyle;
        stock_trade_history_array.$loaded().then(function(){
            $scope.tradeList = stock_trade_history_array;
        },function(error){
            console.error("[Error]TradeHistory data fetch from trade_history"+error);
        });
    }
    $scope.rowColorChoose = function(trade,positionFlag){
        if(positionFlag&&rowStyle=="colored"){
            if(trade.trade_type === "Buy"){
                return "last_buycolor";
            }
            return "last_sellcolor";
        }
        else{
            if(trade.trade_type === "Buy"){
                return "buycolor";
            }
            return "sellcolor";
        }
    }
});
app.controller("stockFollowController",function($scope,$firebaseArray,$http,$interval){
    var stock_follow_ref = new Firebase("https://stock-show.firebaseio.com/stock_follow");
    var stock_follow_array = $firebaseArray(stock_follow_ref);
    var timer;

    init();
    function init(){
        $scope.follows = [];
        stock_follow_array.$loaded().then(function(){
            angular.forEach(stock_follow_array,function(follow_stock){
                var url = "http://api.money.126.net/data/feed/"+ follow_stock.stock_code +"?callback=JSON_CALLBACK";
                $http({method:"JSONP",url:url}).
                    success(function(data,status){
                        for(var stock_follow in data){
                            console.log("[Success] in get data from "+url);
                            $scope.follows.push(
                                {
                                    name:data[stock_follow].name,
                                    price:data[stock_follow].price,
                                    updown:data[stock_follow].updown,
                                    percent:data[stock_follow].percent,
                                    code:data[stock_follow].code
                                }
                            )
                        }
                    }).
                    error(function(data,status){
                        console.error("[Error] get data from " + url +"  "+ status);
                    });
            });
        },function(error){
            console.error("[Error] load data from stock_follow "+ error);
        })
    }
    var timer=$interval(function(){
        angular.forEach( $scope.follows,function(follow_stock) {
            var url = "http://api.money.126.net/data/feed/" + follow_stock.code + "?callback=JSON_CALLBACK";
            $http({method: "JSONP", url: url}).
                success(function (data, status) {
                    for (var stock_follow in data) {
                        console.log("[Success] in get data from " + url);
                        follow_stock.name = data[stock_follow].name;
                        follow_stock.price = data[stock_follow].price;
                        follow_stock.updown = data[stock_follow].updown;
                        follow_stock.percent = data[stock_follow].percent;
                        follow_stock.code = data[stock_follow].code;
                    }
                }).
                error(function (data, status) {
                    console.error("[Error] get data from " + url + "  " + status);
                });
        });
    },5000);

    $scope.bgColorChoose = function(follow_stock){
        if(follow_stock.updown>0){
            return "bg_red";
        }
        else if(follow_stock.updown<0){
            return "bg_green";
        }
    }

    $scope.removeFollow = function(code) {
        for (var item = 0; item < stock_follow_array.length; item++) {
            if (stock_follow_array[item].stock_code === code) {
                $scope.follows.splice(item,1);
                //console.info("++++++++++++++++++++++++"+$scope.follows.length);
                stock_follow_array.$remove(item).then(function () {
                    console.log("[Success] remove " + code + " from follow list!");
                }, function (error) {
                    console.error("[Error] remove" + code + " from follow list!  " + error);
                })
            }
        }
    };

    $scope.$on("$destroy",
        function(){
            if(angular.isDefined(timer)){
                $interval.cancel(timer);
                timer=undefined;
            }
        });
});