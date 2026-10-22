import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import PetalBackground from './components/PetalBackground';
import EntryPage from './components/EntryPage';
import AuctioneerDashboard from './components/AuctioneerDashboard';
import TeamDashboard from './components/TeamDashboard';
import { getSocket, fetchAuctioneerState, fetchTeamState } from './services/api';

export default function App() {
  const [role, setRole] = useState(null); // null (entry), 'auctioneer', 'team'
  const [session, setSession] = useState(null);
  const [auctioneerState, setAuctioneerState] = useState(null);
  const [teamState, setTeamState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session if present
  useEffect(() => {
    const savedAuctioneer = localStorage.getItem('jp_auctioneer_session');
    const savedTeam = localStorage.getItem('jp_team_session');

    if (savedAuctioneer) {
      try {
        const parsed = JSON.parse(savedAuctioneer);
        setSession(parsed);
        setRole('auctioneer');
      } catch (e) {
        localStorage.removeItem('jp_auctioneer_session');
      }
    } else if (savedTeam) {
      try {
        const parsed = JSON.parse(savedTeam);
        setSession(parsed);
        setRole('team');
      } catch (e) {
        localStorage.removeItem('jp_team_session');
      }
    }
    setLoading(false);
  }, []);

  // Hydrate & Subscribe Real-Time Socket
  useEffect(() => {
    if (!role || !session) return;
    const socket = getSocket();

    if (role === 'auctioneer') {
      const { gameId, secret } = session;
      // Initial HTTP fetch
      fetchAuctioneerState(gameId, secret)
        .then(setAuctioneerState)
        .catch((err) => {
          console.error('Failed to load auctioneer state:', err);
        });

      // Join real-time room
      socket.emit('join:auctioneer', { gameId, auctioneerSecret: secret });

      // Real-time listener
      const handleStateUpdate = (newState) => {
        setAuctioneerState(newState);
      };
      socket.on('auctioneer:state', handleStateUpdate);

      return () => {
        socket.off('auctioneer:state', handleStateUpdate);
      };
    } else if (role === 'team') {
      const { teamToken } = session;
      // Initial HTTP fetch
      fetchTeamState(teamToken)
        .then(setTeamState)
        .catch((err) => {
          console.error('Failed to load team state:', err);
        });

      // Join real-time room
      socket.emit('join:team', { teamToken });

      // Real-time listener
      const handleTeamUpdate = (newState) => {
        setTeamState(newState);
      };
      socket.on('team:state', handleTeamUpdate);

      return () => {
        socket.off('team:state', handleTeamUpdate);
      };
    }
  }, [role, session]);

  // Handler: Created Auction
  const handleAuctionCreated = (data) => {
    const newSession = {
      gameId: data.gameId,
      secret: data.auctioneerSecret,
      roomCode: data.roomCode,
      auctioneerName: data.auctioneerName
    };
    localStorage.setItem('jp_auctioneer_session', JSON.stringify(newSession));
    setSession(newSession);
    setRole('auctioneer');
  };

  // Handler: Joined Team
  const handleTeamJoined = (data) => {
    const newSession = {
      gameId: data.gameId,
      roomCode: data.roomCode,
      teamId: data.teamId,
      teamName: data.teamName,
      teamColor: data.teamColor,
      teamToken: data.teamToken
    };
    localStorage.setItem('jp_team_session', JSON.stringify(newSession));
    setSession(newSession);
    setRole('team');
  };

  // Handler: Exit to Entry Page
  const handleExit = () => {
    localStorage.removeItem('jp_auctioneer_session');
    localStorage.removeItem('jp_team_session');
    setRole(null);
    setSession(null);
    setAuctioneerState(null);
    setTeamState(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        color: 'var(--sakura-light)',
        fontFamily: 'var(--font-heading)'
      }}>
        <h2>Loading Japan Places Auction Arena...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient Cherry Blossom Falling Petals */}
      <PetalBackground />

      {/* Navigation Header */}
      <Navbar
        role={role}
        roomCode={session?.roomCode}
        teamName={session?.teamName}
        teamColor={session?.teamColor}
        onExit={handleExit}
      />

      {/* Main View Router */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1, paddingBottom: '40px' }}>
        {!role && (
          <EntryPage
            onAuctionCreated={handleAuctionCreated}
            onTeamJoined={handleTeamJoined}
          />
        )}

        {role === 'auctioneer' && (
          <AuctioneerDashboard
            gameId={session?.gameId}
            auctioneerSecret={session?.secret}
            gameState={auctioneerState}
            onRefresh={() => {
              if (session?.gameId && session?.secret) {
                fetchAuctioneerState(session.gameId, session.secret).then(setAuctioneerState);
              }
            }}
          />
        )}

        {role === 'team' && (
          <TeamDashboard
            teamState={teamState}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <span>Japan Places Auction Arena 🇯🇵</span>
          <span>•</span>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--sakura-light)' }}>日本の名所オークションゲーム</span>
        </div>
        <p>Real-time strategy bidding featuring Japan's most celebrated cultural treasures.</p>
      </footer>
    </div>
  );
}
