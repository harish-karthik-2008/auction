const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend development
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Helper to broadcast synchronized state to all connected roles securely
function broadcastGameState(gameId) {
  if (!gameId) return;

  // 1. Broadcast full master state to auctioneer
  const auctioneerState = db.getAuctioneerGameView(gameId);
  if (auctioneerState) {
    io.to(`auctioneer:${gameId}`).emit('auctioneer:state', auctioneerState);
  }

  // 2. Broadcast strictly filtered, private state to each team
  const teams = Object.values(db.state.teams).filter(t => t.gameId === gameId);
  teams.forEach(team => {
    const teamState = db.getTeamGameView(gameId, team.id);
    if (teamState) {
      io.to(`team:${team.id}`).emit('team:state', teamState);
    }
  });
}

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

// --- REST Endpoints ---

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

// 2. Get Teams for Room (for Join Screen)
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

    // Notify auctioneer that team has connected/joined
    broadcastGameState(game.id);

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

// 5. Fetch Filtered Team View (Zero leakage of other teams)
app.get('/api/team/state', requireTeam, (req, res) => {
  try {
    const state = db.getTeamGameView(req.gameId, req.team.id);
    if (!state) return res.status(404).json({ error: 'Team view not found.' });
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Auctioneer Controls ---

// Add Place
app.post('/api/auctioneer/places/add', requireAuctioneer, (req, res) => {
  try {
    const place = db.addPlace(req.gameId, req.body);
    broadcastGameState(req.gameId);
    res.status(201).json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit Place
app.put('/api/auctioneer/places/:placeId', requireAuctioneer, (req, res) => {
  try {
    const place = db.editPlace(req.gameId, req.params.placeId, req.body);
    broadcastGameState(req.gameId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Place
app.delete('/api/auctioneer/places/:placeId', requireAuctioneer, (req, res) => {
  try {
    db.deletePlace(req.gameId, req.params.placeId);
    broadcastGameState(req.gameId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start Auction on a Place
app.post('/api/auctioneer/places/:placeId/start', requireAuctioneer, (req, res) => {
  try {
    const place = db.startPlaceAuction(req.gameId, req.params.placeId);
    broadcastGameState(req.gameId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Current Bid
app.post('/api/auctioneer/places/:placeId/bid', requireAuctioneer, (req, res) => {
  try {
    const { bidAmount, bidderTeamId } = req.body;
    const place = db.updateCurrentBid(req.gameId, req.params.placeId, bidAmount, bidderTeamId);
    broadcastGameState(req.gameId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Confirm Purchase (Sell Place to Team)
app.post('/api/auctioneer/places/:placeId/sell', requireAuctioneer, (req, res) => {
  try {
    const { teamId, purchasedPrice } = req.body;
    const result = db.confirmPurchase(req.gameId, req.params.placeId, teamId, purchasedPrice);
    broadcastGameState(req.gameId);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark Place as Unsold
app.post('/api/auctioneer/places/:placeId/unsold', requireAuctioneer, (req, res) => {
  try {
    const place = db.markPlaceUnsold(req.gameId, req.params.placeId);
    broadcastGameState(req.gameId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Relist Place (Back to Upcoming)
app.post('/api/auctioneer/places/:placeId/relist', requireAuctioneer, (req, res) => {
  try {
    const place = db.relistPlace(req.gameId, req.params.placeId);
    broadcastGameState(req.gameId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reopen / Correct Result (Reverts sold status and restores team purse)
app.post('/api/auctioneer/places/:placeId/reopen', requireAuctioneer, (req, res) => {
  try {
    const place = db.reopenAuction(req.gameId, req.params.placeId);
    broadcastGameState(req.gameId);
    res.json({ success: true, place });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// End Auction and Finalize Leaderboard
app.post('/api/auctioneer/end', requireAuctioneer, (req, res) => {
  try {
    const leaderboard = db.endAuction(req.gameId);
    broadcastGameState(req.gameId);
    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Socket.IO Real-time Subscriptions ---
io.on('connection', (socket) => {
  // Auctioneer joins private channel with secret verification
  socket.on('join:auctioneer', ({ gameId, auctioneerSecret }) => {
    if (gameId && auctioneerSecret && db.verifyAuctioneer(gameId, auctioneerSecret)) {
      socket.join(`auctioneer:${gameId}`);
      // Send initial snapshot
      const snapshot = db.getAuctioneerGameView(gameId);
      if (snapshot) socket.emit('auctioneer:state', snapshot);
    } else {
      socket.emit('error', 'Unauthorized auctioneer connection.');
    }
  });

  // Team joins their isolated private channel with team token verification
  socket.on('join:team', ({ teamToken }) => {
    const team = db.getTeamByToken(teamToken);
    if (team) {
      socket.join(`team:${team.id}`);
      socket.join(`game:${team.gameId}`);
      // Send initial snapshot
      const snapshot = db.getTeamGameView(team.gameId, team.id);
      if (snapshot) socket.emit('team:state', snapshot);
    } else {
      socket.emit('error', 'Unauthorized team connection.');
    }
  });
});

// Serve static frontend files if built in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('/{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🇯🇵 Japan Places Auction Arena Server running on port ${PORT}`);
});
