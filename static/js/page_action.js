// 是否新建文件夹
function isNew() {
	if (!newClick) {
		newFile();
	}
	else {
		let new_input = document.getElementsByClassName("new_input")[0];
		new_input.focus();  //聚焦到文本框内
	}
}

// 新建文件夹
function newFile() {
	newClick = true;
	// 回到顶部
	$('html,body').animate({ scrollTop: '0px' }, 800);
	let con = $(".content"),
		htmlStr = ``,
		tbody = $("tbody").eq(1);
	con.scrollTop(0);

	// 文件创建时间
	let myDate = new Date();
	let month = addZero(myDate.getMonth() + 1),
		date = addZero(myDate.getDate()),
		hour = addZero(myDate.getHours()),
		min = addZero(myDate.getMinutes()),
		sec = addZero(myDate.getSeconds()),
		timeText = myDate.getFullYear() + "-" + month + "-" + date + " " + hour + ":" + min + ":" + sec;
	htmlStr = `
        <tr class="trstyle">
            <td class="tdwidthbox">
                <label class="checklabel">
                    <input type="checkbox" class="checkbox">
                    <i class="check"></i>
                </label>
            </td>
            <td class="tdwidth1">
                <div class="file_name">
                    <input type="text" class="new_input">
                    <span class="icon">
                        <i class="icon_1"></i>
                        <i class="icon_2"></i>
                    </span>
                </div>
                <label class="dir_label">
                    <i class="dir_i"></i>
                </label>
            </td>
            <td class="tdwidth2">-</td>
            <td class="tdwidth3">${timeText}</td>
        </tr>
    `;
	tbody.prepend(htmlStr);

	let icon = $(".icon"),
		icon_save = $(".icon_1"),
		icon_cancel = $(".icon_2"),
		new_input = $(".new_input");
	new_input.focus(); //光标回到输入框内

	// 保存按钮
	icon_save.on('click', function (e) {
		stopPropagation(e);
		let input_value = new_input.val();  //获取文本框的数据
		if (!input_value) {
			alert("文件名称不能为空，请重新输入！");
			new_input.focus();
		}
		else {
			// 验证文件名
			if (!validateFileName(input_value)) {
				alert("文件名不能包含以下字符:[\\\\/:*?\"<>|]");
				new_input.focus();  //光标定位到输入框中
			}
			else {
				let new_data = `{"Opt":1,"DirName":["${input_value}"]}`;
				$.ajax(
					{
						url: home_rpc,
						data: new_data,
						type: "POST",
						async: false,
						success: function (data) {
							if (data.code == 1000) {
								// 隐藏新建文件夹的框，使添加的文件直接加入表格中
								new_input[0].className = "hide";
								icon_save[0].className = "hide";
								icon_cancel[0].className = "hide";
								console.log(icon)
								icon[0].className = "";
								icon[0].innerText = input_value;
								current_file = ".";
								queryData(current_file);
								return true;
							}
							else {
								alert(data.description);
								return false;
							}
						},
						error: function () {
							alert("Network error!")
						}
					});
			}
		}
		newClick = false;
	});

	// 取消按钮
	icon_cancel.on('click', function () {
		queryData(".");
		newClick = false;
	});
}

// 删除文件
function deleteFile() {
	current_file = ".";
	checkSelect();
	let del_data = `{"Opt":2,"DirName":[${checkSelect_list}]}`;
	if (checkSelect_list.length === 0) {
		alert("请先选择文件！");
		return;
	}
	$.ajax(
		{
			url: home_rpc,
			data: del_data,
			type: "POST",
			async: false,
			success: function (data) {
				if (data.code == 1000) {
					let menu = document.getElementsByClassName("menu")[0];  //右键的菜单
					menu.style.display = "none";
					checkSelect_list = [];
					isCheckAll();
					queryData(current_file);
					clearMoreBtn();
					return true;
				}
				else {
					alert(data.description);
					return false;
				}
			},
			error: function () {
				alert("Network error!")
			}
		});
}

// 文件查看刷新
function refresh() {
	let icon_refresh = document.getElementsByClassName("iconfont-refresh")[0],
		rotateval = 0;
	function rot() {
		rotateval = rotateval + 1;
		if (rotateval === 360) {
			clearInterval(interval);
			rotateval = 0;
			queryData(".");
		}
		icon_refresh.style.transform = 'rotate(' + rotateval + 'deg)';
	}
	let interval = setInterval(rot, 5);
}

