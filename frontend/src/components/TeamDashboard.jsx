import React, { useState } from 'react';
import {
  Coins,
  MapPin,
  Sparkles,
  ShoppingBag,
  Clock,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Shield,
  Layers
} from 'lucide-react';

export default function TeamDashboard({ teamState }) {
  const [activeTab, setActiveTab] = useState('stage'); // 'stage', 'collection', 'upcoming'

  const { game, myTeam, currentPlace, availablePlaces = [] } = teamState || {};

  const ownedPlaces = myTeam?.ownedPlaces || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
      {/* Top Banner: Team Identity & Live Remaining Purse */}
      <div className="glass-panel-glow" style={{
        padding: '24px 28px',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        background: 'linear-gradient(135deg, rgba(20, 32, 65, 0.9) 0%, rgba(10, 17, 40, 0.95) 100%)',
        border: `2px solid ${myTeam?.color || 'var(--sakura-primary)'}`
      }}>
        {/* Left: Team Name & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: myTeam?.color || 'var(--sakura-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${myTeam?.color || 'var(--sakura-primary)'}55`
          }}>
            <Shield size={28} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--sakura-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your Assigned Team
              </span>
              <span className="hanko-stamp" style={{ borderColor: myTeam?.color, color: myTeam?.color, fontSize: '0.68rem' }}>
                チーム
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '2px 0 0' }}>
              {myTeam?.name || 'My Team'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Starting Purse: {Number(myTeam?.startingPurse || 0).toLocaleString()} pts • Owned Places: {ownedPlaces.length}
            </div>
          </div>
        </div>

        {/* Right: Live Remaining Purse (Section 3 & 4) */}
        <div style={{
          background: 'rgba(7, 13, 30, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 24px',
          textAlign: 'right',
          minWidth: '240px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
            <Coins size={16} color="var(--gold-accent)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--gold-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Remaining Purse Balance
            </span>
          </div>

          <div style={{
            fontFamily: 'monospace',
            fontSize: '2.4rem',
            fontWeight: 900,
            color: '#34d399',
            letterSpacing: '0.04em',
            textShadow: '0 0 20px rgba(52, 211, 153, 0.4)'
          }}>
            {Number(myTeam?.remainingPurse || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>pts</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Updates immediately upon each winning bid
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('stage')}
          style={{
            background: activeTab === 'stage' ? 'var(--sakura-primary)' : 'transparent',
            color: activeTab === 'stage' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Compass size={16} />
          <span>Live Auction Floor {currentPlace && '🔴'}</span>
        </button>

        <button
          onClick={() => setActiveTab('collection')}
          style={{
            background: activeTab === 'collection' ? 'var(--sakura-primary)' : 'transparent',
            color: activeTab === 'collection' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <ShoppingBag size={16} />
          <span>Our Acquired Places ({ownedPlaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            background: activeTab === 'upcoming' ? 'var(--sakura-primary)' : 'transparent',
            color: activeTab === 'upcoming' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={16} />
          <span>Available Places ({availablePlaces.length})</span>
        </button>
      </div>

      {/* --- TAB 1: LIVE AUCTION FLOOR --- */}
      {activeTab === 'stage' && (
        <div>
          {currentPlace ? (
            <div className="glass-panel-glow" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '0'
              }}>
                {/* Place Image */}
                <div style={{ height: '400px', position: 'relative' }}>
                  <img
                    src={currentPlace.imageUrl}
                    alt={currentPlace.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <span className="badge-status badge-live">
                      ● LIVE BIDDING IN PROGRESS
                    </span>
                    <span className="hanko-stamp" style={{ background: 'rgba(0,0,0,0.6)', borderColor: '#ffd166', color: '#ffd166' }}>
                      現在開催中
                    </span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(7, 13, 30, 0.95) 0%, transparent 100%)',
                    padding: '24px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sakura-light)', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <MapPin size={15} />
                      <span>{currentPlace.location}</span>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>
                      {currentPlace.name}
                    </h3>
                  </div>
                </div>

                {/* Live Place Details & Floor Bid */}
                <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--sakura-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Current Landmark on Floor
                    </span>
                    <h4 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginTop: '4px', marginBottom: '14px' }}>
                      {currentPlace.name}
                    </h4>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                      {currentPlace.description || 'Famous landmark in Japan undergoing bidding.'}
                    </p>

                    {/* Floor metrics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '14px',
                      marginBottom: '24px'
                    }}>
                      <div style={{
                        background: 'rgba(10, 17, 40, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '16px',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Base Starting Prize
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                          {Number(currentPlace.basePrize).toLocaleString()} pts
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(10, 17, 40, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '16px',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Original Reference Value
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#93c5fd', marginTop: '4px' }}>
                          {Number(currentPlace.originalValue).toLocaleString()} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-Time Current Bid Display */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 117, 143, 0.15) 0%, rgba(10, 17, 40, 0.8) 100%)',
                    border: '1px solid rgba(255, 117, 143, 0.35)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--sakura-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Current Live Bid
                    </span>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '3.2rem',
                      fontWeight: 900,
                      color: '#ffffff',
                      marginTop: '4px',
                      textShadow: '0 0 25px rgba(255, 117, 143, 0.5)'
                    }}>
                      {Number(currentPlace.currentBid || currentPlace.basePrize).toLocaleString()} <span style={{ fontSize: '1.2rem', color: 'var(--sakura-light)' }}>pts</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      State your bids to the auctioneer. The highest approved bid takes the property!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standby State */
            <div className="glass-panel" style={{
              padding: '60px 20px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(255, 117, 143, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                color: 'var(--sakura-primary)'
              }}>
                <Clock size={36} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#ffffff', marginBottom: '8px' }}>
                Awaiting Next Japanese Landmark...
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
                The Auctioneer is preparing the next iconic spot. Review upcoming destinations to formulate your bidding strategy!
              </p>
              <button
                onClick={() => setActiveTab('upcoming')}
                className="btn-sakura"
              >
                <span>View Available Destinations</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: OUR TEAM COLLECTION (ACQUIRED PLACES) --- */}
      {activeTab === 'collection' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#ffffff' }}>
                {myTeam?.name}'s Acquired Landmarks ({ownedPlaces.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Places secured by your team with their purchase price and reference valuation.
              </p>
            </div>
            <div className="hanko-stamp">獲得名所</div>
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
                      border: '1px solid rgba(52, 211, 153, 0.4)',
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
                        <span className="badge-status badge-sold">
                          ✓ ACQUIRED
                        </span>
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(7, 13, 30, 0.9) 0%, transparent 100%)',
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

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        background: 'rgba(10, 17, 40, 0.6)',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Purchased Price</span>
                          <div style={{ fontWeight: 800, color: '#f87171', fontSize: '0.95rem' }}>
                            {Number(place.purchasedPrice).toLocaleString()} pts
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Original Value</span>
                          <div style={{ fontWeight: 800, color: '#93c5fd', fontSize: '0.95rem' }}>
                            {Number(place.originalValue).toLocaleString()} pts
                          </div>
                        </div>
                      </div>

                      <div style={{
                        background: gain >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${gain >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ color: 'var(--text-muted)' }}>Value Net Gain:</span>
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
                No Destinations Won Yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
                "千里の道も一歩から" — A journey of a thousand miles begins with a single step. Place your first winning bid on the live floor!
              </p>
              <button
                onClick={() => setActiveTab('stage')}
                className="btn-sakura"
              >
                Go to Live Floor
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: AVAILABLE & UPCOMING PLACES --- */}
      {activeTab === 'upcoming' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#ffffff' }}>
                Available Places in Auction Queue ({availablePlaces.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Upcoming destinations you can prepare to bid on. Budget your remaining purse wisely!
              </p>
            </div>
            <div className="hanko-stamp">出品予定</div>
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
                <div style={{ height: '170px', position: 'relative' }}>
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span className="badge-status badge-upcoming">
                      UPCOMING
                    </span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(7, 13, 30, 0.9) 0%, transparent 100%)',
                    padding: '12px 14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sakura-light)', fontSize: '0.75rem' }}>
                      <MapPin size={12} />
                      <span>{place.location}</span>
                    </div>
                    <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', margin: '2px 0 0' }}>
                      {place.name}
                    </h4>
                  </div>
                </div>

                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {place.description || 'Authentic Japanese landmark.'}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    background: 'rgba(10, 17, 40, 0.5)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Base Starting Prize</span>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
                        {Number(place.basePrize).toLocaleString()} pts
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reference Value</span>
                      <div style={{ fontWeight: 700, color: '#93c5fd', fontSize: '0.9rem' }}>
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
