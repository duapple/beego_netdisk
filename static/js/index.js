// 加载页面
function loadPage() {
	queryData(current_file);
}

// 获取数据
function queryData(ret) {
	let index_data = `{"Opt":0,"DirName":["${ret}"]}`;
	console.log(index_data);
	$.ajax({
		url: home_rpc,
		data: index_data,
		type: "POST",
		async: false,
		success: function (data) {
			if (data) {
				_DATA = data;
				return true;
			}
			else {
				return false;
			}
		},
		error: function () {
			alert("Network error!")
		}
	});
	bindHTML();
	clickHandle();
}

// 把数据绑定在页面中
function bindHTML() {
	if (!_DATA) return;
	let file_system = $(".file_system"),  //当前所在文件路径
		htmlStr = ``,
		tbody = $("tbody").eq(1);
	index = 0;

	// 遍历数据(json格式)
	for (let key in _DATA) {
		if (key !== "CurrentDir") {
			// 遍历属性值(数组形式)	
			if (key === "Dirs") {
				if (_DATA[key]) {
					_DATA[key].forEach(item => {
						let { DirName, Size, ModTime } = item;
						dirs_files_data[index] = DirName;
						index++;
						htmlStr += `
							<tr class="trstyle">
								<td class="tdwidthbox">
									<label class="checklabel">
										<input type="checkbox" class="checkbox">
										<i class="check"></i>
									</label>
								</td>
								<td class="tdwidth1">
									<div class="file_name">
										<span>${DirName}</span>
									</div>
									<label class="dir_label">
										<i class="dir_i"></i>
									</label>
									<div class="div_icon" style="display: none;">
										<i class="icon_share"></i>
										<i class="icon_download"></i>
										<i class="icon_more"></i>
									</div>
								</td>
								<td class="tdwidth2">${Size}</td>
								<td class="tdwidth3">${ModTime}</td>
							</tr>
						`;
					});
				}
			}
			else if (key === "Files") {
				if (_DATA[key]) {
					_DATA[key].forEach(item => {
						let { FileName, Size, ModTime } = item;
						dirs_files_data[index] = FileName;
						index++;
						htmlStr += `
								<tr class="trstyle">
									<td class="tdwidthbox">
										<label class="checklabel">
											<input type="checkbox" class="checkbox">
											<i class="check"></i>
										</label>
									</td>
									<td class="tdwidth1">
										<div class="file_name">
											<span>${FileName}</span>
										</div>
										<label class="dir_label">
											<i class="${isFileType(FileName)}"></i>
										</label>
										<div class="div_icon" style="display: none;">
											<i class="icon_share"></i>
											<i class="icon_download"></i>
											<i class="icon_more"></i>
										</div>
									</td>
									<td class="tdwidth2">${Size}</td>
									<td class="tdwidth3">${ModTime}</td>
								</tr>
							`;
					});
				}
			}
		}
		else {
			current_dir = _DATA[key].slice(0, -1).split('/'); //以数组的形式存储路径
			let str = ``,
				text = "";
			for (let i = 2; i < current_dir.length; i++) {
				if (current_dir[i] === username) {
					text = "全部文件";
				}
				else {
					text = current_dir[i];
				}
				str += `
						<a class="file_system_a">${text}</a>
						${(i === current_dir.length - 1) ? "" : "<span class='file_system_span'>></span>"}
					`;
				file_system.html(str);
			}
		}
	}
	tbody.html(htmlStr);
}

