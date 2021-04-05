package userptl

import (
	"bytes"
	"encoding/json"

	log "github.com/beego/beego/v2/core/logs"
)

type ResponseBody struct {
	Method string      `json:"method"`
	Code   uint32      `json:"code"`
	Data   interface{} `json:"data"`
	Msg    string      `json:"msg"`
}

const (
	SUCCESS                 = 0
	ERROR_PARAM_ILLEGAL     = 1
	ERROR_PARAM_INVALID     = 2
	ERROR_OPERATION_ILLEGAL = 3
	ERROR_TARGET_NULL       = 4
	ERROR_SERVER_INSIDE     = 5
	ERROR_TARGET_EXIST      = 6
	ERROR_DATA_ANALYSIS     = 7
)

func (resp *ResponseBody) PrintBody() {
	body, err := json.Marshal(*resp)
	if err != nil {
		log.Error(err)
		return
	}

	var formatJsonStr bytes.Buffer
	err = json.Indent(&formatJsonStr, []byte(body), "", "\t")

	if err == nil {
		log.Info("response body: \r\n", string(formatJsonStr.Bytes()))
	}
}
