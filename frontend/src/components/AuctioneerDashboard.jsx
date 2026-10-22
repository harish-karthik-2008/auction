import React, { useState } from 'react';
import {
  Gavel,
  Plus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Users,
  MapPin,
  TrendingUp,
  AlertCircle,
  Edit2,
  Trash2,
  Copy,
  Check,
  Coins,
  Shield,
  Sparkles,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { auctioneerAction } from '../services/api';
import PlaceModal from './PlaceModal';
import WinnerModal from './WinnerModal';

export default function AuctioneerDashboard({
  gameId,
  auctioneerSecret,
  gameState,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('places'); // 'places', 'teams'
  const [placeFilter, setPlaceFilter] = useState('ALL'); // 'ALL', 'AVAILABLE', 'SOLD', 'UNSOLD'
  
  // Modals
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  
  // Direct "Mark as Purchased" Modal State
  const [sellingPlace, setSellingPlace] = useState(null);
  const [buyerTeamId, setBuyerTeamId] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const [actionError, setActionError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const { game, places = [], teams = [] } = gameState || {};

  const soldCount = places.filter(p => p.status === 'SOLD').length;
  const availableCount = places.filter(p => p.status === 'UPCOMING' || p.status === 'UNSOLD').length;

  const handleCopyCode = () => {
    if (!game?.roomCode) return;
    navigator.clipboard.writeText(game.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Open the "Mark Purchased" dialog
  const handleOpenSellModal = (place) => {
    setActionError('');
    setSellingPlace(place);
    setBuyerTeamId('');
    setCustomPrice(place.purchasedPrice || place.basePrize);
  };

  // Confirm Purchase (Admin marks which place purchased by whom)
  const handleConfirmPurchase = async () => {
    if (!sellingPlace) return;
    if (!buyerTeamId) {
      setActionError('Please select which team purchased this place.');
      return;
    }
    const finalPrice = Number(customPrice);
    if (!finalPrice || finalPrice <= 0) {
      setActionError('Please enter a valid positive purchased price.');
      return;
    }

    const team = teams.find(t => t.teamId === buyerTeamId);
    if (team && finalPrice > team.remainingPurse) {
      setActionError(`Insufficient purse: ${team.teamName} only has ${team.remainingPurse.toLocaleString()} pts remaining.`);
      return;
    }

    setActionError('');
    try {
      await auctioneerAction(`places/${sellingPlace.id}/sell`, 'POST', gameId, auctioneerSecret, {
        teamId: buyerTeamId,
        purchasedPrice: finalPrice
      });
      setSellingPlace(null);
      setBuyerTeamId('');
      setCustomPrice('');
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Mark place as Unsold
  const handleMarkUnsold = async (placeId) => {
    setActionError('');
    try {
      await auctioneerAction(`places/${placeId}/unsold`, 'POST', gameId, auctioneerSecret);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Reopen / Correct / Undo Purchase
  const handleReopen = async (placeId) => {
    setActionError('');
    try {
      await auctioneerAction(`places/${placeId}/reopen`, 'POST', gameId, auctioneerSecret);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Relist Unsold place
  const handleRelist = async (placeId) => {
    setActionError('');
    try {
      await auctioneerAction(`places/${placeId}/relist`, 'POST', gameId, auctioneerSecret);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Save (Create or Edit) Place
  const handleSavePlace = async (placeData) => {
    setActionError('');
    try {
      if (editingPlace) {
        await auctioneerAction(`places/${editingPlace.id}`, 'PUT', gameId, auctioneerSecret, placeData);
      } else {
        await auctioneerAction('places/add', 'POST', gameId, auctioneerSecret, placeData);
      }
      setIsPlaceModalOpen(false);
      setEditingPlace(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Delete Place
  const handleDeletePlace = async (placeId) => {
    if (!window.confirm('Are you sure you want to delete this destination?')) return;
    setActionError('');
    try {
      await auctioneerAction(`places/${placeId}`, 'DELETE', gameId, auctioneerSecret);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // End Auction
  const handleEndAuction = async () => {
    if (!window.confirm('Are you sure you want to end the auction and crown the winner?')) return;
    setActionError('');
    try {
      await auctioneerAction('end', 'POST', gameId, auctioneerSecret);
      setIsWinnerModalOpen(true);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Filtered places
  const filteredPlaces = places.filter(p => {
    if (placeFilter === 'ALL') return true;
    if (placeFilter === 'AVAILABLE') return p.status === 'UPCOMING' || p.status === 'UNSOLD';
    if (placeFilter === 'SOLD') return p.status === 'SOLD';
    if (placeFilter === 'UNSOLD') return p.status === 'UNSOLD';
    return true;
  });

  const selectedBuyerTeam = teams.find(t => t.teamId === buyerTeamId);

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
      {/* Top Banner: Room Code & Game Status */}
      <div className="glass-panel" style={{
        padding: '24px 30px',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        background: 'linear-gradient(135deg, rgba(26, 38, 77, 0.9) 0%, rgba(10, 17, 40, 0.95) 100%)',
        border: '1px solid rgba(255, 117, 143, 0.3)'
      }}>
        {/* Left: Room Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--sakura-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Join Code for Teams
              </span>
              <span className="hanko-stamp" style={{ fontSize: '0.7rem' }}>部屋番号</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '2.6rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.18em',
                textShadow: '0 0 20px rgba(255, 117, 143, 0.4)'
              }}>
                {game?.roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="btn-navy"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                {copiedCode ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          <div style={{ height: '48px', width: '1px', background: 'rgba(255, 255, 255, 0.12)', display: 'none', md: 'block' }} />

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sold / Available</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                <span style={{ color: '#34d399' }}>{soldCount} Sold</span> / <span style={{ color: 'var(--sakura-light)' }}>{availableCount} Left</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Teams</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-accent)', marginTop: '2px' }}>
                {teams.length} Teams
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setEditingPlace(null); setIsPlaceModalOpen(true); }}
            className="btn-navy"
            style={{ border: '1px solid rgba(255, 117, 143, 0.35)' }}
          >
            <Plus size={16} color="var(--sakura-primary)" />
            <span>Add Japan Place</span>
          </button>

          <button
            onClick={handleEndAuction}
            className="btn-gold"
          >
            <Trophy size={18} />
            <span>End & Crown Winner</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {actionError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.18)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          fontSize: '0.92rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('places')}
          style={{
            background: activeTab === 'places' ? 'var(--sakura-primary)' : 'transparent',
            color: activeTab === 'places' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <MapPin size={16} />
          <span>Manage Japan Places & Record Purchases ({places.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          style={{
            background: activeTab === 'teams' ? 'var(--sakura-primary)' : 'transparent',
            color: activeTab === 'teams' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Users size={16} />
          <span>Teams Valuation & Rankings ({teams.length})</span>
        </button>
      </div>

      {/* --- TAB 1: MANAGE PLACES & MARK PURCHASED --- */}
      {activeTab === 'places' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '22px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'All Places', value: 'ALL' },
                { label: `Available (${availableCount})`, value: 'AVAILABLE' },
                { label: `Sold / Purchased (${soldCount})`, value: 'SOLD' },
                { label: 'Unsold', value: 'UNSOLD' }
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setPlaceFilter(f.value)}
                  style={{
                    background: placeFilter === f.value ? 'rgba(255, 117, 143, 0.25)' : 'rgba(10, 17, 40, 0.6)',
                    border: placeFilter === f.value ? '1px solid var(--sakura-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: placeFilter === f.value ? '#ffffff' : 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Click <strong>"Mark Purchased by Team"</strong> on any landmark to record which team bought it!
            </span>
          </div>

          {/* Places Grid */}
          <div className="places-grid">
            {filteredPlaces.map((place) => {
              const buyerTeam = teams.find(t => t.teamId === place.purchasedByTeamId);
              const isSold = place.status === 'SOLD';

              return (
                <div
                  key={place.id}
                  className="glass-panel"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: isSold ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid var(--navy-border)',
                    boxShadow: isSold ? '0 8px 25px rgba(16, 185, 129, 0.15)' : 'var(--shadow-card)'
                  }}
                >
                  {/* Photo */}
                  <div style={{ height: '190px', position: 'relative' }}>
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span className={`badge-status badge-${place.status.toLowerCase()}`}>
                        {isSold ? '✓ SOLD' : place.status}
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
                      <h4 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.1rem', margin: '2px 0 0' }}>
                        {place.name}
                      </h4>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      {/* Price info */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        background: 'rgba(10, 17, 40, 0.6)',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Base Starting Prize
                          </span>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.98rem' }}>
                            {Number(place.basePrize).toLocaleString()} pts
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Reference Value
                          </span>
                          <div style={{ fontWeight: 800, color: '#93c5fd', fontSize: '0.98rem' }}>
                            {Number(place.originalValue).toLocaleString()} pts
                          </div>
                        </div>
                      </div>

                      {/* If Sold: Show Buyer Banner */}
                      {isSold && (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: buyerTeam?.color || '#34d399'
                            }} />
                            <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.92rem' }}>
                              Purchased by {buyerTeam?.teamName || 'Unknown Team'}
                            </span>
                          </div>
                          <div style={{ color: '#ffffff', fontSize: '0.85rem', marginTop: '2px', fontWeight: 600 }}>
                            Purchased Price: {Number(place.purchasedPrice).toLocaleString()} pts
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {!isSold ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenSellModal(place)}
                            className="btn-sakura"
                            style={{ flex: 2, padding: '10px 14px', fontSize: '0.85rem' }}
                          >
                            <CheckCircle2 size={16} />
                            <span>Mark Purchased by Team</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkUnsold(place.id)}
                            className="btn-navy"
                            style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                            title="Mark Unsold"
                          >
                            <XCircle size={15} />
                            <span>Unsold</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenSellModal(place)}
                            className="btn-navy"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', color: '#93c5fd' }}
                            title="Change buyer team or purchased price"
                          >
                            <Edit2 size={14} />
                            <span>Change Buyer / Price</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReopen(place.id)}
                            className="btn-navy"
                            style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#ffd166' }}
                            title="Revert sale and refund team purse"
                          >
                            <RotateCcw size={14} />
                            <span>Reopen</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => { setEditingPlace(place); setIsPlaceModalOpen(true); }}
                        className="btn-navy"
                        style={{ padding: '8px' }}
                        title="Edit Destination Info"
                      >
                        <Edit2 size={14} />
                      </button>

                      {!isSold && (
                        <button
                          type="button"
                          onClick={() => handleDeletePlace(place.id)}
                          className="btn-navy"
                          style={{ padding: '8px', color: '#f87171' }}
                          title="Delete Place"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 2: TEAMS MASTER FINANCIAL LEDGER --- */}
      {activeTab === 'teams' && (
        <div>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#ffffff' }}>
                  Teams Financial & Valuation Master Ledger
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Visible strictly to Auctioneer. Automatically recalculates Total Current Value and Gain for every purchase.
                </p>
              </div>
              <div className="hanko-stamp">採点台帳</div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{
                    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--sakura-light)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase'
                  }}>
                    <th style={{ padding: '12px 10px' }}>Rank</th>
                    <th style={{ padding: '12px 10px' }}>Team Name</th>
                    <th style={{ padding: '12px 10px' }}>Starting Purse</th>
                    <th style={{ padding: '12px 10px' }}>Remaining Purse</th>
                    <th style={{ padding: '12px 10px' }}>Places Purchased</th>
                    <th style={{ padding: '12px 10px' }}>Total Spent</th>
                    <th style={{ padding: '12px 10px' }}>Original Value</th>
                    <th style={{ padding: '12px 10px', color: '#ffd166' }}>Current Team Value</th>
                    <th style={{ padding: '12px 10px' }}>Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.teamId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <td style={{ padding: '14px 10px', fontWeight: 800 }}>
                        #{t.rank} {t.isTied && '(Tie)'}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: t.color || '#ff758f'
                          }} />
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>{t.teamName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>
                        {t.startingPurse.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#34d399', fontWeight: 700 }}>
                        {t.remainingPurse.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#ffffff' }}>
                        {t.placesPurchasedCount}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#f87171' }}>
                        {t.totalPurchasedCost.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#93c5fd' }}>
                        {t.totalOriginalValue.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#ffd166', fontWeight: 800, fontSize: '1rem' }}>
                        {t.totalCurrentValue.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '14px 10px',
                        color: t.auctionGain >= 0 ? '#34d399' : '#f87171',
                        fontWeight: 700
                      }}>
                        {t.auctionGain >= 0 ? '+' : ''}{t.auctionGain.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: MARK PLACE AS PURCHASED BY TEAM --- */}
      {sellingPlace && (
        <div className="modal-overlay" onClick={() => setSellingPlace(null)}>
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '32px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(160deg, #121c3b 0%, #0a1128 100%)',
              border: '2px solid rgba(52, 211, 153, 0.5)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSellingPlace(null)}
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
              <XCircle size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="hanko-stamp" style={{ borderColor: '#34d399', color: '#34d399' }}>購入記録</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#ffffff' }}>
                Record Purchase for Place
              </h3>
            </div>

            {/* Place Card Highlight */}
            <div style={{
              display: 'flex',
              gap: '14px',
              background: 'rgba(10, 17, 40, 0.6)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              alignItems: 'center'
            }}>
              <img
                src={sellingPlace.imageUrl}
                alt={sellingPlace.name}
                style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
              <div>
                <h4 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                  {sellingPlace.name}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--sakura-light)', marginTop: '2px' }}>
                  Base: {Number(sellingPlace.basePrize).toLocaleString()} pts • Ref Value: {Number(sellingPlace.originalValue).toLocaleString()} pts
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Select Team */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Purchased by Which Team?
                </label>
                <select
                  className="jp-input"
                  value={buyerTeamId}
                  onChange={(e) => setBuyerTeamId(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">-- Choose Purchasing Team --</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName} (Remaining Purse: {t.remainingPurse.toLocaleString()} pts)
                    </option>
                  ))}
                </select>
              </div>

              {/* Enter Purchased Price */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Final Purchased Price (Points)
                </label>
                <input
                  type="number"
                  className="jp-input"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  min="1"
                  required
                />
              </div>

              {/* Team Purse Check */}
              {selectedBuyerTeam && (
                <div style={{
                  fontSize: '0.85rem',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: (Number(customPrice) > selectedBuyerTeam.remainingPurse)
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(16, 185, 129, 0.15)',
                  color: (Number(customPrice) > selectedBuyerTeam.remainingPurse)
                    ? '#f87171'
                    : '#34d399',
                  border: `1px solid ${Number(customPrice) > selectedBuyerTeam.remainingPurse ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                }}>
                  <strong>{selectedBuyerTeam.teamName}</strong> Remaining Purse: {selectedBuyerTeam.remainingPurse.toLocaleString()} pts
                  {Number(customPrice) > selectedBuyerTeam.remainingPurse ? (
                    <div style={{ marginTop: '2px', fontWeight: 700 }}>
                      ⚠️ Error: Price exceeds team's remaining purse balance!
                    </div>
                  ) : (
                    <div style={{ marginTop: '2px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Purse after purchase: {(selectedBuyerTeam.remainingPurse - Number(customPrice)).toLocaleString()} pts
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSellingPlace(null)}
                  className="btn-navy"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  disabled={!buyerTeamId || !customPrice || (selectedBuyerTeam && Number(customPrice) > selectedBuyerTeam.remainingPurse)}
                  className="btn-sakura"
                  style={{ flex: 2, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm Purchase</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Place Modal */}
      <PlaceModal
        isOpen={isPlaceModalOpen}
        onClose={() => { setIsPlaceModalOpen(false); setEditingPlace(null); }}
        onSave={handleSavePlace}
        initialData={editingPlace}
      />

      {/* Winner Modal */}
      <WinnerModal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        leaderboard={teams}
      />
    </div>
  );
}
