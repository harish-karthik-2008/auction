import React, { useState } from 'react';
import {
  Coins,
  MapPin,
  ShoppingBag,
  Clock,
  Shield,
  Layers,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';

export default function TeamDashboard({ teamState }) {
  const [activeTab, setActiveTab] = useState('purchased'); // 'purchased', 'available'

  const { game, myTeam, availablePlaces = [] } = teamState || {};
  const ownedPlaces = myTeam?.ownedPlaces || [];

  // Calculate total spent so far
  const totalSpent = ownedPlaces.reduce((sum, p) => sum + (Number(p.purchasedPrice) || 0), 0);
  const totalRefValue = ownedPlaces.reduce((sum, p) => sum + (Number(p.originalValue) || 0), 0);
  const netGain = totalRefValue - totalSpent;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
      {/* 1. Team Header & Live Purse Summary */}
      <div className="glass-panel-glow" style={{
        padding: '28px',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        background: 'linear-gradient(135deg, rgba(20, 32, 65, 0.9) 0%, rgba(10, 17, 40, 0.95) 100%)',
        border: `2px solid ${myTeam?.color || 'var(--sakura-primary)'}`
      }}>
        {/* Left: Team Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            backgroundColor: myTeam?.color || 'var(--sakura-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${myTeam?.color || 'var(--sakura-primary)'}66`
          }}>
            <Shield size={32} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--sakura-light)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Team Portal
              </span>
              <span className="hanko-stamp" style={{ borderColor: myTeam?.color, color: myTeam?.color, fontSize: '0.68rem' }}>
                チーム
              </span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', margin: '2px 0 0' }}>
              {myTeam?.name || 'My Team'}
            </h2>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Starting Purse: <strong style={{ color: '#ffffff' }}>{Number(myTeam?.startingPurse || 0).toLocaleString()} pts</strong> • Acquired: <strong style={{ color: '#ffffff' }}>{ownedPlaces.length} places</strong>
            </div>
          </div>
        </div>

        {/* Right: Remaining Purse Card */}
        <div style={{
          background: 'rgba(7, 13, 30, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 28px',
          textAlign: 'right',
          minWidth: '260px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
            <Coins size={18} color="var(--gold-accent)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--gold-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Remaining Purse Balance
            </span>
          </div>

          <div style={{
            fontFamily: 'monospace',
            fontSize: '2.6rem',
            fontWeight: 900,
            color: '#34d399',
            letterSpacing: '0.04em',
            textShadow: '0 0 25px rgba(52, 211, 153, 0.45)'
          }}>
            {Number(myTeam?.remainingPurse || 0).toLocaleString()} <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>pts</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
            <span>Spent: {totalSpent.toLocaleString()} pts</span>
            <span>Est. Gain: {netGain >= 0 ? '+' : ''}{netGain.toLocaleString()} pts</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('purchased')}
          style={{
            background: activeTab === 'purchased' ? 'var(--sakura-primary)' : 'rgba(10, 17, 40, 0.6)',
            color: activeTab === 'purchased' ? '#ffffff' : 'var(--text-secondary)',
            border: activeTab === 'purchased' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <ShoppingBag size={18} />
          <span>Our Purchased Places ({ownedPlaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('available')}
          style={{
            background: activeTab === 'available' ? 'var(--sakura-primary)' : 'rgba(10, 17, 40, 0.6)',
            color: activeTab === 'available' ? '#ffffff' : 'var(--text-secondary)',
            border: activeTab === 'available' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={18} />
          <span>Available Places ({availablePlaces.length})</span>
        </button>
      </div>

      {/* 3. Tab Content */}

      {/* TAB 1: OUR PURCHASED PLACES */}
      {activeTab === 'purchased' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#ffffff' }}>
                Places Purchased by {myTeam?.name} ({ownedPlaces.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Landmarks secured by your team, showing the final purchased price and reference value.
              </p>
            </div>
            <div className="hanko-stamp">購入済名所</div>
          </div>

          {ownedPlaces.length > 0 ? (
            <div className="places-grid">
              {ownedPlaces.map((place) => {
                const gain = Number(place.originalValue) - Number(place.purchasedPrice);
                return (
                  <div
                    key={place.id}
                    className="glass-panel"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: '1px solid rgba(52, 211, 153, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <div style={{ height: '190px', position: 'relative' }}>
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <span className="badge-status badge-sold">
                          ✓ OWNED BY YOUR TEAM
                        </span>
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(7, 13, 30, 0.95) 0%, transparent 100%)',
                        padding: '14px 16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sakura-light)', fontSize: '0.75rem' }}>
                          <MapPin size={12} />
                          <span>{place.location}</span>
                        </div>
                        <h4 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.1rem', margin: '2px 0 0' }}>
                          {place.name}
                        </h4>
                      </div>
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        background: 'rgba(10, 17, 40, 0.65)',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Purchased Price
                          </span>
                          <div style={{ fontWeight: 800, color: '#f87171', fontSize: '1.05rem', marginTop: '2px' }}>
                            {Number(place.purchasedPrice).toLocaleString()} pts
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Reference Value
                          </span>
                          <div style={{ fontWeight: 800, color: '#93c5fd', fontSize: '1.05rem', marginTop: '2px' }}>
                            {Number(place.originalValue).toLocaleString()} pts
                          </div>
                        </div>
                      </div>

                      <div style={{
                        background: gain >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${gain >= 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem'
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Net Value Gain:</span>
                        <span style={{ fontWeight: 800, color: gain >= 0 ? '#34d399' : '#f87171' }}>
                          {gain >= 0 ? '+' : ''}{gain.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel" style={{
              padding: '60px 20px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 117, 143, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--sakura-primary)'
              }}>
                <ShoppingBag size={30} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
                No Places Purchased Yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
                Your team hasn't been assigned any landmarks yet. Review the available places to see what will be auctioned next!
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="btn-sakura"
              >
                View Available Places
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABLE PLACES */}
      {activeTab === 'available' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#ffffff' }}>
                Available Places for Auction ({availablePlaces.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Destinations waiting to be auctioned with their base starting prize and reference valuation.
              </p>
            </div>
            <div className="hanko-stamp">出品予定名所</div>
          </div>

          <div className="places-grid">
            {availablePlaces.map((place) => (
              <div
                key={place.id}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: '180px', position: 'relative' }}>
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span className="badge-status badge-upcoming">
                      AVAILABLE
                    </span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(7, 13, 30, 0.95) 0%, transparent 100%)',
                    padding: '12px 14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sakura-light)', fontSize: '0.75rem' }}>
                      <MapPin size={12} />
                      <span>{place.location}</span>
                    </div>
                    <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem', margin: '2px 0 0' }}>
                      {place.name}
                    </h4>
                  </div>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {place.description || 'Iconic Japanese heritage destination.'}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    background: 'rgba(10, 17, 40, 0.6)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Base Starting Prize
                      </span>
                      <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.98rem', marginTop: '2px' }}>
                        {Number(place.basePrize).toLocaleString()} pts
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Reference Value
                      </span>
                      <div style={{ fontWeight: 800, color: '#93c5fd', fontSize: '0.98rem', marginTop: '2px' }}>
                        {Number(place.originalValue).toLocaleString()} pts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
