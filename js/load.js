function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function dyloadPage(url,doc,params){
    httpGetAsync(url,function (text){
        if (typeof(params) === 'string')
          text = text.replace('/*!!!params*/',' + "' + params + '"');
        doc.open("text/html", "replace");
        doc.write(text);
        doc.close();
    });
}
