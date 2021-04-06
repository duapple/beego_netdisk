package home

import (
	"github.com/duapple/beego_netdisk/controllers"
)

type TransportController struct {
	controllers.Controller
}

func (c *TransportController) Get() {
	userName := c.GetSession("username")
	if userName == nil {
		c.DestroySession()
		c.Ctx.Redirect(302, "/login")
	}
	c.TplName = "transport.html"
}
