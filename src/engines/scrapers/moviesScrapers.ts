import type { ScraperAgent } from "./ScraperAgent";
import { runAgentHealthCheck } from "./ScraperAgent";
import { scrapeDirectVideoStream } from "./DirectStreamScraper";

interface MovieSiteMeta {
  id: string;
  name: string;
  domain: string;
  badge: string;
  streamFormat: "m3u8" | "mp4";
  pattern: string;
  resolverPath: (q: string) => string;
}

const MOVIE_SITES: MovieSiteMeta[] = [
  { id: "akwam-scraper", name: "أكوام (Akwam)", domain: "https://akwam.to", badge: "مترجم ومدبلج", streamFormat: "mp4", pattern: `href=["'](https?://[^"']+\\.mp4)["']`, resolverPath: (q) => `https://akwam.to/search?q=${encodeURIComponent(q)}` },
  { id: "faselhd-scraper", name: "فاصل إعلاني (FaselHD)", domain: "https://www.faselhd.club", badge: "سيرفرات متعددة", streamFormat: "m3u8", pattern: `["']file["']\\s*:\\s*["']([^"']+\\.m3u8)["']`, resolverPath: (q) => `https://www.faselhd.club/?s=${encodeURIComponent(q)}` },
  { id: "wecima-scraper", name: "وي سيما (WeCima)", domain: "https://wecima.show", badge: "HD 1080p", streamFormat: "mp4", pattern: `source\\s+src=["'](https?://[^"']+\\.mp4)["']`, resolverPath: (q) => `https://wecima.show/search/${encodeURIComponent(q)}` },
  { id: "arabseed-scraper", name: "عرب سيد (ArabSeed)", domain: "https://arabseed.show", badge: "تحميل ومشاهدة", streamFormat: "m3u8", pattern: `["'](https?://[^"']+/hls/[^"']+\\.m3u8)["']`, resolverPath: (q) => `https://arabseed.show/find/?find=${encodeURIComponent(q)}` },
  { id: "cima4u-scraper", name: "سيما فور يو (Cima4U)", domain: "https://cima4u.skin", badge: "مترجم عربي", streamFormat: "mp4", pattern: `src=["'](https?://[^"']+\\.mp4)["']`, resolverPath: (q) => `https://cima4u.skin/?s=${encodeURIComponent(q)}` },
  { id: "egydead-scraper", name: "إيجي ديد (EgyDead)", domain: "https://egydead.live", badge: "رعب ومسلسلات", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://egydead.live/?s=${encodeURIComponent(q)}` },
  { id: "topcinema-scraper", name: "توب سينما (TopCinema)", domain: "https://topcinema.top", badge: "أفلام حديثة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://topcinema.top/?s=${encodeURIComponent(q)}` },
  { id: "cimanow-scraper", name: "سيما ناو (CimaNow)", domain: "https://cimanow.cc", badge: "سيرفرات سريعة", streamFormat: "m3u8", pattern: `file:\\s*["']([^"']+\\.m3u8)["']`, resolverPath: (q) => `https://cimanow.cc/?s=${encodeURIComponent(q)}` },
  { id: "shooflive-scraper", name: "شوف لايف (ShoofLive)", domain: "https://shooflive.cam", badge: "مسلسلات حصرية", streamFormat: "m3u8", pattern: `https?://[^"']+/master\\.m3u8`, resolverPath: (q) => `https://shooflive.cam/?s=${encodeURIComponent(q)}` },
  { id: "lodynet-scraper", name: "لودي نت (LodyNet)", domain: "https://lodynet.me", badge: "هندي وآسيوي", streamFormat: "mp4", pattern: `https?://[^"']+/video\\.mp4`, resolverPath: (q) => `https://lodynet.me/?s=${encodeURIComponent(q)}` },
  { id: "dramacafe-scraper", name: "دراما كافيه (DramaCafe)", domain: "https://dramacafe.to", badge: "دراما عربية", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://dramacafe.to/?s=${encodeURIComponent(q)}` },
  { id: "movizland-scraper", name: "موفيز لاند (Movizland)", domain: "https://movizland.online", badge: "مكتبة ضخمة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://movizland.online/?s=${encodeURIComponent(q)}` },
  { id: "shahid4u-scraper", name: "شاهد فور يو (Shahid4U)", domain: "https://shahid4u.party", badge: "مشاهدة أونلاين", streamFormat: "m3u8", pattern: `https?://[^"']+/playlist\\.m3u8`, resolverPath: (q) => `https://shahid4u.party/?s=${encodeURIComponent(q)}` },
  { id: "qissat-ishq-scraper", name: "قصة عشق (Qissat Ishq)", domain: "https://3sk.biz", badge: "تركي مترجم", streamFormat: "m3u8", pattern: `https?://[^"']+/live/hls/[^"']+\\.m3u8`, resolverPath: (q) => `https://3sk.biz/?s=${encodeURIComponent(q)}` },
  { id: "turksub-scraper", name: "تورك صب (TurkSub)", domain: "https://turksub.com", badge: "دراما تركية", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://turksub.com/?s=${encodeURIComponent(q)}` },
  { id: "cimaclub-scraper", name: "سيما كلوب (CimaClub)", domain: "https://cimaclub.vip", badge: "أفلام 2024", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://cimaclub.vip/?s=${encodeURIComponent(q)}` },
  { id: "egybest-scraper", name: "إيجي بست (EgyBest Core)", domain: "https://egybest.media", badge: "الأصلية", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://egybest.media/explore/?q=${encodeURIComponent(q)}` },
  { id: "mycima-scraper", name: "ماي سيما (MyCima New)", domain: "https://mycima.tv", badge: "سيرفرات فائقة", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://mycima.tv/search/${encodeURIComponent(q)}` },
  { id: "arabp2p-scraper", name: "عرب تورنت (ArabP2P)", domain: "https://arabp2p.net", badge: "تورنت مباشر", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://arabp2p.net/search?q=${encodeURIComponent(q)}` },
  { id: "cimacity-scraper", name: "سيما سيتي (CimaCity)", domain: "https://cimacity.com", badge: "HD Clean", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://cimacity.com/?s=${encodeURIComponent(q)}` },
  { id: "cimaflash-scraper", name: "سيما فلاش (CimaFlash)", domain: "https://cimaflash.top", badge: "بث سريع", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://cimaflash.top/?s=${encodeURIComponent(q)}` },
  { id: "dardarkom-scraper", name: "دار داركم (DarDarkom)", domain: "https://dardarkom.link", badge: "أرشيف نادر", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://dardarkom.link/?s=${encodeURIComponent(q)}` },
  { id: "halacima-scraper", name: "هلا سيما (HalaCima)", domain: "https://halacima.com", badge: "مترجم عربي", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://halacima.com/?s=${encodeURIComponent(q)}` },
  { id: "cimalight-scraper", name: "سيما لايت (CimaLight)", domain: "https://cimalight.online", badge: "خفيف للأجهزة", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://cimalight.online/?s=${encodeURIComponent(q)}` },
  { id: "alooytv-scraper", name: "علوي تي في (AlooyTV)", domain: "https://alooytv.com", badge: "خليجي ومغاربي", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://alooytv.com/?s=${encodeURIComponent(q)}` },
  { id: "cimastar-scraper", name: "سيما ستار (CimaStar)", domain: "https://cimastar.net", badge: "نجوم السينما", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://cimastar.net/?s=${encodeURIComponent(q)}` },
  { id: "moviztime-scraper", name: "موفيز تايم (MovizTime)", domain: "https://moviztime.com", badge: "سينما هوليوود", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://moviztime.com/?s=${encodeURIComponent(q)}` },
  { id: "cima4film-scraper", name: "سيما فور فيلم (Cima4Film)", domain: "https://cima4film.pro", badge: "أفلام كاملة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://cima4film.pro/?s=${encodeURIComponent(q)}` },
  { id: "drama2day-scraper", name: "دراما توداي (Drama2Day)", domain: "https://drama2day.to", badge: "مسلسلات اليوم", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://drama2day.to/?s=${encodeURIComponent(q)}` },
  { id: "series4u-scraper", name: "سيريز فور يو (Series4U)", domain: "https://series4u.net", badge: "مواسم كاملة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://series4u.net/?s=${encodeURIComponent(q)}` },
  { id: "panet-scraper", name: "بانيت مسلسلات (Panet)", domain: "https://panet.co.il", badge: "أرشيف كلاسيكي", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://panet.co.il/series/search?q=${encodeURIComponent(q)}` },
  { id: "bokra-scraper", name: "موقع بكرة (Bokra TV)", domain: "https://bokra.net", badge: "عربي مجاني", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://bokra.net/search/${encodeURIComponent(q)}` },
  { id: "farfesh-scraper", name: "فرفش بلس (Farfesh)", domain: "https://farfeshplus.online", badge: "مسلسلات رمضان", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://farfeshplus.online/?s=${encodeURIComponent(q)}` },
  { id: "cinemana-scraper", name: "سينمانا شبكتي (Cinemana)", domain: "https://cinemana.shabakkaty.com", badge: "سيرفرات العراق", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://cinemana.shabakkaty.com/search?keyword=${encodeURIComponent(q)}` },
  { id: "shahiid-hub-scraper", name: "شهيد هاب (Shahiid Hub)", domain: "https://shahiid.hub", badge: "أفلام ومسلسلات", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://shahiid.hub/?s=${encodeURIComponent(q)}` },
  { id: "mosalsalat-scraper", name: "مسلسلات أونلاين (Mosalsalat)", domain: "https://mosalsalat.net", badge: "حلقات كاملة", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://mosalsalat.net/?s=${encodeURIComponent(q)}` },
  { id: "yalladr-scraper", name: "يلا دراما (Yalla Drama)", domain: "https://yalladrama.com", badge: "سيرفرات سريعة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://yalladrama.com/?s=${encodeURIComponent(q)}` },
  { id: "arabtvd-scraper", name: "عرب تي في دراما (ArabTV)", domain: "https://arabtv.org", badge: "بث دراما", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://arabtv.org/?s=${encodeURIComponent(q)}` },
  { id: "movierr-scraper", name: "موفير (Movierr Arab)", domain: "https://movierr.org", badge: "مترجم بلوراي", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://movierr.org/?s=${encodeURIComponent(q)}` },
  { id: "blu-ray-ar-scraper", name: "بلوراي العرب (BluRay AR)", domain: "https://blurayar.com", badge: "4K UHD", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://blurayar.com/?s=${encodeURIComponent(q)}` },
  { id: "dramacool-ar-scraper", name: "دراما كول عربي (DramaCool AR)", domain: "https://dramacool.ar", badge: "آسيوي مترجم", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://dramacool.ar/?s=${encodeURIComponent(q)}` },
  { id: "netflix-mirror-scraper", name: "مرآة نتفلكس (NetMirror)", domain: "https://netmirror.app", badge: "أعمال أصلية", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://netmirror.app/search?q=${encodeURIComponent(q)}` },
  { id: "prime-mirror-scraper", name: "مرآة برايم (PrimeMirror)", domain: "https://primemirror.tv", badge: "برايم فيديو", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://primemirror.tv/search?q=${encodeURIComponent(q)}` },
  { id: "disney-mirror-scraper", name: "مرآة ديزني (DisneyMirror)", domain: "https://disneymirror.stream", badge: "مدبلج مصري وفصحى", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://disneymirror.stream/?s=${encodeURIComponent(q)}` },
  { id: "osn-mirror-scraper", name: "مرآة أو إس إن (OSN Mirror)", domain: "https://osnmirror.online", badge: "قنوات بريميوم", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://osnmirror.online/?s=${encodeURIComponent(q)}` },
  { id: "shahid-vip-mirror", name: "شاهد VIP ميرور (ShahidVIP)", domain: "https://shahidvip.stream", badge: "أعمال حصرية", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://shahidvip.stream/?s=${encodeURIComponent(q)}` },
  { id: "watchit-mirror", name: "ووتش إت ميرور (WatchIT)", domain: "https://watchitmirror.com", badge: "دراما مصرية", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://watchitmirror.com/?s=${encodeURIComponent(q)}` },
  { id: "starzplay-mirror", name: "ستارزبلاي ميرور (StarzPlay)", domain: "https://starzmirror.net", badge: "هوليوود ورياضة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://starzmirror.net/?s=${encodeURIComponent(q)}` },
  { id: "hbo-mirror-ar", name: "إتش بي أو ميرور (HBO Max AR)", domain: "https://hbomaxmirror.stream", badge: "4K مسلسلات", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://hbomaxmirror.stream/?s=${encodeURIComponent(q)}` },
  { id: "apple-tv-mirror", name: "آبل تي في ميرور (AppleTV+)", domain: "https://appletvmirror.com", badge: "أعمال مميزة", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://appletvmirror.com/?s=${encodeURIComponent(q)}` },
  { id: "streamio-core", name: "ستريميو كور (Stremio Core)", domain: "https://vidsrc.su", badge: "Torrent Stream", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://vidsrc.su/embed/movie/${q}` },
  { id: "cinemavilla-ar", name: "سينما فيلا (CinemaVilla)", domain: "https://cinemavilla.cc", badge: "مترجم بلوراي", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://cinemavilla.cc/?s=${encodeURIComponent(q)}` },
  { id: "cimatop-pro", name: "سيما توب برو (CimaTop Pro)", domain: "https://cimatop.pro", badge: "أفلام الأسبوع", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://cimatop.pro/?s=${encodeURIComponent(q)}` },
  { id: "egy4u-stream", name: "إيجي فور يو (Egy4U)", domain: "https://egy4u.cam", badge: "سيرفرات مباشرة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://egy4u.cam/?s=${encodeURIComponent(q)}` },
  { id: "fasel-pro", name: "فاصل برو (Fasel Pro)", domain: "https://faselpro.com", badge: "سيرفر VIP", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://faselpro.com/?s=${encodeURIComponent(q)}` },
  { id: "akwam-hd", name: "أكوام إتش دي (Akwam HD)", domain: "https://akwam.us", badge: "أكوام البديل", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://akwam.us/search?q=${encodeURIComponent(q)}` },
  { id: "cima4up-stream", name: "سيما فور أب (Cima4Up)", domain: "https://cima4up.tv", badge: "سريع وخفيف", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://cima4up.tv/?s=${encodeURIComponent(q)}` },
  { id: "egybest-vip", name: "إيجي بست VIP (EgyBest VIP)", domain: "https://egybest.vip", badge: "بدون إعلانات", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://egybest.vip/?s=${encodeURIComponent(q)}` },
  { id: "mycima-me", name: "وي سيما مي (WeCima Me)", domain: "https://wecima.me", badge: "سيرفر احتياطي", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://wecima.me/search/${encodeURIComponent(q)}` },
  { id: "arabseed-live", name: "عرب سيد لايف (ArabSeed Live)", domain: "https://arabseed.live", badge: "تحميل ومشاهدة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://arabseed.live/find/?find=${encodeURIComponent(q)}` },
  { id: "topcinema-vip", name: "توب سينما VIP (TopCinema)", domain: "https://topcinema.vip", badge: "جودة أصلية", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://topcinema.vip/?s=${encodeURIComponent(q)}` },
  { id: "shahid4u-pro", name: "شاهد فور يو برو (Shahid4U Pro)", domain: "https://shahid4u.pro", badge: "بث مباشر وسريع", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://shahid4u.pro/?s=${encodeURIComponent(q)}` },
  { id: "cimanow-vip", name: "سيما ناو VIP (CimaNow)", domain: "https://cimanow.vip", badge: "FHD سيرفر", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://cimanow.vip/?s=${encodeURIComponent(q)}` },
  { id: "shoof-max", name: "شوف ماكس (Shoof Max)", domain: "https://shoofmax.tv", badge: "خليجي وعربي", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://shoofmax.tv/?s=${encodeURIComponent(q)}` },
  { id: "lodynet-tv", name: "لودي نت تي في (LodyNet TV)", domain: "https://lodynet.tv", badge: "مدبلج هندي", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://lodynet.tv/?s=${encodeURIComponent(q)}` },
  { id: "3sk-tv", name: "قصة عشق تي في (3sk TV)", domain: "https://3sk.tv", badge: "تركي حصري", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://3sk.tv/?s=${encodeURIComponent(q)}` },
  { id: "turksub-pro", name: "تورك صب برو (TurkSub Pro)", domain: "https://turksub.pro", badge: "ترجمة فورية", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://turksub.pro/?s=${encodeURIComponent(q)}` },
  { id: "cimacity-pro", name: "سيما سيتي برو (CimaCity)", domain: "https://cimacity.vip", badge: "سينما العالم", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://cimacity.vip/?s=${encodeURIComponent(q)}` },
  { id: "halacima-hd", name: "هلا سيما HD (HalaCima)", domain: "https://halacima.org", badge: "سيرفر الخليج", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://halacima.org/?s=${encodeURIComponent(q)}` },
  { id: "dramacafe-vip", name: "دراما كافيه VIP (DramaCafe)", domain: "https://dramacafe.vip", badge: "رمضان 2024", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://dramacafe.vip/?s=${encodeURIComponent(q)}` },
  { id: "egydead-hd", name: "إيجي ديد HD (EgyDead)", domain: "https://egydead.online", badge: "سيرفر أوروبا", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://egydead.online/?s=${encodeURIComponent(q)}` },
  { id: "cima4u-pro", name: "سيما فور يو برو (Cima4U Pro)", domain: "https://cima4u.pro", badge: "مكتبة ضخمة", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://cima4u.pro/?s=${encodeURIComponent(q)}` },
  { id: "wecima-online", name: "وي سيما أونلاين (WeCima Online)", domain: "https://wecima.online", badge: "بث مباشر سريع", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://wecima.online/search/${encodeURIComponent(q)}` },
  { id: "faselhd-live", name: "فاصل لايف (Fasel Live)", domain: "https://faselhd.live", badge: "سيرفرات تركية وعربية", streamFormat: "m3u8", pattern: `https?://[^"']+\\.m3u8`, resolverPath: (q) => `https://faselhd.live/?s=${encodeURIComponent(q)}` },
  { id: "akwam-direct", name: "أكوام مباشر (Akwam Direct)", domain: "https://akwam.vip", badge: "تحميل وسحب مباشر", streamFormat: "mp4", pattern: `https?://[^"']+\\.mp4`, resolverPath: (q) => `https://akwam.vip/search?q=${encodeURIComponent(q)}` },
];

export const MOVIES_SCRAPERS: ScraperAgent[] = MOVIE_SITES.map((site) => {
  return {
    siteId: site.id,
    siteName: site.name,
    category: "movies",
    categoryLabel: "أفلام ومسلسلات",
    baseUrl: site.domain,
    streamFormat: site.streamFormat,
    description: `قاشط مخصص لموقع ${site.name} لسحب روابط الفيديو المباشرة (${site.streamFormat.toUpperCase()}) وإزالة الإعلانات المزعجة`,
    customExtractionPattern: {
      target: site.streamFormat,
      selectorOrRegex: site.pattern,
      requiresReferer: true,
      streamResolverUrl: (q, s, e) => {
        const slug = q.toLowerCase().replace(/[^\w\s\u0600-\u06FF-]/g, "").trim().replace(/\s+/g, "-");
        const suffix = s && e ? `-s0${s}e0${e}` : "";
        return site.streamFormat === "m3u8"
          ? `https://stream.${site.domain.replace(/^https?:\/\//, '')}/hls/${slug}${suffix}/master.m3u8`
          : `https://stream.${site.domain.replace(/^https?:\/\//, '')}/video/${slug}${suffix}/1080p.mp4`;
      },
    },
    extractStream: async (query, s, e) => {
      return scrapeDirectVideoStream({
        siteId: site.id,
        siteName: site.name,
        baseUrl: site.domain,
        title: query,
        season: s,
        episode: e,
        defaultFormat: site.streamFormat,
        audioLanguage: "ar",
      });
    },
    testHealth: async () => {
      return runAgentHealthCheck({
        siteId: site.id,
        siteName: site.name,
        category: "movies",
        baseUrl: site.domain,
        streamFormat: site.streamFormat,
        customExtractionPattern: {
          target: site.streamFormat,
          selectorOrRegex: site.pattern,
          requiresReferer: true,
          streamResolverUrl: (q, s, e) => {
            const slug = q.toLowerCase().replace(/[^\w\s\u0600-\u06FF-]/g, "").trim().replace(/\s+/g, "-");
            const suffix = s && e ? `-s0${s}e0${e}` : "";
            return site.streamFormat === "m3u8"
              ? `https://stream.${site.domain.replace(/^https?:\/\//, '')}/hls/${slug}${suffix}/master.m3u8`
              : `https://stream.${site.domain.replace(/^https?:\/\//, '')}/video/${slug}${suffix}/1080p.mp4`;
          },
        },
      });
    },
  };
});
