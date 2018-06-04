const Koa = require('koa');
const route = require('koa-route');
const request = require('superagent');
const app = new Koa();

 // request
 //    .get('https://dev.e-things.cn/Comprehensive_App_Display/allEntitys.html?harbor_name=iot:nudt:smarthome')
 //    .then(function(res) {
 //       console.log(res.text)
 //       response = res;
 //    });
let postData = 
      {"name": "下雨开灯", "conditionInfo": [{ "veId": '1021611151057241921681101059', "serviceName": '', "serviceId": "1051611151057241921681101034","param":""},
          { "veId": '1021611151057241921681101059',"serviceName": '', "serviceId": "1051611151057241921681101029", "param": {'subscribe': 'on'} ,}
    ],"controlInfo": [{ "veId": '10217101710353219216814711026', "serviceName": '', "serviceId": "1051611141523491921681101002", "param": { 'color': 'red' }}],
    "max":"linked","min":"linked"
      }

var data = {
  data:JSON.stringify(postData)
}
//转换post请求数据格式
var sendData = '';
for (property in data) {
    sendData = sendData + property + '=' + encodeURIComponent(data[property]) + "&";
}  


// request
//  .post('http://192.168.12.27:8080/Comprehensive_App_Display/insertCoordination.html')
//  .send(sendData)
//  .then(function(res) {
//       //console.log(res);
//    })
//  .catch(function(err) {
//       console.log(err);
//       // err.message, err.response
//    })
request
  .get('http://192.168.12.27:8080/Comprehensive_App_Display/getAll.html')
  .then(function(res) {
      console.log(res.text)
   });

const about = ctx => {
  console.log(ctx.request.href)
  ctx.response.type = 'html';
  ctx.response.body = '<a href="/">Index Page</a>';
};

const main = ctx => {
   ctx.response.body = '<a href="/">Index Page</a>';

};

app.use(route.get('/', main));
app.use(route.get('/about', about));

app.listen(3000);
