var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
require('mongoose-type-email');

var schema = new Schema({
  userName: {type: String, required: true, unique: true},
  userEmail: {type: mongoose.SchemaTypes.Email, required: true, unique: true, trim: true},
  contents : {type: String},
  facebook: {id: String, token: String},
  photoURL : {type: String},
  insignia : {type: Number, default: 0},
  win : {type: Number, default: 0},
  lose : {type: Number, default: 0},
  money: {type: Number, default: 1000000}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});

schema.methods.changeUserInformation = function(key, value, res) {
  this[key] = value;
  // this.save();
  this.save(function(err, user){
      if(err){
        return res.sendStatus(500);
      } else {
        // return res.sendStatus(200);
        return res.json(user);
      }
  });
};
schema.methods.addElementAndSave = function(key, value) {
  if (this[key].indexOf(value) == -1){
    this[key].push(value);
    this.save();
    return true;
  } else {
    return false;
  }
};
schema.methods.deleteElementAndSave = function(key, value) {
  var index = this[key].indexOf(value);
  if (index != -1){
    this[key].splice(index,1);
    this.save();
    return true;
  } else {
    return false;
  }
};
var User = mongoose.model('User', schema);
module.exports = User;
