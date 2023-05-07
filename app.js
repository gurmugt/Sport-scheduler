/* eslint-disable radix */
/* eslint-disable no-console */
const express = require('express');

const app = express();
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
const path = require('path');
const { Session, playersList } = require('./models');

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', async (request, response) => {
  response.render('index', {
    title: 'Sport Scheduler',
  });
});

app.get('/addSession', (request, response) => {
  response.render('sessions', {
    title: 'Add new Sessions',
    sessionRecord: null,
    players: null,
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
      });
      await playersList.createPlayers(request.body.players, session.id);
      console.log('create player id', session.id);
    }
    response.redirect('/');
  } catch (error) {
    console.log(error);
  }
});

app.get('/addSession/:id', async (req, response) => {
  try {
    const sessionRecord = await Session.findByPk(req.params.id);
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
