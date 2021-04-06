package upload

import (
	"crypto/md5"
	"fmt"
	"io/ioutil"
	"os"
	"path"

	"github.com/beego/beego/v2/core/logs"
	"github.com/duapple/beego_netdisk/controllers"
	"github.com/duapple/beego_netdisk/controllers/home"
	"github.com/duapple/beego_netdisk/controllers/userptl"
	"github.com/prometheus/common/log"
)

type UploadController struct {
	controllers.Controller
}

type UploadChunkController struct {
	controllers.Controller
}

type Chunk_Upload_Info struct {
	UserName    string `json:"user_name"`
	SrcFilePath string `json:"src_file_path"`
	FilePath    string `json:"file_path"`
	FileName    string `json:"file_name"`
	Size        int64  `json:"size"`
	ChunkNum    int32  `json:"chunk_num"`
	MD5         string `json:"md5"`
	ChunkIndex  int32  `json:"chunk_index"`
}

func (c *UploadController) Post() {

	var currentUser string
	var responseJson userptl.ResponseBody
	var err error

	ok := c.Session_Check_Form(&currentUser)
	if !ok {
		return
	}

	defer func() {
		// logs.Error(err)
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
	}()

	currentPath, err := c.Get_Current_Path(currentUser)
	logs.Info("currentPath:", currentPath)
	if err != nil {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	_, h, err := c.GetFile("upload_file")
	if err != nil {
		logs.Info("getfile err ", err)
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	logs.Info("upload file name:", h.Filename)

	savePath := path.Clean(home.RootPath + currentUser + "/" + currentPath + "/" + h.Filename)
	c.SaveToFile("upload_file", savePath)

	responseJson = userptl.ResponseBody{
		Method: c.Ctx.Request.RequestURI,
		Data:   "",
		Msg:    "Upload file success.",
		Code:   userptl.SUCCESS,
	}
}

func (c *UploadChunkController) Post() {

	var currentUser string
	var responseJson userptl.ResponseBody
	var err error

	ok := c.Session_Check_Form(&currentUser)
	if !ok {
		return
	}

	defer func() {
		logs.Error(err)
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
	}()

	var uploadInfo Chunk_Upload_Info
	var sessionUploadInfo Chunk_Upload_Info

	err = c.ParseForm(&uploadInfo)
	if err != nil {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	//上传第一片，需要做任务创建

	fullPath := path.Clean(home.RootPath + currentUser + "/" + uploadInfo.FilePath + "/" + uploadInfo.FileName)
	// 判断文件是否已经存在
	_, err = os.Stat(fullPath)
	if err == nil {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "File already exist.",
			Code:   userptl.ERROR_TARGET_EXIST,
		}
		return
	}

	// 在session中保存本次任务的信息
	taskId := path.Clean(uploadInfo.FilePath + "/" + uploadInfo.FileName)
	sessionUploadInfoObj := c.GetSession(taskId)
	if sessionUploadInfoObj == nil {
		err = c.SetSession(taskId, uploadInfo)
		if err != nil {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    err.Error(),
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}

		sessionUploadInfo = uploadInfo
		sessionUploadInfo.ChunkIndex = 0

	} else {
		sessionUploadInfo, ok = sessionUploadInfoObj.(Chunk_Upload_Info)
		if !ok {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    "Get session chunk upload info error.",
				Code:   userptl.ERROR_DATA_ANALYSIS,
			}
			return
		}
	}

	ok = sessionUploadInfo.Check(&uploadInfo)
	if !ok {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "Current chunk info error.",
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
	}

	_, h, err := c.GetFile("upload_file")
	if err != nil {
		logs.Info("getfile err ", err)
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	logs.Info("upload file name:", h.Filename)

	savePath := path.Clean(home.RootPath + uploadInfo.UserName + "/" + uploadInfo.FilePath + "/" + h.Filename + ".tmp")
	// c.SaveToFile("upload_file", savePath)

	file, _, err := c.Ctx.Request.FormFile("upload_file")
	if err != nil {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}
	defer file.Close()

	var data []byte = make([]byte, 1024*1024*1024)
	data_len, err := file.Read(data)
	if err != nil {
		logs.Error(err)
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}
	logs.Info("data_len:", data_len)

	data_write := data[:data_len]

	fileSave, err := os.OpenFile(savePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, os.ModePerm)
	if err != nil {
		logs.Error(err)
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	write_len, err := fileSave.Write(data_write)
	if err != nil {
		logs.Error(err)
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}
	defer fileSave.Close()
	logs.Info("write_len: ", write_len)

	sessionUploadInfo.ChunkIndex++
	if sessionUploadInfo.ChunkIndex == sessionUploadInfo.ChunkNum {

		md5_str = FileMD5(savePath)
		if md5_str != sessionUploadInfo.MD5 {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    "MD5 check error. client DM5: " + uploadInfo.MD5 + ", server MD5: " + md5_str,
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}

		err = os.Rename(savePath, fullPath)
		if err != nil {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    err.Error(),
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}
		else {

			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   sessionUploadInfo,
				Msg:    "Upload file success.",
				Code:   userptl.SUCCESS,
			}

			// 完成一个文件的完整上传，删除session中暂存的信息
			c.DelSession(taskId)
		}

	} else {

		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   sessionUploadInfo,
			Msg:    "Upload file success.",
			Code:   userptl.SUCCESS,
		}
	}
}

func (c *UploadChunkController) Get() {

}

func (info *Chunk_Upload_Info) Check(res *Chunk_Upload_Info) (ok bool) {
	if info.ChunkNum != res.ChunkNum || info.FileName != res.FileName ||
		info.FilePath != res.FilePath || info.MD5 != res.MD5 ||
		info.UserName != res.UserName || info.Size != res.Size ||
		info.SrcFilePath != res.SrcFilePath {
		return false
	}

	return true
}

func Merge_Chunk() (err error) {

	return
}

func FileMD5(file string) string {
	f, err := os.Open(file)
	defer f.Close()
	if err != nil {
		logs.Info(err)
		return ""
	}

	buffer, _ := ioutil.ReadAll(f)
	data := buffer
	has := md5.Sum(data)
	md5str := fmt.Sprintf("%x", has)
	log.Infof("MD5:%s\n", md5str)
	return md5str
}