// 上传文件
function upload(e) {
	upload_type = 1; //上传文件
	file_one = document.getElementById('file').files[0];  //获取上传的文件对象
	let form_info = new FormData(document.getElementById('filename'));  //获取上传的文件的formdata信息
	// 把formdata信息放入formObj
	formObj = addFileObj(form_info, formObj);
	// 把文件对象放入uploadFile_obj
	uploadFile_obj = addFileObj(file_one, uploadFile_obj);
	// 把e对象放入eObj
	eObj = addFileObj(e, eObj);
	// 当前上传请求所在的数组放入requestObj
	requestObj = addFileObj(currentRequest_arr, requestObj);
	if (end_lastLi) {  //如果上一个进度表创建完毕，则创建下一个（此时的进度表处于未结束状态）
		end_lastLi = false;
		addLi(index_uploadFile_obj);
	}
}

// 上传文件夹
function uploadDir() {
	upload_type = 2; //上传文件夹
	$('#folder').change(function (e) {
		eObj = addFileObj(e, eObj);
		let folder_name = null; //文件夹名
		let files = e.target.files; //所有文件
		files_arr = files;
		folder_name = (files[0].webkitRelativePath).split('/')[0]; //获取文件夹名

		//新建上传的同名文件夹
		let new_data = `{"Opt":1,"DirName":["${folder_name}"]}`;
		$.ajax(
			{
				url: home_rpc,
				data: new_data,
				type: "POST",
				async: false,
				success: function (data) {
					if (data.code == 1000) {
						console.log(data.description);
						queryData(folder_name);
						return true;
					}
					else {
						alert(data.description);
						return false;
					}
				},
				error: function () {
					alert("Network error!")
				}
			});
		index_uploadFile_obj = 0;
		addLi(index_uploadFile_obj);
	});
}

// 添加上传文件任务的进度表
function addLi(index) {
	let file = null;  //上传的文件
	if (upload_type === 1) {   //文件
		file = uploadFile_obj[index];
		index_uploadFile_obj = 0;  //新上传的文件对象的索引为0
	}
	else {   //文件夹
		file = files_arr[index];
		index_uploadFile_obj++;  //新上传的文件对象的索引递增
	}
	console.log(uploadFile_obj);
	console.log(index)
	console.log(file);
	let file_name = file.name,
		file_size = bytesToSize(file.size);
	newLoadli(file_name, file_size, current_dir[current_dir.length - 1]);
	end_lastLi = true;  //上一个进度表已完成创建
	if (upload_type === 1) {   //文件：结束上一个文件的上传后开始分片
		if (end_last) {  //上一个文件上传任务结束了才开始当前任务
			end_last = false;
			index_uploadFile_obj++;  //上一个文件没有上传完，新上传的文件对象的索引递增
			getFileMd5(0);
		}
	}
	else {   //文件夹：先把文件夹中的所有文件的上传进度表都创建完成再逐个分片
		if (index_uploadFile_obj >= files_arr.length) {
			index_uploadFile_obj = 0;  //文件全部完成上传，新上传的文件对象的索引归0
			getFileMd5(0);
		}
		else {
			addLi(index_uploadFile_obj);
		}
	}
}

/* 创建上传/下载进度表
*  @params
*      name,size,dir [string] 文件名，文件大小，上传目录
*  @return
*/
function newLoadli(name, size, dir) {
	let uploadList = $("#uploadList");

	let uploadStr = `
		<li class="status">
			<div class="process"></div>
			<div class="file-info">
				<div class="file-name">${name}</div>
				<div class="file-size">${size}</div>
				<div class="file-path">${dir}</div>
				<div class="file-status">等待上传</div>
				<div class="file-operate">
					<em class="pause"></em>
					<em class="remove"></em>
				</div>
			</div>
		</li>	
	`;
	uploadList.append(uploadStr);
}

