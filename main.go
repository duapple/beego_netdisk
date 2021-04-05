package main

import (
	beego "github.com/beego/beego/v2/server/web"
	_ "github.com/duapple/beego_netdisk/log"
	_ "github.com/duapple/beego_netdisk/routers"
)

func main() {
	beego.Run()
}
