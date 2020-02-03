// window.$ = window.jQuery = require('jquery');
var express = require('express');
var path = require('path');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var bodyParser   = require('body-parser');
var session = require('express-session');


var user = {
	username: 'Guest',
	id: 0,
	password: 'passer'
};
var secret = 'W$q4=25*8%v-}UV';

var app = express();

app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

// using body parser to parse the body of incoming post requests
app.use(require('body-parser').urlencoded({
    extended: true // must give a value for extended
}));


// using express-session for session cookies
app.use(session(
        {
            name: 'site_cookie',
            secret: secret,
            resave: true,
            saveUninitialized: true,
        }
    )
);

passport.use(
	new Strategy(
	{
		usernameField: 'user',
		passwordField: 'pass'
	},
	function(username, password, cb){
		if (username === user.username && password.toString() === user.password){
			return cb(null, user);
		}
		return cb(null, false);
	}
   )
);

passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    cb(null, user);
});


app.use(passport.initialize());

app.get("/dashboard", function(req, res){
	res.render("dashboard");
});

app.get("/", function(req, res){
	res.render("login");
});

app.get('/logout',
    function (req, res) {
    	req.logout();
    	res.redirect('/');
});


app.post('/login',
	passport.authenticate('local', { successRedirect: '/dashboard',
									 failureRedirect: '/' })
);


function isLoggedIn(req, res, next) {
    if(req.user) {
        return next();
    } else {
        return res.redirect('/');
    }
 }


app.listen(app.get("port"), function(){
	console.log('Node server is running..');
});