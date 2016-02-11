/**
 * Created by jiezhao on 2015/8/6.
 */
app.service("stockService",function(){
   this.calculateStockValue = function($scope,$http,stock_data_array,stock_data_obj,deferred){
        var total_stock_value = 0;
        var code_amount = [];
        url = "http://api.money.126.net/data/feed/";
        for(var item= 0;item<stock_data_array.length;item++){
            url = url+ stock_data_array[item].buy_stock_code +",";
            code_amount.push({code:stock_data_array[item].buy_stock_code,amount: stock_data_array[item].buy_stock_amount});
        }
        url = url.substring(0,url.length-1);
        url += "?callback=JSON_CALLBACK";
        console.log("url++++++++  "+url);


        if(stock_data_array.length>0) {
            $http({method: "JSONP", url: url}).
                success(function (data, status) {
                    //console.log("code_amount: " + code_amount);
                    var amount;
                    for (var stock in data) {
                        for (var i in code_amount) {
                            if (code_amount[i].code === stock)
                                amount = code_amount[i].amount;
                        }
                        total_stock_value += data[stock].price * amount;
                        console.log("code: " +data[stock].code+ "   price: " + data[stock].price + "    amount: " +amount+"     stock_value: " + total_stock_value);
                    }

                    //store the stock_value to fireBase
                    stock_data_obj.stock_value = total_stock_value;
                    stock_data_obj.$save().then(function(stock_cash_ref) {

                        stock_cash_ref.key() === stock_data_obj.$id; // true
                        console.log("DB stock_value update after price update");
                        deferred.resolve("$q is invoked to calculate the total amount");
                    }, function(error) {
                        console.log("Error:", error);
                    });

                    //init the "cash and stock_value" chart
                    initChart($scope, stock_data_obj, total_stock_value);
                }).
                error(function (data, status) {
                    console.log("query stock_data_array fail:" + status);
                    //return stock_value;
                });
        }
        else{//hold no stock
            initChart($scope, stock_data_obj, total_stock_value);
            deferred.resolve("$q is invoked when hold no stock");
        }

    };
    function initChart($scope,stock_data_obj,stock_value){
        $scope.chart_labels = ["Cash", "Stock Value"];
        $scope.chart_data = [stock_data_obj.cash, stock_value];
        $scope.chart_legend = [true, true];
    };
});

app.service("dataRetriever",["$http","$q",function($http,$q){
    this.get = function(){
        var deferred = $q.defer();
        var stockCode = "0000001,1399001,1399606";
        var url = "http://api.money.126.net/data/feed/"+ stockCode +"?callback=JSON_CALLBACK";
        $http({
            method:"JSONP",
            url:url
        }).then(function(data){
            deferred.resolve(data);
            //console.log("_________________"+$scope.stockList.length);
        },function(error){
            console.error("Remote url error");
        });
        return deferred.promise;
    }
}]);