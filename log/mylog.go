package log

import (
	"github.com/beego/beego/v2/core/logs"
)

func init() {
	logs.SetLogger("console")
	logs.Info("Log module init ok.")
}