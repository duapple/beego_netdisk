let titleList = $(".content .left li"),
    mainList = $(".main .main-info"),
    spanList = $(".main-active .title span"),
    title_index = 0;
spanList.eq(1).text(username);

// 点击选项显示不同的内容
titleList.on('click', function (e) {
    stopPropagation(e);
    title_index = $(this).index();
    $(this).addClass('active');
    $(this).siblings().removeClass('active');
    mainList.eq(title_index).removeClass('hide');
    mainList.eq(title_index).addClass('main-active');
    // 修改兄弟节点的类
    mainList.eq(title_index).siblings().removeClass('main-active');
    mainList.eq(title_index).siblings().addClass('hide');
    if (title_index === 2) {
        let username_input = $(".name input");
        username_input.val(username);
    }
    else if (title_index === 3) {
        let username_span = $(".main-active .info li span").eq(1);
        console.log(username_span)
        username_span.text(username);
    }
});

// 修改密码
function modify_pwd() {
    let password_input = $(".pwd input");
    let old_pwd = password,
        new_pwd = b64_md5(password_input.val());
    let modify_data = `[{"username":"${username}","password":"${old_pwd}"},{"username":"${username}","password":"${new_pwd}"}]`;

    $.ajax({
        url: modify_rpc,
        data: modify_data,
        type: "POST",
        async: false,
        success: function (result) {
            if (result.code == 0) {
                window.location.href = login_href;
                return true;
            }
            else {
                alert(result.msg);
                return false;
            }
        },
        error: function () {
            alert("服务器错误")
        }
    });
}

// 注销账号
function deregister() {
    let pwd = password
        deregister_data = `{"username":"${username}","password":"${pwd}"}`;

    $.ajax({
        url: deregister_rpc,
        data: deregister_data,
        type: "POST",
        async: false,
        success: function (result) {
            if (result.code == 0) {
                window.location.href = login_href;
                return true;
            }
            else {
                alert(result.msg);
                return false;
            }
        },
        error: function () {
            alert("服务器错误")
        }
    });
}