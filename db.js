'use strict';

var schemas = require('./schemas.js');
var bcrypt = require('bcrypt');
var colors = require('colors');


function createUser(attributes) {
	var pass = attributes.password;
	var hash = bcrypt.hashSync(pass, 10);
	attributes.password = hash;
	attributes.admin = false;
	attributes.created_at = new Date();
	attributes.updated_at = new Date();

	var newUser = new schemas.User(attributes);

	newUser.save(function(err) {
		if (err) timeStamp(err, true);
		timeStamp("User " + attributes.name + " registered!");
	});
}

function createConvo(attributes, callback) {
	attributes.time = new Date();
	findUser(attributes.user_one, function(user_one) {
		if (user_one) {
			findUser(attributes.user_two, function(user_two) {
				//console.log("finding " + attributes.user_two);
				if (user_two) {
					attributes.user_one = user_one._id;
					attributes.user_two = user_two._id;

					var newConvo = new schemas.Convo(attributes);

					newConvo.save(function(err) {
						if (err) timeStamp(err, true);
						timeStamp("Conversation created between " + user_one.username + 
							" and " + user_two.username);
						return callback(newConvo);
		
					});
				} else {
					timeStamp("No user_two found for " + attributes.user_two + ".", true);
				} // write else clauses later // create user for user_two
			});
		}  else {
			timeStamp("No user_one found for " + attributes.user_one + ".", true);
		}// write else clauses later // create user for user_one
	})
	
}

function createMessage(attributes, callback) {
	attributes.time = new Date();
	
	findUser(attributes.user_fk, function(user_fk) {
		if (user_fk) {
			attributes.user_fk = user_fk._id;

			var newMessage = new schemas.Message(attributes);
			user_fk.msgs_sent = user_fk.msgs_sent + 1;
			user_fk.save();

			newMessage.save(function(err) {
				if (err) timeStamp(err, true);
				
				return callback();
			});
		} else {
			timeStamp("No user found from attributes.", null);
		}
	});

	
}

function loginUser(username, password, callback) {
	schemas.User.findOne({'username': username }, function (err, user) {
		
  		if (err) console.error("ERROR: " + err.message);
  		if (user != null) {
  			var hashed = user["password"];

  			var goodLogin = bcrypt.compareSync(password, hashed);
  			if (goodLogin) {
  				schemas.User.where({'username': username}).update({"updated_at": new Date()}).exec();
  			}
  			return callback(goodLogin);
  			
  		}

  		timeStamp('Unsuccessful login attempt for user ' + username, null);
  		return callback(false);

	});
	

}

function findUser(username, callback) {
	schemas.User.findOne({'username': username }, function (err, user) {
  		if (err) timeStamp(err, true);
  		if (user != null) {
  			
  			return callback(user);
  		}
  		return callback(null);
	});
}

function findConvo(user_one, user_two, callback) {
	findUser(user_one, function(userone) {
		if (userone == null) {
			return callback(null);
		}

		findUser(user_two, function(usertwo) {
			if (usertwo == null) {
				return callback(null);
			}
			var query = schemas.Convo.findOne().or([{"user_one": userone._id, "user_two": usertwo._id},
			 {"user_one": usertwo._id, "user_two": userone._id}]);

			query.exec(function(err, convo) {
				if (err) timeStamp(err, true);
				return callback(convo);
			});
		});

	});
	
}

function findUserConvos(username, callback) {
	findUser(username, function(usr) {
		if (usr == null) {
			return callback(null);
		}

		var query = schemas.Convo.find().or([{"user_one": usr._id},
			{"user_two": usr._id}]);
		query.populate("user_one");
		query.populate("user_two");
		query.exec(function(err, convos) {
			if (err) timeStamp(err, true);
			return callback(convos);
		});
	});
	
}

function findMessages(user, callback) {
	findUser(user, function(founduser) {
		if (founduser == null) {
			return callback([]);
		}

		var query = schemas.Message.find({"user_fk": founduser._id});
		query.populate('user_fk');
		query.exec(function(err, messages) {
			if (err) timeStamp(err, true);

			return callback(messages);
		});
	});
}

function findAllMessages(callback) {
	var query = schemas.Message.find({});
		query.populate('user_fk');
		query.sort({time: "asc"});
		query.exec(function(err, messages) {
			if (err) timeStamp(err, true);
			
			return callback(messages);
		});
}

function updateLogins(username, callback) {
	schemas.User.findOne({username: username}, function(err, user) {
		if (err) timeStamp(err, true);

		user.logins = user.logins + 1;
		user.save();
		return callback();
	});
}

function timeStamp(string, error) {
	Number.prototype.padLeft = function(base,chr){
   		var  len = (String(base || 10).length - String(this).length)+1;
   		return len > 0? new Array(len).join(chr || '0')+this : this;
	}

	var d = new Date(),
       dformat = [ (d.getMonth()+1).padLeft(),
                    d.getDate().padLeft(),
                    d.getFullYear()].join('/')+
                    ' ' +
                  [ d.getHours().padLeft(),
                    d.getMinutes().padLeft(),
                    d.getSeconds().padLeft()].join(':');
    // format string; red where error is true, yellow
    // when error is null, default when error is omitted or false
    if (error)
    	console.log("[" + dformat + "]  " + string .red);
    else if (error === null)
    	console.log("[" + dformat + "]  " + string .yellow);
    else
    	console.log("[" + dformat + "]  " + string);
}


// make this available to our users in our Node applications
module.exports.findUser = findUser;
module.exports.findConvo = findConvo;
module.exports.findUserConvos = findUserConvos;
module.exports.findMessages = findMessages;
module.exports.findAllMessages = findAllMessages;
module.exports.createUser = createUser;
module.exports.createConvo = createConvo;
module.exports.createMessage = createMessage;
module.exports.loginUser = loginUser;
module.exports.updateLogins = updateLogins;
module.exports.timeStamp = timeStamp;