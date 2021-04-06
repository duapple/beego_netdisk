package login

import (
	"encoding/json"
	"errors"
	"os"
	"path"

	"github.com/beego/beego/v2/core/logs"
	log "github.com/beego/beego/v2/core/logs"
	"github.com/duapple/beego_netdisk/controllers"
	"github.com/duapple/beego_netdisk/controllers/home"
	"github.com/duapple/beego_netdisk/controllers/userptl"
)

type LoginController struct {
	controllers.Controller
}

type LogoutController struct {
	controllers.Controller
}

type AuthenticationController struct {
	controllers.Controller
}

type RegisterController struct {
	controllers.Controller
}

type DeregisterController struct {
	controllers.Controller
}

type AcountController struct {
	controllers.Controller
}

type EditAcountCtontroller struct {
	controllers.Controller
}

func (c *LoginController) Get() {
	c.TplName = "login.html"
}

func (c *LogoutController) Post() {
	// c.TplName = "login.html"

	c.DestroySession()

	c.Ctx.Redirect(302, "/login")
}

func (c *AuthenticationController) Post() {

	data := c.Body_Check()

	var responseJson *userptl.ResponseBody

	defer func() {
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
	}()

	var user UserInfo
	err := json.Unmarshal(data, &user)
	if err != nil {
		logs.Error(err.Error())
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}
	logs.Info("user:", user.UserName, "password:", user.PassWord)

	// 进行账户验证
	userFound, found := Users.FindUser(&user)
	if !found {
		err := errors.New("user no found")
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_TARGET_NULL,
		}
		return
	} else {
		if userFound.PassWord != user.PassWord {
			responseJson = &userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    "Password verify error.",
				Code:   userptl.ERROR_PARAM_INVALID,
			}
			return
		}

		//设置session
		err = c.SessionRegenerateID()
		if err != nil {
			log.Error(err)
			responseJson = &userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    err.Error(),
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}
		err = c.SetSession("username", user.UserName)
		if err != nil {
			log.Error(err)
			responseJson = &userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    err.Error(),
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}
	}

	responseJson = &userptl.ResponseBody{
		Method: c.Ctx.Request.RequestURI,
		Data:   "",
		Msg:    "authentication success",
		Code:   userptl.SUCCESS,
	}
}

func (c *RegisterController) Get() {
	c.TplName = "regist.html"
}

func (c *RegisterController) Post() {

	data := c.Body_Check()

	var responseJson *userptl.ResponseBody

	defer func() {
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
	}()

	var user UserInfo
	err := json.Unmarshal(data, &user)
	if err != nil {
		logs.Error(err.Error())
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}
	logs.Info("user:", user.UserName, "password:", user.PassWord)

	_, found := Users.FindUser(&user)
	if found {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "The user already exist.",
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}

	err = Users.AddUser(&user)
	if err != nil {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}

	path := path.Join(home.RootPath, user.UserName)
	logs.Info("make dir path", path)
	err = os.MkdirAll(path, 0777)
	if err != nil {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "Make dir of user error: " + err.Error(),
			Code:   userptl.SUCCESS,
		}
		return
	}

	responseJson = &userptl.ResponseBody{
		Method: c.Ctx.Request.RequestURI,
		Data:   "",
		Msg:    "Register success.",
		Code:   userptl.SUCCESS,
	}

}

func (c *DeregisterController) Post() {

	data := c.Body_Check()

	var responseJson *userptl.ResponseBody

	defer func() {
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
	}()

	var user UserInfo
	err := json.Unmarshal(data, &user)
	if err != nil {
		logs.Error(err.Error())
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}
	logs.Info("user:", user.UserName, "password:", user.PassWord)

	userFound, found := Users.FindUser(&user)
	if !found {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "The user is not exist.",
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}

	if userFound.PassWord != user.PassWord {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "Password verify error.",
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}

	err = Users.RemoveUser(&user)
	if err != nil {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}

	err = os.RemoveAll(home.RootPath + user.UserName)
	if err != nil {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "Remove dir of user error: " + err.Error(),
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}

	responseJson = &userptl.ResponseBody{
		Method: c.Ctx.Request.RequestURI,
		Data:   "",
		Msg:    "Deregister success.",
		Code:   userptl.SUCCESS,
	}

}

func (c *EditAcountCtontroller) Post() {

	data := c.Body_Check()

	var responseJson *userptl.ResponseBody

	defer func() {
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
	}()

	var user []UserInfo
	err := json.Unmarshal(data, &user)
	if err != nil {
		logs.Error(err.Error())
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}
	logs.Info("user: ", user)

	userFound, ok := Users.FindUser(&user[0])
	if !ok {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "user no found",
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}

	if userFound.PassWord == user[0].PassWord {
		user[1].UserName = user[0].UserName
		err := Users.SetUser(&user[1])
		if err != nil {
			responseJson = &userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    err.Error(),
				Code:   userptl.ERROR_OPERATION_ILLEGAL,
			}
			return
		}
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "Modify user account success.",
			Code:   userptl.SUCCESS,
		}
		return

	} else {
		responseJson = &userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "Password verify error.",
			Code:   userptl.SUCCESS,
		}
		return
	}
}

func (c *AcountController) Get() {
	userName := c.GetSession("username")
	if userName == nil {
		c.DestroySession()
		c.Ctx.Redirect(302, "/login")
	}

	c.TplName = "account.html"
}
