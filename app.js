var _PI = 3.14159265359;

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

var serialPort = require('serialport');

var fs = require('fs');
var cheerio = require('cheerio');

//var sse = require('sse-nodejs'), http = require('http');

var index = require('./routes/index');
var users = require('./routes/users');
var summary = require('./routes/summary');

var userMMSUpdate = require('./routes/mmsDataUpdate');
var userMatUpdate = require('./routes/matDataUpdate'); 
var userReelUpdate = require('./routes/reelDataUpdate');
var userUnitUpdate = require('./routes/unitDataUpdate');

var mmsBeacons = []; 
var beaconPulses = [];

var mmsPortMap = [];

var app = express();

process.title="MMSApp";

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser.json());
app.use(bodyParser.xml());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// adding jquery...
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

app.use('/', index);
app.use('/users', users);
app.use('/summary', summary);

app.use('/mmsDataUpdate', userMMSUpdate);
app.use('/matDataUpdate', userMatUpdate);
app.use('/reelDataUpdate', userReelUpdate);
app.use('/unitDataUpdate', userUnitUpdate);

app.use('/messageMMS', function(req, res){
  //console.log('req.body.id == ' + req.body.id);
  console.log('req.body.mes == ' + req.body.mes);
  
  MessageMMS(req.body.id, req.body.mes);
  res.end();
});

/*var clients = [];
app.get('/eventStream', function(req, res){
    var client = sse(res);
 
    client.disconnect(function(){
        console.log("client disconnected");
    });

    clients.push(client);
});
 
app.listen(3001, function(){
    console.log('Simple SSE server start at port: 3001');
});*/

