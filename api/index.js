const express = require('express');
const cors = require('cors');
const db = require('../backend/db');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware: Authenticate Auctioneer Secret
function requireAuctioneer(req, res, next) {
  const gameId = req.headers['x-game-id'] || req.body.gameId || req.query.gameId;
  const secret = req.headers['x-auctioneer-secret'] || req.body.auctioneerSecret;

  if (!gameId || !secret || !db.verifyAuctioneer(gameId, secret)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing auctioneer secret.' });
  }
  req.gameId = gameId;
  next();
}

// Middleware: Authenticate Team Token
function requireTeam(req, res, next) {
  const teamToken = req.headers['x-team-token'] || req.query.teamToken;
  const team = db.getTeamByToken(teamToken);
  if (!team) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing team token.' });
  }
  req.team = team;
  req.gameId = team.gameId;
  next();
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Create Game
app.post('/api/games/create', (req, res) => {
  try {
    const { auctioneerName, numTeams, startingPurse, customTeamNames } = req.body;
    const { game, auctioneerSecret } = db.createGame({
      auctioneerName,
      numTeams,
      startingPurse,
      customTeamNames
    });

    res.status(201).json({
      success: true,
      gameId: game.id,
      roomCode: game.roomCode,
      auctioneerSecret,
      auctioneerName: game.auctioneerName,
      startingPurse: game.startingPurse
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Get Teams for Room
app.get('/api/games/:roomCode/teams', (req, res) => {
  try {
    const teams = db.getRoomTeams(req.params.roomCode);
    if (!teams) {
      return res.status(404).json({ error: 'Invalid or inactive Room OTP code.' });
    }
    res.json({ teams });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Join Game as Team
app.post('/api/games/:roomCode/join', (req, res) => {
  try {
    const { teamNameOrId } = req.body;
    const { game, team, teamToken } = db.joinTeam(req.params.roomCode, teamNameOrId);

    res.json({
      success: true,
      gameId: game.id,
      roomCode: game.roomCode,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      teamToken
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Fetch Master Auctioneer View
app.get('/api/auctioneer/state', requireAuctioneer, (req, res) => {
  try {
    const state = db.getAuctioneerGameView(req.gameId);
    if (!state) return res.status(404).json({ error: 'Game not found.' });
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Fetch Filtered Team View
app.get('/api/team/state', requireTeam, (req, res) => {
  try {
    const state = db.getTeamGameView(req.gameId, req.team.id);
    if (!state) return res.status(404).json({ error: 'Team view not found.' });
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auctioneer Controls
app.post('/api/auctioneer/places/add', requireAuctioneer, (req, res) => {
  try {
    const place = db.addPlace(req.gameId, req.body);
    res.status(201).json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/auctioneer/places/:placeId', requireAuctioneer, (req, res) => {
  try {
    const place = db.editPlace(req.gameId, req.params.placeId, req.body);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/auctioneer/places/:placeId', requireAuctioneer, (req, res) => {
  try {
    db.deletePlace(req.gameId, req.params.placeId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auctioneer/places/:placeId/start', requireAuctioneer, (req, res) => {
  try {
    const place = db.startPlaceAuction(req.gameId, req.params.placeId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auctioneer/places/:placeId/bid', requireAuctioneer, (req, res) => {
  try {
    const { bidAmount, bidderTeamId } = req.body;
    const place = db.updateCurrentBid(req.gameId, req.params.placeId, bidAmount, bidderTeamId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auctioneer/places/:placeId/sell', requireAuctioneer, (req, res) => {
  try {
    const { teamId, purchasedPrice } = req.body;
    const result = db.confirmPurchase(req.gameId, req.params.placeId, teamId, purchasedPrice);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auctioneer/places/:placeId/unsold', requireAuctioneer, (req, res) => {
  try {
    const place = db.markPlaceUnsold(req.gameId, req.params.placeId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auctioneer/places/:placeId/relist', requireAuctioneer, (req, res) => {
  try {
    const place = db.relistPlace(req.gameId, req.params.placeId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auctioneer/places/:placeId/reopen', requireAuctioneer, (req, res) => {
  try {
    const place = db.reopenAuction(req.gameId, req.params.placeId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auctioneer/end', requireAuctioneer, (req, res) => {
  try {
    const leaderboard = db.endAuction(req.gameId);
    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = app;
