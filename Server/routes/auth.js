module.exports = function(app, passport) {
  /*
  app.post('/login', passport.authenticate('local-login'), function(req, res) {
    if(req.user){
      return res.json(req.user);
    } else {
      return res.sendStatus(403);
    }
  });
*/
  app.get('/auth/facebook',
    passport.authenticate('facebook', { scope : 'email' })
  );
// http://localhost:3000/auth/facebook/callback
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect : '/',
      failureFlash : false
    }),
    function(req, res, next) {
      console.log("---------Session---------");
      console.log(req.user);
      console.log("-------------------------");
      res.redirect('/game');
    }
  );
  /*
  app.get('/auth/facebook/token',
    passport.authenticate('facebook-token'),
    function (req, res) {
      if (req.user) {
        return res.json(req.user);
      } else {
        return res.sendStatus(403);
      }
    }
  );
  */
  app.get('/user/logout', function(req, res) {
    console.log("logout");
    req.logout();
    res.redirect('/');
    // res.sendStatus(200);
  });
};
