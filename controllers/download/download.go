package download

import (
	"path"

	"github.com/beego/beego/v2/adapter/logs"
	"github.com/duapple/beego_netdisk/controllers"
	"github.com/duapple/beego_netdisk/controllers/home"
	"github.com/duapple/beego_netdisk/controllers/userptl"
)

type DownloadController struct {
	controllers.Controller
}

type Download_File struct {
	File string `form:"test"`
}

func (c *DownloadController) Post() {

	var currentUser string
	var responseJson userptl.ResponseBody
	var err error

	ok := c.Session_Check_Form(&currentUser)
	if !ok {
		return
	}

	defer func() {
		if err != nil {
			logs.Error(err)
			responseJson.PrintBody()
			c.Data["json"] = responseJson
			c.ServeJSON()
		}
	}()

	currentPath, err := c.Get_Current_Path(currentUser)
	if err != nil {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	file := c.GetString("download_file")
	logs.Info("file: ", file)

	path := path.Clean(home.RootPath + currentUser + "/" + currentPath + "/" + file)

	logs.Info("File: ", path)

	c.Ctx.Output.Download(path)
}
