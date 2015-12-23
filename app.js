var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var mongoose = require('./db.js');
var bodyParser = require("body-parser");
var session = require('express-session');


var currentUser = "";

app.use(session({
    secret: 'W3gsz?JP@0=_2389AGvsjrlSDF;',
    resave: true,
    saveUninitialized: true
}));


app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());
// set static directory
app.use(express.static(__dirname + '/assets'));

var auth = function(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
  	return res.sendFile(__dirname + "/assets/views/login.html");
  }
    
};


var revAuth = function(req, res, next) {
  if (!req.session || !req.session.user)
    return next();
  else
    return res.sendFile(__dirname + "/assets/views/chat.html");
};



app.get('/', function(req, res) {
	res.sendFile(__dirname + "/assets/views/index.html");
});

app.get('/login', revAuth, function(req, res) {
	res.sendFile(__dirname + "/assets/views/login.html")
});

app.post('/login', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	mongoose.loginUser(username, password, function(succeeded) {
		
		if (succeeded) {
			req.session.user = username;
			currentUser = username;
			console.log("User " + username + " has logged in.");
			res.send(true);
		} else {
			res.send(false);
		}
	});
	
});



app.get('/logout', function(req, res) {
	console.log("User " + req.session.user + " has logged out.");
	currentUser = "";
	req.session.destroy();
	res.sendFile(__dirname + "/assets/views/index.html");
});

app.get('/chat', auth, function(req, res) {
	res.sendFile(__dirname + "/assets/views/chat.html");
});

app.get('/register', function(req, res) {
	res.sendFile(__dirname + "/assets/views/register.html");
});

app.get('/tictac', function(req, res) {
	res.sendFile(__dirname + "/assets/views/tictactoe.html");
});

app.post('/register', function(req, res) {
	var params = {name: req.body.name,
				  username: req.body.username,
				  email: req.body.email,
				  password: req.body.password1,
				  location: req.body.location
				  };

	mongoose.createUser(params);
	res.redirect("/");
	
});

app.get('/api/user', function(req, res) {
	if (!req.session.user) {
		res.json({});
	} else {
		mongoose.findUser(req.session.user, function(user) {
			res.json(user);
			
		});

	}
});

app.get('/api/convos', function(req, res) {
	mongoose.findUserConvos(req.session.user, function(convos) {
		
		res.json(convos);
	});
});

var online = []

io.on("connection", function(socket) {
	
	
	socket.on("new message", function(msg) {
		// check if convo exists between two users. create it if it doesnt exist
		mongoose.findConvo(msg.username, msg.recipient, function(convo) {
			if (!convo) {
				var attribs = {"user_one": msg.username, "user_two": msg.recipient};
				mongoose.createConvo(attribs, function(convo) {
					mongoose.createMessage({"text": msg.message,
						"user_fk": msg.username, "convo_fk": convo._id}, function() {

						mongoose.findAllMessages(function(messages) {
							var recipient = {username: msg.recipient};
							recipi = online.filter(function(otherusr) {
								return otherusr.username === recipient.username;
							});
							
							// refresh the online convo list by removing them
							// and re-adding them to the online array
							delUser(socket.id, function() {
								loadUser(msg, socket.id, function() {
									delUser(recipi[0].socket, function() {
										loadUser(recipient, recipi[0].socket, function() {
											io.emit("new message", messages);
											
										});
									});
								});
							});						
						});
					});
				});

			} else {
				
				mongoose.createMessage({"text": msg.message,
					"user_fk": msg.username, "convo_fk": convo._id}, function() {

					mongoose.findAllMessages(function(messages) {
						io.emit("new message", messages);
					});
				});
			}
		});
	});
	

	socket.on("loadUser", function(user) {
		loadUser(user, socket.id);
		
	});

	socket.on("logout", function() {
		delUser(socket.id);
	});
});

var delUser = function(socket, callback) {
	online.some(function(usr) {
		if (usr.socket === socket) {
				
			online = online.filter(function(popped) {
				// remove user from online list and pop from the list
				console.log("User " + usr.username + " has left the chat.");
				return popped.username != usr.username;
			});
		}
	});

	if (callback) {		
		return callback();
	} else {
		io.emit("refresh", online);
	}
}

var loadUser = function(user, socket, callback) {
	mongoose.findUser(user.username, function(foundUser) {
		mongoose.findUserConvos(foundUser.username, function(convos) {
			var duplicate = online.some(function (usr) {
				return usr.username === foundUser.username;
			});

			// only add to list of online users if it isn't already there
			if (!duplicate) {
				online.push({"username": foundUser.username,
				 "socket": socket,
				 "time": new Date(),
				 "user_id": foundUser._id,
				 "convo_ids": convos});
			}
				
			console.log("User " + foundUser.username + " has joined the chat");

			mongoose.findAllMessages(function(messages) {
					
				io.emit('new User', {"convos": online, "messages": messages});
				//io.emit('refresh', online);
				if (callback) return callback();
			});
		});
	});
}








http.listen(3000, function() {
	console.log("Running on port 3000...");
});