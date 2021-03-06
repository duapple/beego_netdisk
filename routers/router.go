package routers

import (
	beego "github.com/beego/beego/v2/server/web"
	"github.com/duapple/beego_netdisk/controllers/download"
	"github.com/duapple/beego_netdisk/controllers/home"
	"github.com/duapple/beego_netdisk/controllers/login"
	"github.com/duapple/beego_netdisk/controllers/upload"
)

func init() {
	beego.Router("/", &login.LoginController{})

	beego.Router("/login", &login.LoginController{})
	beego.Router("/logout", &login.LogoutController{})
	beego.Router("/authentication", &login.AuthenticationController{})
	beego.Router("/register", &login.RegisterController{})
	beego.Router("/deregister", &login.DeregisterController{})
	beego.Router("/edit_account", &login.EditAcountCtontroller{}) /* 修改账户 */
	beego.Router("/account", &login.AcountController{})

	beego.Router("/index", &home.IndexController{})
	beego.Router("/dir_option", &home.DirOptionController{})

	beego.Router("/upload", &upload.UploadController{})
	beego.Router("/upload_chunk", &upload.UploadChunkController{})
	beego.Router("/upload_chunk_get", &upload.UploadChunkGetController{})

	beego.Router("/download", &download.DownloadController{})
}
