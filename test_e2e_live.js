const { io } = require('./frontend/node_modules/socket.io-client');
const assert = require('assert');

const SERVER_URL = 'http://localhost:5000';

async function runLiveE2ETest() {
  console.log('🚀 Running Live End-to-End Test on http://localhost:5000...\n');

  // 1. Test Static Frontend & Health
  const healthRes = await fetch(`${SERVER_URL}/api/health`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok', 'Health check failed');
  console.log('✅ 1. Server Health Check: OK');

  const htmlRes = await fetch(`${SERVER_URL}/`);
  const htmlText = await htmlRes.text();
  assert(htmlText.includes('Japan Places Auction Arena'), 'Frontend index.html should contain app title');
  console.log('✅ 2. Frontend HTML Served correctly with title.');

  // 2. Create Auction
  const createRes = await fetch(`${SERVER_URL}/api/games/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auctioneerName: 'Master Kenji',
      numTeams: 4,
      startingPurse: 100000,
      customTeamNames: ['Team Sakura', 'Team Samurai', 'Team Shogun', 'Team Ninja']
    })
  });
  const createData = await createRes.json();
  assert(createData.success, 'Game creation should succeed');
  assert(createData.roomCode, 'Room code generated');
  assert(createData.auctioneerSecret, 'Auctioneer secret generated');
  console.log(`✅ 3. Game Created via REST API. Room Code: ${createData.roomCode}`);

  const gameId = createData.gameId;
  const roomCode = createData.roomCode;
  const secret = createData.auctioneerSecret;

  // 3. Join 3 Teams
  const joinTeam1 = await (await fetch(`${SERVER_URL}/api/games/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamNameOrId: 'Team Sakura' })
  })).json();

  const joinTeam2 = await (await fetch(`${SERVER_URL}/api/games/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamNameOrId: 'Team Samurai' })
  })).json();

  const joinTeam3 = await (await fetch(`${SERVER_URL}/api/games/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamNameOrId: 'Team Shogun' })
  })).json();

  assert(joinTeam1.teamToken, 'Team 1 token present');
  assert(joinTeam2.teamToken, 'Team 2 token present');
  assert(joinTeam3.teamToken, 'Team 3 token present');
  console.log('✅ 4. All 3 Teams Joined successfully via REST.');

  // 4. Test WebSocket Real-Time Connection
  const auctioneerSocket = io(SERVER_URL);
  const team1Socket = io(SERVER_URL);

  let auctioneerStateReceived = false;
  let team1StateReceived = false;

  await new Promise((resolve) => {
    let readyCount = 0;
    const checkReady = () => {
      readyCount++;
      if (readyCount === 2) resolve();
    };

    auctioneerSocket.emit('join:auctioneer', { gameId, auctioneerSecret: secret });
    auctioneerSocket.on('auctioneer:state', (state) => {
      auctioneerStateReceived = true;
      assert(state.places.length >= 10, 'Master state contains all places');
      checkReady();
    });

    let teamInitialReceived = false;
    team1Socket.emit('join:team', { teamToken: joinTeam1.teamToken });
    team1Socket.on('team:state', (state) => {
      assert.strictEqual(state.otherTeams, undefined, 'Privacy check: No other teams in payload');
      assert.strictEqual(state.teams, undefined, 'Privacy check: No teams array in payload');
      if (!teamInitialReceived) {
        teamInitialReceived = true;
        assert.strictEqual(state.myTeam.name, 'Team Sakura');
        assert.strictEqual(state.myTeam.remainingPurse, 100000);
        checkReady();
      } else {
        if (state.myTeam.remainingPurse === 75000) {
          console.log('⚡ Real-time Socket Event: Team 1 received instant purse deduction (75,000 pts) via WebSocket!');
        } else if (state.currentPlace && state.currentPlace.name.includes('Mount Fuji')) {
          console.log('⚡ Real-time Socket Event: Team 1 received live auction broadcast for Mount Fuji!');
        }
      }
    });
  });

  console.log('✅ 5. Real-Time WebSockets authenticated & synchronized with zero data leak.');

  // 5. Auctioneer Starts Mount Fuji Auction
  const masterState = await (await fetch(`${SERVER_URL}/api/auctioneer/state`, {
    headers: { 'x-game-id': gameId, 'x-auctioneer-secret': secret }
  })).json();

  const fuji = masterState.places.find(p => p.name.includes('Mount Fuji'));
  assert(fuji, 'Mount Fuji found');

  const startRes = await (await fetch(`${SERVER_URL}/api/auctioneer/places/${fuji.id}/start`, {
    method: 'POST',
    headers: { 'x-game-id': gameId, 'x-auctioneer-secret': secret }
  })).json();
  assert(startRes.success, 'Start auction succeeded');
  console.log('✅ 6. Live Auction started for Mount Fuji.');

  // 6. Update Floor Bid via REST
  const bidRes = await (await fetch(`${SERVER_URL}/api/auctioneer/places/${fuji.id}/bid`, {
    method: 'POST',
    headers: { 'x-game-id': gameId, 'x-auctioneer-secret': secret, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidAmount: 25000 })
  })).json();
  assert.strictEqual(bidRes.place.currentBid, 25000);
  console.log('✅ 7. Floor bid updated to 25,000 pts.');

  // 7. Sell to Team Sakura for 25,000 pts
  const sellRes = await (await fetch(`${SERVER_URL}/api/auctioneer/places/${fuji.id}/sell`, {
    method: 'POST',
    headers: { 'x-game-id': gameId, 'x-auctioneer-secret': secret, 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: joinTeam1.teamId, purchasedPrice: 25000 })
  })).json();
  assert(sellRes.success);
  console.log('✅ 8. Mount Fuji confirmed sold to Team Sakura for 25,000 pts.');

  // 8. Verify Team 1's private state after sale
  const team1UpdatedState = await (await fetch(`${SERVER_URL}/api/team/state`, {
    headers: { 'x-team-token': joinTeam1.teamToken }
  })).json();

  assert.strictEqual(team1UpdatedState.myTeam.remainingPurse, 75000);
  assert.strictEqual(team1UpdatedState.myTeam.ownedPlaces.length, 1);
  assert.strictEqual(team1UpdatedState.myTeam.ownedPlaces[0].name, fuji.name);
  console.log(`✅ 9. Team 1 private state verified: Remaining purse = 75,000 pts, 1 owned place (${fuji.name}).`);

  // 9. End Auction & Verify Winner Leaderboard
  const endRes = await (await fetch(`${SERVER_URL}/api/auctioneer/end`, {
    method: 'POST',
    headers: { 'x-game-id': gameId, 'x-auctioneer-secret': secret }
  })).json();

  assert(endRes.success);
  const winner = endRes.leaderboard[0];
  console.log(`✅ 10. Tournament Ended. Champion: ${winner.teamName} with Current Value ${winner.totalCurrentValue.toLocaleString()} pts!`);

  auctioneerSocket.disconnect();
  team1Socket.disconnect();

  console.log('\n🌟 ALL LIVE E2E REAL-TIME TESTS PASSED ON LIVE SERVER!\n');
}

runLiveE2ETest().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
