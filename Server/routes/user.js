var express = require('express');
var User = require('../models/User');
var async = require('async');

var adminIdentifier = "58a7e9988db8080bf26fdbf5";
var router = express.Router();

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.sendStatus(401);
  }
}
/* GET users listing. */
router.get('/', needAuth, function(req, res, next) {

});

// http://localhost:3000/user/validate?key=userName&value=관리자

router.put('/', needAuth, function(req, res, next) {
  var key = req.query.key;
  var value = req.body[key];
  req.user.changeUserInformation(key, value, res);
});

router.delete('/', needAuth, function(req, res, next) {
  async.parallel([
    function (callback){
        User.findOneAndRemove({_id: req.user.id}, callback);
    }
  ], function(err, results){
    // 성공시 logout
    return err ? res.sendStatus(500):res.sendStatus(200);
  });
});

module.exports = router;
