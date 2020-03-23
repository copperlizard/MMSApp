var express = require('express');
var router = express.Router();
var fs = require('fs');
var ser = new(require('xmldom')).XMLSerializer;

/* POST mmsDataUpdate listing. */
router.post('/', function(req, res, next){
  //console.log(req.body.xml);  
  //console.log(typeof(req.body.xml));

  fs.writeFileSync('./public/mmsData.xml', req.body.xml);

  /*fs.writeFile('./public/mmsData.xml', req.body.xml, function(err){
    if(err){
      return console.log(err);
    }
    console.log('mmsData.xml file saved');
  });*/

  res.send('POST saved');
});

router.get('/', function(req, res, next){
  var xmlData = fs.readFileSync('./public/mmsData.xml', 'utf8');

  if(xmlData.length == 0){
    console.log('ERROR READING FILE (mmsData.xml)!');
    return;
  }

  //console.log('mmsData.xml file read');
  res.send(xmlData);
  /*fs.readFile('./public/mmsData.xml', function(err, data){
    if(err){
      return console.log(err);
    }
    console.log('mmsData.xml file read');
    res.send(data);
    return;
  });*/
});

module.exports = router;

