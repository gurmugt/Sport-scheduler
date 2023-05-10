/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable radix */
/* eslint-disable no-console */
const express = require('express');

const app = express();
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
const path = require('path');

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
const passport = require('passport');
const flash = require('connect-flash');
const connectEnsureLogin = require('connect-ensure-login');
const session_express = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const {
  Session, playersList, Sport, User,
} = require('./models');

const saltRounds = 10;

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session_express({
  secret: 'my-super-secret-key-123456789876123456788',
  cookies: {
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          }
          return done(null, false, {
            message: 'Invalid password. Please try Again',
          });
        })
        .catch(() => done(null, false, {
          message: 'Account not registered?  To continue please, signup!',
        }));
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log('Serializing user in session', user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

// Sign up
app.get('/signup', (request, response) => {
  response.render('signup', {
    title: 'Signup',
  });
});

app.post('/users', async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);

  try {
    const user = await User.create({
      name: request.body.name,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect('/addSport');
    });
  } catch (error) {
    console.log(error);
  }
});

app.get('/login', (request, response) => {
  response.render('login', {
    title: 'login',
  });
});

app.post(
  '/session',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
  }),
  (request, response) => {
    console.log(request.user);
    response.redirect('/addSport');
  },
);

app.get('/', async (request, response) => {
  response.render('index', {
    title: 'Sport Scheduler',
  });
});

app.post('/addSession', async (request, response) => {
  try {
    const id = parseInt(request.body.sessionId);
    const date = new Date(request.body.date);
    console.log(id);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(id)) {
      console.log('Updating');
      await Session.updateSessions({
        date,
        location: request.body.location,
        numPlayers: request.body.numPlayers,
        id,
      });
      await playersList.updatePlayers(request.body.players, id);
    } else {
      console.log('Creating');
      const session = await Session.createSessions({
        date: request.body.date,
        location: request.body.location,
        numPlayers: request.body.numPlayers,
        sportId: request.body.sportId,
      });
      await playersList.createPlayers(request.body.players, session.id);
      console.log('create player id', session.id);
    }
    response.redirect(302, `/modifySessions/${request.body.sportId}`);
  } catch (error) {
    console.log(error);
  }
});

app.get('/addSession/:id', async (request, response) => {
  try {
    const sessionRecord = await Session.findByPk(request.params.id);
    const playersArray = await playersList.findAll({
      where: {
        sessionId: sessionRecord.id,
      },
    });
    const players = playersArray.map((player) => player.name).join(',');
    response.render('sessions', {
      title: 'Edit Session',
      sessionRecord,
      players,
    });
  } catch (error) {
    console.log(error);
  }
});

// eslint-disable-next-line consistent-return
app.get('/modifySessions/:id', async (request, response) => {
  try {
    const session = await Session.findByPk(request.params.id);
    const playersArray = await playersList.findAll({
      where: {
        sessionId: session.id,
      },
    });
    response.render('modifySessions', {
      title: 'Edit Session',
      session,
      playersArray,
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Rendering addSport
app.get('/addSport', (request, response) => {
  response.render('addSport', {
    title: 'Create Sport',
  });
});

// Create a new sport
app.post('/addSport', async (request, response) => {
  try {
    const sport = await Sport.create({
      name: request.body.title,
    });
    return response.redirect(302, `/sport/${sport.id}`);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get('/sport/:id', async (request, response) => {
  const getSport = await Sport.findByPk(request.params.id);
  const sessionRecord = await Session.findAll({
    where: {
      sportId: getSport.id,
    },
  });
  response.render('sport', {
    title: 'Sport List',
    getSport,
    sessionRecord,
  });
});

app.get('/sport/:sportId/addSession', async (request, response) => {
  response.render('sessions', {
    title: 'Add Sessions',
    sessionRecord: null,
    players: null,
    sportId: request.params.sportId,
  });
});

app.get('/sport/:sportId/addSesssion/:sessionId', async (req, resp) => {
  const { sportId } = req.params;

  const sessionRecord = await Session.findByPk(req.params.sessionId);
  const playersArray = await playersList.findAll({
    where: {
      sessionId: req.params.sessionId,
    },
  });
  const players = playersArray.map((player) => player.name).join(',');
  resp.render('addSession', {
    title: 'Create New Session',
    sessionRecord,
    players,
    sportId,
  });
});

// Delete players
app.delete('/modifySessions/:id', async (request, response) => {
  try {
    await playersList.removePlayers(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Delete session
app.delete('/modifySessions/sessions/:id', async (request, response) => {
  try {
    await Session.removeSessions(request.params.id);
    return response.render('index');
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
