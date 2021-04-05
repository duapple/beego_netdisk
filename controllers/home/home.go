package home

import "github.com/duapple/beego_netdisk/controllers"

type IndexController struct {
	controllers.Controller
}

func (c *IndexController) Get() {
	userName := c.GetSession("username")
	if userName == nil {
		c.DestroySession()
		c.Ctx.Redirect(302, "/login")
	}
	c.TplName = "index.html"
}
