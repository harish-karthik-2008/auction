const assert = require('assert');
const db = require('./backend/db');

console.log('🧪 Starting Japan Places Auction Arena Unit & Logic Tests...\n');

// 1. Create Auction Game
const { game, auctioneerSecret } = db.createGame({
  auctioneerName: 'Master Kenji',
  numTeams: 4,
  startingPurse: 100000,
  customTeamNames: ['Team Sakura', 'Team Samurai', 'Team Shogun', 'Team Ninja']
});

assert(game.id, 'Game should have an ID');
assert(game.roomCode && game.roomCode.length === 6, 'Room code should be 6 digits');
assert(auctioneerSecret, 'Auctioneer secret must exist');
console.log(`✅ 1. Game created successfully. Room OTP: ${game.roomCode}`);

// 2. Fetch Room Teams
const roomTeams = db.getRoomTeams(game.roomCode);
assert.strictEqual(roomTeams.length, 4, 'Should have 4 teams initialized');
console.log(`✅ 2. Room teams verified: ${roomTeams.map(t => t.name).join(', ')}`);

// 3. Join 3 Teams
const team1Join = db.joinTeam(game.roomCode, 'Team Sakura');
const team2Join = db.joinTeam(game.roomCode, 'Team Samurai');
const team3Join = db.joinTeam(game.roomCode, 'Team Shogun');

assert(team1Join.teamToken, 'Team 1 should get teamToken');
assert(team2Join.teamToken, 'Team 2 should get teamToken');
assert(team3Join.teamToken, 'Team 3 should get teamToken');
console.log('✅ 3. 3 Teams joined successfully with private tokens.');

// 4. Test Strict Privacy Isolation (Section 3 & 9)
const team1View = db.getTeamGameView(game.id, team1Join.team.id);
assert(team1View.myTeam.name === 'Team Sakura', 'Team 1 view has Team Sakura');
assert.strictEqual(team1View.myTeam.remainingPurse, 100000, 'Starting purse is 100k');
assert.strictEqual(team1View.otherTeams, undefined, 'CRITICAL: Other teams data must NOT exist in team view');
assert.strictEqual(team1View.teams, undefined, 'CRITICAL: Teams array must NOT exist in team view');
assert.strictEqual(team1View.leaderboard, undefined, 'CRITICAL: Leaderboard must NOT exist in team view');
console.log('✅ 4. Privacy validation passed: zero leakage of other teams in team view!');

// 5. Start Auction on Mount Fuji
const allPlaces = Object.values(db.state.places).filter(p => p.gameId === game.id);
const fuji = allPlaces.find(p => p.name.includes('Mount Fuji'));
assert(fuji, 'Mount Fuji must exist in places');

db.startPlaceAuction(game.id, fuji.id);
assert.strictEqual(db.state.places[fuji.id].status, 'LIVE');
console.log(`✅ 5. Mount Fuji auction started. Status: LIVE (Base Prize: ${fuji.basePrize})`);

// 6. Update Bids
db.updateCurrentBid(game.id, fuji.id, 20000);
assert.strictEqual(db.state.places[fuji.id].currentBid, 20000);
console.log('✅ 6. Floor bid updated to 20,000 pts.');

// 7. Confirm Purchase to Team Sakura for 25,000
const purchaseResult = db.confirmPurchase(game.id, fuji.id, team1Join.team.id, 25000);
assert.strictEqual(purchaseResult.place.status, 'SOLD');
assert.strictEqual(purchaseResult.place.purchasedByTeamId, team1Join.team.id);
assert.strictEqual(purchaseResult.place.purchasedPrice, 25000);
console.log('✅ 7. Mount Fuji sold to Team Sakura for 25,000 pts.');

// 8. Validate Section 4 Valuation Formulas
const team1Stats = db.calculateTeamStats(team1Join.team.id);
// Remaining Purse = 100,000 - 25,000 = 75,000
assert.strictEqual(team1Stats.remainingPurse, 75000, 'Remaining purse calculation must be 75,000');
// Total Original Value = 55,000 (Mount Fuji's original reference value)
assert.strictEqual(team1Stats.totalOriginalValue, 55000, 'Total original value must be 55,000');
// Total Purchased Cost = 25,000
assert.strictEqual(team1Stats.totalPurchasedCost, 25000, 'Total purchased cost must be 25,000');
// Total Current Team Value = Remaining Purse (75,000) + Total Original Value (55,000) = 130,000
assert.strictEqual(team1Stats.totalCurrentValue, 130000, 'Total current value must be 130,000');
// Auction Gain = 130,000 - 100,000 = +30,000
assert.strictEqual(team1Stats.auctionGain, 30000, 'Auction gain must be +30,000');
console.log('✅ 8. Section 4 Valuation Formulas verified exactly:');
console.log(`     - Remaining Purse: ${team1Stats.remainingPurse.toLocaleString()} pts`);
console.log(`     - Total Original Value: ${team1Stats.totalOriginalValue.toLocaleString()} pts`);
console.log(`     - Total Current Team Value: ${team1Stats.totalCurrentValue.toLocaleString()} pts`);
console.log(`     - Auction Gain: +${team1Stats.auctionGain.toLocaleString()} pts`);

// 9. Validate Overdraft Prevention (Cannot spend more than remaining purse)
const kInari = allPlaces.find(p => p.name.includes('Fushimi Inari'));
db.startPlaceAuction(game.id, kInari.id);
let overdraftBlocked = false;
try {
  // Team Sakura has 75,000 left. Try to buy for 80,000.
  db.confirmPurchase(game.id, kInari.id, team1Join.team.id, 80000);
} catch (err) {
  overdraftBlocked = true;
  console.log(`✅ 9. Overdraft prevention triggered correctly: "${err.message}"`);
}
assert(overdraftBlocked, 'Server must block purchase exceeding remaining purse');

// 10. Test Reopening / Correction of Sold Auction Result
db.reopenAuction(game.id, fuji.id);
assert.strictEqual(db.state.places[fuji.id].status, 'UPCOMING');
assert.strictEqual(db.state.places[fuji.id].purchasedByTeamId, null);
const team1StatsAfterReopen = db.calculateTeamStats(team1Join.team.id);
assert.strictEqual(team1StatsAfterReopen.remainingPurse, 100000, 'Purse restored back to 100,000 upon reopen');
console.log('✅ 10. Reopen auction result verified: place reset to UPCOMING, purse restored to 100,000 pts.');

// 11. Finalize game & Leaderboard ranking with tie-breakers
// Let's sell Fuji to Team Samurai for 30,000, and Inari to Team Sakura for 15,000
db.confirmPurchase(game.id, fuji.id, team2Join.team.id, 30000);
db.confirmPurchase(game.id, kInari.id, team1Join.team.id, 15000);

const finalLeaderboard = db.endAuction(game.id);
assert.strictEqual(db.state.games[game.id].status, 'ENDED');
assert(finalLeaderboard.length >= 3, 'Leaderboard must contain all teams');
assert(finalLeaderboard[0].rank === 1, 'Top team has rank 1');
console.log('\n🏆 11. Final Leaderboard Calculated:');
finalLeaderboard.forEach(t => {
  console.log(`   #${t.rank} ${t.teamName}: Current Value = ${t.totalCurrentValue.toLocaleString()} | Purse = ${t.remainingPurse.toLocaleString()} | Gain = ${t.auctionGain >= 0 ? '+' : ''}${t.auctionGain.toLocaleString()}`);
});

console.log('\n🎉 ALL 11 TESTS PASSED PERFECTLY!\n');
