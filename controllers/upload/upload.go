package upload

import (
	"crypto/md5"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"strconv"

	"github.com/beego/beego/v2/core/logs"
	"github.com/duapple/beego_netdisk/controllers"
	"github.com/duapple/beego_netdisk/controllers/home"
	"github.com/duapple/beego_netdisk/controllers/userptl"
)

type UploadController struct {
	controllers.Controller
}

type UploadChunkController struct {
	controllers.Controller
}

type UploadChunkGetController struct {
	controllers.Controller
}

type Chunk_Upload_Info struct {
	controllers.Chunk_Upload_Info_t
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
		// logs.Error(err)
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
	}()

	var uploadInfo Chunk_Upload_Info
	var sessionUploadInfo Chunk_Upload_Info

	err = c.Get_Upload_Info(&uploadInfo)
	if err != nil {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	logs.Info("uploadInfo: \r\n", uploadInfo)

	fullPath := path.Clean(home.RootPath + currentUser + "/" + uploadInfo.FilePath + "/" + uploadInfo.FileName)
	savePath := path.Clean(home.RootPath + uploadInfo.UserName + "/" + uploadInfo.FilePath + "/" + uploadInfo.FileName + ".tmp")

	logs.Info("fullPath: ", fullPath, "savePath:", savePath)

	//上传第一片，需要做任务创建
	if uploadInfo.ChunkIndex == 1 {
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

		_, err = os.Stat(savePath)
		if err == nil {

			err := os.Remove(savePath)
			if err != nil {
				responseJson = userptl.ResponseBody{
					Method: c.Ctx.Request.RequestURI,
					Data:   "",
					Msg:    "Tempurature file already exist.",
					Code:   userptl.ERROR_TARGET_EXIST,
				}
				return
			}
		}
	}

	// 在session中保存本次任务的信息
	taskId := path.Clean(uploadInfo.FilePath + "/" + uploadInfo.FileName)
	logs.Info("taskId:", taskId)
	sessionUploadInfoObj := c.GetSession(taskId)
	if sessionUploadInfoObj == nil {
		logs.Info("session is null.")

		if uploadInfo.ChunkIndex != 1 {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   "",
				Msg:    "Session upload info not exist.",
				Code:   userptl.ERROR_PARAM_INVALID,
			}
			return
		}

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

		if uploadInfo.ChunkIndex == 1 {
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
		}
	}

	ok = sessionUploadInfo.Check(&uploadInfo)
	if !ok {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   sessionUploadInfo,
			Msg:    "Current chunk info error.",
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	if sessionUploadInfo.ChunkIndex >= uploadInfo.ChunkIndex {
		msg := fmt.Sprintf("Chunk index error. session chunk index: %d, client chunk index: %d, ", sessionUploadInfo.ChunkIndex, uploadInfo.ChunkIndex)
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   sessionUploadInfo,
			Msg:    msg,
			Code:   userptl.ERROR_PARAM_INVALID,
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

	sessionUploadInfo.ChunkIndex = sessionUploadInfo.ChunkIndex + 1
	logs.Info("chunk index: ", sessionUploadInfo.ChunkIndex)
	if sessionUploadInfo.ChunkIndex == sessionUploadInfo.ChunkNum {

		md5_str := FileMD5(savePath)
		if md5_str != sessionUploadInfo.MD5 {

			err := os.Remove(savePath)
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
		} else {

			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   sessionUploadInfo,
				Msg:    "Upload all file success.",
				Code:   userptl.SUCCESS,
			}

			// 完成一个文件的完整上传，删除session中暂存的信息
			c.DelSession(taskId)
			return
		}

	} else {

		err = c.SetSession(taskId, sessionUploadInfo)
		if err != nil {
			responseJson = userptl.ResponseBody{
				Method: c.Ctx.Request.RequestURI,
				Data:   sessionUploadInfo,
				Msg:    "Set session upload info error.",
				Code:   userptl.ERROR_SERVER_INSIDE,
			}
			return
		}

		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   sessionUploadInfo,
			Msg:    "Upload file success.",
			Code:   userptl.SUCCESS,
		}
		return
	}
}

func (c *UploadChunkGetController) Post() {
	var current_user string
	var responseJson userptl.ResponseBody
	var err error

	ok := c.Session_Check_Form(&current_user)
	if !ok {
		return
	}

	defer func() {
		// logs.Error(err)
		responseJson.PrintBody()
		c.Data["json"] = responseJson
		c.ServeJSON()
	}()

	var upload_info Chunk_Upload_Info

	err = c.Get_Upload_Info(&upload_info)
	if err != nil {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    err.Error(),
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	taskId := path.Clean(upload_info.FilePath + "/" + upload_info.FileName)
	logs.Info("taskId: ", taskId)
	session_upload_info_obj := c.GetSession(taskId)
	if session_upload_info_obj == nil {

		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "Get session error.",
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	session_upload_info, ok := session_upload_info_obj.(Chunk_Upload_Info)
	if !ok {
		responseJson = userptl.ResponseBody{
			Method: c.Ctx.Request.RequestURI,
			Data:   "",
			Msg:    "Get session upload info error.",
			Code:   userptl.ERROR_DATA_ANALYSIS,
		}
		return
	}

	responseJson = userptl.ResponseBody{
		Method: c.Ctx.Request.RequestURI,
		Data:   session_upload_info,
		Msg:    "Get session upload info success.",
		Code:   userptl.SUCCESS,
	}
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
	if err != nil {
		logs.Info(err)
		return ""
	}
	defer f.Close()

	buffer, _ := ioutil.ReadAll(f)
	data := buffer
	has := md5.Sum(data)
	md5str := fmt.Sprintf("%x", has)
	logs.Info("MD5:%s\n", md5str)
	return md5str
}

func (c *UploadChunkController) Get_Upload_Info(info *Chunk_Upload_Info) (err error) {
	info.UserName = c.GetString("user_name")
	info.SrcFilePath = c.GetString("src_file_path")
	info.FilePath = c.GetString("file_path")
	info.FileName = c.GetString("file_name")

	var size int
	var chunknum int
	var chunkindex int
	size, err = strconv.Atoi(c.GetString("size"))
	if err != nil {
		logs.Error(err)
	}
	info.Size = int64(size)

	chunknum, err = strconv.Atoi(c.GetString("chunk_num"))
	if err != nil {
		logs.Error(err)
	}
	info.ChunkNum = int32(chunknum)

	info.MD5 = c.GetString("md5")

	chunkindex, err = strconv.Atoi(c.GetString("chunk_index"))
	if err != nil {
		logs.Error(err)
	}
	info.ChunkIndex = int32(chunkindex)

	return
}

func (c *UploadChunkGetController) Get_Upload_Info(info *Chunk_Upload_Info) (err error) {
	info.UserName = c.GetString("user_name")
	info.SrcFilePath = c.GetString("src_file_path")
	info.FilePath = c.GetString("file_path")
	info.FileName = c.GetString("file_name")

	var size int
	var chunknum int
	var chunkindex int
	size, err = strconv.Atoi(c.GetString("size"))
	if err != nil {
		logs.Error(err)
	}
	info.Size = int64(size)

	chunknum, err = strconv.Atoi(c.GetString("chunk_num"))
	if err != nil {
		logs.Error(err)
	}
	info.ChunkNum = int32(chunknum)

	info.MD5 = c.GetString("md5")

	chunkindex, err = strconv.Atoi(c.GetString("chunk_index"))
	if err != nil {
		logs.Error(err)
	}
	info.ChunkIndex = int32(chunkindex)

	return
}
