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

// eslint-disable-next-line consistent-return
app.post('/users', async (request, response) => {
  const {
    firstName, lastName, email, password, role, adminKey,
  } = request.body;
  const hashedPwd = await bcrypt.hash(password, saltRounds);

  try {
    let user;
    if (role === 'admin') {
      const adminSecretValue = 'admin123';
      if (adminKey === adminSecretValue) {
        console.log('role:', role);
        user = await User.create({
          firstName,
          lastName,
          email,
          password: hashedPwd,
          role,
        });
      } else {
        return response.status(403).send('Incorrect adminKey');
      }
    } else {
      console.log('role:', role);
      user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPwd,
        role,
      });
    }
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect('/sportList');
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

app.post('/session', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), (request, response) => {
  console.log(request.user);
  response.redirect('/sportList');
});

app.get('/', async (request, response) => {
  response.render('index', {
    title: 'Sport Scheduler',
  });
});

app.post('/addSession', async (request, response) => {
  try {
    const { sessionId, sportId } = request.body;
    const date = new Date(request.body.date);
    console.log(sessionId);

    if (sessionId) {
      console.log('Updating');
      await Session.updateSessions({
        date,
        location: request.body.location,
        numPlayers: request.body.numPlayers,
        id: sessionId,
      });
      await playersList.updatePlayers(request.body.players, sessionId);
      console.log('Before Redirection');
      console.log(sportId);
      console.log(sessionId);
      response.redirect(302, `/${sportId}/modifySessions/${sessionId}`);
    } else {
      console.log('Creating');
      console.log(request.body.numPlayers);
      const session = await Session.createSessions({
        date: request.body.date,
        location: request.body.location,
        numPlayers: request.body.numPlayers,
        sportId: request.body.sportId,
        userId: request.user.id,
      });

      await playersList.createPlayers(request.body.players, request.user.firstName, session.id);
      console.log('create player id', session.id);
      response.redirect(302, `/${request.body.sportId}/modifySessions/${session.id}`);
    }
  } catch (error) {
    console.log(error);
    response.status(500).send('Error occurred while updating session.');
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
  const { user } = request;
  // console.log('user is', user.role)
  response.render('sport', {
    title: 'Sports',
    getSport,
    sessionRecord,
    user,
  });
});

// Fetching all the available sports
app.get('/sportList', async (request, response) => {
  const { firstName } = request.user;
  const sportList = await Sport.findAll();
  const player_sessions_id = (await
  playersList.findAll({ where: { name: firstName } })).map((player) => player.sessionId);
  const joined_sessions = await Session.joined_sessions(player_sessions_id);
  console.log('joined sessions length', joined_sessions.length);
  console.log(player_sessions_id);
  console.log(joined_sessions);
  console.log('player sessions id', player_sessions_id.length);
  const { user } = request;
  response.render('sportList', {
    title: 'Available Sports',
    sportList,
    user,
    joined_sessions,

  });
});

// direct from sportList to addSport
app.get('/sportList/addSport', async (request, response) => {
  response.render('addSport', {
    title: 'Create Sport',
  });
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
      sportId: request.body.sportId,
    });
  } catch (error) {
    console.log(error);
  }
});

// eslint-disable-next-line consistent-return
app.get('/:sportId/modifySessions/:id', async (request, response) => {
  try {
    const getSport = await Sport.findByPk(request.params.sportId);
    const session = await Session.findByPk(request.params.id);
    const { user } = request;
    console.log('Is user really admin', user.role);
    const playersArray = await playersList.findAll({
      where: {
        sessionId: session.id,
      },
    });
    response.render('modifySessions', {
      title: 'Edit Session',
      session,
      user,
      playersArray,
      getSport,
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Goto sessionCreate
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
  const players = playersList.map((player) => player.name).join(',');
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
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete('/sport/delete/:id', async (request, response) => {
  try {
    await Sport.deleteSport(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Routing for join session
app.post('/sport/:sportId/createSession/:sessionId/join/:userid', async (request, response) => {
  const user = await User.findByPk(Number(request.params.userid));
  try {
    const ses = await Session.findByPk(request.params.sessionId);
    await Session.update(
      {
        numPlayers: ses.numPlayers - 1,
      },
      {
        where: {
          id: request.params.sessionId,
        },
      },
    );
    await playersList.create({
      name: user.firstName,
      sessionId: request.params.sessionId,
    });
    response.redirect(302, `/${request.params.sportId}/modifySessions/${request.params.sessionId}`);
  } catch (error) {
    console.log(error);
  }
});

// Routing for leave sessions
app.post('/sport/:sportId/createSession/:sessionId/leave/:userid', async (request, res) => {
  const user = await User.findByPk(Number(request.params.userid));

  try {
    const ses = await Session.findByPk(request.params.sessionId);
    await Session.update(
      {
        numPlayers: ses.numPlayers + 1,
      },
      {
        where: {
          id: request.params.sessionId,
        },
      },
    );
    await playersList.destroy({
      where: {
        name: user.firstName,
        sessionId: request.params.sessionId,
      },
    });
    res.redirect(302, `/${request.params.sportId}/modifySessions/${request.params.sessionId}`);
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
