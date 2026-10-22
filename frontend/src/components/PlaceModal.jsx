import React, { useState, useEffect } from 'react';
import { X, Image, MapPin, Coins, Sparkles } from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Mount Fuji', url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Kyoto Torii', url: 'https://images.unsplash.com/photo-1478436127897-769e00d2c715?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Golden Pavilion', url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Shibuya Crossing', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Himeji Castle', url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Dotonbori Osaka', url: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1200&q=80' }
];

export default function PlaceModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [basePrize, setBasePrize] = useState(10000);
  const [originalValue, setOriginalValue] = useState(35000);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setImageUrl(initialData.imageUrl || '');
      setLocation(initialData.location || '');
      setDescription(initialData.description || '');
      setBasePrize(initialData.basePrize || 10000);
      setOriginalValue(initialData.originalValue || 35000);
    } else {
      setName('');
      setImageUrl(PRESET_IMAGES[0].url);
      setLocation('Tokyo / Kyoto');
      setDescription('');
      setBasePrize(10000);
      setOriginalValue(35000);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      imageUrl,
      location,
      description,
      basePrize: Number(basePrize),
      originalValue: Number(originalValue)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(160deg, #121c3b 0%, #0a1128 100%)',
          border: '2px solid rgba(255, 117, 143, 0.4)',
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
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div className="hanko-stamp">{initialData ? '名所編集' : '名所登録'}</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#ffffff' }}>
            {initialData ? 'Edit Japan Place' : 'Add New Japan Place'}
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Specify name, real location photograph, base starting bid, and secret reference valuation.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Place Name & Kanji
            </label>
            <input
              type="text"
              className="jp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mount Fuji (富士山)"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Location / Prefecture
            </label>
            <input
              type="text"
              className="jp-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Shizuoka & Yamanashi"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Real Photograph URL
            </label>
            <input
              type="url"
              className="jp-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              required
            />
            {/* Quick preset chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  style={{
                    background: imageUrl === preset.url ? 'var(--sakura-primary)' : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {/* Image Preview */}
            {imageUrl && (
              <div style={{ marginTop: '10px', height: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Base Prize (Minimum Bid)
              </label>
              <input
                type="number"
                className="jp-input"
                value={basePrize}
                onChange={(e) => setBasePrize(e.target.value)}
                step="500"
                min="1000"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Original / Reference Value
              </label>
              <input
                type="number"
                className="jp-input"
                value={originalValue}
                onChange={(e) => setOriginalValue(e.target.value)}
                step="1000"
                min="1000"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description (Optional)
            </label>
            <textarea
              className="jp-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief cultural story or landmark history..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn-navy" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn-sakura" style={{ flex: 1 }}>
              {initialData ? 'Save Changes' : 'Add Place'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
