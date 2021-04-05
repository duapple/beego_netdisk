package controllers

import (
	"errors"

	"github.com/beego/beego/v2/core/logs"
	beego "github.com/beego/beego/v2/server/web"
	"github.com/duapple/beego_netdisk/controllers/userptl"
)

/* 重定义的类型不会拥有原来类型的方法 */
// type Controller beego.Controller

type Controller struct {
	beego.Controller
}

type Form_Data struct {
	Name string `form:"test"`
}

func (c *Controller) Session_Check(responseJson *userptl.ResponseBody,
	userName *string) (data []byte, ok bool) {
	if responseJson == nil || userName == nil {
		panic("Parameter nil.")
	}

	currentUser := c.GetSession("username")
	if currentUser == nil {
		c.DestroySession()
		c.Ctx.Redirect(302, "/login")
	}

	data = c.Ctx.Input.RequestBody
	logs.Info(string(data))

	*userName, ok = currentUser.(string)
	if !ok {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Code:   userptl.ERROR_DATA_ANALYSIS,
			Msg:    "Get session user error.",
			Data:   "",
		}
	}

	return
}

func (c *Controller) Session_Check_Form(userName *string) (ok bool) {
	if userName == nil {
		panic("Parameter nil.")
	}

	currentUser := c.GetSession("username")
	if currentUser == nil {
		c.DestroySession()
		c.Ctx.Redirect(302, "/login")
	}

	*userName, ok = currentUser.(string)

	return
}

func (c *Controller) Body_Check() (data []byte) {
	data = c.Ctx.Input.RequestBody
	logs.Info(string(data))

	return
}

func (c *Controller) Get_Current_Path(currentUser string) (currentPath string, err error) {
	path := c.GetSession("current_path")
	if path == nil {
		currentPath = "/"
		c.SetSession("current_path", currentPath)
		return
	}

	currentPath, ok := path.(string)
	if !ok {
		err = errors.New("get session current path error")
	}

	return
}
