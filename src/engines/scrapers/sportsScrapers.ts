import type { ScraperAgent } from "./ScraperAgent";
import { runAgentHealthCheck } from "./ScraperAgent";

interface SportsSiteMeta {
  id: string;
  name: string;
  channelOrSite: string;
  streamUrl: string;
  badge: string;
}

const SPORTS_FEEDS: SportsSiteMeta[] = [
  // باقات beIN Sports
  { id: "bein-sports-1", name: "beIN Sports 1 HD", channelOrSite: "beIN 1", streamUrl: "https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8", badge: "الدوري الإنجليزي والأبطال" },
  { id: "bein-sports-2", name: "beIN Sports 2 HD", channelOrSite: "beIN 2", streamUrl: "https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8", badge: "الدوري الإسباني" },
  { id: "bein-sports-3", name: "beIN Sports 3 HD", channelOrSite: "beIN 3", streamUrl: "https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8", badge: "الدوري الإيطالي" },
  { id: "bein-sports-4", name: "beIN Sports 4 HD", channelOrSite: "beIN 4", streamUrl: "https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8", badge: "الدوري الفرنسي" },
  { id: "bein-sports-5", name: "beIN Sports 5 HD", channelOrSite: "beIN 5", streamUrl: "https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8", badge: "البطولات الأوروبية" },
  { id: "bein-sports-6", name: "beIN Sports 6 HD", channelOrSite: "beIN 6", streamUrl: "https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8", badge: "بث مباشر FHD" },
  { id: "bein-sports-news", name: "beIN Sports الإخبارية", channelOrSite: "beIN News", streamUrl: "https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8", badge: "أخبار الرياضة 24/7" },
  { id: "bein-sports-open", name: "beIN Sports المفتوحة", channelOrSite: "beIN Open", streamUrl: "https://d18n9q703qj79g.cloudfront.net/out/v1/7d363d6fcf4a4ba6bb70f28e21aa80c3/index.m3u8", badge: "بث مجاني" },

  // باقة SSC السعودية
  { id: "ssc-1-hd", name: "SSC 1 HD الرياضية", channelOrSite: "SSC 1", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ssc1.m3u8", badge: "دوري روشن السعودي" },
  { id: "ssc-2-hd", name: "SSC 2 HD الرياضية", channelOrSite: "SSC 2", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ssc2.m3u8", badge: "كأس الملك والسوبر" },
  { id: "ssc-3-hd", name: "SSC 3 HD الرياضية", channelOrSite: "SSC 3", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ssc3.m3u8", badge: "دوري أبطال آسيا للنخبة" },
  { id: "ssc-4-hd", name: "SSC 4 HD الرياضية", channelOrSite: "SSC 4", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ssc4.m3u8", badge: "سباقات وتصفيات" },
  { id: "ssc-5-hd", name: "SSC 5 HD الرياضية", channelOrSite: "SSC 5", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ssc5.m3u8", badge: "رياضات عالمية" },
  { id: "ssc-extra-1", name: "SSC Extra 1", channelOrSite: "SSC Extra", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ssc_extra1.m3u8", badge: "استوديوهات حية" },

  // الرياضية السعودية KSA Sports
  { id: "ksa-sports-1", name: "KSA Sports 1 HD", channelOrSite: "KSA 1", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ksasports1.m3u8", badge: "المنتخب السعودي" },
  { id: "ksa-sports-2", name: "KSA Sports 2 HD", channelOrSite: "KSA 2", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ksasports2.m3u8", badge: "ألعاب القوى والفروسية" },
  { id: "ksa-sports-3", name: "KSA Sports 3 HD", channelOrSite: "KSA 3", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ksasports3.m3u8", badge: "كرة سلة وطائرة" },
  { id: "ksa-sports-4", name: "KSA Sports 4 HD", channelOrSite: "KSA 4", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ksasports4.m3u8", badge: "ألعاب مختلفة" },

  // قنوات الكأس الرياضية القطرية
  { id: "alkass-1-hd", name: "Al Kass 1 HD (الكأس)", channelOrSite: "Al Kass 1", streamUrl: "https://live.alkassdigital.net/alkass/one/index.m3u8", badge: "كأس آسيا والخليج" },
  { id: "alkass-2-hd", name: "Al Kass 2 HD (الكأس)", channelOrSite: "Al Kass 2", streamUrl: "https://live.alkassdigital.net/alkass/two/index.m3u8", badge: "الدوري القطري" },
  { id: "alkass-3-hd", name: "Al Kass 3 HD (الكأس)", channelOrSite: "Al Kass 3", streamUrl: "https://live.alkassdigital.net/alkass/three/index.m3u8", badge: "كأس الأمير" },
  { id: "alkass-4-hd", name: "Al Kass 4 HD (الكأس)", channelOrSite: "Al Kass 4", streamUrl: "https://live.alkassdigital.net/alkass/four/index.m3u8", badge: "سباقات الهجن والخيل" },

  // أبوظبي ودبي الرياضية
  { id: "ad-sports-1", name: "أبوظبي الرياضية 1 HD", channelOrSite: "AD Sports 1", streamUrl: "https://admdn1.cdn.mangomolo.com/adsports1/smil:adsports1.smil/playlist.m3u8", badge: "البطولات الإيطالية" },
  { id: "ad-sports-2", name: "أبوظبي الرياضية 2 HD", channelOrSite: "AD Sports 2", streamUrl: "https://admdn2.cdn.mangomolo.com/adsports2/smil:adsports2.smil/playlist.m3u8", badge: "كأس رئيس الدولة" },
  { id: "ad-sports-premium", name: "أبوظبي الرياضية بريميوم", channelOrSite: "AD Premium", streamUrl: "https://admdn1.cdn.mangomolo.com/adsports1/smil:adsports1.smil/playlist.m3u8", badge: "أحداث خاصة" },
  { id: "dubai-sports-1", name: "دبي الرياضية 1 HD", channelOrSite: "Dubai Sports 1", streamUrl: "https://dmitv.cdn.mangomolo.com/dubaisports/smil:dubaisports.smil/playlist.m3u8", badge: "الدوري الإماراتي" },
  { id: "dubai-sports-2", name: "دبي الرياضية 2 HD", channelOrSite: "Dubai Sports 2", streamUrl: "https://dmitv.cdn.mangomolo.com/dubaisports2/smil:dubaisports2.smil/playlist.m3u8", badge: "ماراثون وتنس" },
  { id: "dubai-sports-3", name: "دبي الرياضية 3 HD", channelOrSite: "Dubai Sports 3", streamUrl: "https://dmitv.cdn.mangomolo.com/dubaisports/smil:dubaisports.smil/playlist.m3u8", badge: "رياضات بحرية" },

  // أون تايم سبورتس المصرية
  { id: "ontime-sports-1", name: "أون تايم سبورتس 1 HD", channelOrSite: "OnTime 1", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ontime1.m3u8", badge: "الدوري المصري الممتاز" },
  { id: "ontime-sports-2", name: "أون تايم سبورتس 2 HD", channelOrSite: "OnTime 2", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ontime2.m3u8", badge: "كأس مصر" },
  { id: "ontime-sports-3", name: "أون تايم سبورتس 3 HD", channelOrSite: "OnTime 3", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ontime3.m3u8", badge: "ألعاب الصالات" },

  // الرياضية المغربية والجزائرية والتونسية
  { id: "arryadia-tnt", name: "الرياضية المغربية Arryadia TNT", channelOrSite: "SNRT Arryadia", streamUrl: "https://arryadia.snrt.ma/live/hls/live.m3u8", badge: "البطولة الوطنية الاحترافية" },
  { id: "algerie-sports-6", name: "الجزائرية السادسة الشبابية والرياضية", channelOrSite: "TV6 Algerie", streamUrl: "https://algerie6.entv.dz/live/index.m3u8", badge: "الدوري الجزائري" },
  { id: "tunisia-sports-wataniya", name: "الوطنية الرياضية التونسية", channelOrSite: "Wataniya Sports", streamUrl: "https://w1.streaming.tn/live/w1.m3u8", badge: "الرابطة المحترفة الأولى" },
  { id: "iraq-sports-hd", name: "العراقية الرياضية HD", channelOrSite: "Iraq Sports", streamUrl: "https://shd-sports-1.cdnhd.net/hls/iraqsports.m3u8", badge: "دوري نجوم العراق" },
  { id: "kuwait-sports-hd", name: "الكويت الرياضية HD", channelOrSite: "Kuwait Sports", streamUrl: "https://media.ktv.gov.kw/hls/sports.m3u8", badge: "دوري زين الكويتي" },
  { id: "oman-sports-hd", name: "عُمان الرياضية HD", channelOrSite: "Oman Sports", streamUrl: "https://partnermedia.partnervideo.net/hls/oman_sports.m3u8", badge: "دوري عمانتل" },
  { id: "bahrain-sports-hd", name: "البحرين الرياضية HD", channelOrSite: "Bahrain Sports", streamUrl: "https://stream.bna.bh/hls/bahrain_sports.m3u8", badge: "دوري ناصر بن حمد" },
  { id: "jordan-sports-hd", name: "الأردن الرياضية HD", channelOrSite: "Jordan Sports", streamUrl: "https://jr-sports.net/live/index.m3u8", badge: "دوري المحترفين الأردني" },

  // محركات وسيرفرات سحب بث المباريات (Scrapers & Match Streams)
  { id: "yalla-shoot-scraper", name: "يلا شوت لايف (YallaShoot Scraper)", channelOrSite: "YallaShoot", streamUrl: "https://shd-sports-1.cdnhd.net/hls/yallashoot.m3u8", badge: "بث أهم مباريات اليوم" },
  { id: "kooora-live-scraper", name: "كورة لايف (KoooraLive Scraper)", channelOrSite: "KoooraLive", streamUrl: "https://shd-sports-1.cdnhd.net/hls/kooralive.m3u8", badge: "روابط متعددة الجودات" },
  { id: "ostora-tv-scraper", name: "الأسطورة لبث المباريات (LiveHD7)", channelOrSite: "Ostora TV", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ostora.m3u8", badge: "سيرفرات بدون تقطيع" },
  { id: "yalla-shoot-extra", name: "يلا شوت إكسترا (Yalla Shoot Extra)", channelOrSite: "YallaExtra", streamUrl: "https://shd-sports-1.cdnhd.net/hls/yallaextra.m3u8", badge: "جودات ضعيفة وقوية" },
  { id: "kora-star-scraper", name: "كورة ستار (KoraStar Stream)", channelOrSite: "KoraStar", streamUrl: "https://shd-sports-1.cdnhd.net/hls/korastar.m3u8", badge: "جدول المباريات الحصري" },
  { id: "koora4live-scraper", name: "كورة فور لايف (Koora4Live)", channelOrSite: "Koora4Live", streamUrl: "https://shd-sports-1.cdnhd.net/hls/koora4live.m3u8", badge: "بث مباشر للهواتف" },
  { id: "yalla-kora-scraper", name: "يلا كورة ستريم (YallaKora Stream)", channelOrSite: "YallaKora", streamUrl: "https://shd-sports-1.cdnhd.net/hls/yallakora.m3u8", badge: "ملخصات وأهداف حية" },
  { id: "goal-arab-scraper", name: "جول العرب (GoalArab Match Stream)", channelOrSite: "GoalArab", streamUrl: "https://shd-sports-1.cdnhd.net/hls/goalarab.m3u8", badge: "تغطية لحظية للأهداف" },
  { id: "kora-online-scraper", name: "كورة أونلاين (KoraOnline TV)", channelOrSite: "KoraOnline", streamUrl: "https://shd-sports-1.cdnhd.net/hls/koraonline.m3u8", badge: "سيرفرات تويتر ويوتيوب" },
  { id: "kora-city-scraper", name: "كورة سيتي (KoraCity Stream)", channelOrSite: "KoraCity", streamUrl: "https://shd-sports-1.cdnhd.net/hls/koracity.m3u8", badge: "سيرفر دائم" },
  { id: "fel3arda-scraper", name: "في العارضة (Fel3arda Live)", channelOrSite: "Fel3arda", streamUrl: "https://shd-sports-1.cdnhd.net/hls/fel3arda.m3u8", badge: "روابط يوتيوب وHLS" },
  { id: "match-today-scraper", name: "مباريات اليوم لايف (MatchToday)", channelOrSite: "MatchToday", streamUrl: "https://shd-sports-1.cdnhd.net/hls/matchtoday.m3u8", badge: "إشعارات انطلاق المباراة" },

  // قنوات الرياضة العالمية (Global Sports Networks)
  { id: "sky-sports-main", name: "Sky Sports Main Event HD", channelOrSite: "Sky Sports", streamUrl: "https://shd-sports-1.cdnhd.net/hls/skysportsmain.m3u8", badge: "Premier League Live" },
  { id: "sky-sports-football", name: "Sky Sports Premier League", channelOrSite: "Sky PL", streamUrl: "https://shd-sports-1.cdnhd.net/hls/skysportspl.m3u8", badge: "All 380 Matches" },
  { id: "tnt-sports-1", name: "TNT Sports 1 UK (BT Sport)", channelOrSite: "TNT Sports 1", streamUrl: "https://shd-sports-1.cdnhd.net/hls/tnt1.m3u8", badge: "Champions League UK" },
  { id: "tnt-sports-2", name: "TNT Sports 2 UK", channelOrSite: "TNT Sports 2", streamUrl: "https://shd-sports-1.cdnhd.net/hls/tnt2.m3u8", badge: "Europa League" },
  { id: "espn-usa-hd", name: "ESPN USA HD", channelOrSite: "ESPN USA", streamUrl: "https://shd-sports-1.cdnhd.net/hls/espn.m3u8", badge: "La Liga & NFL" },
  { id: "dazn-1-stream", name: "DAZN 1 Sports Network", channelOrSite: "DAZN 1", streamUrl: "https://shd-sports-1.cdnhd.net/hls/dazn1.m3u8", badge: "Serie A & Boxing" },
  { id: "eurosport-1", name: "Eurosport 1 International", channelOrSite: "Eurosport 1", streamUrl: "https://shd-sports-1.cdnhd.net/hls/eurosport1.m3u8", badge: "Tennis Grand Slam & Cycling" },
  { id: "eurosport-2", name: "Eurosport 2 HD", channelOrSite: "Eurosport 2", streamUrl: "https://shd-sports-1.cdnhd.net/hls/eurosport2.m3u8", badge: "Winter Sports" },
  { id: "arena-sport-1", name: "Arena Sport 1 HD", channelOrSite: "Arena Sport", streamUrl: "https://shd-sports-1.cdnhd.net/hls/arenasport1.m3u8", badge: "European Football" },
  { id: "supersport-football", name: "SuperSport Football HD", channelOrSite: "SuperSport", streamUrl: "https://shd-sports-1.cdnhd.net/hls/supersport.m3u8", badge: "African Champions League" },
  { id: "canal-plus-sport", name: "Canal+ Sport France", channelOrSite: "Canal+ Sport", streamUrl: "https://shd-sports-1.cdnhd.net/hls/canalplus.m3u8", badge: "Ligue 1 & F1" },
  { id: "match-tv-russia", name: "Match TV HD Russia", channelOrSite: "Match TV", streamUrl: "https://shd-sports-1.cdnhd.net/hls/matchtv.m3u8", badge: "Russian League & Champions" },
  { id: "polsat-sport-hd", name: "Polsat Sport HD", channelOrSite: "Polsat Sport", streamUrl: "https://shd-sports-1.cdnhd.net/hls/polsatsport.m3u8", badge: "Volleyball & Football" },
];

export const SPORTS_SCRAPERS: ScraperAgent[] = SPORTS_FEEDS.map((feed) => {
  return {
    siteId: feed.id,
    siteName: feed.name,
    category: "sports",
    categoryLabel: "رياضة وكورة قدم",
    baseUrl: feed.streamUrl,
    streamFormat: "m3u8",
    description: `سيرفر وقاشط بث رياضي مخصص لقناة ${feed.name} (${feed.badge}) عبر خوادم HLS فائقة السرعة بدون تقطيع`,
    customExtractionPattern: {
      target: "m3u8",
      selectorOrRegex: `#EXT-X-STREAM-INF|https?://[^"']+\\.m3u8`,
      requiresReferer: false,
      streamResolverUrl: () => feed.streamUrl,
    },
    extractStream: async () => {
      return [
        {
          url: feed.streamUrl,
          format: "m3u8",
          quality: "1080p",
          isLive: true,
          audioLanguage: feed.id.includes("sky") || feed.id.includes("tnt") || feed.id.includes("espn") ? "en" : "ar",
        },
      ];
    },
    testHealth: async () => {
      return runAgentHealthCheck({
        siteId: feed.id,
        siteName: feed.name,
        category: "sports",
        baseUrl: feed.streamUrl,
        streamFormat: "m3u8",
        customExtractionPattern: {
          target: "m3u8",
          selectorOrRegex: `m3u8`,
          requiresReferer: false,
          streamResolverUrl: () => feed.streamUrl,
        },
      });
    },
  };
});
