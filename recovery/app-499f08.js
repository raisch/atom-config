var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var redis = require('redis');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var client  = redis.createClient();

GLOBAL.Config = require('./config/app.config');

require('./config/alert.message');
require('./config/notification');
require('./config/mimetypes');
GLOBAL.ApiHelper = require('./middleware/ApiHelper');
GLOBAL.ContentUploader = require('./middleware/ContentUploader');
ContentUploader.init();
GLOBAL.DateTime  = require('./lib/DateTime');
GLOBAL.Util  = require('./lib/Util');
GLOBAL.NewsFeed  = require('./lib/NewsFeed');
//Define Clusters
var Clusters = require('./config/clusters');
Clusters.init();

//Update calender events handler
GLOBAL.CalendarEventHandler = require('./middleware/CalendarEventHandler');
CalendarEventHandler.init();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({ extended: true,limit: '100mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*
app.use(session({
  store: new RedisStore({
    host: Config.CACHE_HOST,
    port: Config.CACHE_PORT,

  }),
    secret: Config.SECRET,
    saveUninitialized: true,
    resave: true
}));
*/

app.use(session({
  secret: Config.SECRET,
  store: new RedisStore({host: Config.CACHE_HOST, port: Config.CACHE_PORT, client: client, ttl: 260}),
  saveUninitialized: true,
  resave: false
}));

require('./core/model');
var routes = require('./routes/route');
var testRoutes = require('./routes/test');
var reactRoutes = require('./routes/index');
var apiRoutes = require('./routes/api');

app.use('/s3', require('react-s3-uploader/s3router')({
    bucket: "ambi-dev",
    region: 'us-east-1', //optional
    headers: {'Access-Control-Allow-Origin': '*'}, // optional
    ACL: 'public-read', // this is default
    uniquePrefix: true // (4.0.2 and above) default is true, setting the attribute to false preserves the original filename in S3
}));

app.use('/', reactRoutes);
app.use('/', routes);
app.use('/test', testRoutes);
app.use('/api', apiRoutes);

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

//ES Connection Update - init
GLOBAL.ESUpdateHandler = require('./middleware/ESUpdateHandler');
ESUpdateHandler.init();

//ES Connection Update - init
GLOBAL.UpdateConnectionsHandler = require('./middleware/UpdateConnectionsHandler');
UpdateConnectionsHandler.init();


//Update notification category
GLOBAL.NotificationCategoryUpdateHandler = require('./middleware/NotificationCategoryUpdateHandler');

// TODO : @Naveen - uncomment this after fixing issue
//NotificationCategoryUpdateHandler.init();

module.exports = app;