/* 计算文件的MD5值
*  @params
*      index 当前索引(eObj,uploadFile_obj,files_arr) 
*  @return 
*/
function getFileMd5(index) {
	let e = eObj[index];
	let file = null;  //要计算的文件
	if (upload_type === 1) {  //文件
		file = uploadFile_obj[index];
	}
	else {  //文件夹
		file = files_arr[index];
	}
	console.log("------------计算中-----------");

	let fileReader = new FileReader(),
		box = document.getElementById("file_md5"),  //存放MD5值
		blobSlice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice,
		chunk_size = 2097152,  //2MB
		chunks = Math.ceil(file.size / chunk_size),
		currentChunk = 0,
		spark = new SparkMD5();
	console.log("共", chunks, "片");

	fileReader.onload = function (e) {
		console.log("正在解析第", currentChunk + 1, "片...");
		spark.appendBinary(e.target.result);
		currentChunk++;

		if (currentChunk < chunks) {
			loadNext();
		}
		else {
			box.innerText = spark.end();
			console.info("------------ MD5=" + box.innerText);
			md5_file = box.innerText;
			uploadEver(index);
		}
	};

	function loadNext() {
		let start = currentChunk * chunk_size,
			end = start + chunk_size >= file.size ? file.size : start + chunk_size;

		fileReader.readAsBinaryString(blobSlice.call(file, start, end));
	};

	loadNext();
}

/* 排队上传单个文件
*  @params
		index 文件数组索引
*  @return
*/
function uploadEver(index) {
	if (upload_type === 1) {
		file_obj = uploadFile_obj[index];
	}
	else {
		file_obj = files_arr[index];
	}
	console.log(file_obj)
	fileSize = file_obj.size;
	let file_name = file_obj.name;

	chunkSize = chunk(fileSize);  //每片的大小
	chunkNum = Math.ceil(fileSize / chunkSize);  //总片数
	let upload_data = `{"Option":"uploadFile","FileName":"${file_name}","Size":"${fileSize}","ChunkNum":"${chunkNum}","MD5":"${md5_file}","ChunkPos":"1"}`;
	console.log(upload_data);
	$.ajax(
		{
			url: uploadreq_rpc,
			data: upload_data,
			type: "POST",
			async: false,
			success: function (data) {
				if (data.code == 1000) {
					argItem[0] = file_name;
					argItem[1] = md5_file;
					currentRequest_arr.push(argItem); //把文件名、MD5和请求放入当前请求数组
					uploadFile(0);
					return true;
				}
				else {
					alert(data.description);
					return false;
				}
			},
			error: function () {
				alert("Network error!")
			}
		});
}

/* 分片上传文件
*  @params
		start [number] 起始字节
*  @return
*/
function uploadFile(start) {
	current_file = ".";
	endupload_flag = false;
	// 上传完成 
	if (start >= fileSize) {
		console.log("------------上传完成......");
		end_last = true;
		endupload_flag = true;
		process_global = 0;
		chunkNum_uploaded = 1;
		if (upload_type === 1) {
			obj_index++;
			if (obj_index >= uploadFile_obj.length) { //文件全部上传完毕
				uploadFile_obj = {
					length: 0
				};
				queryData(current_file);
			}
			else {
				getFileMd5(obj_index);
			}
		}
		else {
			file_index++;
			if (file_index >= files_arr.length) {  //文件夹的文件上传完毕
				queryData(current_file);
			}
			else {
				getFileMd5(file_index);
			}
		}
		return;
	}
	// 获取文件块的终止字节
	end = (start + chunkSize > fileSize) ? fileSize : (start + chunkSize);

	// 将文件切块上传
	let form_data = formObj[obj_index]; //获取表单信息
	let formData = new FormData();
	if (upload_type === 2) { //上传文件夹
		formData.append("uploadfile", file_obj.slice(start, end)) //将获取的文件分片赋给新的对象
	}
	else { //上传文件
		formData.append("uploadfile", form_data.get("uploadfile").slice(start, end)) //将获取的文件分片赋给新的对象
	}

	$.ajax({
		url: upload_rpc,
		data: formData,
		type: "POST",
		cache: false,
		processData: false,
		contentType: false, //必须false才会自动加上正确的Content-Type
		//这里我们先拿到jQuery产生的 XMLHttpRequest对象，为其增加 progress 事件绑定，然后再返回交给ajax使用
		xhr: function () {
			let xhr = $.ajaxSettings.xhr();
			if (xhr.upload) {
				xhr.upload.onprogress = function (progress) {
					updateProgress(progress);
				};
			}
			argItem[2] = xhr; //将每个上传任务的每一片存入requestObj对象中，该对象存入的是request_arr数组中
			argItem = [];
			return xhr;
		},
		success: function (data) {
			if (data.code == 1000) {
				chunkNum_uploaded++;
				console.log("准备上传第" + chunkNum_uploaded + "片......");
				uploadFile(end);
			}
			else {
				alert(data.description);
				return false;
			}
		}
	});
}

