package home

import (
	"github.com/duapple/beego_netdisk/controllers"
)

type ShareController struct {
	controllers.Controller
}

func (c *ShareController) Get() {
	userName := c.GetSession("username")
	if userName == nil {
		c.DestroySession()
		c.Ctx.Redirect(302, "/login")
	}
	c.TplName = "share.html"
}
