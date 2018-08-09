const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const moment = require('moment');
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require('bcryptjs');

const users = require('../controllers/users.controller');
const User = require('../models/user');
const Post = require('../models/post');
const configAuth = require('../config/auth');
const configMailer = require('../config/nodemailer');


router.get('/login', (req, res) => {

    let message = req.flash('errors');

    res.render('users/login', { message: message });
});

router.get('/register', (req, res) => {
    res.render('users/register');
});

router.get('/forget_password',(req,res) => {
    res.render('users/forget_password');
});

router.post('/forget_password', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: configMailer.mailer.options.service, 
          auth: {
            user: configMailer.mailer.options.auth.user,
            pass: configMailer.mailer.options.auth.pass
          }
        });
        var mailOptions = {
          to: user.email,
          from: configMailer.mailer.from,
          subject: 'Password Reset',
          text: 'You are receiving this because you  have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/users/forget_password_confirm/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');

        });
      }
    ], function(err) {
      if (err) return next(err);
      res.render('users/forget_password',req.flash('success_msg'));
    });
  });
  
  router.get('/forget_password_confirm/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
      }
      res.render('users/forget_password_confirm', {token: req.params.token,});
    });
  });
  
  router.post('/forget_password_confirm/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
          }
          if(req.body.password === req.body.confirm) {
            user.password=bcrypt.hashSync(req.body.password, 10);; 
              user.resetPasswordToken = undefined;
               user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
            service: configMailer.mailer.options.service, 
            auth: {
              user: configMailer.mailer.options.auth.user,
              pass: configMailer.mailer.options.auth.pass
            }
          });
        var mailOptions = {
          to: user.email,
          from: configMailer.mailer.from,
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/users/login');
    });
  });
  
router.get('/profile', ensureAuthenticated, (req, res) => {
    Post.find({ 'author': req.user._id }, (err, posts) => {
        if (err) {
            console.log(err);
        } else {
            // for (i in posts) {
            //     var formatted_date = moment(posts[i].createdAt).format("DD-MM-YYYY");
            //     date={
            //         dateFormat:formatted_date
            //     }

            // }
            
            res.render('users/profile', { currentUser: req.user, posts: posts});
        }
    });



});

router.get('/edit_profile/:id', (req, res) => {
    User.findOne({
        _id: req.params.id
    }).then(user => {
        res.render('users/edit_profile', {
            user: user
        });
    });

});

router.put('/profile/:id', (req, res) => {
    User.findOne({
        _id: req.params.id

    }).then(user => {
        user.fullName = req.body.fullName;
        user.DateBirth = req.body.DateBirth;
        user.street = req.body.street;
        user.country = req.body.country;
        user.phone = req.body.phone;
        user.email = req.body.email;

        user.save().then(user => {
            res.redirect('/users/profile');
        })


    });
});

router.post('/register', (req, res) => {
    let errors = [];
    if (req.body.pass != req.body.pass2) {
        errors.push({ text: "passwords does not match!" });
    }
    if (req.body.pass.length < 5) {
        errors.push({ text: "password must be at least 5 characters!" });

    }
    if (req.body.phone.length < 10) {
        errors.push({ text: "phone must be maximum 10 characters!" });
    }
    if (errors.length > 0) {
        res.render('users/register', {
            errors: errors,
            fullName: req.body.fullName,
            DateBirth: req.body.DateBirth,
            street: req.body.street,
            country: req.body.country,
            phone: req.body.phone,
            email: req.body.email,
            username: req.body.username,
            password: req.body.pass,
            password2: req.body.pass2


        });
    } else {

        var newUser = new User({
            fullName: req.body.fullName,
            DateBirth: req.body.DateBirth,
            street: req.body.street,
            country: req.body.country,
            phone: req.body.phone,
            email: req.body.email,
            username: req.body.username,
            password: req.body.pass
        });
        User.createUser(newUser, function (err, user) {
            if (err) throw err;
            console.log(user);
        });

        res.redirect('/users/login');
    }
});



passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'pass',
    passReqToCallback: true
},
    function (req, email, password, done) {

        User.getUserByEmail(email, function (err, user) {
            if (err) return done(err);
            if (!user) {
                req.flash('errors', 'User not exist');
                return done(null, false, { message: 'User not exist' });
            }

            User.comparePassword(password, user.password, function (err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    req.flash('errors', 'Invalid password');
                    return done(null, false, { message: 'Invalid password' });
                }
            });
        });
    }));

passport.use(new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
    profileFields: ['id', 'name', 'displayName', 'emails', 'photos']
},
    function (req, accessToken, refreshToken, profile, done) {
        var providerData = profile._json;
        providerData.accessToken = accessToken;
        providerData.refreshToken = refreshToken;
        var providerUserProfile = {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            displayName: profile.displayName,
            phone: profile.phone,
            email: profile.emails[0].value,
            profileImageURL: (profile.id) ? '//graph.facebook.com/' + profile.id + '/picture?type=large' : undefined,
            provider: 'facebook',
            providerIdentifierField: 'id',
            providerData: providerData
        };

        // Save the user OAuth profile
        users.saveOAuthUserProfile(req, providerUserProfile, done);



    }));

passport.use(new GoogleStrategy({
    clientID: configAuth.googleAuth.clientID,
    clientSecret: configAuth.googleAuth.clientSecret,
    callbackURL: configAuth.googleAuth.callbackURL,
    passReqToCallback: true
},
    function (req, accessToken, refreshToken, profile, done) {
        // Set the provider data and include tokens
        var providerData = profile._json;
        providerData.accessToken = accessToken;
        providerData.refreshToken = refreshToken;

        // Create the user OAuth profile
        var providerUserProfile = {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            profileImageURL: (providerData.cover.coverPhoto.url) ? providerData.cover.coverPhoto.url : undefined,
            provider: 'google',
            providerIdentifierField: 'id',
            providerData: providerData
        };

        // Save the user OAuth profile
        users.saveOAuthUserProfile(req, providerUserProfile, done);
    }
));

router.post('/login', passport.authenticate('local', {
    successRedirect: '/users/profile',
    failureRedirect: '/users/login',
    failureFlash: true
}));


router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/auth/facebook/callback', passport.authenticate('facebook',
    {
        successRedirect: '/users/profile',
        failureRedirect: '/users/login'
    }));

// Set up the Google OAuth routes 
router.get('/auth/google', passport.authenticate('google', {
    scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ],
    failureRedirect: '/users/login'
}));
router.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/users/profile',
    failureRedirect: '/users/login'

}));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.getUserById(id, function (err, user) {
        done(err, user);
    });
});


router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/');
    }
}
module.exports = router;