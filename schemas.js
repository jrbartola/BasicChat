var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var Schema = mongoose.Schema;


var db = mongoose.connection;
db.on('error', console.error.bind(console, "Didn't connect to database"));
db.once('open', function (callback) {

});

var userSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: Boolean,
  location: String,
  created_at: Date,
  updated_at: Date,
  logins: {type: Number, default: 0},
  msgs_sent: {type: Number, default: 0}
});

var convoSchema = new Schema({
	user_one: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
	user_two: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
	time: Date
});

var messageSchema = new Schema({
	text: {type: String, required: true},
	picture: String,
	user_fk: {type: Schema.Types.ObjectId, required: true, ref: 'User'},
	time: Date,
	convo_fk: {type: Schema.Types.ObjectId, required: true, ref: 'Convo'}
});


var User = mongoose.model('User', userSchema);
var Convo = mongoose.model('Convo', convoSchema);
var Message = mongoose.model('Message', messageSchema);

module.exports.User = User;
module.exports.Convo = Convo;
module.exports.Message = Message;
module.exports.Mongoose = mongoose;
