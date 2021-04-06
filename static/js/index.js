// 加载页面
function loadPage() {
	queryData(current_path);
}

// 获取数据
function queryData(ret) {
	let index_data = `{"dir_option":"dir_option_read","dir_name":["${ret}"]}`;
	$.ajax({
		url: home_rpc,
		data: index_data,
		type: "POST",
		async: false,
		success: function (result) {
			if (result.code === 0) {
				_DATA = result.data;
				console.log(_DATA);
				return true;
			}
			else {
				alert(result.msg);
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
		if (key !== "current_path") {
			// 遍历属性值(数组形式)	
			if (key === "dirs") {
				if (_DATA[key]) {
					_DATA[key].forEach(item => {
						let { dir_name, size, modification_time } = item;
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
										<span>${dir_name}</span>
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
								<td class="tdwidth2">${size}</td>
								<td class="tdwidth3">${modification_time}</td>
							</tr>
						`;
					});
				}
			}
			else if (key === "files") {
				if (_DATA[key]) {
					_DATA[key].forEach(item => {
						let { file_name, size, modification_time } = item;
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
											<span>${file_name}</span>
										</div>
										<label class="dir_label">
											<i class="${isFileType(file_name)}"></i>
										</label>
										<div class="div_icon" style="display: none;">
											<i class="icon_share"></i>
											<i class="icon_download"></i>
											<i class="icon_more"></i>
										</div>
									</td>
									<td class="tdwidth2">${size}</td>
									<td class="tdwidth3">${modification_time}</td>
								</tr>
							`;
					});
				}
			}
		}
		else {
			current_path = _DATA.current_path;
			current_dirname_arr =  _DATA[key] === "/" ? [""] : (_DATA[key].split('/')); //以数组的形式存储路径的文件夹名
			let str = ``,
				text = "";
			for (let i = 0; i < current_dirname_arr.length; i++) {
				if (current_dirname_arr[i] === "") {
					text = "全部文件";
				}
				else {
					text = current_dirname_arr[i];
				}
				str += `
						<a class="file_system_a">${text}</a>
						${(i === current_dirname_arr.length - 1) ? "" : "<span class='file_system_span'>></span>"}
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
		if(trList.index($(this)) === 0)	return;
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
		dir_name = filenameList[i].innerText;
		stopPropagation(e);
		more_show.css("display", "none");
		current_path  = current_path === "/" ? (current_path + dir_name) : (current_path + "/" + dir_name);
		if ($(i_list).eq(i).hasClass("dir_i")) { //文件夹可以点击进入
			queryData(current_path);
		}
		else { //文件不可以点击进入
			return;
		}
	});

	// 鼠标双击某行
	fileList.on('dblclick', function (e) {
		stopPropagation(e);
		let i = fileList.index($(this));
		dir_name = fileList[i].innerText;
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
		current_path  = current_path === "/" ? (current_path + dir_name) : (current_path + "/" + dir_name);
		if (!($(i_list).hasClass("dir_i"))) { //是文件不可进入
			return;
		}
		else { //文件夹可以进入
			queryData(current_path);
		}
	});

	// 右键文件弹出菜单
	trList.on('mousedown', function (e) {
		// 右键弹出菜单
		if (e.button == 2) {
			cleanLastHandle(lastIndex_rightBtn);
			container.css("overflow", "hidden");
			let data_index = $(this).attr('data-index');
			if (!(trList.eq(data_index)) || data_index === "0") {
				return;
			}
			else {
				cssLeftHandle(data_index);
				lastIndex_rightBtn = data_index; //保存当前的index
			}
			current_dom = $(this);
			select_file = ($(this).find("span").eq(0)).text();  //当前点击的文件名
			menu.css("display", "block");
			// 根据鼠标点击位置和浏览器顶部的距离更改菜单的位置
			let obj = mousePos(e);
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
		let i = $(this).index();
		i = i === current_dirname_arr.length ? (i - 1) : i;
		current_dirname_arr.splice(i);
		current_path = current_dirname_arr.join('/');
		queryData(current_path);
	});
}