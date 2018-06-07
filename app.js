const Koa = require('koa');
const path = require('path');
const route = require('koa-route');
const views = require('koa-views');
const static =require('koa-static');
const koaBody = require('koa-body');
const fs = require('fs');
const request = require('superagent');
const ffmpeg = require('fluent-ffmpeg'); 
const AipSpeech = require("baidu-aip-sdk").speech;
const app = new Koa();
 
app.use(koaBody({ multipart: true }));
// 加载模板引擎 
app.use(views(path.join(__dirname, './views'), { extension: 'ejs' }))

app.use(static(path.join(__dirname,'./static')));


const main = async(ctx) => {
  let title = '接口调试';
  await ctx.render('user',{title});
};

async function saveFile(file){
  
  //获取文件后缀名
  var fileName = (file.name).split("."); 
  fileFormat = fileName[fileName.length-1];

  //创建可读流
  const reader = fs.createReadStream(file.path);
  //创建可写流，存储在uploads文件夹下

  let newFileName = Date.parse(new Date()).toString()+'.'+fileFormat;
  const stream = fs.createWriteStream(path.join('uploads/',newFileName));
  //将可读流的内容写入可写流中
  reader.pipe(stream);
  console.log('正在上传文件 %s -> %s', file.name, stream.path);
  console.log('上传完成！');
  return stream.path;

};

function unlink(path){
  fs.unlink(path, function (err) {
     if (err) return console.log(err);
     console.log('文件删除成功');
 })
}

function transformation(path){
  console.log("开始转换格式："+path)
  return new Promise(function (resolve, reject) {
    //获取音频文件并转换格式
    let command = new ffmpeg(path)
      //音频输出格式s16le
      .format('s16le')  
      // setup event handlers
      //音频输出设为单声道
      .audioChannels(1) 
      //采样率改为16000
      .outputOptions('-ar 16000') 
      // save to file  
      .save(path+'.pcm')
      //转换结束
      .on('end',async function() {  
        console.log('音频文件转换完成！'); 
        let paths = path+'.pcm';
        resolve(paths);
      }) 
      //错误信息 
      .on('error', function(err) {  
        console.log('转换错误: ' + err.message); 
        reject(err);
      });
  });    
}

//语音识别函数，参数传入音频路径
function recognition(path){

  console.log("语音识别函数输出路径："+path)
    
  return new Promise(function (resolve, reject) {
    //调用百度语音识别sdk 
    const client = new AipSpeech(11329608,'oy5RntWlo3kp8GKIPcELcu2p', 'eogEHtEmF41qBYuEQkNNGKfckiWbUBPw');

    let voice = fs.readFileSync(path.toString());
    let voiceBase64 = new Buffer(voice);
    // 识别本地语音文件
    client.recognize(voiceBase64, 'pcm', 16000).then(function(result) {
        console.log('语音识别成功: ' + JSON.stringify(result));
        return resolve(result);
    }, function(err) {
        console.log("语音识别错误："+err);
        return reject(err);
    });
  });
};
    
//语音识别post识别
const speechRecognition = async(ctx,next) => {
  let result = {};
  const file = ctx.request.body.files.file;
  //保存在本地
  const path = await saveFile(file);
  
  await transformation(path)
    .then(function(res){
      return recognition(res); 
    })
    .then(function(res){
      result = res;
      console.log(res)
    })
  unlink(path);
  unlink(path+'.pcm');
  ctx.body= result
};

//人脸识别post
const imageRecognition = async(ctx,next) => {
  let result = {};
  //获取表单提交的图片文件
  const file = ctx.request.body.files.file;
  
  console.log("上传文件路径为："+file.path);
  //将图片文件转换为base64格式
  let base64Img = base64_encode(file.path);

  //出入图片文件，调用人脸识别接口
  await faceRecognition(base64Img)
    .then(function(res){
      console.log(res.status)
      ctx.body = res.text
      //console.log(res.text);
     })
};

// 图片base64编码
function base64_encode(path) {
  console.log("图片开始base64转码！")
  // read binary data
  var bitmap = fs.readFileSync(path.toString());
  console.log("图片base64转码成功！")
  // convert binary data to base64 encoded string
  return new Buffer.from(bitmap).toString('base64');
}

//语音识别函数，参数传入音频路径
function faceRecognition(base64Img){

  console.log("图片识别中")
  
  let url = 'https://api-cn.faceplusplus.com/facepp/v3/detect'
  let key = 'Bk5wLdWj-t0rgoxp2fIDEN0WLRmLi1Yw'
  let secret = 'YckFHP9dMkC93JEcidJ62IX4lMfOFIuj'
  let picUrl =  'https://cdn.faceplusplus.com.cn/mc-official/scripts/demoScript/images/demo-pic1.jpg';

  var data = {
    api_key:key,
    api_secret:secret,
    image_base64:base64Img,
    return_attributes:"emotion"
  }
  
  return new Promise(function (resolve, reject) {  
  request
    .post(url)
    .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    .send(data)
    .then(function(res) {
       console.log("图片识别成功！")
       return resolve(res);
        
      })
    .catch(function(err) {
       console.log("图片识别失败！")
       return reject(err);
      })
       
  });
};

//image recognition
app.use(route.get('/', main));
app.use(route.post('/api/speechRecognition',speechRecognition));
app.use(route.post('/api/imageRecognition',imageRecognition));


app.listen(3000);
