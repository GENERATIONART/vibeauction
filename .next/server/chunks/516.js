"use strict";exports.id=516,exports.ids=[516],exports.modules={77516:(e,t,i)=>{i.d(t,{ED:()=>K,M7:()=>H,NR:()=>N,y0:()=>Y,vT:()=>q,pH:()=>J,iN:()=>O,TC:()=>R});var n=i(93977),a=i(49411),r=i(37857);function o(){return{balance:0,activeBids:[],vaultItems:[],walletLog:[],confessions:[],mintedVibes:[],processedStripeSessions:{}}}async function s({name:e,category:t,manifesto:i}){let n=process.env.FAL_KEY;if(!n)return null;let a=[`Surreal abstract artwork representing "${e}"`,t?`a ${t} vibe`:null,i?i.slice(0,100):null,"Bold graphic design, dreamlike quality, editorial art style, vivid colors, no text, no words"].filter(Boolean).join(". ");try{let e=new AbortController,t=setTimeout(()=>e.abort(),2e4),i=await fetch("https://fal.run/fal-ai/flux/schnell",{method:"POST",headers:{Authorization:`Key ${n}`,"Content-Type":"application/json"},body:JSON.stringify({prompt:a,image_size:"landscape_4_3",num_images:1,num_inference_steps:4,enable_safety_checker:!0}),signal:e.signal});if(clearTimeout(t),!i.ok){let e=await i.text().catch(()=>"");return console.error(`[generate-image] fal.ai error ${i.status}:`,e),null}let r=await i.json(),o=r?.images?.[0]?.url??null;return o||console.error("[generate-image] fal.ai returned no image URL:",JSON.stringify(r)),o}catch(e){return console.error("[generate-image] fetch failed:",e?.message??e),null}}var l=i(82591);let u=process.env.EMAIL_FROM||"Vibe Auction <noreply@vibeauction.co>",d=(process.env.NEXT_PUBLIC_APP_URL||process.env.APP_URL||"https://vibeauction.co").replace(/\/$/,"");async function c(e){let t=function(){let e="https://wjvxgcitsjytxsjatwrk.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;return e&&t?(0,r.eI)(e,t,{auth:{persistSession:!1}}):null}();if(!t||!e)return null;try{let{data:i}=await t.auth.admin.getUserById(e);return i?.user?.email??null}catch{return null}}async function m({to:e,subject:t,html:i}){let n=function(){let e=process.env.RESEND_API_KEY;return e?new l.R(e):null}();if(n&&e)try{await n.emails.send({from:u,to:e,subject:t,html:i})}catch(e){console.error("[email] send failed:",e?.message)}}function p(e){return`<!DOCTYPE html>
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
        <tr><td style="padding-top:32px;">${e}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding-top:40px;border-top:1px solid #222222;margin-top:40px;">
            <p style="color:#555555;font-size:12px;margin:0;">
              You're receiving this because you have an active auction on
              <a href="${d}" style="color:#C8FF00;text-decoration:none;">Vibe Auction</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`}function f(e,t="#C8FF00",i="#000000"){return`<span style="display:inline-block;background:${t};color:${i};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:99px;">${e}</span>`}function g(e,t){return`<a href="${t}" style="display:inline-block;background:#C8FF00;color:#000000;font-weight:900;font-size:16px;text-transform:uppercase;letter-spacing:1px;padding:16px 32px;border-radius:4px;text-decoration:none;margin-top:24px;">${e}</a>`}function b({emoji:e,title:t,amountLabel:i,amount:n}){return`
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:2px solid #222222;border-radius:8px;padding:20px;margin:24px 0;">
    <tr>
      <td>
        <div style="font-size:40px;line-height:1;margin-bottom:12px;">${e||"✨"}</div>
        <div style="font-size:22px;font-weight:900;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.5px;line-height:1.2;margin-bottom:12px;">${t}</div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#555555;margin-bottom:4px;">${i}</div>
        <div style="font-size:32px;font-weight:900;color:#C8FF00;line-height:1;">${Number(n||0).toLocaleString()} <span style="font-size:16px;">AURA</span></div>
      </td>
    </tr>
  </table>`}async function h({toUserId:e,vibeName:t,vibeEmoji:i,vibeSlug:n,newAmount:a}){let r=await c(e);if(!r)return;let o=p(`
    ${f("⚡ You've Been Outbid","#FF4400","#FFFFFF")}
    <h1 style="font-size:32px;font-weight:900;margin:20px 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.1;">
      Someone just stomped your bid
    </h1>
    <p style="color:#888888;font-size:16px;margin:0 0 4px;">
      Another bidder has taken the lead. Don't let them have it.
    </p>
    ${b({emoji:i,title:t,amountLabel:"New highest bid",amount:a})}
    <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0;">
      You have until the auction ends to reclaim your spot at the top.
      Every second counts — vibes wait for no one.
    </p>
    ${g("\uD83D\uDD25 Bid Again Now",`${d}/auction/${n}`)}
  `);await m({to:r,subject:`⚡ You've been outbid on "${t}"`,html:o})}async function y({toUserId:e,vibeName:t,vibeEmoji:i,vibeSlug:n,bidAmount:a,bidderHandle:r}){let o=await c(e);if(!o)return;let s=p(`
    ${f("\uD83D\uDCB8 Your Vibe Got a Bid","#C8FF00","#000000")}
    <h1 style="font-size:32px;font-weight:900;margin:20px 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.1;">
      People are fighting over your vibe
    </h1>
    <p style="color:#888888;font-size:16px;margin:0 0 4px;">
      ${r?`<strong style="color:#C8FF00;">${r}</strong> just`:"Someone just"} placed a bid on your listing.
    </p>
    ${b({emoji:i,title:t,amountLabel:"Bid placed",amount:a})}
    <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0;">
      The auction is live and heating up. Watch the action or sit back — either way, your vibe is having a moment.
    </p>
    ${g("\uD83D\uDC40 Watch the Auction",`${d}/auction/${n}`)}
  `);await m({to:o,subject:`💸 "${t}" just got a bid!`,html:s})}async function w({toUserId:e,vibeName:t,vibeEmoji:i,vibeSlug:n,finalAmount:a}){let r=await c(e);if(!r)return;let o=p(`
    ${f("\uD83C\uDFC6 You Won the Auction","#C8FF00","#000000")}
    <h1 style="font-size:36px;font-weight:900;margin:20px 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.1;">
      It's officially yours.
    </h1>
    <p style="color:#888888;font-size:16px;margin:0 0 4px;">
      You fought for it and won. This vibe now lives in your Vault forever.
    </p>
    ${b({emoji:i,title:t,amountLabel:"Winning bid",amount:a})}
    <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0;">
      Truly iconic. Not everyone gets to own a piece of the intangible — but you do now.
      Head to your Vault to see your collection.
    </p>
    ${g("✨ View Your Vault",`${d}/vault`)}
    <p style="margin-top:20px;color:#555555;font-size:13px;">
      Winning bid: <strong style="color:#C8FF00;">${Number(a||0).toLocaleString()} AURA</strong>
    </p>
  `);await m({to:r,subject:`🏆 You won "${t}"!`,html:o})}async function _({toUserId:e,vibeName:t,vibeEmoji:i,vibeSlug:n,startingPrice:a}){let r=await c(e);if(!r)return;let o=p(`
    ${f("✅ Your Vibe is Live","#00FF88","#000000")}
    <h1 style="font-size:32px;font-weight:900;margin:20px 0 8px;text-transform:uppercase;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.1;">
      Your vibe just dropped
    </h1>
    <p style="color:#888888;font-size:16px;margin:0 0 4px;">
      It's on the market. Bidders can see it. The auction has started.
    </p>
    ${b({emoji:i,title:t,amountLabel:"Starting bid",amount:a})}
    <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0;">
      Share the link to get the bidding war started. The more eyes on it, the higher it goes.
    </p>
    ${g("\uD83D\uDD17 Share Your Auction",`${d}/auction/${n}`)}
  `);await m({to:r,subject:`✅ "${t}" is now live on Vibe Auction`,html:o})}let v=a.join(process.cwd(),"data"),x=a.join(v,"vibe-store.json"),A=Promise.resolve(),F=e=>String(e||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""),$=(e,t=1e3)=>"string"==typeof e?e.trim().slice(0,t):"",S=(e,t=0)=>{if("number"==typeof e&&Number.isFinite(e))return e;if("string"==typeof e){let i=Number(e.replace(/,/g,"").trim());return Number.isFinite(i)?i:t}return t},j=e=>{let t=e.getDate(),i=e.toLocaleString("en-US",{month:"short"});return`${t} ${i}`};function I(){let e="https://wjvxgcitsjytxsjatwrk.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdnhnY2l0c2p5dHhzamF0d3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjQ0MjAsImV4cCI6MjA4ODY0MDQyMH0.8K1Rrwm8hpmNm6IvsK0yN8ROLu5W_QvIZX35sG1r1qs";return e&&t?(0,r.eI)(e,t,{auth:{persistSession:!1}}):null}async function D(){let e=I();if(!e)return null;let{data:t,error:i}=await e.from("vibes").select("*").order("created_at",{ascending:!1}).limit(100);return i?null:t.map(e=>({id:e.id,slug:e.slug,name:e.name,category:e.category,emoji:e.emoji,manifesto:e.manifesto,duration:e.duration,startingPrice:e.starting_price,buyNowPrice:e.buy_now_price??null,imageUrl:e.image_url??null,isAnonymous:e.is_anonymous,author:e.author,listedBy:e.listed_by??e.author,createdAt:e.created_at,endTime:e.end_time??null}))}async function B(e){let t=I();if(!t)return null;let{data:i,error:n}=await t.from("vibes").select("*").eq("slug",e).single();return n||!i?null:{id:i.id,slug:i.slug,name:i.name,category:i.category,emoji:i.emoji,manifesto:i.manifesto,duration:i.duration,startingPrice:i.starting_price,buyNowPrice:i.buy_now_price??null,imageUrl:i.image_url??null,isAnonymous:i.is_anonymous,author:i.author,listedBy:i.listed_by??i.author,createdAt:i.created_at,endTime:i.end_time??null}}async function N(e,t=10){let i=I();if(!i||!e)return{bids:[],topBid:null};let[{data:n,error:a},{data:r,error:o}]=await Promise.all([i.from("vibe_bids").select("amount, user_id, created_at").eq("vibe_id",e).order("created_at",{ascending:!1}).limit(t),i.from("vibe_bids").select("amount, user_id, created_at").eq("vibe_id",e).order("amount",{ascending:!1}).order("created_at",{ascending:!1}).limit(1)]);if(a||o)return{bids:[],topBid:null};let s=Array.isArray(n)?n:[],l=r?.[0]??null,u=[...new Set([...s.map(e=>e.user_id),l?.user_id].filter(Boolean))],d={};if(u.length>0){let{data:e}=await i.from("profiles").select("id, username").in("id",u);for(let t of e||[])d[t.id]=t.username}let c=e=>({id:`${e.user_id}-${e.created_at}`,user:d[e.user_id]?`@${d[e.user_id]}`:"Anonymous",amount:e.amount,createdAt:e.created_at,time:new Date(e.created_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})});return{bids:s.map(c),topBid:l?c(l):null}}async function U(){let e=I();if(!e)return null;let{data:t,error:i}=await e.from("vibe_bids").select("vibe_id, vibe_name, amount").order("amount",{ascending:!1});if(i||!t)return null;let n=new Map;for(let e of t)n.has(e.vibe_id)||n.set(e.vibe_id,{id:e.vibe_id,name:e.vibe_name,amount:e.amount,status:"HIGHEST"});return Array.from(n.values())}async function V(e,t){let i=I();if(!i||!e)return{inserted:!1,reason:"missing_supabase_or_user"};let{error:n}=await i.from("vault_items").insert({id:t.id,user_id:e,name:t.name,emoji:t.emoji,category:t.category,rarity:t.rarity,price:t.price,won_date:t.wonDate,image_url:t.imageUrl??null,original_author:t.originalAuthor??null});return n?"23505"===n.code?{inserted:!1,reason:"already_owned"}:{inserted:!1,reason:"vault_insert_failed"}:{inserted:!0,reason:"inserted"}}async function C(e,t){let i=I(),n=Math.max(0,Math.abs(S(t)));if(!i||!e)return!1;if(0===n)return!0;let{data:a,error:r}=await i.from("profiles").select("aura_balance").eq("id",e).single();if(r)return!1;let o=S(a?.aura_balance,0);if(o<n)return!1;let{error:s}=await i.from("profiles").update({aura_balance:o-n}).eq("id",e);return!s}async function z(e){let t=I();if(!t)return!1;let i=e.endTime?new Date(e.endTime).toISOString():new Date(Date.now()+function(e){if("string"!=typeof e)return 864e5;let t=0,i=e.match(/(\d+)\s*d/i),n=e.match(/(\d+)\s*h/i),a=e.match(/(\d+)\s*m/i);return i&&(t+=864e5*Number(i[1])),n&&(t+=36e5*Number(n[1])),a&&(t+=6e4*Number(a[1])),0===t&&(t=864e5),t}(e.duration)).toISOString(),{error:n}=await t.from("vibes").insert({id:e.id,slug:e.slug,name:e.name,category:e.category,emoji:e.emoji,manifesto:e.manifesto,duration:e.duration,starting_price:e.startingPrice,buy_now_price:e.buyNowPrice??null,image_url:e.imageUrl??null,is_anonymous:e.isAnonymous,author:e.author,listed_by:e.listedBy??e.author,created_at:e.createdAt,end_time:i});return!n}async function L(){try{await n.mkdir(v,{recursive:!0});let e=await n.readFile(x,"utf8");return JSON.parse(e)}catch{return null}}async function P(e){try{return await n.mkdir(v,{recursive:!0}),await n.writeFile(x,JSON.stringify(e,null,2),"utf8"),!0}catch{return!1}}function k(e){let t=o();return e&&"object"==typeof e?{...t,...e,balance:S(e.balance,t.balance),activeBids:Array.isArray(e.activeBids)?e.activeBids:t.activeBids,vaultItems:Array.isArray(e.vaultItems)?e.vaultItems:t.vaultItems,walletLog:Array.isArray(e.walletLog)?e.walletLog:t.walletLog,confessions:Array.isArray(e.confessions)?e.confessions:t.confessions,mintedVibes:Array.isArray(e.mintedVibes)?e.mintedVibes:t.mintedVibes,processedStripeSessions:e.processedStripeSessions&&"object"==typeof e.processedStripeSessions?e.processedStripeSessions:t.processedStripeSessions}:t}async function E(){let e=await L();return e?k({...e,mintedVibes:[]}):o()}function T(e){let t=A.then(e,e);return A=t.then(()=>void 0,()=>void 0),t}function Y(){return T(async()=>{let[e,t,i]=await Promise.all([E(),D(),U()]),n=null!==t?t:Array.isArray(e.mintedVibes)?e.mintedVibes:[],a=Array.isArray(e.activeBids)?e.activeBids:[];if(i&&i.length>0){let e=new Set(i.map(e=>e.id));a=[...i,...a.filter(t=>!e.has(F(t.id||t.name)))]}return{state:k({...e,mintedVibes:n,activeBids:a})}})}function M(e){return T(async()=>{let t=await L(),i=structuredClone(t?k(t):o()),n=await e(i)||{},a=k(n.state||i);return await P(a),{...n,state:a}})}async function O(e,t){let i=F(e?.id||e?.name),n=S(e?.amount),a=null,r=null;if(i&&n>0){let o=I();if(o){let{data:s}=await o.from("vibe_bids").select("user_id, amount").eq("vibe_id",i).order("amount",{ascending:!1}).order("created_at",{ascending:!1}).limit(1),l=s?.[0],u=S(l?.amount,0);if(n<=u&&(r=u+1),t){let{data:s}=await o.auth.getUser(t);if((a=s?.user?.id??null)&&null===r){let{data:t}=await o.from("profiles").select("username").eq("id",a).single(),r=t?.username?`@${t.username}`:null;await o.from("vibe_bids").insert({id:`bid-${i}-${Date.now()}`,user_id:a,vibe_id:i,vibe_name:e?.name||"Unknown Vibe",amount:n});let{data:s}=await o.from("vibes").select("slug, emoji, listed_by, author").eq("slug",i).single(),u=s?.slug??i,d=s?.emoji??e?.emoji??"✨",c={vibeName:e?.name||"Unknown Vibe",vibeEmoji:d,vibeSlug:u};l?.user_id&&l.user_id!==a&&h({toUserId:l.user_id,...c,newAmount:n}).catch(()=>{});let m=s?.listed_by??null;m&&m!==a&&y({toUserId:m,...c,bidAmount:n,bidderHandle:r}).catch(()=>{})}}}}return M(t=>{if(!i||n<=0)return{state:t,accepted:!1};let a=t.activeBids.findIndex(e=>F(e.id||e.name)===i),o=Math.max(a>=0?S(t.activeBids[a]?.amount,0):0,r?r-1:0);if(n<=o)return{state:t,accepted:!1,reason:"bid_too_low",minimumBid:o+1};let s={id:i,emoji:e?.emoji||"✨",name:e?.name||"Unknown Vibe",amount:n,status:"HIGHEST",updatedAt:Date.now()};return -1===a?t.activeBids=[s,...t.activeBids]:t.activeBids[a]={...t.activeBids[a],...s},{state:t,accepted:!0}})}async function R(e,t){let i=F(e?.id||e?.name);if(!i)return{settled:!1};let n=e?.directPurchase===!0,a=S(e?.price),r=Date.now(),o=e?.wonDate||j(new Date(r)),s=e?.category||"Social",l=e?.rarity||"epic",u={id:`vault-${i}`,name:e?.name||"Unknown Vibe",emoji:e?.emoji||"✨",category:s,rarity:l,wonDate:o,price:a,imageUrl:e?.imageUrl??null,originalAuthor:e?.author??null},d=null;if(t){let e=I();if(e){let{data:i}=await e.auth.getUser(t);d=i?.user?.id??null}}if(d){if(!n){let e=I();if(e){let{data:t}=await e.from("vibe_bids").select("user_id").eq("vibe_id",i).order("amount",{ascending:!1}).order("created_at",{ascending:!1}).limit(1),n=t?.[0]?.user_id??null;if(!n)return{settled:!1,reason:"no_winning_bid"};if(n!==d)return{settled:!1,reason:"not_highest_bidder"}}}if(a>0){let e=I();if(e){let{data:t}=await e.from("profiles").select("aura_balance").eq("id",d).single();if(S(t?.aura_balance,0)<Math.abs(a))return{settled:!1,reason:"insufficient_balance"}}}let t=await V(d,u);return t.inserted?await C(d,a)?(w({toUserId:d,vibeName:e?.name||"Unknown Vibe",vibeEmoji:e?.emoji||"✨",vibeSlug:i,finalAmount:a}).catch(()=>{}),M(e=>(e.activeBids=e.activeBids.filter(e=>F(e.id||e.name)!==i),{state:e,settled:!0}))):{settled:!1,reason:"balance_update_failed"}:{settled:!1,reason:t.reason||"vault_insert_failed"}}return M(e=>{if(e.vaultItems.some(e=>F(e.id||e.name)===i))return{state:e,settled:!1};let t=Math.abs(a),n=S(e.balance);if(t>0&&n<t)return{state:e,settled:!1,reason:"insufficient_balance"};let o={id:`tx-won-${i}-${r}`,label:`WON: "${u.name}"`,amount:-Math.abs(a),createdAt:r};return e.balance=n-t,e.vaultItems=[u,...e.vaultItems],e.activeBids=e.activeBids.filter(e=>F(e.id||e.name)!==i),e.walletLog=[o,...e.walletLog],{state:e,settled:!0}})}function q(e){return M(t=>{let i=$(e?.confession||e?.text);if(!i)return{state:t,mintedConfession:null};let n=$(e?.title),a=e?.isAnonymous!==!1,r=$(e?.alias||e?.author),o=Date.now(),s=i.split(/\s+/).slice(0,6).join(" "),l=n||s||"Untitled Confession",u=F(`${l}-${o}`)||`confession-${o}`,d={id:`conf-${u}`,title:l,confession:i,isAnonymous:a,author:a?"Anonymous":r||"@VibeMinter",createdAt:o};return t.confessions=[d,...t.confessions].slice(0,100),{state:t,mintedConfession:d}})}async function J(e,t=null){let i=$(e?.name||e?.title,100),n=$(e?.category,50)||"Feelings",a=$(e?.emoji,10)||"✨",r=$(e?.manifesto||e?.description||e?.details,2e3),l=$(e?.duration,50)||"24 Hours",u=Math.max(0,S(e?.startingPrice||e?.price)),d=S(e?.buyNowPrice),c=Date.now(),m=i||"Untitled Vibe",p=F(`${m}-${n}-${c}`)||`vibe-${c}`,f=await s({name:m,category:n,manifesto:r}),g={id:`mint-${p}`,slug:p,name:m,category:n,emoji:a,manifesto:r,duration:l,startingPrice:u,buyNowPrice:d>0?d:null,imageUrl:f,isAnonymous:e?.isAnonymous===!0,author:$(e?.author||e?.alias)||null,listedBy:$(e?.listedBy||e?.author||e?.alias)||null,createdAt:c},b=await z(g),h=k(await L()||o());h.mintedVibes=[g,...h.mintedVibes].slice(0,100),await P(h);let y=b?await D().then(e=>e||h.mintedVibes):h.mintedVibes,w=k({...h,mintedVibes:y});if(t){let e=I();e&&e.auth.getUser(t).then(({data:e})=>{let t=e?.user?.id;t&&_({toUserId:t,vibeName:g.name,vibeEmoji:g.emoji,vibeSlug:g.slug,startingPrice:g.startingPrice}).catch(()=>{})}).catch(()=>{})}return{state:w,mintedVibe:g}}async function H(e){let t=await B(e);if(t)return t;let{state:i}=await Y();return(i.mintedVibes??[]).find(t=>t.slug===e)??null}function K({sessionId:e,auraAmount:t,label:i}){return M(n=>{let a=$(e),r=Math.max(0,S(t));if(!a||r<=0)return{state:n,credited:!1,reason:"invalid_payload"};if(n.processedStripeSessions&&"object"==typeof n.processedStripeSessions||(n.processedStripeSessions={}),n.processedStripeSessions[a])return{state:n,credited:!1,reason:"already_processed"};let o=Date.now(),s={id:`tx-stripe-${a}`,label:$(i)||"Stripe Top Up",amount:r,createdAt:o};return n.balance=S(n.balance)+r,n.walletLog=[s,...n.walletLog],n.processedStripeSessions[a]={auraAmount:r,creditedAt:o},{state:n,credited:!0,reason:"credited"}})}}};