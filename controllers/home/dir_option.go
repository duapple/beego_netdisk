package home

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"strings"

	"github.com/beego/beego/v2/adapter/logs"
	"github.com/beego/beego/v2/server/web"
	"github.com/duapple/beego_netdisk/controllers"
	"github.com/duapple/beego_netdisk/controllers/userptl"
)

type DirOptionController struct {
	controllers.Controller
}

type Directory struct {
	DirName string `json:"dir_name"`
	Size    string `json:"size"`
	ModTime string `json:"modification_time"`
}

type File struct {
	FileName string `json:"file_name"`
	Size     string `json:"size"`
	ModTime  string `json:"modification_time"`
}

type Dir_Info struct {
	CurrentPath string      `json:"current_path"`
	Dirs        []Directory `json:"dirs"`
	Files       []File      `json:"files"`
}

/* 删除时，DirName只有第一个元素有效
读和创建时，整个数组有效 */
type Dir_Option struct {
	DirOption string   `json:"dir_option"`
	DirName   []string `json:"dir_name"`
}

const (
	DirOptionRead   = "dir_option_read"   /* 读取目录内容 */
	DirOptionCreate = "dir_option_create" /* 创建目录 */
	DirOptionRemove = "dir_option_remove" /* 删除目录或文件 */
	DirOptionRename = "dir_option_rename" /* 重命名目录或者文件 */
)

type Size_Unit int64

const (
	Size_Unit_GB   = 0x40000000 /* Gb */
	Size_Unit_MB   = 0x100000   /* Mb */
	Size_Unit_KB   = 0x400      /* Kb */
	Size_Unit_BYTE = 0          /* Byte */
)

var RootPath string

func init() {
	path, err := web.AppConfig.String("RootDiskPath")
	if err != nil {
		panic(err)
	}

	RootPath = string(path)

	logs.Info("Root Disk path: ", RootPath)
}

func (c *DirOptionController) Post() {

	var currentUser string
	var responseJson userptl.ResponseBody

	data, ok := c.Session_Check(&responseJson, &currentUser)
	if !ok {
		return
	}

	defer func() {
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
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

	var reqDirOption Dir_Option
	err = json.Unmarshal(data, &reqDirOption)
	if err != nil {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	// fullPath := RootPath + currentPath

	switch reqDirOption.DirOption {

	/* 读目录信息 */
	case DirOptionRead:
		dirInfo, err := reqDirOption.Read(currentUser, currentPath)

		if err != nil {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    err.Error(),
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}

		if err = c.SetSession("current_path", dirInfo.CurrentPath); err != nil {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    err.Error(),
				Code:   userptl.ERROR_DATA_ANALYSIS,
			}
			return
		}

		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   dirInfo,
			Msg:    "Get dir info success.",
			Code:   userptl.SUCCESS,
		}

	/* 创建目录 */
	case DirOptionCreate:
		dirInfo, err := reqDirOption.Create(currentUser, currentPath)
		if err != nil {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    err.Error(),
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}

		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   dirInfo,
			Msg:    "Create dir success.",
			Code:   userptl.SUCCESS,
		}
		return

	/* 删除目录 */
	case DirOptionRemove:

		dirInfo, err := reqDirOption.Remove(currentUser, currentPath)
		if err != nil {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   dirInfo,
				Msg:    err.Error(),
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}

		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   dirInfo,
			Msg:    "Remove dir success.",
			Code:   userptl.SUCCESS,
		}
		return

	/* 重命名目录或者文件 */
	case DirOptionRename:

		dirInfo, err := reqDirOption.Rename(currentUser, currentPath)
		if err != nil {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   dirInfo,
				Msg:    err.Error(),
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}

		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   dirInfo,
			Msg:    "Rename dir or file success.",
			Code:   userptl.SUCCESS,
		}
		return

	}
}

func (dirOpt *Dir_Option) Rename(user, currentPath string) (dirInfo Dir_Info, err error) {

	if dirOpt.DirName == nil {
		err = errors.New("request dir name is null")
		return
	}

	for _, info := range dirOpt.DirName {
		if ok := strings.Compare(info, ".."); strings.Contains(info, "/..") || strings.Contains(info, "../") || strings.Contains(info, "/") || info == "" || ok == 0 {
			err = errors.New("request dir name is illegal: .. ")
			return
		}
	}

	oldPath := path.Clean(RootPath + user + "/" + currentPath + "/" + dirOpt.DirName[0])
	newPath := path.Clean(RootPath + user + "/" + currentPath + "/" + dirOpt.DirName[1])
	err = os.Rename(oldPath, newPath)
	if err != nil {
		return
	}

	dirOpt.DirName[0] = currentPath
	dirInfo, err = dirOpt.Read(user, currentPath)

	return
}