/* 文件上传进度
*  @params
*      progress [object] 上传进度对象
*  @return
*/
function updateProgress(progress) {
	let uploadList = document.getElementById("uploadList"),
		len = uploadList.children.length,
		thisIndex = 0, //索引
		total_proc = 0; //总进度
	if (upload_type === 1) {
		thisIndex = obj_index;
	}
	else {
		thisIndex = file_index;
	}
	let process = uploadList.getElementsByClassName("process")[thisIndex], //li对应的进度标签
		status = uploadList.getElementsByClassName("file-status")[thisIndex],
		operate = uploadList.getElementsByClassName("file-operate")[thisIndex],
		em1 = operate.getElementsByTagName("em")[0],
		em2 = operate.getElementsByTagName("em")[1],
		total = document.getElementsByClassName("total")[0];
	if (progress.lengthComputable) {
		console.log("loaded:" + progress.loaded, "total:" + progress.total);
		let current_progress = progress.loaded / progress.total; //当前片的进度
		process_global = (((chunkNum_uploaded - 1) / chunkNum) + (current_progress / chunkNum)) * 100; //每个文件总进度 = （已上传的片数/总片数 + 当前片的进度/总片数） * 100
		let percent = process_global.toFixed(2) + "%";
		console.log("percent:" + percent);
		process.style.width = percent; //每个文件的进度
		status.innerText = percent; //每个文件的进度值
		total_percent[thisIndex] = process_global.toFixed(2);
		if (upload_type === 2) { //文件夹
			let len = files_arr.length;
			for (let i = 0; i < total_percent.length; i++) {
				let sum = total_percent[i] / len;
				total_proc += sum;
			}
		}
		else { //文件
			let len = uploadFile_obj.length;
			for (let i = 0; i < total_percent.length; i++) {
				let sum = total_percent[i] / len;
				total_proc += sum;
			}
		}
		console.log("total_percent:" + Math.round(total_proc));
		total.style.width = Math.round(total_proc) + "%"; //总进度
		if (process_global == 100) {
			status.innerText = "上传成功";
			status.style.color = "#9a079a";
			em1.className = "clear";
			em2.className = "";
		}
	}
}

/* 暂停文件
*  @params
		index 任务列表索引
*  @return
*/
function pauseUpload(index) {
	console.log(requestObj);
	console.log(requestObj[index]);
	console.log(requestObj[index][0]);
	console.log(requestObj[index][0][2]);
	requestObj[index][0][2].abort(); //中止当前上传任务中的已上传的最后一片
	if (index < requestObj.length - 1) {
		index++;
		chunkNum_uploaded = 1;
		getFileMd5(index);
	}
}

/* 续传文件
*  @params
		index 任务列表索引
*  @return
*/
function reUpload(index) {
	let file_name = null;
	if (upload_type === 1) {
		file_name = uploadFile_obj[index].name;
	}
	else {
		file_name = files_arr[index].name;
	}

	let upload_data = `{"Option":"reUploadFile","FileName":"${file_name}","Size":"${fileSize}","ChunkNum":"${chunkNum}","MD5":"${md5_file}","ChunkPos":"${chunkNum_uploaded}"}`;
	console.log(upload_data);
	$.ajax(
		{
			url: uploadreq_rpc,
			data: upload_data,
			type: "POST",
			async: false,
			success: function (data) {
				if (data.code == 1000) {
					console.log(data.description);
					uploadFile(end - chunkSize);
					return true;
				}
				else {
					alert(data.description);
					return false;
				}
			},
			error: function () {
				alert("Network error!")
			}
		});
}