// 处理点击
function clickHandle() {
	let container = $(".content"),  //文件目录表格所在的区域
		menu = $(".menu");  //右键的菜单
	let trList = $("tr"), //每一行文件
		checkList = $(".checkbox"),  //文件左侧的选择框
		fileList = $(".file_name"), //文件名集合
		iconList = $(".div_icon"),
		more_show = $(".more"), //更多按钮
		labelList = $(".checklabel"),
		tdList = $(".tdwidth1"),
		systemList = $(".file_system_a"),
		lastIndex_leftBtn = 0,  //左键的上一次点击
		lastIndex_rightBtn = 0;  //右键的上一次点

	trList.each(function (index, item) {
		$(this).attr("data-index", index);
	});

	// 鼠标经过上传按钮显示上传和上传文件夹选项
	let upload_btn = $(".upload"),
		upload_ul = $(".upload_file"),
		el = $('#file')[0];
	el.addEventListener('change', upload, false); //给上传文件按钮绑定点击事件

	// 鼠标划过表格第一行不变换背景色
	trList.eq(0).on('mousemove', function () {
		trList.eq(0).css("background", "none");
	});

	// 屏蔽默认右键菜单
	container.on('contextmenu', function (event) {
		event.preventDefault();
	});

	// 整个页面点击鼠标左键关闭菜单
	$("html").on('click', function (e) {
		stopPropagation(e);
		menu.css("display", "none");
	});

	// 整个页面禁止双击选中文字
	document.onselectstart = function () {
		return false;
	}

	//鼠标经过/离开上传按钮显示/隐藏上传选项
	upload_btn.on('mouseenter', function () {
		upload_ul.css("display", "block");
	}).on('mouseleave', function () {
		upload_ul.css("display", "none");
	});

	// 清除上一次点击样式，并添加当前点击样式
	function cssLeftHandle(data_index) {
		// 清除上一次左键点击的样式
		trList.eq(lastIndex_leftBtn).css("background", "none");
		trList.eq(lastIndex_leftBtn).attr("isClick", false);
		checkList.eq(lastIndex_leftBtn).prop("checked", false);
		// 添加背景颜色
		trList.eq(data_index).css("background", "#e8f6fd");
		// 选中方框
		checkList.eq(data_index).prop("checked", true);
		trList.eq(data_index).attr("isClick", true);
	}

	// 清除上一次左/右键点击的样式
	function cleanLastHandle(btn) {
		trList.eq(btn).css("background", "none");
		trList.eq(btn).attr("isClick", false);
		checkList.eq(btn).prop("checked", false);
	}

	// 左键点击表格某一行添加背景色并清除上一次点击行的背景色
	trList.on('click', function (e) {
		stopPropagation(e); //阻止冒泡
		let $this = $(this);
		// 清除所有选中框的样式
		clearBox();
		more_show.css("display", "block"); //显示更多按钮
		cleanLastHandle(lastIndex_rightBtn);
		cleanLastHandle(lastIndex_leftBtn);
		let data_index = $this.attr('data-index');
		if (!(trList.eq(data_index))) {
			return;
		}
		else {
			cssLeftHandle(data_index);
			lastIndex_leftBtn = data_index; //保存当前的index
		}
	});

	// 鼠标停留/离开时显示/隐藏每行的操作图标
	trList.on('mouseenter', function (e) {
		stopPropagation(e); //阻止冒泡
		iconList.eq(trList.index($(this)) - 1).css("display", "block");
	}).on('mouseleave', function (e) {
		stopPropagation(e); //阻止冒泡
		iconList.eq(trList.index($(this)) - 1).css("display", "none");
	});

	// 选中表格中的某行选择框添加背景色
	labelList.on('click', function (e) {
		stopPropagation(e);
		menu.eq(0).css("display", "none");
		let index = labelList.index($(this));
		if (index === 0) return;
		if (checkList.eq(index).prop("checked")) {
			checkList.eq(index).prop("checked", false);
			trList.eq(index).css("background", "none");
			clearMoreBtn();
		}
		else {
			checkList.eq(index).prop("checked", true);
			trList.eq(index).css("background", "#e8f6fd");
			clearMoreBtn();
		}
	});

	// 左键点击查看文件夹
	let filenameList = [],  //文件名集合
		i_list = [];	//图标集合
	for (let i = 0; i < fileList.length; i++) {
		filenameList.push($(fileList[i]).find("span")[0]);
	}
	for (let i = 1; i < tdList.length; i++) {
		i_list.push($(tdList[i]).find("i")[0]);
	}
	$(filenameList).on('click', function (e) {
		let i = $(filenameList).index($(this));
		stopPropagation(e);
		more_show.css("display", "none");
		current_file = dirs_files_data[i]; //存储当前点击的文件夹名
		if ($(i_list).eq(i).hasClass("dir_i")) { //文件夹可以点击进入
			dirs_files_data = [];
			queryData(current_file);
		}
		else { //文件不可以点击进入
			return;
		}
	});

	// 鼠标双击某行
	fileList.on('dblclick', function (e) {
		stopPropagation(e);
		let i = fileList.index($(this));
		more_show.css("display", "none");
		clearBox();
		cleanLastHandle(lastIndex_rightBtn);
		let data_index = $(this).attr('data-index');
		if (!(trList.eq(data_index))) {
			return;
		}
		else {
			cssLeftHandle(data_index);
			lastIndex_leftBtn = data_index; //保存当前的index
		}
		current_file = dirs_files_data[i];
		if (!($(i_list).hasClass("dir_i"))) { //是文件不可进入
			return;
		}
		else { //文件夹可以进入
			dirs_files_data = [];
			queryData(current_file);
		}
	});

	// 右键文件弹出菜单
	trList.on('mousedown', function (e) {
		// 右键弹出菜单
		if (e.button == 2) {
			cleanLastHandle(lastIndex_rightBtn);
			container.css("overflow", "hidden");
			let data_index = $(this).attr('data-index');
			if (!(trList.eq(data_index))) {
				return;
			}
			else {
				cssLeftHandle(data_index);
				lastIndex_rightBtn = data_index; //保存当前的index
			}
			select_file = ($(this).find("span").eq(0)).text();  //当前点击的文件名
			menu.css("display", "block");
			// 根据鼠标点击位置和浏览器顶部的距离更改菜单的位置
			let obj = mousePos(e);
			console.log(obj)
			if (obj.width > 420) {
				menu.css("left", obj.width - 330 + "px");
			}
			else {
				menu.css("left", "90px");
			}
			if (obj.height < 700) {
				menu.css("top", obj.height - 108 + "px");
			}
			else {
				menu.css("top", "570px");
			}
		}
		// 左键关闭菜单
		else if (e.button == 0) {
			container.css("overflow", "auto");
			menu.css("display", "none");
		}
	});

	// 点击路径跳转文件夹
	systemList.on('click', function () {
		let current = $(this).text(), //当前点击路径名
			index_find = current_dir.indexOf(current),  //在已存的点击的文件夹集合里找当前点击路径名
			jump_num = 0;
		if (index_find !== -1) {
			jump_num = (current_dir.length - 1) - index_find; //跳转次数
			for (let i = 0; i < jump_num; i++) {
				returnFile();
			}
		}
		else { //点击的路径名为“全部文件”时跳转到根目录下
			jump_num = (current_dir.length - 1) - 2;
			for (let i = 0; i < jump_num; i++) {
				console.log("***jump第" + i + "次");
				returnFile();
			}
		}
	});
}