var mongoose = require('mongoose');
var config = require('./config');
var log = require('./log')(module);

mongoose.connect("mongodb://localhost/mobile");

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

var User = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    login: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    created: { type: Date, default: Date.now }
});

User.path('login').validate(function(v) {
  return v.length > 3 && v.length < 70;
});

var Tag = new Schema({
  name: { type: String, required: true }
});

var Post = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  tags: [Tag],
  created: { type: Date, default: Date.now }
});

var UsersModel = mongoose.model('User', User);
module.exports.UsersModel = UsersModel;

var PostsModel = mongoose.model('Post', Post);
module.exports.PostsModel = PostsModel;
