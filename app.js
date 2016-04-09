var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var stormpath = require('express-stormpath');
require('dotenv').config();

var app = express();

// initialize stormpath user system
app.use(stormpath.init(app, {
  website: true,
  web: {
    // register options
    register: {
      form: {
        fields: {
          // add a registration code field
          registrationCode: {
            enabled: true,
            label: 'Registration Code',
            name: 'registrationCode',
            placeholder: '10-digit number',
            required: true,
            type: 'text'
          }
        }
      }
    }
  },
  /*
  Commenting out for now, until 
  // confirm that the registration code is valid
  preRegistrationHandler: function(formData, req, res, next) {
    app.get('stormpathApplication').getCustomData(function(err, data) {
      console.log(data);
    });
    return next(new Error('Registration error.'));
  },
  // log out the fact that a new user has registered
  postRegistrationHandler: function(account, req, res, next) {
    console.log('successfully registered ' + account.email);
    console.log(account);
    next();
  },
  */
  // after login, redirect the user to the admin page
  postLoginHandler: function(account, req, res, next) {
    res.status(302).redirect('/admin');
  }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/admin', stormpath.groupsRequired(['admin']), require('./routes/admin'));
app.use('/survey', stormpath.groupsRequired(['admin']), require('./routes/survey'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
