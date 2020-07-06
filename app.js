const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');
const flash = require('connect-flash');

const indexRouter = require('./routes/index');
const dashBoard = require('./routes/dashboard');
const auth = require('./routes/auth');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('express-ejs-extend'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'blog key',
  resave: true,
  saveUninitialized: true,
  cookie:{maxAge: 1000*1000}
}));
app.use(flash());

//middleware
const authCheck = function(req, res, next){
  if(req.session.uid){
    return next();
  }
  return res.redirect('/auth/login');
}

app.use('/', indexRouter);
app.use('/dashboard', authCheck, dashBoard);
app.use('/auth', auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  let title='';
  // render the error page
  console.log(err.status);
  if(err.status == 404){
    title = '你所查看的頁面並不存在'
  }else{
    title = '程式錯誤'
  }
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err,
    title: title
  });
});

module.exports = app;