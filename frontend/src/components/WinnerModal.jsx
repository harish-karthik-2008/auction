import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles, Award, X, RotateCcw, ChevronRight } from 'lucide-react';

export default function WinnerModal({ isOpen, onClose, leaderboard, onPlayAgain }) {
  useEffect(() => {
    if (isOpen) {
      // Fire Japanese celebration confetti
      const end = Date.now() + 3.5 * 1000;
      const colors = ['#ff758f', '#ffd166', '#ffffff', '#e63946', '#ffb7b2'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen || !leaderboard || leaderboard.length === 0) return null;

  const winner = leaderboard[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '36px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(165deg, #101c3d 0%, #080e22 100%)',
          border: '2px solid rgba(255, 215, 0, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.25)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
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
          <X size={24} />
        </button>

        {/* Crown & Title Banner */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffeaa7 0%, #d4af37 100%)',
            boxShadow: '0 0 35px rgba(212, 175, 55, 0.6)',
            marginBottom: '16px'
          }}>
            <Crown size={44} color="#0d1b2a" />
          </div>

          <div className="hanko-stamp" style={{ borderColor: '#ffd166', color: '#ffd166', marginBottom: '10px' }}>
            優勝決定 • GRAND CHAMPION
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.2
          }}>
            Tournament Champion Crowned!
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--sakura-light)', fontSize: '1.1rem', letterSpacing: '0.1em' }}>
            日本の名所オークション 最終勝者発表
          </p>
        </div>

        {/* Winner Highlight Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(255, 117, 143, 0.1) 100%)',
          border: '2px solid rgba(255, 215, 0, 0.6)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 30px',
          marginBottom: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                background: '#ffd166',
                color: '#070d1e',
                fontWeight: 800,
                fontSize: '0.8rem',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.08em'
              }}>
                RANK #1
              </span>
              <span style={{ color: 'var(--sakura-light)', fontSize: '0.85rem' }}>
                {winner.isTied ? '(Tied)' : 'Undisputed Champion'}
              </span>
            </div>
            <h3 style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: winner.color || '#ff758f'
              }} />
              {winner.teamName}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Acquired {winner.placesPurchasedCount} Japan locations • Auction Gain: {winner.auctionGain >= 0 ? '+' : ''}{winner.auctionGain.toLocaleString()} pts
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gold-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
              Total Current Team Value
            </span>
            <span style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#ffd166',
              fontFamily: 'monospace',
              letterSpacing: '0.05em'
            }}>
              {winner.totalCurrentValue.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block' }}>
              Remaining Purse: {winner.remainingPurse.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Tie-breaker formula note */}
        <div style={{
          background: 'rgba(10, 17, 40, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '24px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={16} color="var(--gold-accent)" />
          <span>
            <strong>Official Scoring:</strong> Rank is determined by <em>Total Current Team Value</em> (Remaining Purse + Total Original Value). In case of identical values, the team with the higher <em>Remaining Purse</em> wins the tie-breaker.
          </span>
        </div>

        {/* Complete Leaderboard Table (Section 5) */}
        <div style={{ overflowX: 'auto', marginBottom: '28px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.88rem'
          }}>
            <thead>
              <tr style={{
                borderBottom: '2px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--sakura-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem'
              }}>
                <th style={{ padding: '12px 10px' }}>Rank</th>
                <th style={{ padding: '12px 10px' }}>Team</th>
                <th style={{ padding: '12px 10px' }}>Starting Purse</th>
                <th style={{ padding: '12px 10px' }}>Remaining Purse</th>
                <th style={{ padding: '12px 10px' }}>Places</th>
                <th style={{ padding: '12px 10px' }}>Purchased Cost</th>
                <th style={{ padding: '12px 10px' }}>Original Value</th>
                <th style={{ padding: '12px 10px', color: '#ffd166' }}>Current Value</th>
                <th style={{ padding: '12px 10px' }}>Gain</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((team, idx) => (
                <tr
                  key={team.teamId}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: idx === 0 ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                    fontWeight: idx === 0 ? 700 : 500
                  }}
                >
                  <td style={{ padding: '14px 10px' }}>
                    {team.rank === 1 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ffd166', fontWeight: 800 }}>
                        <Crown size={15} /> 1
                      </span>
                    ) : team.rank === 2 ? (
                      <span style={{ color: '#cbd5e1', fontWeight: 700 }}>2</span>
                    ) : team.rank === 3 ? (
                      <span style={{ color: '#d97706', fontWeight: 700 }}>3</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>{team.rank}</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: team.color || '#ff758f'
                      }} />
                      <span style={{ color: '#ffffff' }}>{team.teamName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>
                    {team.startingPurse.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 10px', color: '#34d399', fontWeight: 600 }}>
                    {team.remainingPurse.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>
                    {team.placesPurchasedCount}
                  </td>
                  <td style={{ padding: '14px 10px', color: '#f87171' }}>
                    {team.totalPurchasedCost.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 10px', color: '#93c5fd' }}>
                    {team.totalOriginalValue.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 10px', color: '#ffd166', fontWeight: 800, fontSize: '0.95rem' }}>
                    {team.totalCurrentValue.toLocaleString()}
                  </td>
                  <td style={{
                    padding: '14px 10px',
                    color: team.auctionGain >= 0 ? '#34d399' : '#f87171',
                    fontWeight: 700
                  }}>
                    {team.auctionGain >= 0 ? '+' : ''}{team.auctionGain.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          <button onClick={onClose} className="btn-navy">
            Close Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
