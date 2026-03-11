import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const FROM = process.env.EMAIL_FROM || 'Vibe Auction <noreply@vibeauction.co>';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://vibeauction.co').replace(/\/$/, '');

async function getEmailForUser(userId) {
  const sb = getSupabaseAdmin();
  if (!sb || !userId) return null;
  try {
    const { data } = await sb.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

async function send({ to, subject, html }) {
  const resend = getResend();
  if (!resend || !to) return;
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[email] send failed:', err?.message);
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

function base(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Vibe Auction</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Helvetica Neue',Arial,sans-serif;color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Logo -->
        <tr>
          <td style="padding-bottom:32px;border-bottom:2px solid #C8FF00;">
            <span style="font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#C8FF00;">
              VIBE AUCTION
            </span>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding-top:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding-top:40px;border-top:1px solid #222222;margin-top:40px;">
            <p style="color:#555555;font-size:12px;margin:0;">
              You're receiving this because you have an active auction on
              <a href="${APP_URL}" style="color:#C8FF00;text-decoration:none;">Vibe Auction</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function pill(text, color = '#C8FF00', textColor = '#000000') {
  return `<span style="display:inline-block;background:${color};color:${textColor};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:99px;">${text}</span>`;
}

function cta(label, url) {
  return `<a href="${url}" style="display:inline-block;background:#C8FF00;color:#000000;font-weight:900;font-size:16px;text-transform:uppercase;letter-spacing:1px;padding:16px 32px;border-radius:4px;text-decoration:none;margin-top:24px;">${label}</a>`;
}

function vibeCard({ emoji, title, amountLabel, amount }) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:2px solid #222222;border-radius:8px;padding:20px;margin:24px 0;">
    <tr>
      <td>
        <div style="font-size:40px;line-height:1;margin-bottom:12px;">${emoji || '✨'}</div>
        <div style="font-size:22px;font-weight:900;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.5px;line-height:1.2;margin-bottom:12px;">${title}</div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555555;margin-bottom:4px;">${amountLabel}</div>
        <div style="font-size:32px;font-weight:900;color:#C8FF00;line-height:1;">${Number(amount || 0).toLocaleString()} <span style="font-size:16px;">AURA</span></div>
      </td>
    </tr>
  </table>`;
}

// ─── Email types ─────────────────────────────────────────────────────────────

export async function sendOutbidEmail({ toUserId, vibeName, vibeEmoji, vibeSlug, newAmount }) {
  const to = await getEmailForUser(toUserId);
  if (!to) return;

  const html = base(`
    ${pill('⚡ You\'ve Been Outbid', '#FF4400', '#FFFFFF')}
    <h1 style="font-size:32px;font-weight:900;margin:20px 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.1;">
      Someone just stomped your bid
    </h1>
    <p style="color:#888888;font-size:16px;margin:0 0 4px;">
      Another bidder has taken the lead. Don't let them have it.
    </p>
    ${vibeCard({ emoji: vibeEmoji, title: vibeName, amountLabel: 'New highest bid', amount: newAmount })}
    <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0;">
      You have until the auction ends to reclaim your spot at the top.
      Every second counts — vibes wait for no one.
    </p>
    ${cta('🔥 Bid Again Now', `${APP_URL}/auction/${vibeSlug}`)}
  `);

  await send({ to, subject: `⚡ You've been outbid on "${vibeName}"`, html });
}

export async function sendNewBidOnYourVibeEmail({ toUserId, vibeName, vibeEmoji, vibeSlug, bidAmount, bidderHandle }) {
  const to = await getEmailForUser(toUserId);
  if (!to) return;

  const html = base(`
    ${pill('💸 Your Vibe Got a Bid', '#C8FF00', '#000000')}
    <h1 style="font-size:32px;font-weight:900;margin:20px 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.1;">
      People are fighting over your vibe
    </h1>
    <p style="color:#888888;font-size:16px;margin:0 0 4px;">
      ${bidderHandle ? `<strong style="color:#C8FF00;">${bidderHandle}</strong> just` : 'Someone just'} placed a bid on your listing.
    </p>
    ${vibeCard({ emoji: vibeEmoji, title: vibeName, amountLabel: 'Bid placed', amount: bidAmount })}
    <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0;">
      The auction is live and heating up. Watch the action or sit back — either way, your vibe is having a moment.
    </p>
    ${cta('👀 Watch the Auction', `${APP_URL}/auction/${vibeSlug}`)}
  `);

  await send({ to, subject: `💸 "${vibeName}" just got a bid!`, html });
}

export async function sendAuctionWonEmail({ toUserId, vibeName, vibeEmoji, vibeSlug, finalAmount }) {
  const to = await getEmailForUser(toUserId);
  if (!to) return;

  const html = base(`
    ${pill('🏆 You Won the Auction', '#C8FF00', '#000000')}
    <h1 style="font-size:36px;font-weight:900;margin:20px 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.1;">
      It's officially yours.
    </h1>
    <p style="color:#888888;font-size:16px;margin:0 0 4px;">
      You fought for it and won. This vibe now lives in your Vault forever.
    </p>
    ${vibeCard({ emoji: vibeEmoji, title: vibeName, amountLabel: 'Winning bid', amount: finalAmount })}
    <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0;">
      Truly iconic. Not everyone gets to own a piece of the intangible — but you do now.
      Head to your Vault to see your collection.
    </p>
    ${cta('✨ View Your Vault', `${APP_URL}/vault`)}
    <p style="margin-top:20px;color:#555555;font-size:13px;">
      Winning bid: <strong style="color:#C8FF00;">${Number(finalAmount || 0).toLocaleString()} AURA</strong>
    </p>
  `);

  await send({ to, subject: `🏆 You won "${vibeName}"!`, html });
}

export async function sendVibeListedEmail({ toUserId, vibeName, vibeEmoji, vibeSlug, startingPrice }) {
  const to = await getEmailForUser(toUserId);
  if (!to) return;

  const html = base(`
    ${pill('✅ Your Vibe is Live', '#00FF88', '#000000')}
    <h1 style="font-size:32px;font-weight:900;margin:20px 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.1;">
      Your vibe just dropped
    </h1>
    <p style="color:#888888;font-size:16px;margin:0 0 4px;">
      It's on the market. Bidders can see it. The auction has started.
    </p>
    ${vibeCard({ emoji: vibeEmoji, title: vibeName, amountLabel: 'Starting bid', amount: startingPrice })}
    <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0;">
      Share the link to get the bidding war started. The more eyes on it, the higher it goes.
    </p>
    ${cta('🔗 Share Your Auction', `${APP_URL}/auction/${vibeSlug}`)}
  `);

  await send({ to, subject: `✅ "${vibeName}" is now live on Vibe Auction`, html });
}
