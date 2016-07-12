var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var stormpath = require('express-stormpath');
var session = require('express-session');
require('dotenv').config();

var app = express();

var mongoose = require('mongoose');
// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.
var uristring = 'mongodb://localhost/data';

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded, now connected to: ' + uristring);
  }
});

// var db = mongoose.connect(uristring);

// mongoose.connection.on('error', function(err) {
//   console.log('MongoDB error: %s', err);
// });

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
  // confirm that the registration code is valid
  preRegistrationHandler: function(formData, req, res, next) {
    // check the registration data in custom data to confirm that
    // this is a valid registration code and email combination
    app.get('stormpathApplication').getCustomData(function(err, data) {
      // check three potential error points
      if (err) {
        return next(new Error('Internal error accessing data.'));
      } else if (!data.registration.hasOwnProperty(formData.registrationCode)) {
        return next(new Error('Invalid registration code.'));
      } else if (data.registration[formData.registrationCode] !== formData.email) {
        return next(new Error('Registration code does not match email on record.'));
      } else {
        // if all tests are pass, approve the registration
        // and remove the registration code from custom data
        delete data.registration[formData.registrationCode];
        data.save();
        next();
      }
    });
  },
  // add the account to the admin account
  postRegistrationHandler: function(account, req, res, next) {
    // get the admin group
    app.get('stormpathApplication').getGroups({name: 'admin'}, function(err, groups) {
      // iterate through the returned groups
      groups.each(function(group, cb) {
        // add the newly created account to the admin group
        if (group.name === 'admin') {
          account.addToGroup(group, function(err, membership) {
            // return any relevant err from adding group membership
            if (err) {
              return next(err);
            }
          });
        }
        // continue iterating through the returned groups
        cb();
      }, function(err) {
        // after iterating through all groups move on, passing any relevant err
        if (err) {
          next(err);
        } else {
          next();
        }
      });
    });
  },
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
app.use('/stylesheets', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use('/', require('./routes/index'));
app.use('/admin', stormpath.groupsRequired(['admin']), require('./routes/admin'));
app.use('/init', stormpath.groupsRequired(['admin']), require('./routes/init'));
app.use('/report', stormpath.groupsRequired(['admin']), require('./routes/report'));
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
