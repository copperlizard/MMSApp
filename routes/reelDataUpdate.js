var express = require('express');
var router = express.Router();
var fs = require('fs');
var ser = new(require('xmldom')).XMLSerializer;

/* POST reelDataUpdate */
router.post('/', function(req, res, next) {
  console.log(req.body.xml);
  //console.log(typeof(req.body.xml));

  fs.writeFileSync('./public/reelData.xml', req.body.xml);
  /*fs.writeFile('./public/reelData.xml', req.body.xml, function(err){
    if(err){
      return console.log(err);
    }
    console.log('reelData.xml file saved');
  });*/

  res.send('reelData POST saved');
});

module.exports = router;

