var express = require('express');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var http = require('http');
var User = require('./models/user').User;

// Create a new Express application.
var app = express();
//definición de puerto
app.set('port', process.env.PORT || 3000);
//app.set('port',3000);

// Lo necesario para ocupar passport
passport.use(new Strategy({
    //clientID: '1237889892938057',
    clientID: '1759592940975382',
    //clientSecret: '1c6b8c6b32c1cfda1c9969179e370e5f',
    clientSecret: '8e5d51d7ae1de27ed55b732826526b1b',
    //callbackURL: 'http://localhost:3000/login/facebook/return'
    callbackURL: 'https://jhonattan-facebook-login-2.herokuapp.com/login/facebook/return'
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOne({id: profile.id}, function(err, user) {
      if(err) throw(err);
      if(!err && user!= null) return cb(null, user);

      // Al igual que antes, si el usuario ya existe lo devuelve
      // y si no, lo crea y salva en la base de datos
      var user = new User({
        id          : profile.id,
        displayName : profile.displayName,
        exp         : 0,
        nivel       : 1
      });
      user.save(function(err) {
        if(err) throw err;
        cb(null, user);
      });
    });
  }));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});



// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//definición de carpeta publica
app.use("/public",express.static('public'));

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
  function(req, res) {
    res.render('inicio', { user: req.user, title: 'Inicio' });
  });

app.get('/inicio',
  function(req, res) {
    res.locals.title;
    res.render('inicio',
    {
      title:'Inicio'
    });
  });

app.get('/facebook-error',
  function(req, res) {
    res.render('facebook-error', { user: req.user, title: 'Error' });
  });

app.get('/login/facebook',
  passport.authenticate('facebook'),function(req,res){
    console.log('/login/facebook/ '+app.get('port'));
  });

app.get('/login/facebook/return', 
  passport.authenticate('facebook', { failureRedirect: '/facebook-error' }),
  function(req, res) {
    console.log('/login/facebook/return/ '+app.get('port'));
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user, title:req.user.displayName });
  });

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});