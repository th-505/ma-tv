const http = require('http');
const https = require('https');

// Helper to make fast HTTP/HTTPS requests with timeout
async function testUrl(url, options = {}) {
  const timeoutMs = options.timeoutMs || 5000;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(options.headers || {})
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    const contentType = res.headers.get('content-type') || '';
    const cors = res.headers.get('access-control-allow-origin') || 'none';

    return {
      url,
      status: res.status,
      statusText: res.statusText,
      latency,
      contentType,
      cors,
      ok: res.ok,
    };
  } catch (err) {
    const latency = Date.now() - start;
    return {
      url,
      status: 0,
      statusText: err.name === 'AbortError' ? 'TIMEOUT' : (err.message || 'ERROR'),
      latency,
      contentType: '',
      cors: 'none',
      ok: false,
    };
  }
}

async function runFullAudit() {
  console.log('=== STARTING FULL QA AUTOMATION AUDIT ===\n');

  // 1. Audit Localhost 5173
  console.log('--- 1. Testing Localhost:5173 Web App ---');
  const appRoot = await testUrl('http://localhost:5173/');
  console.log(`[Root App] Status: ${appRoot.status} (${appRoot.latency}ms) - Content-Type: ${appRoot.contentType}`);

  // 2. Sample testing across all 6 requested categories
  console.log('\n--- 2. Testing Sample Streams across 6 Categories ---');

  const samples = {
    arabic: [
      { name: 'أكوام (Akwam MP4)', url: 'https://stream.akwam.link/video/al-ikhtiyar-s01e01/1080p.mp4' },
      { name: 'فاصل إعلاني (FaselHD HLS)', url: 'https://stream.faselhd.club/hls/el-haramy-s01e01/master.m3u8' },
      { name: 'وي سيما (WeCima)', url: 'https://v.wecima.show/watch/welad-rizk-3/master.mp4' },
      { name: 'عرب سيد (ArabSeed)', url: 'https://stream.arabseed.show/hls/al-baab-al-maftooh/master.m3u8' },
      { name: 'إيجي ديد (EgyDead)', url: 'https://stream.egydead.live/hls/parafan-s01e01/index.m3u8' },
      { name: 'ماي سيما (MyCima)', url: 'https://stream.mycima.tv/vod/hamel-al-laqab/master.m3u8' }
    ],
    foreign: [
      { name: 'VidSrc VOD Embed', url: 'https://vidsrc.su/embed/movie/550' },
      { name: 'SuperStream VOD Embed', url: 'https://superstream.su/embed/movie/550' },
      { name: '2Embed VOD Embed', url: 'https://www.2embed.cc/embed/550' },
      { name: 'SmashyStream VOD Embed', url: 'https://embed.smashystream.com/playere.php?tmdb=550' },
      { name: 'Consumet API Gateway', url: 'https://api.consumet.org/' },
      { name: 'Consumet Moe Gateway', url: 'https://consumet.moe/' }
    ],
    sports: [
      { name: 'beIN Sports 1 HD', url: 'https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8' },
      { name: 'beIN Sports News HD', url: 'https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8' },
      { name: 'الكأس 1 HD (Al Kass 1)', url: 'https://live.alkassdigital.net/alkass/one/index.m3u8' },
      { name: 'الكأس 2 HD (Al Kass 2)', url: 'https://live.alkassdigital.net/alkass/two/index.m3u8' },
      { name: 'أبوظبي الرياضية 1 (AD Sports 1)', url: 'https://admdn1.cdn.mangomolo.com/adsports1/smil:adsports1.smil/playlist.m3u8' },
      { name: 'دبي الرياضية 1 (Dubai Sports 1)', url: 'https://dmitv.cdn.mangomolo.com/dubaisports/smil:dubaisports.smil/playlist.m3u8' },
      { name: 'الرياضية المغربية (Arryadia TNT)', url: 'https://arryadia.snrt.ma/live/hls/live.m3u8' }
    ],
    live_tv: [
      { name: 'الجزيرة الإخبارية (Al Jazeera)', url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8' },
      { name: 'العربية الحدث (Al Hadath)', url: 'https://mbc-live.akamaized.net/hls/live/2041285/alhadath/master.m3u8' },
      { name: 'تلفزيون دبي (Dubai TV)', url: 'https://dmitv.cdn.mangomolo.com/dubaitv/smil:dubaitv.smil/playlist.m3u8' },
      { name: 'فرانس 24 عربي (France 24 AR)', url: 'https://f24hls-i.akamaihd.net/hls/live/221193/F24_AR_1400/master.m3u8' },
      { name: 'روسيا اليوم (RT Arabic)', url: 'https://rt-ara.rttv.com/live/rtara/playlist.m3u8' },
      { name: 'بي بي سي عربي (BBC Arabic)', url: 'https://vs-hls-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_arabic_tv/pc_hd_abr_v2.mpd' }
    ],
    anime: [
      { name: 'GogoAnime CDN Stream', url: 'https://stream.anitaku.to/hls/naruto/master.m3u8' },
      { name: 'HiAnime Zoro Stream', url: 'https://stream.hianime.to/hls/one-piece/index.m3u8' },
      { name: 'Anime4Up CDN Stream', url: 'https://stream.anime4up.com/hls/attack-on-titan/index.m3u8' },
      { name: 'WitAnime CDN Stream', url: 'https://stream.witanime.com/hls/jujutsu-kaisen/master.m3u8' },
      { name: 'DramaCool Asian HLS', url: 'https://stream.dramacool.ch/hls/squid-game/index.m3u8' }
    ],
    classic_egyptian: [
      { name: 'موقع بكرة (Bokra Classic)', url: 'https://stream.bokra.net/video/bab-al-hawa/1080p.mp4' },
      { name: 'فرفش بلس (Farfesh Plus)', url: 'https://stream.farfeshplus.online/hls/layali-el-helmeya/master.m3u8' },
      { name: 'بانيت مسلسلات (Panet Series)', url: 'https://stream.panet.co.il/hls/raafat-al-haggan/index.m3u8' },
      { name: 'دار داركم (DarDarkom Archive)', url: 'https://stream.dardarkom.link/hls/classic-movie/master.m3u8' },
      { name: 'علوي تي في (AlooyTV)', url: 'https://stream.alooytv.com/hls/khaleeji-series/master.m3u8' }
    ]
  };

  const results = {};

  for (const [category, items] of Object.entries(samples)) {
    console.log(`\nTesting Category: [${category}] (${items.length} samples)`);
    results[category] = [];
    for (const item of items) {
      const res = await testUrl(item.url, { timeoutMs: 6000 });
      results[category].push({
        ...item,
        status: res.status,
        statusText: res.statusText,
        latency: res.latency,
        contentType: res.contentType,
        cors: res.cors,
        ok: res.ok,
      });
      console.log(`  - [${item.name}] => HTTP ${res.status} | Latency: ${res.latency}ms | Type: ${res.contentType.slice(0, 30)} | CORS: ${res.cors}`);
    }
  }

  // 3. Testing Public Proxy Relay and Local Proxy endpoints
  console.log('\n--- 3. Testing Proxy Relays ---');
  const testTarget = 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8';
  const corsProxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(testTarget)}`;
  const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(testTarget)}`;

  const proxyRes1 = await testUrl(corsProxyUrl, { timeoutMs: 5000 });
  console.log(`  - [corsproxy.io] => HTTP ${proxyRes1.status} (${proxyRes1.latency}ms) | CORS: ${proxyRes1.cors}`);

  const proxyRes2 = await testUrl(allOriginsUrl, { timeoutMs: 5000 });
  console.log(`  - [allorigins.win] => HTTP ${proxyRes2.status} (${proxyRes2.latency}ms) | CORS: ${proxyRes2.cors}`);

  // Summary JSON
  console.log('\n=== AUDIT RUN COMPLETED SUCCESSFULLY ===');
}

runFullAudit().catch(console.error);
