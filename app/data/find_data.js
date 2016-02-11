/**
 * Created by jiezhao on 2015/8/26.
 */
function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
var code = "";
for(var j=0;j<9;j++) {
    if(j==1) continue;
    var content = httpGet("http://stock.finance.sina.com.cn/stock/quote/sza"+j+".html");

    for (var i = 0; i < 50; i++) {
        var index = content.indexOf("<a name=");
        content = content.substr(index + 10);
        code += '"' + content.substr(0, 6) + '",';
    }
}
console.log(code);