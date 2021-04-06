/* 退出
    *  @params
    *  @return
    */
function logout() {
    window.location.href = logout_href;
}

/* 校验文件名是否合理
*  @params
*      fileName 文件名
*  @return
*      [boolean] true:是;false:否
*/
function validateFileName(fileName) {
    let reg = new RegExp('[\\\\/:*?\"<>|]');
    if (reg.test(fileName)) {
        return false;
    }
    return true;
}

/* 阻止冒泡
    *  @params
    *      e  
    *  @return 
    */
function stopPropagation(e) {
    e = e || window.event;
    if (e.stopPropagation) { //W3C阻止冒泡方法
        e.stopPropagation();
    }
    else {
        e.cancelBubble = true; //IE阻止冒泡方法
    }
}

/* 转换字节
*  @params
*      bytes [number] 字节数
*  @return
*      [string] 转换后的字符串
*/
function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';
    let k = 1024,
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/* 删除最后一个子元素
*  @params
*      e 元素
*  @return
*/
function deleteChild(e) {
    let child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
}

/* 补0
*  @params
*      s [number] 数字
*  @return
*      s [string] 补0后的字符串
*/
function addZero(s) {
    return s < 10 ? '0' + s : s;
}

/* 添加文件至数组
*  @params
*      file [string] 文件名
*  @return
*/
function addList(file) {
    if (checkSelect_list.indexOf(file) == -1) {
        checkSelect_list.push(file);
    }
    else {
        return;
    }
}

// 判断文件类型
function isFileType(flieName) {
    let className = null,
        arr = flieName.split('.'), //文件名用点分隔为数组
        file_type = arr[arr.length - 1]; //获取文件名后缀
    switch (file_type) {
        case "jpeg":
            className = "jpeg_i";
            break;
        case "jpg":
            className = "jpg_i";
            break;
        case "mp3":
            className = "mp3_i";
            break;
        case "mp4":
            className = "mp4_i";
            break;
        case "pdf":
            className = "pdf_i";
            break;
        case "png":
            className = "png_i";
            break;
        case "ppt":
            className = "ppt_i";
            break;
        case "rar":
            className = "rar_i";
            break;
        case "zip":
            className = "rar_i";
            break;
        case "txt":
            className = "txt_i";
            break;
        case "doc":
            className = "word_i";
            break;
        case "docx":
            className = "word_i";
            break;
        case "xls":
            className = "xls_i";
            break;
        case "xlsx":
            className = "xls_i";
            break;
        default:
            className = "other_i";
            break;
    }
    return className;
}

/* 返回上一级目录
*  @params
*  @return
*/
function returnFile() {
    current_dirname_arr.pop();
    current_path = current_dirname_arr.join('/');
	queryData(current_path);
}

/* 清除选中框样式
*  @params
*  @return
*/
function clearBox() {
    let trList = document.getElementsByTagName("tr"),
        checkList = document.getElementsByClassName("checkbox"),
        checkLen = checkList.length;
    for (let i = 0; i < checkLen; i++) {
        checkList[i].checked = false;
        trList[i].style.background = "none";
    }
}

/* 是否隐藏更多按钮
*  @params
*  @return
*/
function clearMoreBtn() {
    let checkList = document.getElementsByClassName("checkbox"),  //文件左侧的选择框
        more_show = document.getElementsByClassName("more")[0], //下载删除分享按钮所在区域
        checkLen = checkList.length,
        clicked_num = 0;  //已选选择框的数量

    for (let i = 0; i < checkLen; i++) {
        if (checkList[i].checked) {
            clicked_num++;
        }
    }
    if (clicked_num === 0) {
        more_show.style.display = "none"; //隐藏更多按钮
    }
    else {
        more_show.style.display = "block"; //显示更多按钮
    }
}

/* 全选文件
*  @params
*  @return
*/
function checkall() {
    let checkList = document.getElementsByClassName("checkbox"),  //选择框
        more_show = document.getElementsByClassName("more")[0]; //更多按钮
    
    more_show.style.display = checkList[0].checked ? "block" : "none";
    for (let i = 0; i < checkList.length; i++) {
        checkList[i].checked = checkList[0].checked;
    }
}

/* 是否已点击全选文件
*  @params
*  @return
*/
function isCheckAll() {
    let checkFirst = document.getElementsByClassName("checkbox")[0];
    if(checkFirst.checked) {
        checkFirst.checked = false;
    }
}

