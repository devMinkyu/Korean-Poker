var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var FacebookTokenStrategy = require('passport-facebook-token');
var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookClientID = '613559305514339';
var FacebookClientSecret = 'b8a4ab9771c55af309460dcc7cf98e73';
var KakaoStrategy = require('passport-kakao').Strategy;
var KakaoClientID = '5a98281feb79b8e43adbf51624c08a2e';
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
    clientID : FacebookClientID,
    clientSecret : FacebookClientSecret,
    //callbackURL : 'http://localhost:9000/auth/facebook/callback',
    callbackURL : 'http://dev-minkyu.me/auth/facebook/callback',
    profileFields : ["emails", "displayName", "name", "photos"]
  }, function(token, refreshToken, profile, done) {
    if(!profile.emails){
      return done(null);
    }
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
            user.photoURL = profile.photos[0].value;
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

  passport.use(new KakaoStrategy({
      clientID : KakaoClientID,
      //callbackURL : 'http://localhost:9000/auth/kakao/callback'
      callbackURL : 'http://dev-minkyu.me/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done){
      var email = profile._json.kaccount_email;
      process.nextTick(function () {
        User.findOne({'kakao.id': profile.id}, function(err, user) {
          if (err) {
            return done(err);
          }
          if (user) {
            return done(null, user);
          }else {
            User.findOne({userEmail: email}, function(err, user) {
              if (err) {
                return done(err);
              }
              if (!user) {
                user = new User({
                  userName: profile.displayName,
                  userEmail: profile._json.kaccount_email
                });
              }
              user.kakao.id = profile.id;
              user.kakao.token = profile.token;
              if(profile._json.properties.thumbnail_image === ""){
                user.photoURL = "https://img1.daumcdn.net/thumb/R720x0.q80/?scode=mtistory&fname=http%3A%2F%2Fcfile27.uf.tistory.com%2Fimage%2F2466D94653EC5DBD29E64E";
              }else{
                user.photoURL = profile._json.properties.thumbnail_image;
              }
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
    }
  ));
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
