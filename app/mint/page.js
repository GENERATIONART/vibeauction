'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVibeStore } from '../state/vibe-store';
import { useAuth } from '../state/auth-store';
import NavBar from '../components/NavBar';
import { COLORS, RADIUS } from '../../lib/design-tokens.js';

const categoryOptions = [
  { value: 'Auto', label: 'Vibe (AI Picks Category)' },
  { value: 'Confessions', label: 'Confession' },
];

const defaultTitleByCategory = {
  Auto: 'The Exact Moment You Realize You Should Not Have Sent That Text',
  Feelings: 'Flirty Eye Contact at a Red Light That Lasted Too Long',
  Permissions: 'Permission to Leave Because Your Stomach Growled',
  Moments: 'Accidentally Moaning at Pasta in Public',
  Powers: 'Keeping a Straight Face After Saying "That\'s What She Said"',
  Excuses: 'Sorry, That Text Was Not Meant for This Group Chat',
  Confessions: 'Fridge Crime Scene',
};

const MINT_STAGE_ORDER = ['uploading', 'vibing', 'construction', 'generating', 'finalizing'];

const MINT_STAGE_LABELS = {
  uploading: 'Uploading Image',
  vibing: 'Vibing',
  construction: 'Construction Humor',
  generating: 'Generating Image',
  finalizing: 'Packaging Vibe Card',
};

const IMAGE_STYLE_OPTIONS = [
  { value: '', label: 'AI Picks Style' },
  { value: 'surreal editorial collage with layered paper cutout textures', label: 'Surreal Collage' },
  { value: 'bold mid-century poster design with geometric forms and dramatic silhouettes', label: 'Mid-Century Poster' },
  { value: 'stop-motion clay diorama aesthetic with tactile handmade objects', label: 'Clay Stop-Motion' },
  { value: 'expressionist digital painting with thick brush textures and playful distortion', label: 'Expressionist Painting' },
  { value: 'retro halftone comic look with dynamic action framing', label: 'Retro Halftone Comic' },
  { value: 'dreamy 3D toy-world render with exaggerated proportions and tiny details', label: '3D Toy World' },
  { value: 'neo-dada photomontage style with unexpected object combinations', label: 'Neo-Dada Montage' },
  { value: 'street-art mural energy with stylized characters and punchy shapes', label: 'Street Art Mural' },
  { value: 'vintage pulp cover composition with dramatic perspective', label: 'Vintage Pulp' },
  { value: 'minimalist vector scene with absurd props and high-contrast staging', label: 'Minimalist Vector' },
];

const IMAGE_HUMOR_OPTIONS = [
  { value: '', label: 'AI Picks Humor Style' },
  { value: 'visual irony where a serious setup has an obviously ridiculous payoff', label: 'Visual Irony' },
  { value: 'physical comedy through exaggerated motion and over-the-top reactions', label: 'Physical Comedy' },
  { value: 'awkward social tension played as a silent visual joke', label: 'Awkward Tension' },
  { value: 'unexpected scale mismatch (tiny thing acting powerful or huge thing acting delicate)', label: 'Scale Mismatch' },
  { value: 'deadpan absurdism: everything is composed seriously except one impossible detail', label: 'Deadpan Absurdism' },
];

