var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var FacebookTokenStrategy = require('passport-facebook-token');
var FacebookStrategy = require('passport-facebook').Strategy;
var clientID = '613559305514339';
var clientSecret = 'b8a4ab9771c55af309460dcc7cf98e73';
module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new FacebookStrategy({
    clientID : clientID,
    clientSecret : clientSecret,
    callbackURL : 'http://localhost:3000/auth/facebook/callback',
    profileFields : ["emails", "displayName", "name", "photos"]
  }, function(token, refreshToken, profile, done) {
    console.log(profile);
    var email = profile.emails[0].value;
    process.nextTick(function () {
      User.findOne({'facebook.id': profile.id}, function(err, user) {
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null, user);
        } else {
          User.findOne({userEmail: email}, function(err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              user = new User({
                userName: profile.displayName,
                userEmail: profile.emails[0].value
              });
            }
            user.facebook.id = profile.id;
            user.facebook.token = profile.token;
            user.save(function(err) {
              if (err) {
                return done(err);
              }
              return done(null, user);
            });
          });
        }
      });
    });
  }));
};

/*
  passport.use('local-login', new LocalStrategy({
    // usernameField : 'userEmail',
    usernameField: 'userIdentifier',
    passwordField : 'password',
    passReqToCallback : true
  }, function(req, userIdentifier, password, done) {
    process.nextTick(function () {
      User.find({ $or: [ { userName : userIdentifier }, { userEmail : userIdentifier } ] },
        function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user[0]) {
          return done(null, false);
        }
        if (!user[0].validatePassword(password)) {
          return done(null, false);
        }
        return done(null, user[0]);
      });
    });
  }));
*/
  // Facebook Login
  /*
  passport.use(new FacebookTokenStrategy({
    clientID: "1149810431795059",
    clientSecret: "2f4c5d3eaec0abbb1101c23af146ad00"
    }, function(accessToken, refreshToken, profile, done) {
      var email = profile.emails[0].value;
      process.nextTick(function () {
        User.findOne({'facebook.id': profile.id}, function(err, user) {
          if (err) {
            return done(err);
          }
          if (user) {
            return done(null, user);
          } else {
            User.findOne({userEmail: email}, function(err, user) {
              if (err) {
                return done(err);
              }
              if (!user) {
                user = new User({
                  userName: profile.displayName,
                  userEmail: profile.emails[0].value
                });
              }
              user.facebook.id = profile.id;
              user.facebook.token = profile.token;
              user.save(function(err) {
                if (err) {
                  return done(err);
                }
                return done(null, user);
              });
            });
          }
        });
      });
    }));

};
*/
