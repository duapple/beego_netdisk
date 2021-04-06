let host = "localhost:9090";

// 链接地址
let login_href = "http://" + host + "/login",
    regist_href = "http://" + host + "/register",
    index_href = "http://" + host + "/index",
    share_href = "http://" + host + "/share",
    account_href = "http://" + host + "/account",
    logout_href = "http://" + host + "/logout";

// 接口
let login_rpc = "http://" + host + "/authentication",
    register_rpc = "http://" + host + "/register",
    modify_rpc = "http://" + host + "/edit_account",
    deregister_rpc = "http://" + host + "/deregister",
    home_rpc = "http://" + host + "/dir_option",
    logout_rpc = "http://" + host + "/logout",
    upload_rpc = "http://" + host + "/upload",
    download_rpc = "http://" + host + "/download",
    uploadreq_rpc = "http://" + host + "/upload_request";

let _DATA,  //目录数据(JSON格式)
    index = 0;  //key_word的索引

let username = localStorage.getItem("user"), //用户名
    password = localStorage.getItem("password"), //密码
    current_path = "/",  //当前所在的文件夹
    select_file = "",  //当前选中的某个文件，用于下载
    current_dirname_arr = [],  //当前文件夹路径组成的数组，主要用于路径跳转
    dir_name = "",  //当前点击的文件夹
    checkSelect_list = [],  //选中的文件数组
    newClick = false, //新建文件夹正在被调用标识
    md5_file = null, //转换为md5后的文件

    /*重命名需要的变量*/
    current_dom = null;

    /*切片需要的变量*/
    chunkNum = 0, //分片数
    chunkNum_uploaded = 1, //已上传片数
    end = 0, //结束字节

    upload_type = null, //上传类型:1是文件，2是文件夹

    /*上传文件需要的变量*/
    file_one = null, //上传文件的文件对象
    request = null,
    requestObj = {
        length: 0
    }, //上传请求，用于暂停
    currentRequest_arr = [],  //当前上传请求所在的数组
    argItem = [],  //保存每个文件的文件名、MD5值和request请求
    eObj = {
        length: 0
    }, //存储绑定的e对象
    formObj = {
        length: 0
    }, //存储每次点击上传文件里的文件的formdata信息
    uploadFile_obj = {
        length: 0
    }, //存储当前点击上传文件里的文件
    index_uploadFile_obj = 0, //新上传的文件对象的索引，用于添加多少个上传进度表
    obj_index = 0, //uploadFile_obj的索引属性
    end_last = true, //上一个文件上传结束的标识
    end_lastLi = true, //上一个进度表结束的标识

    /*上传文件夹需要的变量*/
    files_arr = null, //文件夹里包含的文件组成的数组
    file_index = 0, //文件夹里的文件数组的索引
    file_obj = null, //上传文件夹里的每个文件

    endupload_flag = true, //每个文件上传结束的标识
    process_global = 0, //每个文件总进度总进度
    total_percent = []; //总进度条数组：里面的值为每个文件的总进度，数组里的值相加能得到总进度条的值

let chunkSize = 0, //每片的大小
    fileSize = 0;  //文件大小

let result = null,
    xmlHttp = null;