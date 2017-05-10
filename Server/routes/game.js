var express = require('express');
var router = express.Router();
var User = require('../models/User');

var async = require('async');
var fs = require('fs');
var rmdir = require('rmdir');
var multipart = require('multiparty');
// middle ware 회원 확인
function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.sendStatus(401);
  }
}

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') {
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST'){
              cb(null);
            }
            else cb(err);
        } else cb(null);
    });
}
/* image Upload
function uploadFile(file, dirPath, res){
  fs.readFile(file.path, function(err, data){
      var filePath = dirPath + "/" + file.originalFilename;
      fs.writeFile(filePath, data, function(err){
        if(err){
          return res.sendStatus(500);
        } else {
          return res.sendStatus(200);
        }
      });
  });
}
*/
router.get('/', function(req, res, next) {
  var uniqueRandom = require('unique-random-array');


});

router.get('/:id', function(req, res, next) {
  console.log(req.params.id);
});

router.post('/', needAuth, function(req, res, next) {

});

module.exports = router;
