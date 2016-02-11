//stock code search and input
app.directive("autoComplete",function(){
    return{
        restrict: 'A',
        scope: {
            ngModel:'=',
            title:'='
        },
        link: function(scope,elem,attrs){
            elem.autocomplete({
                //source: global_stock_data,
                source:function(request,response){
                    var results = [];
                    for(var i=0; i<global_stock_data.length;i++){
                        if(global_stock_data[i].indexOf(request.term) !== -1){
                           results.push(global_stock_data[i]);
                        }
                    }
                    return response(results.slice(0, 10));
                },
                minLength:1,
                select: function(event,ui){
                    scope.$apply(function(){
                        scope.ngModel = ui.item.value;
                        scope.title = "Stock Quotation";
                        window.location = "#/Stock Price/"+ui.item.value+"/"+"b";
                        elem.blur();
                    });
                }
            });

        }
    }
});

//validation for amout input to be a multiple of 100
app.directive("hundred",function(){
    return{
        restrict:"A",
        require:"ngModel",
        link:function(scope,elem,attrs,ngModel){
            ngModel.$validators.hundred = function(modelValue){
                return modelValue%100 === 0;
            }
        }
    }
});

//validation for amout input to be less than allowed
app.directive("nolargerthan",function(){
    return{
        restrict:"A",
        scope:{
            max:"@"
        },
        require:"ngModel",
        link:function(scope,elem,attrs,ngModel){
            ngModel.$validators.nolargerthan= function(modelValue) {
                var tmp = modelValue-scope.max;
                //console.log("+++++++++++++++++"+scope.ngModel);
                if(tmp<=0) {
                    return true;
                }
                else {
                    return false;
                }
            }
        }
    }
});