func (dirOpt *Dir_Option) Remove(user, currentPath string) (dirInfo Dir_Info, err error) {
	if dirOpt.DirName == nil {
		err = errors.New("request dir name is null")
		return
	}

	defer func() {
		dirOpt.DirName[0] = currentPath
		var err1 error
		dirInfo, err1 = dirOpt.Read(user, currentPath)
		if err1 != nil {
			err = err1
		}
	}()

	for _, info := range dirOpt.DirName {

		if ok := strings.Compare(info, ".."); strings.Contains(info, "/..") || strings.Contains(info, "../") || strings.Contains(info, "/") || info == "" || ok == 0 {
			err = errors.New("request dir name is illegal: .. ")
			return
		}

		path := path.Clean(RootPath + user + "/" + currentPath + "/" + info)
		err = os.RemoveAll(path)
		if err != nil {
			return
		}

	}

	return
}

func (dirOpt *Dir_Option) Create(user, currentPath string) (dirInfo Dir_Info, err error) {
	if dirOpt.DirName == nil {
		err = errors.New("request dir name is null")
		return
	}

	if ok := strings.Compare(dirOpt.DirName[0], ".."); strings.Contains(dirOpt.DirName[0], "/..") || strings.Contains(dirOpt.DirName[0], "../") || ok == 0 {
		err = errors.New("request dir name is illegal: .. ")
		return
	}

	err = os.Mkdir((RootPath + user + "/" + currentPath + "/" + dirOpt.DirName[0]), 0777)
	if err != nil {
		return
	}

	dirOpt.DirName[0] = currentPath

	dirInfo, err = dirOpt.Read(user, currentPath)
	if err != nil {
		return
	}

	return
}

func (dirOpt *Dir_Option) Read(user, currentPath string) (dirInfo Dir_Info, err error) {
	if dirOpt.DirName == nil {
		err = errors.New("request dir name is null")
		return
	}

	if ok := strings.Compare(dirOpt.DirName[0], ".."); strings.Contains(dirOpt.DirName[0], "/..") || strings.Contains(dirOpt.DirName[0], "../") || ok == 0 {
		err = errors.New("request dir name is illegal: .. ")
		return
	}

	if dirOpt.DirName[0] == "." {
		dirOpt.DirName[0] = currentPath
	}

	dirInfoList, err := ioutil.ReadDir(RootPath + user + "/" + dirOpt.DirName[0])
	if err != nil {
		logs.Error(err)
		return
	}

	dirInfo.FileInfo_to_Dir_Info(dirInfoList)

	if path := dirOpt.DirName[0]; path == "" {
		dirInfo.CurrentPath = "/"
	} else {
		dirInfo.CurrentPath = dirOpt.DirName[0]
	}

	logs.Info("dirInfo.CurrentPath", dirInfo.CurrentPath)

	return
}

func (dirInfo *Dir_Info) FileInfo_to_Dir_Info(dirInfoList []os.FileInfo) (err error) {

	for _, info := range dirInfoList {

		fileSize := info.Size()
		logs.Info("filesize: ", fileSize)
		size, unit := SizeUnitConvert(fileSize)
		sizeStr := Itoa(size) + unit

		modTimeStr := info.ModTime().Format("2006-01-02 15:04:05")

		if info.IsDir() {
			dir := Directory{
				DirName: info.Name(),
				Size:    "-",
				ModTime: modTimeStr,
			}
			dirInfo.Dirs = append(dirInfo.Dirs, dir)

		} else {
			file := File{
				FileName: info.Name(),
				Size:     sizeStr,
				ModTime:  modTimeStr,
			}
			dirInfo.Files = append(dirInfo.Files, file)

		}
	}

	return
}

func SizeUnitConvert(sizeIn int64) (sizeOut int64, unit string) {

	switch {
	case sizeIn < Size_Unit_KB && sizeIn >= Size_Unit_BYTE:
		sizeOut = sizeIn
		unit = "Byte"

	case sizeIn < Size_Unit_MB && sizeIn >= Size_Unit_KB:
		sizeOut = sizeIn / Size_Unit_KB
		unit = "Kb"

	case sizeIn < Size_Unit_GB && sizeIn >= Size_Unit_MB:
		sizeOut = sizeIn / Size_Unit_MB
		logs.Info("Size_Unit_MB:", Size_Unit_MB)
		logs.Info("sizeOut: ", sizeOut)
		unit = "Mb"

	case sizeIn >= Size_Unit_GB:
		sizeOut = sizeIn / Size_Unit_GB
		unit = "Gb"
	}

	return
}

func Itoa(num int64) (numStr string) {
	numStr = fmt.Sprintf("%d", num)
	return
}
