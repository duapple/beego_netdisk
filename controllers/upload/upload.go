package upload

import (
	"github.com/beego/beego/v2/core/logs"
	"github.com/duapple/beego_netdisk/controllers"
)

type UploadController struct {
	controllers.Controller
}

func (rec *UploadController) Post() {
	_, h, err := rec.GetFile("file")
	if err != nil {
		logs.Info("getfile err ", err)
	}

	logs.Info("filename:", h.Filename)
	rec.SaveToFile("file", "./"+h.Filename)
	rec.Ctx.WriteString("hello 1111")
}