const customStyles = {
  root: {
    background: COLORS.bg,
    color: COLORS.fg,
    minHeight: '100dvh',
    fontFamily: "'Space Grotesk', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    overflowX: 'hidden',
  },
  header: {
    background: COLORS.bg,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  logo: {
    fontWeight: 300,
    letterSpacing: '0.02em',
    fontSize: '20px',
    color: COLORS.accent,
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
  },
  navItem: {
    fontWeight: 500,
    fontSize: '14px',
    color: COLORS.fg,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  userBalance: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: COLORS.accent,
    color: '#000000',
    padding: '4px 12px',
    borderRadius: RADIUS.pill,
    fontWeight: 600,
    fontSize: '13px',
  },
  mainContainer: {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '56px 24px 40px',
  },
  formSectionH1: {
    fontSize: '44px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.05,
    marginBottom: '40px',
  },
  highlightTag: {
    display: 'inline-block',
    background: COLORS.accent,
    color: '#000000',
    padding: '4px 12px',
    borderRadius: RADIUS.chip,
    fontWeight: 700,
    fontSize: '18px',
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
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.accent,
  },
  inputField: {
    background: COLORS.bgElevated,
    border: `1px solid ${COLORS.border}`,
    padding: '13px 16px',
    color: COLORS.fg,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '16px',
    outline: 'none',
    borderRadius: '12px',
  },
  inputFieldFocus: {
    background: COLORS.bgElevated,
    border: `1px solid ${COLORS.accent}`,
    padding: '13px 16px',
    color: COLORS.fg,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '16px',
    outline: 'none',
    borderRadius: '12px',
  },
  selectField: {
    background: COLORS.bgElevated,
    border: `1px solid ${COLORS.border}`,
    padding: '13px 16px',
    color: COLORS.fg,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '16px',
    outline: 'none',
    borderRadius: '12px',
  },
  previewSticky: {
    position: 'sticky',
    top: '100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  previewLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.textFaint,
    textAlign: 'center',
  },
  card: {
    background: COLORS.cardFill,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${COLORS.accentBorderHover}`,
    boxShadow: '0 0 40px -12px rgba(139,92,246,0.35)',
    color: COLORS.fg,
    position: 'relative',
  },
  cardImageArea: {
    height: '180px',
    background: COLORS.bgElevated,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottom: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },
  patternDots: {
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
    backgroundSize: '10px 10px',
    opacity: 0.1,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardFallback: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.pill,
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.06)',
    zIndex: 1,
  },
  liveBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: COLORS.accent,
    color: '#000000',
    fontWeight: 700,
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '3px 9px',
    borderRadius: RADIUS.chip,
    zIndex: 2,
  },
  cardContent: {
    padding: '18px',
    flexGrow: 1,
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.15,
    marginBottom: '8px',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: '10px',
    gap: '8px',
  },
  bidLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
    color: COLORS.textFaint,
  },
  bidAmount: {
    fontSize: '18px',
    fontWeight: 700,
    color: COLORS.accent,
  },
  timer: {
    fontWeight: 600,
    fontSize: '14px',
    color: COLORS.textMuted,
  },
  btnSubmit: {
    marginTop: '34px',
    width: '100%',
    background: COLORS.accent,
    color: '#000000',
    border: 'none',
    padding: '16px',
    borderRadius: RADIUS.pill,
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  uploadZone: {
    border: `1px dashed ${COLORS.borderStrong}`,
    background: COLORS.bgElevated,
    borderRadius: RADIUS.card,
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
    border: `1px dashed ${COLORS.accent}`,
    background: COLORS.bgElevated,
    borderRadius: RADIUS.card,
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
    border: `1px solid ${COLORS.accent}`,
    background: COLORS.bgElevated,
    borderRadius: RADIUS.card,
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
    fontSize: '15px',
    fontWeight: 600,
    color: COLORS.textMuted,
  },
  uploadSubtext: {
    fontSize: '12px',
    color: COLORS.textDim,
    fontWeight: 600,
  },
  uploadRemove: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.6)',
    color: '#FFFFFF',
    border: `1px solid ${COLORS.borderStrong}`,
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: RADIUS.pill,
    cursor: 'pointer',
    zIndex: 3,
    backdropFilter: 'blur(6px)',
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
    background: COLORS.bgElevated,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.accent,
    fontWeight: 600,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.pill,
    fontSize: '15px',
  },
  helperText: {
    fontSize: '12px',
    color: COLORS.textDim,
    fontWeight: 500,
  },
  statusSuccess: {
    marginTop: '18px',
    background: 'rgba(139,92,246,0.1)',
    border: `1px solid ${COLORS.accentBorderHover}`,
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#e0d4ff',
    fontSize: '13px',
    fontWeight: 600,
  },
  statusError: {
    marginTop: '18px',
    background: 'rgba(255,70,70,0.12)',
    border: '1px solid rgba(255,70,70,0.45)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#FF9797',
    fontSize: '13px',
    fontWeight: 600,
  },
  anonToggle: {
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bgElevated,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px',
    minHeight: '54px',
  },
  anonToggleOn: {
    border: `1px solid ${COLORS.accent}`,
    background: 'rgba(139,92,246,0.08)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px',
    minHeight: '54px',
  },
  loadingPanel: {
    marginTop: '12px',
    border: `1px solid ${COLORS.accentBorderHover}`,
    borderRadius: '12px',
    background: 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(17,17,17,0.9))',
    padding: '14px',
  },
  loadingTitle: {
    fontSize: '13px',
    letterSpacing: '0.04em',
    fontWeight: 600,
    color: COLORS.accent,
    marginBottom: '8px',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: COLORS.textMuted,
    marginBottom: '5px',
    fontWeight: 500,
  },
  loadingRowActive: {
    color: '#e0d4ff',
  },
  loadingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    background: '#2F2F2F',
    border: '1px solid #555555',
    flexShrink: 0,
    marginRight: '8px',
  },
  loadingDotActive: {
    background: COLORS.accent,
    border: `1px solid ${COLORS.accent}`,
    boxShadow: '0 0 10px rgba(139,92,246,0.55)',
  },
  loadingTrack: {
    marginTop: '8px',
    height: '4px',
    borderRadius: '999px',
    background: '#252525',
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    background: COLORS.accent,
    transition: 'width 0.35s ease',
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
    category: 'Auto',
    details: '',
    anonymous: true,
    alias: '',
  });
  const [focusedField, setFocusedField] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mintStage, setMintStage] = useState('vibing');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    imagePromptText: '',
    imageStyle: '',
    imageComposition: '',
    imageColor: '',
    imageHumor: '',
  });
  const [remixSlug, setRemixSlug] = useState('');
  const [remixSource, setRemixSource] = useState(null);
  const [remixPrefilledSlug, setRemixPrefilledSlug] = useState('');

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
    setRemixSlug(new URLSearchParams(window.location.search).get('remix') || '');

    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background-color: #09090b; overflow-x: hidden; }
      select option { background: #09090b; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateRemixSource = async () => {
      if (!remixSlug) {
        setRemixSource(null);
        setRemixPrefilledSlug('');
        return;
      }

      const fromStore = (Array.isArray(mintedVibes) ? mintedVibes : []).find((entry) => entry?.slug === remixSlug) || null;
      if (fromStore) {
        if (!cancelled) setRemixSource(fromStore);
        return;
      }

      try {
        const response = await fetch('/api/state', { cache: 'no-store' });
        const payload = await response.json();
        const source =
          (Array.isArray(payload?.state?.mintedVibes) ? payload.state.mintedVibes : []).find((entry) => entry?.slug === remixSlug) || null;
        if (!cancelled) setRemixSource(source);
      } catch {
        if (!cancelled) setRemixSource(null);
      }
    };

    hydrateRemixSource();
    return () => {
      cancelled = true;
    };
  }, [remixSlug, mintedVibes]);

  useEffect(() => {
    if (!remixSource?.slug || remixPrefilledSlug === remixSource.slug) return;

    const sourceTitle = String(remixSource.name || 'Untitled Vibe').trim();
    const sourceAuthor = remixSource.author ? `@${String(remixSource.author).replace(/^@/, '')}` : 'the original lister';
    const sourceManifesto = String(remixSource.manifesto || '').trim();

    setFormData((previous) => ({
      ...previous,
      itemName: previous.itemName || `${sourceTitle} Remix`,
      details:
        previous.details ||
        `Remix of "${sourceTitle}" by ${sourceAuthor}.\n\n${sourceManifesto ? `Source vibe:\n${sourceManifesto}\n\n` : ''}Remix angle: `,
    }));
    setAdvancedOptions((previous) => ({
      ...previous,
      imagePromptText:
        previous.imagePromptText ||
        `Create a fresh visual remix of "${sourceTitle}" by ${sourceAuthor}. Keep the emotional premise and collectible energy, but generate a distinctly new composition with different scene framing, details, and visual storytelling.${sourceManifesto ? ` Source vibe context: ${sourceManifesto}` : ''}`,
    }));
    setUploadedImageUrl('');
    setUploadPreviewUrl('');
    setUploadedFile(null);
    setRemixPrefilledSlug(remixSource.slug);
  }, [remixSource, remixPrefilledSlug]);

  const getInputStyle = (fieldName) => (
    focusedField === fieldName ? customStyles.inputFieldFocus : customStyles.inputField
  );

  const onCategoryChange = (event) => {
    const nextCategory = event.target.value;

    setFormData((previous) => {
      return {
        ...previous,
        category: nextCategory,
      };
    });

    setError('');
    setSuccess('');
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported type. Use JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large (max 10 MB).');
      return;
    }
    setUploadError('');
    setUploadedFile(file);
    setUploadPreviewUrl(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!uploadedFile) return null;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('file', uploadedFile);
      const res = await fetch('/api/upload/vibe-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setUploadError(data.error || 'Upload failed.');
        return null;
      }
      setUploadedImageUrl(data.url);
      return data.url;
    } catch (err) {
      setUploadError('Upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const clearUploadedImage = () => {
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    setUploadedFile(null);
    setUploadPreviewUrl('');
    setUploadedImageUrl('');
    setUploadError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!isAuthed) {
      setError('Sign in to create and list collectible vibes.');
      return;
    }

    const cleanedName = formData.itemName.trim();
    const cleanedDetails = formData.details.trim();
    const cleanedAlias = formData.alias.trim();

    setError('');
    setSuccess('');
    setMintStage('vibing');
    setSubmitting(true);
    let generationEscalationTimeout = null;

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
          setError('Creation failed. Please try again.');
          return;
        }

        const mirroredConfessionVibeResult = await mintVibe({
          name: cleanedName || mintedConfession.title,
          category: 'Confessions',
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

      const updateMintStageFromEvent = (eventName) => {
        if (eventName === 'auth' || eventName === 'auth_retry') {
          setMintStage('vibing');
          return;
        }
        if (eventName === 'request' || eventName === 'request_retry') {
          setMintStage('construction');
          if (generationEscalationTimeout) clearTimeout(generationEscalationTimeout);
          // The request stage includes planner + image generation; escalate after a short wait.
          generationEscalationTimeout = setTimeout(() => {
            setMintStage((current) => (current === 'construction' ? 'generating' : current));
          }, 1400);
          return;
        }
        if (eventName === 'hydrate' || eventName === 'done') {
          if (generationEscalationTimeout) clearTimeout(generationEscalationTimeout);
          setMintStage('finalizing');
          return;
        }
        if (eventName === 'failed') {
          if (generationEscalationTimeout) clearTimeout(generationEscalationTimeout);
        }
      };
      // Upload image if user selected one but it hasn't been uploaded yet
      let finalImageUrl = uploadedImageUrl;
      if (uploadedFile && !uploadedImageUrl) {
        setMintStage('uploading');
        finalImageUrl = await handleImageUpload();
        if (!finalImageUrl && uploadedFile) {
          // upload failed but we already set the error in handleImageUpload
          return;
        }
      }

      const mintResult = await mintVibe({
        name: cleanedName,
        category: isConfession ? 'Confessions' : 'Auto',
        manifesto: cleanedDetails,
        author: profile?.username ?? null,
        listedBy: user?.id ?? null,
        // Image and advanced options
        uploadedImageUrl: finalImageUrl || null,
        imagePromptText: advancedOptions.imagePromptText || null,
        imageStyle: advancedOptions.imageStyle || null,
        imageComposition: advancedOptions.imageComposition || null,
        imageColor: advancedOptions.imageColor || null,
        imageHumor: advancedOptions.imageHumor || null,
        remixSourceSlug: remixSource?.slug || null,
        remixSourceName: remixSource?.name || null,
        remixSourceAuthor: remixSource?.author || null,
      }, {
        onStage: updateMintStageFromEvent,
      });

      if (!mintResult?.mintedVibe) {
        setError(mintResult?.message || 'Listing failed. Please try again.');
        return;
      }

      const minted = mintResult.mintedVibe;

      setMintStage('finalizing');
      setSubmitted(true);
      setSuccess(`Vibe listed in ${minted.category || 'AI category'}.`);

      if (minted.slug) {
        setTimeout(() => router.push(`/vibe/${minted.slug}`), 1200);
        return;
      }

      setTimeout(() => setSubmitted(false), 1800);

      setFormData((previous) => ({
        ...previous,
        itemName: '',
        details: '',
      }));
    } finally {
      if (generationEscalationTimeout) clearTimeout(generationEscalationTimeout);
      setSubmitting(false);
    }
  };

  const previewTitle = formData.itemName || defaultTitleByCategory[formData.category] || defaultTitleByCategory.Auto;
  const previewDetails =
    formData.details ||
    (isConfession
      ? 'Your confession preview appears here before you mint anonymously or publicly.'
      : 'Briefly describe your vibe.');

  return (
    <div style={customStyles.root}>
      <NavBar />

      <main
        style={{
          ...customStyles.mainContainer,
          padding: isMobile ? '26px 16px 24px' : customStyles.mainContainer.padding,
        }}
      >
        <div>
          {remixSource && (
            <div
              style={{
                marginBottom: isMobile ? '20px' : '24px',
                border: '1px solid rgba(139,92,246,0.35)',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(17,17,17,0.95))',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: isMobile ? '18px' : '22px', color: '#8b5cf6' }}>
                Remixing {remixSource.name || 'this vibe'}
              </div>
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#B8B8B8', lineHeight: 1.5 }}>
                Start from the original post, then twist the concept into your own vibe.
                {remixSource.author ? ` Original vibe by @${String(remixSource.author).replace(/^@/, '')}.` : ''}
              </div>
              <Link
                href={`/vibe/${remixSource.slug}`}
                style={{ display: 'inline-block', marginTop: '10px', color: '#FFFFFF', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', textDecoration: 'none' }}
              >
                Back to source vibe
              </Link>
            </div>
          )}

          <h1
            style={{
              ...customStyles.formSectionH1,
              fontSize: isMobile ? '44px' : (isTablet ? '56px' : customStyles.formSectionH1.fontSize),
              marginBottom: isMobile ? '24px' : customStyles.formSectionH1.marginBottom,
            }}
          >
            Create a New <br />
            Collectible{' '}
            <span
              style={{
                ...customStyles.highlightTag,
                fontSize: isMobile ? '14px' : customStyles.highlightTag.fontSize,
                marginLeft: isMobile ? 0 : customStyles.highlightTag.marginLeft,
                marginTop: isMobile ? '8px' : 0,
                display: isMobile ? 'inline-block' : customStyles.highlightTag.display,
              }}
            >
              {isConfession ? 'CONFESSION' : 'AI-CATEGORIZED VIBE'}
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

            <div style={customStyles.inputGroup}>
              <label style={customStyles.label}>Format</label>
              <select style={customStyles.selectField} value={formData.category} onChange={onCategoryChange}>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {!isConfession && (
                <span style={customStyles.helperText}>
                  AI will auto-assign one of the expanded categories when you mint.
                </span>
              )}
            </div>

            {isConfession && (
              <>
                <div style={customStyles.inputGroup}>
                  <label style={customStyles.label}>Visibility</label>
                  <button
                    type="button"
                    style={formData.anonymous ? customStyles.anonToggleOn : customStyles.anonToggle}
                    onClick={() => setFormData((previous) => ({ ...previous, anonymous: !previous.anonymous }))}
                  >
                    <span style={{ fontWeight: 800, textTransform: 'uppercase', color: formData.anonymous ? '#8b5cf6' : '#FFFFFF', fontSize: '13px' }}>
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

            {!isConfession && (
              <div style={{ ...customStyles.inputGroupFullWidth, gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <label style={customStyles.label}>
                  Your Image{' '}
                  <span style={{ fontSize: '12px', color: '#555555', fontFamily: "'Inter', sans-serif", fontWeight: 700, textTransform: 'none' }}>
                    — optional, skips AI generation
                  </span>
                </label>
                <div
                  style={uploadPreviewUrl ? customStyles.uploadZoneHasImage : customStyles.uploadZone}
                  onClick={() => !uploadPreviewUrl && document.getElementById('vibe-image-input').click()}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect(file);
                  }}
                >
                  {uploadPreviewUrl ? (
                    <>
                      <img
                        src={uploadPreviewUrl}
                        alt="Upload preview"
                        style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        type="button"
                        style={customStyles.uploadRemove}
                        onClick={(e) => { e.stopPropagation(); clearUploadedImage(); }}
                      >
                        Remove
                      </button>
                      {uploadedImageUrl && (
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.8)', color: '#8b5cf6', fontSize: '10px', fontWeight: 800, padding: '2px 6px', textTransform: 'uppercase' }}>
                          Uploaded ✓
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={customStyles.uploadIcon}>📷</div>
                      <div style={customStyles.uploadText}>Upload Your Own Image</div>
                      <div style={customStyles.uploadSubtext}>JPEG · PNG · WebP · GIF · Max 10 MB</div>
                    </>
                  )}
                </div>
                <input
                  id="vibe-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                {uploadError && <div style={{ ...customStyles.statusError, marginTop: '6px' }}>{uploadError}</div>}
              </div>
            )}

            {!isConfession && (
              <div style={{ ...customStyles.inputGroupFullWidth, gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <button
                  type="button"
                  style={{
                    background: showAdvanced ? 'rgba(139,92,246,0.08)' : 'transparent',
                    border: `1px solid ${showAdvanced ? '#8b5cf6' : '#333333'}`,
                    borderRadius: '12px',
                    color: showAdvanced ? '#8b5cf6' : '#888888',
                    padding: '13px 16px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => setShowAdvanced((v) => !v)}
                >
                  <span>Advanced Image Options</span>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{showAdvanced ? '▲' : '▼'}</span>
                </button>

                {showAdvanced && (
                  <div style={{
                    border: '1px solid #2A2A2A',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    background: '#09090b',
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '16px',
                    marginTop: '-1px',
                  }}>
                    <div style={{ ...customStyles.inputGroupFullWidth, gridColumn: isMobile ? 'auto' : 'span 2' }}>
                      <label style={{ ...customStyles.label, fontSize: '13px' }}>Image Prompt / Direction</label>
                      <textarea
                        style={{ ...getInputStyle('imagePromptText'), height: '80px', resize: 'none', fontSize: '14px' }}
                        placeholder="e.g. A chaotic office scene with flying papers and a man screaming into a tiny phone..."
                        value={advancedOptions.imagePromptText}
                        onChange={(e) => setAdvancedOptions((p) => ({ ...p, imagePromptText: e.target.value }))}
                        onFocus={() => setFocusedField('imagePromptText')}
                        onBlur={() => setFocusedField('')}
                        maxLength={400}
                        disabled={!!uploadPreviewUrl}
                      />
                      <span style={customStyles.helperText}>
                        {uploadPreviewUrl ? 'Disabled — using uploaded image.' : `${400 - advancedOptions.imagePromptText.length} chars left`}
                      </span>
                    </div>

                    <div style={customStyles.inputGroup}>
                      <label style={{ ...customStyles.label, fontSize: '13px' }}>Art Style</label>
                      <select
                        style={customStyles.selectField}
                        value={advancedOptions.imageStyle}
                        onChange={(e) => setAdvancedOptions((p) => ({ ...p, imageStyle: e.target.value }))}
                        disabled={!!uploadPreviewUrl}
                      >
                        {IMAGE_STYLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={customStyles.inputGroup}>
                      <label style={{ ...customStyles.label, fontSize: '13px' }}>Humor Style</label>
                      <select
                        style={customStyles.selectField}
                        value={advancedOptions.imageHumor}
                        onChange={(e) => setAdvancedOptions((p) => ({ ...p, imageHumor: e.target.value }))}
                        disabled={!!uploadPreviewUrl}
                      >
                        {IMAGE_HUMOR_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {uploadPreviewUrl && (
                      <div style={{ gridColumn: isMobile ? 'auto' : 'span 2', fontSize: '12px', color: '#555555', fontWeight: 700, textTransform: 'uppercase' }}>
                        Image generation options are disabled when you upload your own image.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ ...customStyles.inputGroupFullWidth, gridColumn: isMobile ? 'auto' : 'span 2' }}>
              <label style={customStyles.label}>{isConfession ? 'Confession' : 'Vibe Story (Optional)'}</label>
              <textarea
                style={{ ...getInputStyle('details'), height: '130px', resize: 'none' }}
                placeholder={isConfession ? 'Say the thing you normally keep to yourself...' : 'Give people the origin story, context, or lore behind this vibe...'}
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
                  background: '#8b5cf6',
                  transform: submitted ? 'scale(0.99)' : 'scale(1)',
                  transition: 'all 0.1s',
                  fontSize: isMobile ? '17px' : customStyles.btnSubmit.fontSize,
                  padding: isMobile ? '15px' : customStyles.btnSubmit.padding,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting || !isAuthed ? 'not-allowed' : customStyles.btnSubmit.cursor,
                }}
                disabled={submitting || !isAuthed}
              >
                {!isAuthed
                  ? 'Sign In To Create'
                  : submitting
                  ? `${MINT_STAGE_LABELS[mintStage] || 'Submitting'}...`
                  : submitted
                  ? isConfession
                    ? 'Confession Created ✓'
                    : 'Vibe Posted ✓'
                  : isConfession
                    ? 'Create Confession'
                    : 'Post Vibe'}
              </button>

              {submitting && !isConfession && (
                <div style={customStyles.loadingPanel}>
                  <div style={customStyles.loadingTitle}>Cooking Your Vibe</div>
                  {MINT_STAGE_ORDER.map((stageKey, index) => {
                    const currentIndex = Math.max(0, MINT_STAGE_ORDER.indexOf(mintStage));
                    const isActive = currentIndex === index;
                    const isDone = currentIndex > index;
                    return (
                      <div
                        key={stageKey}
                        style={{
                          ...customStyles.loadingRow,
                          ...(isActive || isDone ? customStyles.loadingRowActive : {}),
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          <span
                            style={{
                              ...customStyles.loadingDot,
                              ...(isActive || isDone ? customStyles.loadingDotActive : {}),
                            }}
                          />
                          {MINT_STAGE_LABELS[stageKey]}
                        </span>
                        <span>{isDone ? 'DONE' : isActive ? 'IN PROGRESS' : 'PENDING'}</span>
                      </div>
                    );
                  })}
                  <div style={customStyles.loadingTrack}>
                    <div
                      style={{
                        ...customStyles.loadingBar,
                        width: `${((Math.max(0, MINT_STAGE_ORDER.indexOf(mintStage)) + 1) / MINT_STAGE_ORDER.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {!isAuthed && (
                <div
                  style={{
                    marginTop: '10px',
                    background: 'rgba(255,210,120,0.12)',
                    border: '1px solid rgba(255,210,120,0.45)',
                    borderRadius: '10px',
                    color: '#FFE5B3',
                    padding: '10px 12px',
                    fontWeight: 600,
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
      </main>

      <svg style={customStyles.svgDrip} preserveAspectRatio="none" viewBox="0 0 1440 100">
        <path
          fill="#8b5cf6"
          d="M0,0 L1440,0 L1440,20 C1400,20 1380,80 1320,80 C1260,80 1240,30 1180,30 C1120,30 1100,90 1020,90 C940,90 920,40 840,40 C760,40 740,100 660,100 C580,100 560,50 480,50 C400,50 380,95 300,95 C220,95 200,45 120,45 C40,45 20,20 0,20 Z"
        />
      </svg>
    </div>
  );
}
