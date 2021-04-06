package login

import (
	"bytes"
	"encoding/json"
	"os"

	log "github.com/beego/beego/v2/core/logs"
)

type UserInfoDatabase interface {
	Init() (data interface{}, err error)
	AddUser(user *UserInfo) (err error)
	RemoveUser(user *UserInfo) (err error)
	FindUser(user *UserInfo) (userOut UserInfo, found bool)
	SetUser(user *UserInfo) (err error)
}

type UserInfo struct {
	UserName    string `json:"username"`
	PassWord    string `json:"password"`
	PhoneNumber string `json:"phone_number"`
	Mail        string `json:"mail"`
}

type JsonFileDatabase struct {
	File  string
	Users map[string]UserInfo
}

var Users UserInfoDatabase

var JsonFile = JsonFileDatabase{File: "users_db.json"}

func init() {
	log.Info("account module init...")

	//设置用户数据库的实现方式
	Users = &JsonFile

	data, _ := Users.Init()

	log.Info("data: ", data)

}

//users database 接口的 json file实现
func (fo *JsonFileDatabase) Init() (data interface{}, err error) {
	data = *fo

	JsonFile.Users = make(map[string]UserInfo)

	buffer, err := fo.ReadFileToBuffer()
	if err != nil || len(buffer) <= 3 {
		log.Error("buffer len: ", len(buffer))
		return
	}

	err = json.Unmarshal(buffer, &fo.Users)
	if err != nil {
		log.Error("Json string to map error: ", err)

		return
	}

	log.Info("Users Info: ", fo.Users)

	return
}

func (f *JsonFileDatabase) AddUser(user *UserInfo) (err error) {

	f.Users[user.UserName] = *user

	f.WriteUserInfoToFile()
	return err
}

func (f *JsonFileDatabase) RemoveUser(user *UserInfo) (err error) {

	delete(f.Users, user.UserName)

	f.WriteUserInfoToFile()
	return err
}

func (f *JsonFileDatabase) FindUser(user *UserInfo) (userOut UserInfo, found bool) {
	userOut, found = f.Users[user.UserName]

	return userOut, found
}

func (f *JsonFileDatabase) SetUser(user *UserInfo) (err error) {
	f.Users[user.UserName] = *user

	f.WriteUserInfoToFile()

	return err
}

// 读去文件内容到buffer中
func (fo *JsonFileDatabase) ReadFileToBuffer() (buffer []byte, err error) {
	log.Info("Read file to buffer")

	f, err := os.Open(fo.File)
	if err != nil {
		log.Error("Open %s error.", fo.File)
		return buffer, err
	}
	defer f.Close()

	fileInfo, err := f.Stat()
	if err != nil {
		log.Error("Get %s info error.", fo.File)
		return buffer, err
	}

	fileSize := fileInfo.Size()
	buffer = make([]byte, fileSize)
	_, err = f.Read(buffer)
	if err != nil {
		log.Error("Read %s error.", fo.File)
		return buffer, err
	}

	return buffer, err
}

func (fo *JsonFileDatabase) WriteUserInfoToFile() (err error) {
	userInfoJsonStr, err := json.Marshal(fo.Users)
	if err != nil {
		log.Error(err)
		return err
	}

	f, err := os.OpenFile(fo.File, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0666)
	if err != nil {
		log.Error(err)
		return err
	}
	defer f.Close()

	var formatJsonStr bytes.Buffer

	json.Indent(&formatJsonStr, []byte(userInfoJsonStr), "", "\t")

	_, err = f.Write(formatJsonStr.Bytes())
	if err != nil {
		log.Error(err)
	}
	return err
}
