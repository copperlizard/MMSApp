var express = require('express');
var router = express.Router();
var fs = require('fs');
var ser = new(require('xmldom')).XMLSerializer;

/* POST unitDataUpdate */
router.post('/', function(req, res, next) {
  console.log(req.body.xml);
  //console.log(typeof(req.body.xml));

  fs.writeFile('./public/unitData.xml', req.body.xml, function(err){
    if(err){
      return console.log(err);
    }
    console.log('unitData.xml file saved');
  });

  res.send('unitData POST saved');
});

module.exports = router;