/* 将勾选的数据添加到数组中
*  @params
*  @return
*      checkSelect_list [array] 选择的文件数组
*/
function checkSelect() {
    let checkList = document.getElementsByClassName("checkbox"),  //选择框
        fileList = document.getElementsByClassName("file_name"),
        checkLen = checkList.length;
    for (let i = 1; i < checkLen; i++) {
        if (checkList[i].checked) {
            addList(fileList[i - 1].innerText);
        }
    }
    for (let i = 0; i < checkSelect_list.length; i++) {
        checkSelect_list[i] = "\"" + checkSelect_list[i] + "\"";
    }
    return checkSelect_list;
}

/* 鼠标点击位置到浏览器顶部的距离
*  @params
*      e 
*  @return
*      {width,height} [object] 宽高
*/
function mousePos(e) {
    e = e || window.event;
    let scrollW = document.documentElement.scrollLeft || document.body.scrollLeft;  //分别兼容ie和chrome
    let scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    let width = e.pageX || (e.clientX + scrollW);  //兼容火狐和其他浏览器
    let height = e.pageY || (e.clientY + scrollY);
    return {
        width: width,
        height: height
    };
}

/* 添加文件对象到一个大对象中
    *  @params
            Obj 要添加的某个对象
            bigObj 大对象
    *  @return
            bigObj 大对象
    */
function addFileObj(obj, bigObj) {
    let index = bigObj.length;
    bigObj[index] = obj;
    bigObj.length++;
    return bigObj;
}

/* 分片
    *  @params
            fileSize 文件大小
    *  @return
            chunkSize 分片的每片大小
    */
function chunk(fileSize) {
    let chunkSize = 0;
    //文件大小不大于10M,每片大小为文件大小
    if (fileSize <= (10 * 1024 * 1024)) {
        chunkSize = fileSize;
        console.log("0M-10M: " + chunkSize);
    }
    //文件大小范围：10M-1G,每片大小为10M
    else if (fileSize > (10 * 1024 * 1024) && fileSize <= (1024 * 1024 * 1024)) {
        chunkSize = 1024 * 1024 * 10; //10M
        console.log("10M-1G: " + chunkSize);
    }
    //文件大小范围：1G-10G,每片大小为文件大小除以100
    else if (fileSize > (1024 * 1024 * 1024) && fileSize <= (10 * 1024 * 1024 * 1024)) {
        chunkSize = Math.ceil(fileSize / 100); //分为100份
        console.log("1G-10G: " + chunkSize);
    }
    //文件大小大于10G
    else {
        alert("文件大小超过10G，请分卷压缩后上传！");
        chunkSize = 0;
    }
    return chunkSize;
}

/* 判断上传任务列表是否为空
*  @params
*  @return
*/
function isEmptyUpload() {
    let liList = $("#uploadList li"),
        nothing = $(".nothing"),
        progress = $(".upload-progress"),
        upload_img = nothing.children("img").eq(0),
        download_img = nothing.children("img").eq(1),
        info = nothing.children(".info"),
        len = 0;
    $.each(liList, function (index, item) {
        if ($(item).css("display") !== "none") len++;
    });
    // 判断列表内是否有任务
    if (len === 0) {
        progress.css("display", "none");
        nothing.css("display", "block");
        upload_img.css("display", "");
        download_img.css("display", "none");
        info.text("当前没有上传任务喔~");
    }
    else {
        nothing.css("display", "none");
        progress.css("display", "block");
    }
}

/* 判断下载任务列表是否为空
*  @params
*  @return
*/
function isEmptyDownload() {
    let liList = $("#downloadList li"),
        nothing = $(".nothing"),
        progress = $(".download-progress"),
        upload_img = nothing.children("img").eq(0),
        download_img = nothing.children("img").eq(1),
        info = nothing.children(".info"),
        len = 0;
    $.each(liList, function (index, item) {
        if ($(item).css(display) !== "none") len++;
    });
    // 判断列表内是否有任务
    if (len === 0) {
        progress.css("display", "none");
        nothing.css("display", "block");
        upload_img.css("display", "none");
        download_img.css("display", "");
        info.text("当前没有下载任务喔~");
    }
    else {
        nothing.css("display", "none");
        progress.css("display", "block");
    }
}
