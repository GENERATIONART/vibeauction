'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVibeStore } from '../state/vibe-store';
import { useAuth } from '../state/auth-store';
import NavBar from '../components/NavBar';

const categoryOptions = [
  'Feelings',
  'Permissions',
  'Moments',
  'Powers',
  'Excuses',
  'Confessions',
];

const durationOptions = ['12 Hours', '24 Hours', '3 Days', '7 Days'];

const defaultTitleByCategory = {
  Feelings: 'Flirty Eye Contact at a Red Light That Lasted Too Long',
  Permissions: 'Permission to Leave Because Your Stomach Growled',
  Moments: 'Accidentally Moaning at Pasta in Public',
  Powers: 'Keeping a Straight Face After Saying "That\'s What She Said"',
  Excuses: 'Sorry, That Text Was Not Meant for This Group Chat',
  Confessions: 'Fridge Crime Scene',
};

const durationMap = {
  '12 Hours': '11h 59m',
  '24 Hours': '23h 59m',
  '3 Days': '2d 23h',
  '7 Days': '6d 23h',
};

const customStyles = {
  root: {
    background: '#0D0D0D',
    color: '#FFFFFF',
    minHeight: '100dvh',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
  },
  header: {
    background: '#000000',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '2px solid #C8FF00',
  },
  logo: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#C8FF00',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
  },
  navItem: {
    fontWeight: 700,
    fontSize: '14px',
    color: '#FFFFFF',
    textDecoration: 'none',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  userBalance: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#C8FF00',
    color: '#000000',
    padding: '4px 12px',
    borderRadius: '99px',
    fontWeight: 700,
    fontSize: '13px',
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '56px 24px 40px',
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '60px',
  },
  formSectionH1: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '64px',
    lineHeight: 0.9,
    textTransform: 'uppercase',
    marginBottom: '40px',
  },
  highlightTag: {
    display: 'inline-block',
    background: '#C8FF00',
    color: '#000000',
    padding: '4px 12px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 800,
    fontSize: '20px',
    transform: 'rotate(-2deg)',
    marginLeft: '10px',
    verticalAlign: 'middle',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputGroupFullWidth: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    gridColumn: 'span 2',
  },
  label: {
    fontFamily: "'Anton', sans-serif",
    textTransform: 'uppercase',
    fontSize: '18px',
    letterSpacing: '0.5px',
    color: '#C8FF00',
  },
  inputField: {
    background: '#111111',
    border: '2px solid #333333',
    padding: '14px',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    fontSize: '16px',
    outline: 'none',
    borderRadius: '0',
  },
  inputFieldFocus: {
    background: '#111111',
    border: '2px solid #C8FF00',
    padding: '14px',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    fontSize: '16px',
    outline: 'none',
    borderRadius: '0',
  },
  selectField: {
    background: '#111111',
    border: '2px solid #333333',
    padding: '14px',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    fontSize: '16px',
    outline: 'none',
    borderRadius: '0',
  },
  previewSticky: {
    position: 'sticky',
    top: '100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  previewLabel: {
    fontFamily: "'Anton', sans-serif",
    textTransform: 'uppercase',
    fontSize: '14px',
    color: '#666666',
    textAlign: 'center',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '2px solid #C8FF00',
    boxShadow: '10px 10px 0px rgba(200, 255, 0, 0.2)',
    color: '#000000',
    position: 'relative',
  },
  cardImageArea: {
    height: '180px',
    background: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottom: '2px solid #000000',
    overflow: 'hidden',
  },
  patternDots: {
    backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)',
    backgroundSize: '10px 10px',
    opacity: 0.1,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardFallback: {
    fontSize: '13px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    border: '2px solid #222222',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.6)',
    zIndex: 1,
  },
  liveBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#000000',
    color: '#C8FF00',
    fontWeight: 800,
    fontSize: '10px',
    textTransform: 'uppercase',
    padding: '4px 8px',
    border: '1px solid #C8FF00',
    transform: 'rotate(2deg)',
    zIndex: 2,
  },
  cardContent: {
    padding: '16px',
    flexGrow: 1,
  },
  cardTitle: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    lineHeight: 1.1,
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    borderTop: '1px solid #DDDDDD',
    paddingTop: '8px',
    gap: '8px',
  },
  bidLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: '#888888',
  },
  bidAmount: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '22px',
  },
  timer: {
    fontWeight: 700,
    fontSize: '14px',
    color: '#666666',
  },
  btnSubmit: {
    marginTop: '34px',
    width: '100%',
    background: '#C8FF00',
    color: '#000000',
    border: 'none',
    padding: '20px',
    fontFamily: "'Anton', sans-serif",
    fontSize: '24px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    cursor: 'pointer',
  },
  uploadZone: {
    border: '2px dashed #444444',
    background: '#111111',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  uploadZoneHover: {
    border: '2px dashed #C8FF00',
    background: '#151515',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  uploadZoneHasImage: {
    border: '2px solid #C8FF00',
    background: '#111111',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  uploadIcon: {
    fontSize: '32px',
    lineHeight: 1,
  },
  uploadText: {
    fontFamily: "'Anton', sans-serif",
    fontSize: '16px',
    textTransform: 'uppercase',
    color: '#666666',
  },
  uploadSubtext: {
    fontSize: '12px',
    color: '#444444',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  uploadRemove: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#000000',
    color: '#C8FF00',
    border: '1px solid #C8FF00',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    padding: '3px 8px',
    cursor: 'pointer',
    zIndex: 3,
  },
  svgDrip: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100px',
    zIndex: 0,
    opacity: 0.1,
    pointerEvents: 'none',
  },
  placeBidBtn: {
    width: '100%',
    height: '44px',
    background: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Anton', sans-serif",
    color: '#C8FF00',
    textTransform: 'uppercase',
    border: 'none',
    fontSize: '16px',
  },
  helperText: {
    fontSize: '12px',
    color: '#666666',
    fontWeight: 700,
  },
  statusSuccess: {
    marginTop: '18px',
    background: 'rgba(200,255,0,0.14)',
    border: '1px solid rgba(200,255,0,0.45)',
    padding: '10px 12px',
    color: '#E9FF9A',
    fontSize: '13px',
    fontWeight: 700,
  },
  statusError: {
    marginTop: '18px',
    background: 'rgba(255,70,70,0.12)',
    border: '1px solid rgba(255,70,70,0.45)',
    padding: '10px 12px',
    color: '#FF9797',
    fontSize: '13px',
    fontWeight: 700,
  },
  anonToggle: {
    border: '2px solid #333333',
    background: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px',
    minHeight: '54px',
  },
  anonToggleOn: {
    border: '2px solid #C8FF00',
    background: '#121812',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px',
    minHeight: '54px',
  },
};

const truncate = (value, max) => {
  const text = String(value || '');
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

export default function MintPage() {
  const router = useRouter();
  const { confessions, mintedVibes, mintConfession, mintVibe } = useVibeStore();
  const { user, profile } = useAuth();

  const [viewportWidth, setViewportWidth] = useState(1200);
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Feelings',
    startingPrice: '100',
    buyItNow: '',
    duration: '24 Hours',
    details: '',
    anonymous: true,
    alias: '',
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadHover, setUploadHover] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef(null);

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth <= 1024;
  const isConfession = formData.category === 'Confessions';
  const isAuthed = Boolean(user);

  const confessionCount = Array.isArray(confessions) ? confessions.length : 0;
  const mintedVibeCount = Array.isArray(mintedVibes) ? mintedVibes.length : 0;
  const totalMinted = confessionCount + mintedVibeCount;

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background-color: #0D0D0D; overflow-x: hidden; }
      select option { background: #0D0D0D; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
      document.head.removeChild(style);
    };
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (fileEvent) => {
      setUploadedImage(fileEvent.target?.result || null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getUploadZoneStyle = () => {
    if (uploadedImage) return customStyles.uploadZoneHasImage;
    if (uploadHover) return customStyles.uploadZoneHover;
    return customStyles.uploadZone;
  };

  const getInputStyle = (fieldName) => (
    focusedField === fieldName ? customStyles.inputFieldFocus : customStyles.inputField
  );

  const onCategoryChange = (event) => {
    const nextCategory = event.target.value;

    setFormData((previous) => {
      return {
        ...previous,
        category: nextCategory,
        startingPrice:
          nextCategory === 'Confessions'
            ? previous.startingPrice === '' || previous.startingPrice === '0'
              ? '0'
              : previous.startingPrice
            : previous.startingPrice === '0'
              ? '100'
              : previous.startingPrice,
      };
    });

    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!isAuthed) {
      setError('Sign in to mint and list vibes.');
      return;
    }

    const cleanedName = formData.itemName.trim();
    const cleanedDetails = formData.details.trim();
    const cleanedAlias = formData.alias.trim();

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isConfession) {
        if (cleanedDetails.length < 12) {
          setError('Confession must be at least 12 characters.');
          return;
        }

        if (!formData.anonymous && cleanedAlias.length < 2) {
          setError('Add a handle when anonymous mode is off.');
          return;
        }

        const mintedConfession = await mintConfession({
          title: cleanedName,
          confession: cleanedDetails,
          isAnonymous: formData.anonymous,
          alias: cleanedAlias,
        });

        if (!mintedConfession) {
          setError('Mint failed. Please try again.');
          return;
        }

        const mirroredConfessionVibeResult = await mintVibe({
          name: cleanedName || mintedConfession.title,
          category: 'Confessions',
          startingPrice: 0,
          duration: 'N/A',
          manifesto: cleanedDetails,
          isAnonymous: formData.anonymous,
          alias: cleanedAlias,
          author: mintedConfession.author,
        });

        if (!mirroredConfessionVibeResult?.mintedVibe) {
          setError(mirroredConfessionVibeResult?.message || 'Confession created, but listing mirror failed. Try refreshing.');
          return;
        }

        setSubmitted(true);
        setSuccess(`Confession minted as ${mintedConfession.author}.`);
        setTimeout(() => setSubmitted(false), 1800);

        setFormData((previous) => ({
          ...previous,
          itemName: '',
          details: '',
          alias: '',
          anonymous: true,
        }));
        return;
      }

      if (cleanedName.length < 3) {
        setError('Vibe name must be at least 3 characters.');
        return;
      }

      const numericPrice = Number(String(formData.startingPrice || '').replace(/,/g, '').trim());
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        setError('Starting price must be greater than 0.');
        return;
      }

      const buyNowNumeric = Number(String(formData.buyItNow || '').replace(/,/g, '').trim());
      const mintResult = await mintVibe({
        name: cleanedName,
        category: formData.category,
        startingPrice: numericPrice,
        buyNowPrice: Number.isFinite(buyNowNumeric) && buyNowNumeric > 0 ? buyNowNumeric : null,
        duration: formData.duration,
        manifesto: cleanedDetails,
        hasImage: Boolean(uploadedImage),
        author: profile?.username ?? null,
        listedBy: user?.id ?? null,
      });

      if (!mintResult?.mintedVibe) {
        setError(mintResult?.message || 'Listing failed. Please try again.');
        return;
      }

      const minted = mintResult.mintedVibe;

      setSubmitted(true);
      setSuccess(`Vibe listed in ${formData.category}.`);

      if (minted.slug) {
        setTimeout(() => router.push(`/auction/${minted.slug}`), 1200);
        return;
      }

      setTimeout(() => setSubmitted(false), 1800);

      setFormData((previous) => ({
        ...previous,
        itemName: '',
        details: '',
        startingPrice: '100',
        buyItNow: '',
        duration: '24 Hours',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const previewTitle = formData.itemName || defaultTitleByCategory[formData.category];
  const previewDetails =
    formData.details ||
    (isConfession
      ? 'Your confession preview appears here before you mint anonymously or publicly.'
      : 'Briefly describe why this vibe is worth bidding on.');
  const previewBid = formData.startingPrice || (isConfession ? '0' : '100');
  const previewTimer = durationMap[formData.duration] || '23h 59m';

  return (
    <div style={customStyles.root}>
      <NavBar />

      <main
        style={{
          ...customStyles.mainContainer,
          gridTemplateColumns: isTablet ? '1fr' : customStyles.mainContainer.gridTemplateColumns,
          gap: isMobile ? '24px' : customStyles.mainContainer.gap,
          padding: isMobile ? '26px 16px 24px' : customStyles.mainContainer.padding,
        }}
      >
        <div>
          <h1
            style={{
              ...customStyles.formSectionH1,
              fontSize: isMobile ? '44px' : (isTablet ? '56px' : customStyles.formSectionH1.fontSize),
              marginBottom: isMobile ? '24px' : customStyles.formSectionH1.marginBottom,
            }}
          >
            Mint a New <br />
            Abstract{' '}
            <span
              style={{
                ...customStyles.highlightTag,
                fontSize: isMobile ? '14px' : customStyles.highlightTag.fontSize,
                marginLeft: isMobile ? 0 : customStyles.highlightTag.marginLeft,
                marginTop: isMobile ? '8px' : 0,
                display: isMobile ? 'inline-block' : customStyles.highlightTag.display,
              }}
            >
              {formData.category.toUpperCase()}
            </span>
          </h1>

          <form
            style={{
              ...customStyles.formGrid,
              gridTemplateColumns: isMobile ? '1fr' : customStyles.formGrid.gridTemplateColumns,
            }}
            onSubmit={handleSubmit}
          >
            <div style={{ ...customStyles.inputGroupFullWidth, gridColumn: isMobile ? 'auto' : 'span 2' }}>
              <label style={customStyles.label}>{isConfession ? 'Confession Title' : 'Vibe Name'}</label>
              <input
                type="text"
                style={getInputStyle('itemName')}
                placeholder={isConfession ? 'e.g. Fridge Crime Scene' : 'e.g. Burp That Tastes Like Last Night\'s Garlic Bread'}
                value={formData.itemName}
                onChange={(event) => setFormData((previous) => ({ ...previous, itemName: event.target.value }))}
                onFocus={() => setFocusedField('itemName')}
                onBlur={() => setFocusedField('')}
              />
            </div>

            <div style={{ ...customStyles.inputGroupFullWidth, gridColumn: isMobile ? 'auto' : 'span 2' }}>
              <label style={customStyles.label}>
                Cover Image{' '}
                <span style={{ fontSize: '12px', color: '#555555', fontFamily: "'Inter', sans-serif", fontWeight: 700, textTransform: 'none' }}>
                  — optional
                </span>
              </label>
              <div
                style={getUploadZoneStyle()}
                onMouseEnter={() => setUploadHover(true)}
                onMouseLeave={() => setUploadHover(false)}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', zIndex: 2 }}
                />
                {!uploadedImage && (
                  <>
                    <span style={customStyles.uploadIcon}>IMG</span>
                    <span style={customStyles.uploadText}>Drop an image or click to browse</span>
                    <span style={customStyles.uploadSubtext}>PNG, JPG, GIF · Max 5MB</span>
                  </>
                )}
                {uploadedImage && (
                  <img
                    src={uploadedImage}
                    alt="Cover preview"
                    style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                  />
                )}
                {uploadedImage && (
                  <button style={customStyles.uploadRemove} onClick={removeImage}>
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>

            <div style={customStyles.inputGroup}>
              <label style={customStyles.label}>Category</label>
              <select style={customStyles.selectField} value={formData.category} onChange={onCategoryChange}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {!isConfession && (
              <>
                <div style={customStyles.inputGroup}>
                  <label style={customStyles.label}>Starting Price (Aura)</label>
                  <input
                    type="number"
                    min="1"
                    style={getInputStyle('startingPrice')}
                    placeholder="100"
                    value={formData.startingPrice}
                    onChange={(event) => setFormData((previous) => ({ ...previous, startingPrice: event.target.value }))}
                    onFocus={() => setFocusedField('startingPrice')}
                    onBlur={() => setFocusedField('')}
                  />
                </div>

                <div style={customStyles.inputGroup}>
                  <label style={customStyles.label}>
                    Buy It Now{' '}
                    <span style={{ fontSize: '12px', color: '#555555', fontFamily: "'Inter', sans-serif", fontWeight: 700, textTransform: 'none' }}>
                      — optional
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    style={getInputStyle('buyItNow')}
                    placeholder="e.g. 500"
                    value={formData.buyItNow}
                    onChange={(event) => setFormData((previous) => ({ ...previous, buyItNow: event.target.value }))}
                    onFocus={() => setFocusedField('buyItNow')}
                    onBlur={() => setFocusedField('')}
                  />
                </div>

                <div style={customStyles.inputGroup}>
                  <label style={customStyles.label}>Auction Duration</label>
                  <select
                    style={customStyles.selectField}
                    value={formData.duration}
                    onChange={(event) => setFormData((previous) => ({ ...previous, duration: event.target.value }))}
                  >
                    {durationOptions.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {isConfession && (
              <>
                <div style={customStyles.inputGroup}>
                  <label style={customStyles.label}>Visibility</label>
                  <button
                    type="button"
                    style={formData.anonymous ? customStyles.anonToggleOn : customStyles.anonToggle}
                    onClick={() => setFormData((previous) => ({ ...previous, anonymous: !previous.anonymous }))}
                  >
                    <span style={{ fontWeight: 800, textTransform: 'uppercase', color: formData.anonymous ? '#C8FF00' : '#FFFFFF', fontSize: '13px' }}>
                      {formData.anonymous ? 'Anonymous' : 'Named'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888888' }}>Tap to toggle</span>
                  </button>
                </div>

                <div style={customStyles.inputGroup}>
                  <label style={customStyles.label}>Your Handle</label>
                  <input
                    type="text"
                    style={getInputStyle('alias')}
                    placeholder="@GhostWriter"
                    value={formData.alias}
                    onChange={(event) => setFormData((previous) => ({ ...previous, alias: event.target.value }))}
                    onFocus={() => setFocusedField('alias')}
                    onBlur={() => setFocusedField('')}
                    disabled={formData.anonymous}
                  />
                  <span style={customStyles.helperText}>
                    {formData.anonymous ? 'Disabled while anonymous minting is enabled.' : 'Used as author for a public confession.'}
                  </span>
                </div>
              </>
            )}

            <div style={{ ...customStyles.inputGroupFullWidth, gridColumn: isMobile ? 'auto' : 'span 2' }}>
              <label style={customStyles.label}>{isConfession ? 'Confession' : 'Manifesto (Optional)'}</label>
              <textarea
                style={{ ...getInputStyle('details'), height: '130px', resize: 'none' }}
                placeholder={isConfession ? 'Say the thing you normally keep to yourself...' : 'Briefly describe why this vibe is worth bidding on...'}
                value={formData.details}
                onChange={(event) => setFormData((previous) => ({ ...previous, details: event.target.value }))}
                onFocus={() => setFocusedField('details')}
                onBlur={() => setFocusedField('')}
                maxLength={280}
              />
              <span style={customStyles.helperText}>{280 - formData.details.length} characters left</span>
            </div>

            <div style={{ ...customStyles.inputGroupFullWidth, gridColumn: isMobile ? 'auto' : 'span 2' }}>
              <button
                type="submit"
                style={{
                  ...customStyles.btnSubmit,
                  background: submitted ? '#A8D800' : '#C8FF00',
                  transform: submitted ? 'scale(0.99)' : 'scale(1)',
                  transition: 'all 0.1s',
                  fontSize: isMobile ? '20px' : customStyles.btnSubmit.fontSize,
                  padding: isMobile ? '16px' : customStyles.btnSubmit.padding,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting || !isAuthed ? 'not-allowed' : customStyles.btnSubmit.cursor,
                }}
                disabled={submitting || !isAuthed}
              >
                {!isAuthed
                  ? 'Sign In To Mint'
                  : submitting
                  ? 'Submitting...'
                  : submitted
                  ? isConfession
                    ? 'Confession Minted ✓'
                    : 'Vibe Listed ✓'
                  : isConfession
                    ? 'Mint Confession'
                    : 'List Vibe for Auction'}
              </button>

              {!isAuthed && (
                <div
                  style={{
                    marginTop: '10px',
                    background: 'rgba(255,210,120,0.12)',
                    border: '1px solid rgba(255,210,120,0.45)',
                    color: '#FFE5B3',
                    padding: '10px 12px',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  Sign in required. <Link href="/login" style={{ color: '#FFE5B3', textDecoration: 'underline' }}>Go to login</Link>
                </div>
              )}
              {error && <div style={customStyles.statusError}>{error}</div>}
              {success && <div style={customStyles.statusSuccess}>{success}</div>}
            </div>
          </form>
        </div>

        <aside>
          <div
            style={{
              ...customStyles.previewSticky,
              position: isTablet ? 'relative' : customStyles.previewSticky.position,
              top: isTablet ? 0 : customStyles.previewSticky.top,
            }}
          >
            <div style={customStyles.previewLabel}>Live Preview</div>

            <article style={customStyles.card}>
              <div style={customStyles.liveBadge}>{formData.category}</div>
              <div style={customStyles.cardImageArea}>
                {!uploadedImage && <div style={customStyles.patternDots}></div>}
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
                  />
                ) : (
                  <div style={customStyles.cardFallback}>IMAGE PREVIEW</div>
                )}
              </div>
              <div style={customStyles.cardContent}>
                <h2 style={{ ...customStyles.cardTitle, fontSize: isMobile ? '22px' : customStyles.cardTitle.fontSize }}>
                  {previewTitle}
                </h2>
                <p style={{ fontSize: '13px', lineHeight: 1.45, color: '#444444', marginBottom: '10px' }}>
                  {truncate(previewDetails, 120)}
                </p>
                <div style={customStyles.cardMeta}>
                  <div>
                    <div style={customStyles.bidLabel}>{isConfession ? 'Category' : 'Starting Bid'}</div>
                    <div style={customStyles.bidAmount}>{isConfession ? 'Confessions' : previewBid}</div>
                  </div>
                  <span style={customStyles.timer}>{isConfession ? (formData.anonymous ? 'Anonymous' : 'Named') : previewTimer}</span>
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <button type="button" style={customStyles.placeBidBtn} disabled>
                  {isConfession ? 'Ready To Mint' : 'Place Bid'}
                </button>
              </div>
            </article>

            <p style={{ fontSize: '12px', color: '#444444', textAlign: 'center', marginTop: '20px', lineHeight: 1.5 }}>
              {isConfession
                ? 'Anonymous confessions hide your handle in feed.'
                : 'Listing a vibe costs 50 AURA. Proceeds are subject to a 2% vibe tax.'}
              <br />
              Total minted: {totalMinted} ({confessionCount} confessions)
            </p>
          </div>
        </aside>
      </main>

      <svg style={customStyles.svgDrip} preserveAspectRatio="none" viewBox="0 0 1440 100">
        <path
          fill="#C8FF00"
          d="M0,0 L1440,0 L1440,20 C1400,20 1380,80 1320,80 C1260,80 1240,30 1180,30 C1120,30 1100,90 1020,90 C940,90 920,40 840,40 C760,40 740,100 660,100 C580,100 560,50 480,50 C400,50 380,95 300,95 C220,95 200,45 120,45 C40,45 20,20 0,20 Z"
        />
      </svg>
    </div>
  );
}
