const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;
// Schema

const UserSchema = new Schema({
    fullName: {
        type: String
    },
    DateBirth: {
        type: Date
    },
    displayName: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        lowercase: true,
        trim: true
    },
    street: {
        type: String
    },
    country: {
        type: String
    },
    phone: {
        type: String
    },
    provider: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    profileImageURL: {
        type: String,
        default: ''
    },
    providerData: {},
    additionalProvidersData: {},
    created: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String
    },

    resetPasswordExpires: {
        type: String
    }
});

module.exports = UserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
    var _this = this;
    var possibleUsername = username.toLowerCase() + (suffix || '');

    _this.findOne({
        username: possibleUsername
    }, function (err, user) {
        if (!err) {
            if (!user) {
                callback(possibleUsername);
            } else {
                return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
            }
        } else {
            callback(null);
        }
    });
};

var User = module.exports = mongoose.model('User', UserSchema);
module.exports.createUser = function (newUser, callback) {
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(newUser.password, salt, function (err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}


module.exports.getUserByEmail = function (email, callback) {
    var query = { email: email };
    User.findOne(query, callback);
}

module.exports.getUserById = function (id, callback) {
    User.findById(id, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
        if (err) throw err;
        callback(null, isMatch);
    });
}