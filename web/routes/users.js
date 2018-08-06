const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const users = require('../controllers/users.controller');
const User = require('../models/user');
const configAuth = require('../config/auth');



router.get('/login', (req, res) => {

    let message = req.flash('errors');

    res.render('users/login', { message: message });
});

router.get('/register', (req, res) => {
    res.render('users/register');
});
router.get('/profile', (req, res) => {
    res.render('users/profile');

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


module.exports = router;