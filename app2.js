var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var mongoose = require('./db.js');
var bodyParser = require("body-parser");
var session = require('express-session');

var online = []
var currentUser = "";

app.use(session({
    secret: 'W3gsz?JP@0=_2389AGvsjrlSDF;',
    resave: true,
    saveUninitialized: true
}));


app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());
// prereqs
app.use(express.static(__dirname + '/assets'));

var auth = function(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
  	return res.sendFile(__dirname + "/assets/views/index.html");
  }
    
};


var revAuth = function(req, res, next) {
  if (!req.session || !req.session.user)
    return next();
  else
    return res.sendFile(__dirname + "/assets/views/chatreact2.html");
};



app.get('/', revAuth, function(request, response) {
	response.sendFile(__dirname + "/assets/views/index.html");
});

app.post('/', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	mongoose.loginUser(username, password, function(succeeded) {
		
		if (succeeded) {
			request.session.user = username;
			currentUser = username;
			console.log("User " + username + " has logged in.");
			response.send(true);
		} else {
			response.send(false);
		}
	});
	
});



app.get('/logout', function(request, response) {
	console.log("User " + request.session.user + " has logged out.");
	currentUser = "";
	request.session.destroy();
	response.sendFile(__dirname + "/assets/views/index.html");
});

app.get('/chat', auth, function(request, response) {
	response.sendFile(__dirname + "/assets/views/chatreact2.html");
});

app.get('/register', function(request, response) {
	response.sendFile(__dirname + "/assets/views/register.html");
});

app.get('/tictac', function(request, response) {
	response.sendFile(__dirname + "/assets/views/tictactoe.html");
});

app.post('/register', function(request, response) {
	var params = {name: request.body.name,
				  username: request.body.username,
				  email: request.body.email,
				  password: request.body.password1,
				  location: request.body.location
				  };

	mongoose.createUser(params);
	response.redirect("/");
	
});

app.get('/api/user', function(request, response) {
	if (!request.session.user) {
		response.json({});
	} else {
		mongoose.findUser(request.session.user, function(user) {
			response.json(user);
		});
		//response.json({"username": request.session.user});
	}
});



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
							io.emit("new message", messages);
						});
					});

					
				});
			} else {
				//console.dir(convo);
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
		
		mongoose.findUser(user.username, function(foundUser) {
			mongoose.findUserConvos(foundUser.username, function(convos) {
				var duplicate = online.some(function (usr) {
					return usr.username === foundUser.username;
				});

				// only add to list of online users if it isn't already there
				if (!duplicate) {
					online.push({"username": foundUser.username,
					 "socket": socket.id,
					 "time": new Date(),
					 "user_id": foundUser._id,
					 "convo_ids": convos});
				}
				

				console.log("User " + foundUser.username + " has joined the chat");

				mongoose.findAllMessages(function(messages) {
					
					io.emit('new User', {"convos": online, "messages": messages});
					//io.emit('refresh', online);
				});
			});
			
		});
		
		
	});

	socket.on("logout", function() {
		online.some(function(usr) {
			if (usr.socket === socket.id) {
				
				online = online.filter(function(popped) {
					// remove user from online list and pop from the list
					console.log("User " + usr.username + " has left the chat.");
								
					
					return popped.username != usr.username;
				});

				io.emit("refresh", online);
				
			}
		});
	});

	
});




http.listen(3000, function() {
	console.log("Running on port 3000...");
});