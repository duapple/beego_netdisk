/*
  @params
    url: 请求的地址
    pram: 发送的数据
    method: 请求的方式
 */
var RequestArray = [], //存储请求的数组
    argItem = [], 
    result = null,
    xmlHttp = null;
function sendAjax(url, pram, method) {
  AddRequestArray(url, pram, method);
}
function AddRequestArray(url, pram, method) {
  var ArgItem = new Array();
  ArgItem[0] = url;
  ArgItem[1] = pram;
  ArgItem[2] = method;
  RequestArray.push(ArgItem); //将当前请求添加到队列末尾
  if (RequestArray.length == 1) {
    //如果请求队列里只有当前请求立即要求执行队列，如果有其他请求，那么就不要求执行队列
    ExeRequest();
  }
}
//开始执行一个ajax请求
function ExeRequest() {
  var arr = RequestArray[0];
  startRequest(arr[0], arr[1], arr[2]);
}
function createXMLHttpRequest() {
  if (window.ActiveXObject) {
    return new ActiveXObject("Microsoft.XMLHTTP");
  } else if (window.XMLHttpRequest) {
    return new XMLHttpRequest();
  }
}
/*发送请求
  @param 
    url: 请求的地址
    pram: 发送的数据
    re_mod: 请求的方式
*/
function startRequest(url, param, re_mod) {
  xmlHttp = createXMLHttpRequest();
  var xmlobj = this; //把本对象赋值给一个变量是为了兼容ie因为this对象在不同的浏览器中有不同的解释
  xmlobj.xmlHttp.onreadystatechange = function () {
    if (xmlobj.xmlHttp.readyState == 4) {
      xmlobj.result = xmlobj.xmlHttp.responseText;
      if (xmlobj.xmlHttp.status == 200 || xmlobj.xmlHttp.status == 500) {
        uploadFile(0); //成功后可以调用其他函数
      } else {
        console.user-logout("error: " + xmlobj.result);
      }
      xmlobj.RequestArray.shift(); //移除队列里的顺序第一个的请求，即当前已经执行完成的请求
      if (xmlobj.RequestArray.length >= 1) {
        //如果请求队列里只有当前请求立即要求执行队列，如果有其他请求，那么就不要求执行队列
        xmlobj.ExeRequest(); //要求执行队列中的请求
      }
    }
  };
  xmlobj.xmlHttp.open(re_mod, url, true);
    //   xmlobj.xmlHttp.upload.onprogress = function (progress) {
    //        updateProgress(progress); //可以获得进度条
    //     };
  console.log(RequestArray[0]);
  argItem[3] = xmlobj.xmlHttp; //把请求存进数组，可以中止请求：argItem[3].abort()
  xmlobj.xmlHttp.send(param);
}

//测试
sendAjax("http://localhost:9090/upload", form_data, "POST");
setTimeout(function(){
    RequestArray[0][3].abort(); //1s后中止该请求
},1000);