/* 跳转到传输列表
*  @params
*  @return
*/
function toTransport() {
	current_file = ".";
	let upload_module = $(".upload-progress"), //上传
		download_module = $(".download-progress")[0], //下载
		netdisk = $(".nav-title li").eq(0),
		transport = $(".nav-title li").eq(1),
		transport_content = $(".transport-content"),
		main_content = $(".main-content"),
		disk = $(".disk"),
		trans = $(".trans"),
		download = $(".trans div").eq(0), //左侧下载菜单
		upload = $(".trans div").eq(1); //左侧上传菜单
	// 顶部导航的显示
	main_content.css("display", "none");
	disk.css("display", "none");
	netdisk[0].className = "";
	transport_content.css("display", "block");
	trans.css("display", "block");
	transport[0].className = "active";

	isEmptyUpload();

	// 点击下载
	download.onclick = function () {
		download.css("background", "#e2ddec");
		upload.css("background", "#f8f7f7");
		upload_module.css("display", "none");
		download_module.css("display", "block");
		isEmptyDownload();
	}

	// 点击上传
	upload.onclick = function () {
		upload.css("background", "#e2ddec");
		download.css("background", "#f8f7f7");
		download_module.css("display", "none");
		upload_module.css("display", "block");
		isEmptyUpload();
	}

	let uploadList = $("#uploadList")[0],
		liList = uploadList.getElementsByTagName("li"),
		total = document.getElementsByClassName("total")[0],
		operationList = document.getElementsByClassName("file-operate"),
		opeLen = operationList.length;
	(function () {
		for (let i = 1; i < opeLen - 1; i++) {
			let em_btn = operationList[i].getElementsByTagName("em")[0],
				em_cancel = operationList[i].getElementsByTagName("em")[1];

			em_btn.onclick = function () {
				if (em_btn.className != 'clear') {
					// 如果当前为暂停图标
					if (em_btn.className == "pause") {
						em_btn.className = "continue";
						pauseUpload(i - 1);
					}
					// 如果当前为继续图标
					else {
						em_btn.className = "pause";
						reUpload(i - 1);
					}
				}
				else { // 如果当前为清除图标
					liList[i - 1].style.display = "none";
					isEmptyUpload();
				}
			}
			// 点击移除图标
			em_cancel.onclick = function () {
				pauseUpload(i - 1);
				cancelUpload(i - 1);
				uploadList.removeChild(uploadList.children[i - 1]);
				total.style.width = 0;
				isEmptyUpload();
			}
		}
	})();
}

/* 跳转到我的网盘
*  @params
*  @return
*/
function toDisk() {
	let netdisk = $(".nav-title li").eq(0),
		transport = $(".nav-title li").eq(1),
		transport_content = $(".transport-content"),
		main_content = $(".main-content"),
		disk = $(".disk"),
		trans = $(".trans");
	main_content.css("display", "block");
	disk.css("display", "block");
	netdisk[0].className = "active";
	transport_content.css("display", "none");
	trans.css("display", "none");
	transport[0].className = "";
}

/* 全部暂停下载
*  @params
*  @return
*/
function pauseList() {
	let pause = document.getElementsByClassName("total-pause")[0],
		uploadList = document.getElementById("uploadList"),
		liList = uploadList.getElementsByTagName("li"),
		len = liList.length;
	if (pause.innerText === "全部暂停") {
		for (let i = 0; i < len; i++) {
			pauseUpload(i);
		}
		pause.innerText = "全部开始";
	}
	else {
		for (let i = 0; i < len; i++) {
			reUpload(i);
		}
		pause.innerText = "全部暂停";
	}
}

/* 下载文件
*  @params
*  @return
*/
function downloadFile() {
	console.log(select_file);
	let form = document.createElement("form"),
		input = document.createElement("input");
	form.style.display = "none";
	form.method = "post";
	form.action = download_rpc;
	form.enctype = "multipart/form-data";
	input.type = "hidden";
	input.name = "downloadfile";
	input.value = select_file;
	form.appendChild(input);
	document.body.appendChild(form);

	let form_data = new FormData(form);
	form.submit();
}

/* 取消上传文件
*  @params
		index 任务列表索引
*  @return
*/
function cancelUpload(index) {
	let file_name = null;
	if (upload_type === 1) {  //文件
		file_name = uploadFile_obj[index].name;
	}
	else {   //文件夹
		file_name = files_arr[index].name;
	}

	let upload_cancel = `{"Option":"uploadCancel","FileName":"${file_name}","Size":"","ChunkNum":"","MD5":"","ChunkPos":""}`;
	console.log(upload_cancel);
	$.ajax(
		{
			url: uploadreq_rpc,
			data: upload_cancel,
			type: "POST",
			async: false,
			success: function (data) {
				if (data.code == 1000) {
					console.log(data.description);
					return true;
				}
				else {
					alert(data.description);
					return false;
				}
			},
			error: function () {
				alert("Network error!")
			}
		});
}

/* 全部取消下载
*  @params
*  @return
*/
function cancelList() {
	let uploadList = document.getElementById("uploadList"),
		liList = uploadList.getElementsByTagName("li"),
		len = liList.length;
	for (let i = 0; i < len; i++) {
		pauseUpload(i);
		cancelUpload(i);
	}
}