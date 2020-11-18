// 根url
var HOST_URI = 'http://192.168.2.105:5000';
// var HOST_URI = 'https://card.jamkung.com';
// 创建盒子
var CREATE_BOX = '/main/box?token=';
// 获取用户的所有盒子
var GET_USER_BOXES = '/main/boxes?token=';
// 克隆盒子
var CLONE_BOX = '/main/box/clone?token=';
// 创建卡
var CREATE_CARD = '/main/card?token=';
// 获取卡
var GET_CARDS = '/main/cards?token=';
// 修改卡
var MOD_CARD = '/main/card?token=';
// 修改盒子
var MOD_BOX = '/main/box?token=';
// 删除盒子
var DELETE_BOX = '/main/box?token=';
// 删除卡
var DELETE_CARD = '/main/card?token=';
// 标记卡
var MARK_CARD_STATUS = '/main/card/status?token='
// 获取openid_token 
var GET_OPENID_TOKEN = '/main/wx/login?lg_code='
// 获取通行证token
var GET_TOKEN = '/main/openid/token?openid_token='
// 获取个人信息
var GET_USER_PROFILE = '/main/user/profile?token='
// 获取短信验证码
var GET_SMS = '/main/sms?token='
// 检验短信验证码
var CHECK_SMS = '/main/check/sms_code?token='
// 反馈信息GET_PHOTO
var FEEDBACK = '/main/feedback?token='
// 获取图片
var GET_FILE = '/main/user/file?token='
// 上传图片
var UPLOAD_FILE = '/main/user/file?token='
// 删除图片
var DELETE_FILE = '/main/user/file?token='
// 获取卡片数据数量
var GET_COUNT = '/main/count?token='
// 获取卡集广场的卡集
var BOX_SHARE_STORE = '/main/boxes/share/store?token='
// 获取分享的卡片
var GET_SHARE_CARDS = '/main/share/cards?token=';

function _boxShareStore() {
  return HOST_URI + BOX_SHARE_STORE;
}


function _getCount() {
  return HOST_URI + GET_COUNT;
}

function _deleteFile() {
  return HOST_URI + DELETE_FILE;
}

function _getFile() {
  return HOST_URI + GET_FILE;
}
function _uploadFile() {
  return HOST_URI + UPLOAD_FILE;
}

function _feedback() {
  return HOST_URI + FEEDBACK;
}

function _getSms() {
  return HOST_URI + GET_SMS;
}
function _checkSms() {
  return HOST_URI + CHECK_SMS;
}


function _getOpenidToken() {
  return HOST_URI + GET_OPENID_TOKEN;
}
function _getUserProfile() {
  return HOST_URI + GET_USER_PROFILE;
}

function _getToken() {
  return HOST_URI + GET_TOKEN;
}

function _createBox() {
  return HOST_URI + CREATE_BOX;
}

function _getUserBoxes() {
  return HOST_URI + GET_USER_BOXES;
}

function _cloneBox() {
  return HOST_URI + CLONE_BOX;
}

function _createCard() {
  return HOST_URI + CREATE_CARD;
}

function _getCards() {
  return HOST_URI + GET_CARDS;
}

function _getShareCards() {
  return HOST_URI + GET_SHARE_CARDS;
}

function _modCard() {
  return HOST_URI + MOD_CARD;
}
function _modBox() {
  return HOST_URI + MOD_BOX;
}

function _deleteBox() {
  return HOST_URI + DELETE_BOX;
}

function _deleteCard() {
  return HOST_URI + DELETE_CARD;
}

function _markCardStatus() {
  return HOST_URI + MARK_CARD_STATUS;
}

module.exports = {
  boxShareStore:_boxShareStore,
  getCount:_getCount,
  deleteFile:_deleteFile,
  getFile:_getFile,
  uploadFile:_uploadFile,
  feedback:_feedback,
  checkSms:_checkSms,
  getSms:_getSms,
  getOpenidToken:_getOpenidToken,
  getToken:_getToken,
  createBox: _createBox,
  getUserBoxes: _getUserBoxes,
  cloneBox: _cloneBox,
  createCard: _createCard,
  getCards: _getCards,
  getShareCards: _getShareCards,
  modCard: _modCard,
  modBox: _modBox,
  deleteBox: _deleteBox,
  deleteCard: _deleteCard,
  markCardStatus: _markCardStatus,
  getUserProfile:_getUserProfile
};