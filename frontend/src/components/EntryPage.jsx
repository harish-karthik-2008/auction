import React, { useState } from 'react';
import { Gavel, Users, Sparkles, MapPin, Shield, Coins, ArrowRight, X, ChevronRight } from 'lucide-react';
import { createGame, getRoomTeams, joinGame } from '../services/api';

const FEATURED_PLACES = [
  {
    name: 'Mount Fuji',
    jp: '富士山',
    location: 'Shizuoka',
    img: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Fushimi Inari',
    jp: '伏見稲荷',
    location: 'Kyoto',
    img: 'https://images.unsplash.com/photo-1478436127897-769e00d2c715?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Kinkaku-ji',
    jp: '金閣寺',
    location: 'Kyoto',
    img: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Shibuya Crossing',
    jp: '渋谷交差点',
    location: 'Tokyo',
    img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80'
  }
];

export default function EntryPage({ onAuctionCreated, onTeamJoined }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create Auction Form state
  const [auctioneerName, setAuctioneerName] = useState('Master Auctioneer');
  const [numTeams, setNumTeams] = useState(4);
  const [startingPurse, setStartingPurse] = useState(100000);

  // Join Auction Form state
  const [roomCode, setRoomCode] = useState('');
  const [teamsInRoom, setTeamsInRoom] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [customTeamName, setCustomTeamName] = useState('');

  // Handler for Create Auction
  const handleCreateAuction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await createGame({
        auctioneerName,
        numTeams: Number(numTeams),
        startingPurse: Number(startingPurse)
      });
      onAuctionCreated(data);
    } catch (err) {
      setError(err.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  // Handler to look up room teams
  const handleFetchRoomTeams = async () => {
    if (!roomCode || roomCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Room OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const teams = await getRoomTeams(roomCode.trim());
      setTeamsInRoom(teams);
      if (teams.length > 0) {
        const firstUnclaimed = teams.find(t => !t.isClaimed);
        if (firstUnclaimed) setSelectedTeamId(firstUnclaimed.id);
      }
    } catch (err) {
      setError(err.message || 'Invalid Room code');
    } finally {
      setLoading(false);
    }
  };

  // Handler for Join Auction
  const handleJoinAuction = async (e) => {
    e.preventDefault();
    if (!roomCode || roomCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Room code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const targetTeam = selectedTeamId || customTeamName;
      if (!targetTeam) {
        setError('Please select or enter a team name');
        setLoading(false);
        return;
      }
      const data = await joinGame(roomCode.trim(), targetTeam);
      onTeamJoined(data);
    } catch (err) {
      setError(err.message || 'Failed to join auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px'
    }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '820px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 117, 143, 0.12)',
          border: '1px solid rgba(255, 117, 143, 0.3)',
          padding: '8px 20px',
          borderRadius: '999px',
          color: 'var(--sakura-light)',
          fontSize: '0.88rem',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          <Sparkles size={16} />
          <span>REAL-TIME STRATEGY & PROPERTY BIDDING GAME</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '0.02em',
          marginBottom: '16px',
          color: '#ffffff'
        }}>
          Japan Places{' '}
          <span style={{
            background: 'linear-gradient(135deg, #ff758f 0%, #ffd166 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Auction Arena
          </span>{' '}
          🇯🇵
        </h1>

        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          color: 'var(--sakura-light)',
          letterSpacing: '0.15em',
          marginBottom: '16px'
        }}>
          日本の名所をめぐる知略のチームオークションバトル
        </p>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.05rem',
          lineHeight: 1.6,
          maxWidth: '680px',
          margin: '0 auto'
        }}>
          Lead your team to glory. Bid live on Mount Fuji, Fushimi Inari, and Japan's most revered cultural landmarks.
          Strategize with purse management, outbid rivals, and claim the championship!
        </p>
      </div>

      {/* Two Large Entry Options (Section 1) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px',
        width: '100%',
        maxWidth: '960px'
      }}>
        {/* Option 1: Create Auction */}
        <div
          onClick={() => { setShowCreateModal(true); setError(''); }}
          className="glass-panel-glow"
          style={{
            cursor: 'pointer',
            padding: '36px',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid rgba(255, 117, 143, 0.4)',
            background: 'linear-gradient(160deg, rgba(26, 38, 77, 0.85) 0%, rgba(10, 17, 40, 0.95) 100%)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 117, 143, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          }}
        >
          {/* Subtle Torii Accent in Corner */}
          <div style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            opacity: 0.12,
            width: '140px',
            height: '140px',
            pointerEvents: 'none'
          }}>
            <img src="/icon.svg" alt="" style={{ width: '100%', height: '100%' }} />
          </div>

          <div>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ff758f 0%, #e63946 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 20px rgba(255, 117, 143, 0.4)'
            }}>
              <Gavel size={32} color="#ffffff" />
            </div>

            <div className="hanko-stamp" style={{ marginBottom: '12px' }}>
              主催者 • AUCTIONEER
            </div>

            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '12px'
            }}>
              Create Auction
            </h2>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              marginBottom: '28px'
            }}>
              Host a new room as Master Auctioneer. Set starting purses, configure teams, manage live bids, and crown the winner on the podium.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ color: 'var(--sakura-light)', fontWeight: 700, fontSize: '0.95rem' }}>
              Host New Game
            </span>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--sakura-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <ArrowRight size={20} />
            </div>
          </div>
        </div>

        {/* Option 2: Join Auction */}
        <div
          onClick={() => { setShowJoinModal(true); setError(''); }}
          className="glass-panel"
          style={{
            cursor: 'pointer',
            padding: '36px',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid rgba(59, 130, 246, 0.35)',
            background: 'linear-gradient(160deg, rgba(20, 32, 65, 0.85) 0%, rgba(10, 17, 40, 0.95) 100%)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          }}
        >
          <div>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
            }}>
              <Users size={32} color="#ffffff" />
            </div>

            <div className="hanko-stamp" style={{ borderColor: '#3b82f6', color: '#60a5fa', marginBottom: '12px' }}>
              チーム参加 • TEAM ENTER
            </div>

            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '12px'
            }}>
              Join Auction
            </h2>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              marginBottom: '28px'
            }}>
              Enter using your 6-digit Room OTP code. Select your team, track your private purse in real time, and outsmart rival teams.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ color: '#93c5fd', fontWeight: 700, fontSize: '0.95rem' }}>
              Enter Room OTP
            </span>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Japan Places Visual Showcase */}
      <div style={{ width: '100%', marginTop: '30px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px'
        }}>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              color: '#ffffff'
            }}>
              Iconic Japanese Treasures Included
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              From holy shrines to neon skylines, bid on 12+ real authenticated locations
            </p>
          </div>
          <div className="hanko-stamp">厳選名所</div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px'
        }}>
          {FEATURED_PLACES.map((p, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                position: 'relative',
                height: '180px'
              }}
            >
              <img
                src={p.img}
                alt={p.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.75)'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(7, 13, 30, 0.95) 0%, rgba(7, 13, 30, 0.2) 60%, transparent 100%)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--sakura-light)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}>
                  <MapPin size={12} />
                  <span>{p.location}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between'
                }}>
                  <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem' }}>
                    {p.name}
                  </h4>
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--sakura-light)',
                    fontSize: '0.9rem'
                  }}>
                    {p.jp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Modal: Create Auction --- */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '36px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(160deg, #121c3b 0%, #091024 100%)',
              border: '2px solid rgba(255, 117, 143, 0.35)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="hanko-stamp">主催設定</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#ffffff' }}>
                Create New Auction
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Configure your game parameters. A unique 6-digit room code will be generated.
            </p>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.88rem',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAuction} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Auctioneer Name
                </label>
                <input
                  type="text"
                  className="jp-input"
                  value={auctioneerName}
                  onChange={(e) => setAuctioneerName(e.target.value)}
                  placeholder="e.g. Master Hiroshi"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Number of Teams ({numTeams})
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={numTeams}
                  onChange={(e) => setNumTeams(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--sakura-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>2 Teams</span>
                  <span>4 Teams</span>
                  <span>8 Teams</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Starting Purse Per Team (Points)
                </label>
                <input
                  type="number"
                  className="jp-input"
                  value={startingPurse}
                  onChange={(e) => setStartingPurse(e.target.value)}
                  step="5000"
                  min="10000"
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Formatted: {Number(startingPurse || 0).toLocaleString()} pts
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-sakura"
                style={{ width: '100%', marginTop: '12px' }}
              >
                {loading ? 'Creating Arena...' : 'Launch Auction Arena 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Join Auction --- */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '36px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(160deg, #101c38 0%, #070e20 100%)',
              border: '2px solid rgba(59, 130, 246, 0.4)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowJoinModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="hanko-stamp" style={{ borderColor: '#3b82f6', color: '#60a5fa' }}>入札者参加</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#ffffff' }}>
                Join Auction Game
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Enter the 6-digit room code provided by your Auctioneer.
            </p>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.88rem',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleJoinAuction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  6-Digit Room OTP Code
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    maxLength={6}
                    className="jp-input"
                    value={roomCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setRoomCode(val);
                      if (val.length === 6) {
                        getRoomTeams(val)
                          .then(teams => {
                            setTeamsInRoom(teams);
                            const first = teams.find(t => !t.isClaimed);
                            if (first) setSelectedTeamId(first.id);
                          })
                          .catch(() => {});
                      }
                    }}
                    placeholder="e.g. 583921"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '1.4rem',
                      letterSpacing: '0.25em',
                      textAlign: 'center',
                      fontWeight: 800
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleFetchRoomTeams}
                    disabled={loading || roomCode.length !== 6}
                    className="btn-navy"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Check Room
                  </button>
                </div>
              </div>

              {/* Team Selection */}
              {teamsInRoom && teamsInRoom.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Select Your Team:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {teamsInRoom.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeamId(t.id)}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: selectedTeamId === t.id
                            ? `2px solid ${t.color || '#ff758f'}`
                            : '1px solid rgba(255, 255, 255, 0.12)',
                          background: selectedTeamId === t.id
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(10, 17, 40, 0.6)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: t.color || '#ff758f'
                        }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                          {t.name}
                        </span>
                        {t.isClaimed && (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 'auto' }}>
                            (Claimed)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback Custom Team Name */}
              {(!teamsInRoom || teamsInRoom.length === 0) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Team Name
                  </label>
                  <input
                    type="text"
                    className="jp-input"
                    value={customTeamName}
                    onChange={(e) => setCustomTeamName(e.target.value)}
                    placeholder="e.g. Team Sakura"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-sakura"
                style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
              >
                {loading ? 'Joining Arena...' : 'Enter Auction Room ⛩️'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
