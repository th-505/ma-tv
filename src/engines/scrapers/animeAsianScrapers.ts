import type { ScraperAgent } from "./ScraperAgent";
import { runAgentHealthCheck } from "./ScraperAgent";
import { scrapeDirectVideoStream } from "./DirectStreamScraper";

interface AnimeAsianMeta {
  id: string;
  name: string;
  category: "anime" | "asian";
  categoryLabel: string;
  domain: string;
  streamFormat: "m3u8" | "mp4";
  badge: string;
  searchUrl: (q: string) => string;
}

const ANIME_ASIAN_PLATFORMS: AnimeAsianMeta[] = [
  // منصات الأنمي العربية والعالمية
  { id: "anime4up-scraper", name: "أنمي فور أب (Anime4Up)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://anime4up.com", streamFormat: "m3u8", badge: "مترجم عربي FHD", searchUrl: (q) => `https://anime4up.com/?search_rule=1&s=${encodeURIComponent(q)}` },
  { id: "okanime-scraper", name: "أوك أنمي (Okanime)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://okanime.xyz", streamFormat: "mp4", badge: "سيرفرات سريعة", searchUrl: (q) => `https://okanime.xyz/search/?s=${encodeURIComponent(q)}` },
  { id: "witanime-scraper", name: "ويت أنمي (WitAnime)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://witanime.com", streamFormat: "m3u8", badge: "حلقات الموسم الجديد", searchUrl: (q) => `https://witanime.com/?search_rule=1&s=${encodeURIComponent(q)}` },
  { id: "animeblkom-scraper", name: "أنمي بالكوم (AnimeBlkom)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animeblkom.net", streamFormat: "mp4", badge: "جودة أصلية", searchUrl: (q) => `https://animeblkom.net/search?query=${encodeURIComponent(q)}` },
  { id: "addanime-scraper", name: "إد أنمي (AddAnime)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://add-anime.net", streamFormat: "m3u8", badge: "أرشيف أنمي كلاسيكي", searchUrl: (q) => `https://add-anime.net/?s=${encodeURIComponent(q)}` },
  { id: "xsanime-scraper", name: "إكس إس أنمي (Xsanime)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://xsanime.com", streamFormat: "mp4", badge: "أنمي مترجم وسريع", searchUrl: (q) => `https://xsanime.com/?s=${encodeURIComponent(q)}` },
  { id: "animelek-scraper", name: "أنمي ليك (AnimeLek)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animelek.me", streamFormat: "m3u8", badge: "مشاهدة وتحميل", searchUrl: (q) => `https://animelek.me/?s=${encodeURIComponent(q)}` },
  { id: "animepahe-scraper", name: "AnimePahe Global", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animepahe.ru", streamFormat: "mp4", badge: "خفيف وعالي الجودة", searchUrl: (q) => `https://animepahe.ru/api?m=search&q=${encodeURIComponent(q)}` },
  { id: "gogoanime-scraper", name: "GogoAnime (AniTaku)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://anitaku.to", streamFormat: "m3u8", badge: "مكتبة أنمي ضخمة", searchUrl: (q) => `https://anitaku.to/search.html?keyword=${encodeURIComponent(q)}` },
  { id: "hianime-scraper", name: "HiAnime (ZoroTo)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://hianime.to", streamFormat: "m3u8", badge: "Ultra HD Sub & Dub", searchUrl: (q) => `https://hianime.to/search?keyword=${encodeURIComponent(q)}` },
  { id: "animedex-scraper", name: "AnimeDex Stream", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animedex.live", streamFormat: "m3u8", badge: "بدون إعلانات", searchUrl: (q) => `https://animedex.live/search?query=${encodeURIComponent(q)}` },
  { id: "animeflv-scraper", name: "AnimeFLV Latino", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animeflv.net", streamFormat: "mp4", badge: "أنمي إسباني وعالمي", searchUrl: (q) => `https://animeflv.net/browse?q=${encodeURIComponent(q)}` },
  { id: "aniwave-scraper", name: "AniWave (9Anime)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://aniwave.to", streamFormat: "m3u8", badge: "سيرفرات متعددة 1080p", searchUrl: (q) => `https://aniwave.to/filter?keyword=${encodeURIComponent(q)}` },
  { id: "kickassanime-scraper", name: "KickAssAnime Stream", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://kaas.to", streamFormat: "m3u8", badge: "تحديث يومي للحلقات", searchUrl: (q) => `https://kaas.to/search?q=${encodeURIComponent(q)}` },
  { id: "animekisa-scraper", name: "AnimeKisa HD", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animekisa.tv", streamFormat: "mp4", badge: "واجهة سريعة", searchUrl: (q) => `https://animekisa.tv/search?q=${encodeURIComponent(q)}` },
  { id: "animedao-scraper", name: "AnimeDao Free", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animedao.to", streamFormat: "m3u8", badge: "أفلام الأنمي الحصرية", searchUrl: (q) => `https://animedao.to/search/?key=${encodeURIComponent(q)}` },
  { id: "spacetoon-go-scraper", name: "سبيستون غو ميرور (Spacetoon)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://spacetoon.com", streamFormat: "m3u8", badge: "كرتون مدبلج عربي فصحى", searchUrl: (q) => `https://spacetoon.com/search?q=${encodeURIComponent(q)}` },
  { id: "cartoon-network-ar", name: "كرتون نتورك بالعربية (CN AR)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://cartoonnetworkarabic.com", streamFormat: "m3u8", badge: "برامج الأطفال المدبلجة", searchUrl: (q) => `https://cartoonnetworkarabic.com/search?q=${encodeURIComponent(q)}` },
  { id: "mbc3-cartoon-scraper", name: "إم بي سي 3 كرتون (MBC 3)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://shahid.mbc.net", streamFormat: "m3u8", badge: "مسلسلات الطفولة والكرتون", searchUrl: (q) => `https://shahid.mbc.net/search?q=${encodeURIComponent(q)}` },
  { id: "crunchyroll-mirror", name: "كرانشي رول ميرور (Crunchyroll)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://crunchyroll.com", streamFormat: "m3u8", badge: "بث أنمي رسمي مترجم", searchUrl: (q) => `https://crunchyroll.com/search?q=${encodeURIComponent(q)}` },
  { id: "bilibili-anime", name: "بيلبيلي أنمي (Bilibili Anime)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://bilibili.tv", streamFormat: "m3u8", badge: "أنمي صيني وياباني", searchUrl: (q) => `https://bilibili.tv/search?keyword=${encodeURIComponent(q)}` },
  { id: "muse-asia-stream", name: "ميوز آسيا (Muse Asia)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://youtube.com/c/MuseAsia", streamFormat: "m3u8", badge: "أنمي قانوني مجاني", searchUrl: (q) => `https://youtube.com/results?search_query=Muse+Asia+${encodeURIComponent(q)}` },
  { id: "anione-asia-stream", name: "آني وان آسيا (Ani-One)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://youtube.com/c/AniOneAsia", streamFormat: "m3u8", badge: "بث عالي الدقة", searchUrl: (q) => `https://youtube.com/results?search_query=Ani-One+${encodeURIComponent(q)}` },
  { id: "anime-slayer-node", name: "أنمي سلاير نود (AnimeSlayer)", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://app-animeslayer.com", streamFormat: "mp4", badge: "سيرفر التطبيقات", searchUrl: (q) => `https://app-animeslayer.com/search?q=${encodeURIComponent(q)}` },
  { id: "shahiid-anime-vip", name: "شهيد أنمي VIP", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://shahiid.anime", streamFormat: "m3u8", badge: "أوفا وأفلام أنمي", searchUrl: (q) => `https://shahiid.anime/?s=${encodeURIComponent(q)}` },
  { id: "animeshow-tv", name: "AnimeShow TV", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animeshow.tv", streamFormat: "mp4", badge: "حلقات كاملة", searchUrl: (q) => `https://animeshow.tv/?s=${encodeURIComponent(q)}` },
  { id: "animetake-pro", name: "AnimeTake Pro", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animetake.tv", streamFormat: "m3u8", badge: "تحميل سريع", searchUrl: (q) => `https://animetake.tv/search?key=${encodeURIComponent(q)}` },
  { id: "animefenix-stream", name: "AnimeFenix Latino", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://animefenix.tv", streamFormat: "mp4", badge: "أنمي أسبوعي", searchUrl: (q) => `https://animefenix.tv/animes?q=${encodeURIComponent(q)}` },
  { id: "monoschinos-hd", name: "MonosChinos HD", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://monoschinos2.com", streamFormat: "m3u8", badge: "بث مستمر", searchUrl: (q) => `https://monoschinos2.com/buscar?q=${encodeURIComponent(q)}` },
  { id: "anime-planet-stream", name: "Anime-Planet Player", category: "anime", categoryLabel: "أنمي وكرتون", domain: "https://anime-planet.com", streamFormat: "mp4", badge: "قاعدة بيانات ومشاهدة", searchUrl: (q) => `https://anime-planet.com/anime/all?name=${encodeURIComponent(q)}` },

  // منصات الدراما الآسيوية والكورية (K-Drama / C-Drama)
  { id: "dramacool-scraper", name: "دراما كول (DramaCool)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://dramacool.ch", streamFormat: "m3u8", badge: "K-Drama مترجم", searchUrl: (q) => `https://dramacool.ch/search?type=movies&keyword=${encodeURIComponent(q)}` },
  { id: "kissasian-scraper", name: "كيس آسيان (KissAsian)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://kissasian.cam", streamFormat: "mp4", badge: "دراما يابانية وكورية", searchUrl: (q) => `https://kissasian.cam/search.html?keyword=${encodeURIComponent(q)}` },
  { id: "viewasian-scraper", name: "فيو آسيان (ViewAsian)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://viewasian.co", streamFormat: "m3u8", badge: "HD مسلسلات آسيوية", searchUrl: (q) => `https://viewasian.co/search?keyword=${encodeURIComponent(q)}` },
  { id: "asianload-scraper", name: "آسيان لود (AsianLoad)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://asianload.io", streamFormat: "mp4", badge: "سيرفرات مباشرة", searchUrl: (q) => `https://asianload.io/search.html?keyword=${encodeURIComponent(q)}` },
  { id: "myasiantv-scraper", name: "ماي آسيان تي في (MyAsianTV)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://myasiantv.ac", streamFormat: "m3u8", badge: "أحدث الدراما الكورية", searchUrl: (q) => `https://myasiantv.ac/search.html?key=${encodeURIComponent(q)}` },
  { id: "doramasyt-scraper", name: "دوراماس واي تي (DoramasYT)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://doramasyt.com", streamFormat: "mp4", badge: "كوري ولاتيني مترجم", searchUrl: (q) => `https://doramasyt.com/buscar?q=${encodeURIComponent(q)}` },
  { id: "estrenosdoramas-scr", name: "إسترينوس دوراماس (EstrenosDoramas)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://estrenosdoramas.net", streamFormat: "m3u8", badge: "دراما شرق آسيا", searchUrl: (q) => `https://estrenosdoramas.net/search?q=${encodeURIComponent(q)}` },
  { id: "fastdrama-scraper", name: "فاست دراما (FastDrama)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://fastdrama.me", streamFormat: "mp4", badge: "سيرفر فائق السرعة", searchUrl: (q) => `https://fastdrama.me/search?q=${encodeURIComponent(q)}` },
  { id: "dramanice-scraper", name: "دراما نايس (DramaNice)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://dramanice.la", streamFormat: "m3u8", badge: "مسلسلات تايوانية وكورية", searchUrl: (q) => `https://dramanice.la/search?q=${encodeURIComponent(q)}` },
  { id: "kshow123-scraper", name: "كي شو 123 (KShow123)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://kshow123.net", streamFormat: "mp4", badge: "برامج واقعية ومسابقات كورية", searchUrl: (q) => `https://kshow123.net/search/${encodeURIComponent(q)}` },
  { id: "viki-rakuten-mirror", name: "فيكي راكوتين ميرور (Viki Rakuten)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://viki.com", streamFormat: "m3u8", badge: "ترجمة رسمية متعددة اللغات", searchUrl: (q) => `https://viki.com/search?q=${encodeURIComponent(q)}` },
  { id: "wetv-asian-stream", name: "وي تي في (WeTV Tencent)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://wetv.vip", streamFormat: "m3u8", badge: "دراما صينية حصرية C-Drama", searchUrl: (q) => `https://wetv.vip/search?q=${encodeURIComponent(q)}` },
  { id: "iqiyi-asian-stream", name: "آي تشي يي (iQiyi Global)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://iq.com", streamFormat: "m3u8", badge: "أعمال أصلية صينية", searchUrl: (q) => `https://iq.com/search?query=${encodeURIComponent(q)}` },
  { id: "youku-asian-stream", name: "يوكو تي في (Youku Global)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://youku.tv", streamFormat: "m3u8", badge: "تاريخي ورومانسي", searchUrl: (q) => `https://youku.tv/search?q=${encodeURIComponent(q)}` },
  { id: "kdramahood-stream", name: "كي دراما هود (KDramaHood)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://kdramahood.com", streamFormat: "mp4", badge: "سيرفرات VIP", searchUrl: (q) => `https://kdramahood.com/?s=${encodeURIComponent(q)}` },
  { id: "asiancrush-stream", name: "آسيان كراش (AsianCrush)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://asiancrush.com", streamFormat: "m3u8", badge: "سينما الشرق الأقصى", searchUrl: (q) => `https://asiancrush.com/search?q=${encodeURIComponent(q)}` },
  { id: "doramasmp4-stream", name: "دوراماس إم بي 4 (DoramasMp4)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://doramasmp4.com", streamFormat: "mp4", badge: "تحميل ومشاهدة مباشرة", searchUrl: (q) => `https://doramasmp4.com/buscar?q=${encodeURIComponent(q)}` },
  { id: "kisskh-stream-node", name: "كيس كيه إتش (Kisskh)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://kisskh.co", streamFormat: "m3u8", badge: "جودات متعددة وسريعة", searchUrl: (q) => `https://kisskh.co/Search?q=${encodeURIComponent(q)}` },
  { id: "cuevana-latino", name: "كويفانا 3 (Cuevana Latino)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://cuevana3.me", streamFormat: "m3u8", badge: "مسلسلات عالمية ولاتينية", searchUrl: (q) => `https://cuevana3.me/search?q=${encodeURIComponent(q)}` },
  { id: "pelisplus-latino", name: "بيليس بلس (PelisPlus HD)", category: "asian", categoryLabel: "دراما آسيوية وكورية", domain: "https://pelisplus.lat", streamFormat: "mp4", badge: "تيلينوفيلا ومسلسلات", searchUrl: (q) => `https://pelisplus.lat/search?q=${encodeURIComponent(q)}` },
];

export const ANIME_ASIAN_SCRAPERS: ScraperAgent[] = ANIME_ASIAN_PLATFORMS.map((platform) => {
  return {
    siteId: platform.id,
    siteName: platform.name,
    category: platform.category,
    categoryLabel: platform.categoryLabel,
    baseUrl: platform.domain,
    streamFormat: platform.streamFormat,
    description: `قاشط وسيرفر مخصص لمنصة ${platform.name} (${platform.badge}) لاستخراج الروابط المباشرة بدون إعلانات`,
    customExtractionPattern: {
      target: platform.streamFormat,
      selectorOrRegex: platform.streamFormat === "m3u8" ? `https?://[^"']+\\.m3u8` : `https?://[^"']+\\.mp4`,
      requiresReferer: true,
      streamResolverUrl: (q, s, e) => {
        const slug = q.toLowerCase().replace(/[^\w\s\u0600-\u06FF-]/g, "").trim().replace(/\s+/g, "-");
        const suffix = s && e ? `-s0${s}e0${e}` : "";
        return platform.streamFormat === "m3u8"
          ? `https://stream.${platform.domain.replace(/^https?:\/\//, '')}/hls/${slug}${suffix}/master.m3u8`
          : `https://stream.${platform.domain.replace(/^https?:\/\//, '')}/video/${slug}${suffix}/1080p.mp4`;
      },
    },
    extractStream: async (query, s, e) => {
      return scrapeDirectVideoStream({
        siteId: platform.id,
        siteName: platform.name,
        baseUrl: platform.domain,
        title: query,
        season: s,
        episode: e,
        defaultFormat: platform.streamFormat,
        audioLanguage: platform.category === "anime" ? "ja" : "ko",
      });
    },
    testHealth: async () => {
      return runAgentHealthCheck({
        siteId: platform.id,
        siteName: platform.name,
        category: platform.category,
        baseUrl: platform.domain,
        streamFormat: platform.streamFormat,
        customExtractionPattern: {
          target: platform.streamFormat,
          selectorOrRegex: `stream`,
          requiresReferer: true,
          streamResolverUrl: (q, s, e) => {
            const slug = q.toLowerCase().replace(/[^\w\s\u0600-\u06FF-]/g, "").trim().replace(/\s+/g, "-");
            const suffix = s && e ? `-s0${s}e0${e}` : "";
            return platform.streamFormat === "m3u8"
              ? `https://stream.${platform.domain.replace(/^https?:\/\//, '')}/hls/${slug}${suffix}/master.m3u8`
              : `https://stream.${platform.domain.replace(/^https?:\/\//, '')}/video/${slug}${suffix}/1080p.mp4`;
          },
        },
      });
    },
  };
});
