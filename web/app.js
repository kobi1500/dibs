const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
var cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


//mongoose
mongoose.connect('mongodb://localhost:27017/dibs-db',{useNewUrlParser: true})
.then(() => console.log('database is connected...')) 
.catch((err) => console.log(err));
const port = process.env.PORT || '3000'
const users = require('./routes/users');
const posts = require('./routes/posts');

const Post = require('./models/post');

const app = express();



app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(methodOverride('_method'));
app.use(cookieParser('keyboard cat'));
app.use(session({
    cookie:{ maxAge: 3600000},
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));
// Express Session


app.use(passport.initialize());
app.use(passport.session());


// passport init





// Global Vars
app.use(function (req, res, next) {
res.locals.success_msg = req.flash('success_msg');
res.locals.error_msg = req.flash('error_msg');
res.locals.error = req.flash('error');
res.locals.user = req.user || null;
next();
});



app.get('/', function(req, res){
    Post.find({}, function(err, posts){
      if(err){
        console.log(err);
      } else {
        res.render('index', {
          posts: posts
        });
      }
    });
  });



app.use('/users', users);
app.use('/posts', posts);
  

    
app.listen(port,() => console.log(`server listening on port ${port}`));