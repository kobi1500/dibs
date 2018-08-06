mongoose = require('mongoose');
  User = require('../models/user');

  var noReturnUrls = [
    '/users/login',
  ];
  

exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
    // Setup info and user objects
    var info = {};
    var user;
  
   
  
    // Define a search query fields
    var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
    var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;
  
    // Define main provider search query
    var mainProviderSearchQuery = {};
    mainProviderSearchQuery.provider = providerUserProfile.provider;
    mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];
  
    // Define additional provider search query
    var additionalProviderSearchQuery = {};
    additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];
  
    // Define a search query to find existing user with current provider profile
    var searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
    };
  
    // Find existing user with this provider account
    User.findOne(searchQuery, function (err, existingUser) {
      if (err) {
        return done(err);
      }
  
      if (!req.user) {
        if (!existingUser) {
          var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');
  
          User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
            user = new User({
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              username: availableUsername,
              displayName: providerUserProfile.displayName,
              profileImageURL: providerUserProfile.profileImageURL,
              provider: providerUserProfile.provider,
              providerData: providerUserProfile.providerData
            });
  
            // Email intentionally added later to allow defaults (sparse settings) to be applid.
            // Handles case where no email is supplied.
            // See comment: https://github.com/meanjs/mean/pull/1495#issuecomment-246090193
            user.email = providerUserProfile.email;
  
            // And save the user
            user.save(function (err) {
              if(!err)
              return done(err, user, info);
            });
          });
        } else {
          return done(err, existingUser, info);
        }
      } else {
        // User is already logged in, join the provider data to the existing user
        user = req.user;
  
        // Check if an existing user was found for this provider account
        if (existingUser) {
          if (user.id !== existingUser.id) {
            return done(new Error('Account is already connected to another user'), user, info);
          }
  
          return done(new Error('User is already connected using this provider'), user, info);
        }
  
        // Add the provider data to the additional provider data field
        if (!user.additionalProvidersData) {
          user.additionalProvidersData = {};
        }
  
        user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;
  
        // Then tell mongoose that we've updated the additionalProvidersData field
        user.markModified('additionalProvidersData');
  
        // And save the user
        user.save(function (err) {
          return done(err, user, info);
        });
      }
    });
  };
  