// catch 404 and forward to error handler
app.use(function(req, res, next){
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next){
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

"use strict";

//Set devices to disconnected at start...
var xmlData = fs.readFileSync('./public/mmsData.xml', 'utf8');

var $ = cheerio.load(xmlData.toString('utf8'), {
  xmlMode: true,
  lowerCaseTags: false,
  lowerCaseAttributeNames: false
});

$('MMSs').find('MMS').each(function(){$(this).find('Connected').text('false');});

fs.writeFile('./public/mmsData.xml', $.xml(), function(err){
  if(err){
    return console.log(err);
  }
  //console.log($.xml());
  console.log('mmsData.xml file saved');
});

function ManageBeacons(mmsID){
  //mmsID = mmsID.replace(/[\x00-\x1F\x7F-\x9F]/g,''); //wtf??? (DLE aka ascii=16 being added to front of 6th pusle id...)
  //console.log('manageBeacons(' + mmsID + ')');
  for(var i = 0; i < mmsBeacons.length; i++){
    //console.log('check mmsBeacons[' + i + '].id==' + mmsBeacons[i].id);
    //console.log('(' + mmsID + ' == ' + mmsBeacons[ i].id + ') == ' + (mmsID == mmsBeacons[i].id));
    //console.log('mmsID.length == ' + mmsID.length + ' ; mmsBeacons[' + i + '].id.length == ' + mmsBeacons[i].id.length);
    if(mmsBeacons[i].id == mmsID){
      //console.log('found beacon id(' + mmsBeacons[i].id + ')!');
      mmsBeacons[i].time = 0;
      return; //no change to beacon list
    }
    
    //console.log('beacon id does not match ' + mmsID);
    //console.log('mmsID[0] == ' + mmsID[0].charCodeAt());
  }

  console.log('could not find beacon id (' + mmsID + ')!');

  //beacon not found
  console.log('adding beacon {' + mmsID + ', 0}');
  //mmsBeacons.push({id:mmsID.trim(), time:0});
  mmsBeacons.push({id:mmsID, time:0});
  return;
}

/*function UpdateSSEClients(message){
  clients.forEach(function(client){client.sendEvent('message', message);});
}*/

function AddMMS(id){
  var mmsData = fs.readFileSync('./public/newMMSData.xml', 'utf8');
  
  var $ = cheerio.load(mmsData.toString('utf8'), {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false
  });

  $('MMS').attr('ID', id);
  return $.html();
}

//var messageInProgress = false;
function MessageMMS(id, message){
  console.log('sending message: ' + message);
  /*while(messageInProgress){
    console.log('previous message in progress...');
  }
  messageInProgress = true;*/

  var path;
  for(var i = 0; i < mmsPortMap.length; i++){
    if(mmsPortMap[i].id == id){
      path = mmsPortMap[i].port;
      break;
    }
  }

  //console.log('path == ' + path);
  openPorts.forEach(function(port){
    if(port.path == path){
      //console.log('writing message');
      //console.log('port == ' + port.path);
      port.write(message);
      //port.write(message, 'utf8', function(){console.log('message buffered...');});
      //port.drain(function(){console.log('port buffer drained!!!');});
    }
  });

  //messageInProgress = false;
}

function ShowPortOpen() {
  console.log('port open.');
}

function FullUnitReport(id, full = true){
  console.log('FullUnitReport(' + id + ')');  

  var mmsData = fs.readFileSync('./public/mmsData.xml', 'utf8');
  var $ = cheerio.load(mmsData.toString('utf8'), {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false
  });

  var matData = fs.readFileSync('./public/matData.xml', 'utf8');
  var $$ = cheerio.load(matData.toString('utf8'), {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false
  });

  var mmsName = $('MMSs').find('MMS[ID="' + id + '"]').find('Name').text(); //???

  $('MMSs').find('MMS[ID="' + id + '"]').find('Nozzle').each(function(){
    var num = $(this).attr('num');
    var dia = $(this).find('Diameter').text();
    var setDia = $(this).find('SetDiameter').text();
    var ht = $(this).find('HighTemp').text();
    var setHT = $(this).find('SetHighTemp').text();
    var aa = $(this).find('AntiAbrasion').text();
    var setAA = $(this).find('SetAntiAbrasion').text();
    var spfu = $(this).find('SPFU').text();
    var setSPFU = $(this).find('SetSPFU').text();
    var matDia = $(this).find('MaterialDiameter').text();
    var setMatDia = $(this).find('SetMaterialDiameter').text();

    if(full){
      MessageMMS(id, id + '_' + num + '_Diameter_' + dia + '\u000D');
      MessageMMS(id, id + '_' + num + '_HighTemp_' + ht + '\u000D');
      MessageMMS(id, id + '_' + num + '_AntiAbrasion_' + aa + '\u000D');
      MessageMMS(id, id + '_' + num + '_SPFU_' + spfu + '\u000D');
      MessageMMS(id, id + '_' + num + '_MaterialDiameter_' + matDia + '\u000D');
    }

    if(Number(setDia) != Number(dia) || full){
      MessageMMS(id, id + '_' + num + '_SetDiameter_' + setDia + '\u000D');
    }
    if(setHT != ht || full){
      MessageMMS(id, id + '_' + num + '_SetHighTemp_' + setHT + '\u000D');
    }
    if(setAA != aa || full){
      MessageMMS(id, id + '_' + num + '_SetAntiAbrasion_' + setAA + '\u000D');
    }
    if(setSPFU != spfu || full){
      MessageMMS(id, id + '_' + num + '_SetSPFU_' + setSPFU + '\u000D');
    }
    if(Number(setMatDia) != Number(matDia) || full){
      MessageMMS(id, id + '_' + num + '_SetMaterialDiameter_' + setMatDia + '\u000D');
    }
  });

  $('MMSs').find('MMS[ID="' + id + '"]').find('Reel').each(function(){
    var slot = $(this).attr('slot');
    var reelMat = $(this).find('Material').text();
    var setReelMat = $(this).find('SetMaterial').text();
    var reelDia = $(this).find('MaterialDiameter').text();
    var setReelDia = $(this).find('SetMaterialDiameter').text();
    var emptyReelWeight = $(this).find('LoadedReelWeight').attr('emptyWeight');
    //var loadedReelWeight = $(this).find('LoadedReelWeight').text();
    var liveReelWeight = $(this).find('LiveWeight').text(); //don't report...
    var extNum = $(this).find('ExtNum').text();
    var setExtNum = $(this).find('SetExtNum').text();

    if(reelMat == ''){
      reelMat = 'Select Material';
    }

    if(setReelMat == ''){
      setReelMat = 'Select Material';
    }

    var matDensity = 0;
    var mats = $$(matData).find('Material');
    for(var i = 0; i < mats.length; i++){
      if($(mats[i]).find('Name').text() == reelMat){
        matDensity = Number($(mats[i]).find('Density').text());
        break;
      }
    }

    /*var setMatDensity = 0;
    for(var i = 0; i < mats.length; i++){
      if($(mats[i]).find('Name').text() == setReelMat){
        setMatDensity = Number($(mats[i]).find('Density').text());
        break;
      }
    }*/

    var matVolume = (Number(liveReelWeight) - Number(emptyReelWeight)) / matDensity;
    var rSquared = (Number(reelDia) * 0.5) * 0.001; //assumes mm input
    rSquared *= rSquared;
    var remFilament = (matVolume / (_PI * rSquared)).toFixed(2);

    remFilament = (Number(liveReelWeight) > Number(emptyReelWeight)) ? remFilament : 'reel empty';
    remFilament = (reelMat != 'Select Material...') ? remFilament : 'select Material...';

    if(full){
      //MessageMMS(id, id + '_' + slot + '_RemFilament_' + remFilament + '\u000D'); //MMS not using this :(
      MessageMMS(id, id + '_' + slot + '_Material_' + reelMat + '\u000D');
      MessageMMS(id, id + '_' + slot + '_MaterialDiameter_' + reelDia + '\u000D');
      MessageMMS(id, id + '_' + slot + '_Density_' + (matDensity / 1000.0) + '\u000D');
      MessageMMS(id, id + '_' + slot + '_ExtNum_' + extNum + '\u000D');
      MessageMMS(id, id + '_' + slot + '_SetReelWeight_' + (emptyReelWeight * 1000.0) + '\u000D');
    }
    if(setReelMat != reelMat || full){
      MessageMMS(id, id + '_' + slot + '_SetMaterial_' + setReelMat + '\u000D');
    }
    if(Number(setReelDia) != Number(reelDia) || full){
      MessageMMS(id, id + '_' + slot + '_SetMaterialDiameter_' + setReelDia + '\u000D');
    }
    if(setExtNum != extNum || full){
      MessageMMS(id, id + '_' + slot + '_SetExtNum_' + setExtNum + '\u000D');
    }
  });
}

function MapMMSPort(mmsID, path){
  for(var i = 0; i < mmsPortMap.length; i++){
    if(mmsPortMap[i].id == mmsID){
      mmsPortMap[i].port = path;
      return;
    }
  }

  mmsPortMap.push({id:mmsID,port:path});

  //FullUnitReport(mmsID);
  setTimeout(FullUnitReport, 5000, mmsID); //send report in 5 seconds (trying to avoid com' conflicts...)

  return;
}

var reading = false; //.........
function ReadSerialData(data, openPort, pnpId){
  if(!openPort.isOpen){ //port closed by previous message in buffer...
    return;
  }

  var startTime = new Date().getTime();
  while(reading){
    //Wait for previous read
    //console.log('waiting for previous read...');
    if(new Date().getTime() >= startTime + 1500){
      console.log('message timeout! closing port: ' + pnpId);
      openPortPNPIDs.push(pnpId); //copy pnpId to prevent reconnections after port closed
      //openPort.close();
      reading = false;
      return;
    }
  }
  reading = true;

  console.log('parser data: ' + data.toString('utf8'));
  var segs = data.toString('utf8').split('_');
  //var reload = false;

  segs[0] = segs[0].replace(/[\x00-\x1F\x7F-\x9F]/g,''); //wtf??? (DLE aka ascii=16 shows up sometimes...)

  //Set mmsunit setting (name, humidity, connected)
  if(segs.length == 3 && segs[0].length == 9){
    var mmsID = segs[0];
    var prop = segs[1];
    var val = segs[2];

    beaconPulses.push(mmsID);

    MapMMSPort(mmsID, openPort.path);

    var xmlData = fs.readFileSync('./public/mmsData.xml', 'utf8');

    var $ = cheerio.load(xmlData.toString('utf8'), {
      xmlMode: true,
      lowerCaseTags: false,
      lowerCaseAttributeNames: false
    });

    //Ensure MMS exists
    if(!$('MMSs').find('MMS[ID="' + mmsID + '"]').length){
      $('MMSs').append(AddMMS(mmsID));
      setTimeout(FullUnitReport, 5000, mmsID); //send report in 5 seconds (trying to avoid com' conflicts...)
    }

    $('MMSs').find('MMS[ID="' + mmsID + '"]').find(prop).text(val);

    $('MMSs').find('MMS[ID="' + mmsID + '"]').find('Connected').text('true');

    fs.writeFileSync('./public/mmsData.xml', $.xml());
    reading = false;
    return;
  }
  //Set reel setting...
  else if(segs.length == 4 && segs[0].length == 9){
    var mmsID = segs[0];
    var nozreelID = segs[1];
    var prop = segs[2];
    var val = segs[3];

    //convert from grams to kg
    if(prop == 'LiveWeight'){
      //val /= 1000.0;
      val = Number(val) / 1000.0;
    }

    beaconPulses.push(mmsID);

    MapMMSPort(mmsID, openPort.path);

    var xmlData = fs.readFileSync('./public/mmsData.xml', 'utf8');

    var $ = cheerio.load(xmlData.toString('utf8'), {
      xmlMode: true,
      lowerCaseTags: false,
      lowerCaseAttributeNames: false
    });

    //Ensure MMS exists
    if(!$('MMSs').find('MMS[ID="' + mmsID + '"]').length){
      $('MMSs').append(AddMMS(mmsID));
      setTimeout(FullUnitReport, 5000, mmsID); //send report in 5 seconds (trying to avoid com' conflicts...)
    }

    $('MMSs').find('MMS[ID="' + mmsID + '"]').find('Connected').text('true');

    if(nozreelID.match(/[a-f]/i)){
      $('MMSs').find('MMS[ID="' + mmsID + '"]').find('Reel[slot="' + nozreelID + '"]').find(prop).text(val);
    }
    else if(nozreelID.match(/[1-3]/i)){
      $('MMSs').find('MMS[ID="' + mmsID + '"]').find('Nozzle[num="' + nozreelID + '"]').find(prop).text(val);
    }

    fs.writeFileSync('./public/mmsData.xml', $.xml());
    reading = false;
    return;
  }  
  
  console.log('received invalid message: ' + data);
  openPortPNPIDs.push(pnpId); //copy pnpId to prevent reconnections after port closed
  //openPort.close();
}

function ShowPortClose(id){
  console.log('port closed.');
  console.log('PnPID == ' + id);
  var index = openPortPNPIDs.indexOf(id);

  if(index > -1){
    openPortPNPIDs.splice(index, 1);
  }

  var mmsID;
  for(var i = 0; i < mmsPortMap.length; i++){
    if(mmsPortMap[i].port == id){
      console.log(mmsPortMap[i].id + ' disconnected!');
      mmsID = mmsPortMap[i].id;
      var xmlData = fs.readFileSync('./public/mmsData.xml', 'utf8');

      var $ = cheerio.load(xmlData.toString('utf8'), {
        xmlMode: true,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false
      });
      $('MMSs').find('MMS[ID="' + mmsID + '"]').find('Connected').text('false');

      fs.writeFileSync('./public/mmsData.xml', $.xml());

      mmsPortMap.splice(i, 1);
      //break;
      return;
    }
  }

  //Maybe not neccessary to remove beacons...
  /*for(var i = 0; i < mmsBeacons.length; i++){
    if(mmsBeacons[i].id == mmsID){
      mmsBeacons.splice(i, 1);
      return;
    }
  }*/
}

function ShowError(err){
  console.log('Serial port error: ' + err);
}

var openPorts = [];
var openPortPNPIDs = [];
const readLine = serialPort.parsers.Readline;
function UnitConnect(){
  //console.log('doing nothing...'); //DEBUG!!!!!!!!!!!!!
  //return; //DEBUG!!!!!!!!!!!!!!!!!!!

  serialPort.list(function(err, ports){
    if(err != null){
      console.log('serialPort.list error: ' + err);
    }
    
    ports.forEach(function(port){

      if(port.pnpId == undefined){
        return;
      }
      
      for(var i = 0; i < openPortPNPIDs.length; i++){
        if(openPortPNPIDs[i] == port.pnpId){
          //console.log('port already opened!');
          return;
        }
      }

      console.log(port.comName);
      console.log(port.pnpId);

      if(port.manufacturer != undefined){
        console.log(port.manufacturer);
      }
      
      if(port.manufacturer != 'Parallax Inc.'){
        console.log('unrecognized device!');
	return;
      }

      console.log('opening new port!');

      var serOptions = {
        //baudRate: 115200,
        //baudRade: 38400, //doesn't work????
        baudRate: 9600,
        databits: 8,
        stopbits: 1,
        parity: 'none',
        bufersize: 256
      };

      var openPort = new serialPort(port.comName, serOptions);
      const lineParser = openPort.pipe(new readLine({delimiter: '\r'}));
      openPort.on('open', ShowPortOpen);
      //openPort.on('data', function(data){console.log('port data: ' + data.toString('utf8'));});
      //lineParser.on('data', ReadSerialData);
      lineParser.on('data', function(data){ReadSerialData(data, openPort, port.pnpId);});
      openPort.on('close', function(){ShowPortClose(port.pnpId);});
      openPort.on('error', ShowError);
      openPortPNPIDs.push(port.pnpId);

      openPorts.push(openPort);
    });
  });
}

function UnitCom(){ //Doesn't actually "Com" anything anymore :(  ... just manages closed ports and beacons...
  /*var mmsData = fs.readFileSync('./public/mmsData.xml', 'utf8');
  var $ = cheerio.load(mmsData.toString('utf8'), {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false
  });

  var matData = fs.readFileSync('./public/matData.xml', 'utf8');
  var $$ = cheerio.load(matData.toString('utf8'), {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false
  });*/

  for(var i = 0; i < openPorts.length; i++){
    if(!openPorts[i].isOpen){
      openPorts.splice(i, 1);
      continue;
    }
    //console.log('writing to port');
    //openPorts[i].write('wubba lubba dub dub\u000D');
   
    /*for(var j = 0; j < mmsPortMap.length; j++){ //MMS not using this :(
      if(mmsPortMap[j].port == openPorts[i].path){
        //Report remFilament[M] (doubles as server to mms heartbeat signal)
        $('MMSs').find('MMS[ID="' + mmsPortMap[j].id + '"]').find('Reel').each(function(){
          var slot = $(this).attr('slot');
          var reelMat = $(this).find('Material').text();
          var reelDia = $(this).find('MaterialDiameter').text();
          var emptyReelWeight = $(this).find('LoadedReelWeight').attr('emptyWeight');
          var liveReelWeight = $(this).find('LiveWeight').text();

          var matDensity = 0;
          var mats = $$(matData).find('Material');
          for(var i = 0; i < mats.length; i++){
            if($(mats[i]).find('Name').text() == reelMat){
              matDensity = Number($(mats[i]).find('Density').text());
              break;
            }
          } 

          var matVolume = (Number(liveReelWeight) - Number(emptyReelWeight)) / matDensity;
          var rSquared = (Number(reelDia) * 0.5) * 0.001; //assumes mm input
          rSquared *= rSquared;
          var remFilament = (matVolume / (_PI * rSquared)).toFixed(2);

          remFilament = (Number(liveReelWeight) > Number(emptyReelWeight)) ? remFilament : 'reel empty';
          remFilament = (reelMat != 'Select Material...') ? remFilament : 'select Material...';

          MessageMMS(mmsPortMap[j].id, mmsPortMap[j].id + '_' + slot + '_RemFilament_' + remFilament + '\u000D');
          //console.log(mmsPortMap[j].id + '_' + slot + '_RemFilament_' + remFilament + '\u000D');
        });
        
        //FullUnitReport(mmsPortMap[j].id); //moved to map function...
        break;
      }
    }*/
  }

  //Process unit beacon pulses...
  //console.log('beaconPulses.length == ' + beaconPulses.length);
  //var pulse = 0;
  while(beaconPulses.length > 0){
    //console.log('pulse#'+pulse++);
    //console.log('mmsBeacons.length == ' + mmsBeacons.length);
    var temp = ManageBeacons(beaconPulses.pop());
  }
 
  //console.log('mmsBeacons.length == ' + mmsBeacons.length);
 
  //Check for disconnected units
  for(var i = 0; i < mmsBeacons.length; i++){
    //console.log('(beep)');
    if(mmsBeacons[i].time < 91){
      mmsBeacons[i].time++;
    }
    else{
      var xmlData = fs.readFileSync('./public/mmsData.xml', 'utf8');
      var $ = cheerio.load(xmlData.toString('utf8'), {
        xmlMode: true,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false
      });

      $('MMSs').find('MMS[ID="' + mmsBeacons[i].id + '"]').find('Connected').text('false');

      fs.writeFileSync('./public/mmsData.xml', $.xml());

      mmsBeacons.splice(i, 1);
      i--;
    }
  }
}

function UnitSync(){
  for(var i = 0; i < openPorts.length; i++){
    if(!openPorts[i].isOpen){
      openPorts.splice(i, 1);
      continue;
    }
    for(var j = 0; j < mmsPortMap.length; j++){ 
      if(mmsPortMap[j].port == openPorts[i].path){
        FullUnitReport(mmsPortMap[j].id, false); 
      }
    }
  }
}

var conInterval = setInterval(UnitConnect, 3000); //Watch for and open ports to new MMS units...

var comInterval = setInterval(UnitCom, 1000); //Detects new/lost connections/coms...

var syncInterval = setInterval(UnitSync, 10000); //Resends any unconfirmed changes (incase missed coms)....
