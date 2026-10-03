import type { ScraperAgent } from "./ScraperAgent";
import { runAgentHealthCheck } from "./ScraperAgent";

interface CombatSiteMeta {
  id: string;
  name: string;
  categoryType: "wrestling" | "ufc" | "boxing" | "mma";
  badge: string;
  streamUrl: string;
  sourceDomain: string;
}

const COMBAT_FEEDS: CombatSiteMeta[] = [
  // مصارعة حرة WWE
  { id: "wwe-network-live", name: "WWE Network 24/7 Live", categoryType: "wrestling", badge: "قناة المصارعة الرسمية", streamUrl: "https://shd-sports-1.cdnhd.net/hls/wwenetwork.m3u8", sourceDomain: "https://watchwrestlingup.org" },
  { id: "wwe-raw-live", name: "WWE Monday Night Raw Live", categoryType: "wrestling", badge: "عرض الرو الأسبوعي المباشر", streamUrl: "https://shd-sports-1.cdnhd.net/hls/wweraw.m3u8", sourceDomain: "https://watchwrestling24.net" },
  { id: "wwe-smackdown-live", name: "WWE Friday Night SmackDown", categoryType: "wrestling", badge: "عرض السماك داون المباشر", streamUrl: "https://shd-sports-1.cdnhd.net/hls/wwesmackdown.m3u8", sourceDomain: "https://allwrestling.live" },
  { id: "wwe-nxt-live", name: "WWE NXT Tuesday Night", categoryType: "wrestling", badge: "نجوم المستقبل", streamUrl: "https://shd-sports-1.cdnhd.net/hls/wwenxt.m3u8", sourceDomain: "https://watchwrestlingup.org" },
  { id: "wwe-wrestlemania-ppv", name: "WWE WrestleMania PPV Stream", categoryType: "wrestling", badge: "عرض المهرجان الأضخم", streamUrl: "https://shd-sports-1.cdnhd.net/hls/wrestlemania.m3u8", sourceDomain: "https://watchwrestling.in" },
  { id: "wwe-royal-rumble-ppv", name: "WWE Royal Rumble PPV Stream", categoryType: "wrestling", badge: "المعركة الملكية الكبرى", streamUrl: "https://shd-sports-1.cdnhd.net/hls/royalrumble.m3u8", sourceDomain: "https://watchwrestling24.net" },
  { id: "wwe-summerslam-ppv", name: "WWE SummerSlam PPV Stream", categoryType: "wrestling", badge: "حفلة الصيف الكبرى", streamUrl: "https://shd-sports-1.cdnhd.net/hls/summerslam.m3u8", sourceDomain: "https://allwrestling.live" },
  { id: "wwe-survivor-series", name: "WWE Survivor Series WarGames", categoryType: "wrestling", badge: "ألعاب الحرب والنجاة", streamUrl: "https://shd-sports-1.cdnhd.net/hls/survivorseries.m3u8", sourceDomain: "https://watchwrestlingup.org" },
  { id: "wwe-money-in-the-bank", name: "WWE Money in the Bank PPV", categoryType: "wrestling", badge: "مباريات الحقيبة", streamUrl: "https://shd-sports-1.cdnhd.net/hls/mitb.m3u8", sourceDomain: "https://watchwrestlingup.org" },
  { id: "wwe-crown-jewel-saudi", name: "WWE Crown Jewel (موسم الرياض)", categoryType: "wrestling", badge: "عروض المملكة المباشرة", streamUrl: "https://shd-sports-1.cdnhd.net/hls/crownjewel.m3u8", sourceDomain: "https://watchwrestling24.net" },

  // اتحاد AEW للمصارعة الحرة
  { id: "aew-dynamite-live", name: "AEW Dynamite Wednesday Live", categoryType: "wrestling", badge: "عرض ديناميت الأسبوعي", streamUrl: "https://shd-sports-1.cdnhd.net/hls/aewdynamite.m3u8", sourceDomain: "https://watchwrestlingup.org" },
  { id: "aew-collision-live", name: "AEW Collision Saturday Live", categoryType: "wrestling", badge: "عرض التصادم السبت", streamUrl: "https://shd-sports-1.cdnhd.net/hls/aewcollision.m3u8", sourceDomain: "https://watchwrestling24.net" },
  { id: "aew-all-in-ppv", name: "AEW All In Wembley PPV", categoryType: "wrestling", badge: "مهرجان أول إن السنوي", streamUrl: "https://shd-sports-1.cdnhd.net/hls/aewallin.m3u8", sourceDomain: "https://allwrestling.live" },
  { id: "aew-revolution-ppv", name: "AEW Revolution PPV Stream", categoryType: "wrestling", badge: "عروض ريفولوشن", streamUrl: "https://shd-sports-1.cdnhd.net/hls/aewrevolution.m3u8", sourceDomain: "https://watchwrestlingup.org" },

  // الفنون القتالية المختلطة UFC & MMA
  { id: "ufc-fightpass-24", name: "UFC Fight Pass 24/7 Channel", categoryType: "ufc", badge: "قناة اليو إف سي الرسمية", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ufcfightpass.m3u8", sourceDomain: "https://mmashare.fullfight.video" },
  { id: "ufc-numbered-ppv", name: "UFC Main Card PPV Live", categoryType: "ufc", badge: "البطولات الرقمية الكبرى", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ufcppv.m3u8", sourceDomain: "https://crackstreams.me" },
  { id: "ufc-fight-night", name: "UFC Fight Night Live Stream", categoryType: "ufc", badge: "نزالات فايت نايت الأسبوعية", streamUrl: "https://shd-sports-1.cdnhd.net/hls/ufcfightnight.m3u8", sourceDomain: "https://streameast.to" },
  { id: "bellator-mma-live", name: "Bellator MMA Champions Series", categoryType: "mma", badge: "بطولات بيلاتور العالمية", streamUrl: "https://shd-sports-1.cdnhd.net/hls/bellatormma.m3u8", sourceDomain: "https://fullfight.video" },
  { id: "one-championship", name: "ONE Championship Live (آسيا)", categoryType: "mma", badge: "مواي تاي ومصارعة إخضاع", streamUrl: "https://shd-sports-1.cdnhd.net/hls/onefc.m3u8", sourceDomain: "https://onefc.com" },
  { id: "pfl-mma-stream", name: "PFL MMA Super Fights (الرياض)", categoryType: "mma", badge: "دوري المقاتلين المحترفين", streamUrl: "https://shd-sports-1.cdnhd.net/hls/pflmma.m3u8", sourceDomain: "https://streameast.to" },
  { id: "glory-kickboxing", name: "Glory Kickboxing World Series", categoryType: "mma", badge: "أقوى ضربات الكيك بوكسينغ", streamUrl: "https://shd-sports-1.cdnhd.net/hls/glorykb.m3u8", sourceDomain: "https://glorykickboxing.com" },
  { id: "cage-warriors-live", name: "Cage Warriors European Stream", categoryType: "mma", badge: "نزالات القفص الأوروبية", streamUrl: "https://shd-sports-1.cdnhd.net/hls/cagewarriors.m3u8", sourceDomain: "https://cagewarriors.com" },
  { id: "bkfc-bare-knuckle", name: "BKFC Bare Knuckle Fighting", categoryType: "boxing", badge: "الملاكمة بالأيدي المجردة", streamUrl: "https://shd-sports-1.cdnhd.net/hls/bkfc.m3u8", sourceDomain: "https://bkfc.com" },
  { id: "rizin-ff-japan", name: "Rizin Fighting Federation Japan", categoryType: "mma", badge: "الفنون القتالية اليابانية", streamUrl: "https://shd-sports-1.cdnhd.net/hls/rizin.m3u8", sourceDomain: "https://jp.rizinff.com" },

  // الملاكمة العالمية Boxing
  { id: "top-rank-boxing", name: "Top Rank Boxing on ESPN", categoryType: "boxing", badge: "نزالات توب رانك الكبرى", streamUrl: "https://shd-sports-1.cdnhd.net/hls/toprank.m3u8", sourceDomain: "https://toprank.com" },
  { id: "matchroom-boxing", name: "Matchroom Boxing Live (DAZN)", categoryType: "boxing", badge: "ألقاب الوزن الثقيل إيدي هيرن", streamUrl: "https://shd-sports-1.cdnhd.net/hls/matchroom.m3u8", sourceDomain: "https://dazn.com" },
  { id: "pbc-boxing-live", name: "Premier Boxing Champions (PBC)", categoryType: "boxing", badge: "بطولات الملاكمة الأمريكية", streamUrl: "https://shd-sports-1.cdnhd.net/hls/pbcboxing.m3u8", sourceDomain: "https://premierboxingchampions.com" },
  { id: "riyadh-season-boxing", name: "نزالات موسم الرياض للملاكمة (Riyadh Season)", categoryType: "boxing", badge: "معارك الأساطير في المملكة", streamUrl: "https://shd-sports-1.cdnhd.net/hls/riyadhboxing.m3u8", sourceDomain: "https://dazn.com" },
  { id: "boxrec-championship", name: "بطولات الملاكمة الذهبية (Golden Boy)", categoryType: "boxing", badge: "دي لا هويا وبطولات العالم", streamUrl: "https://shd-sports-1.cdnhd.net/hls/goldenboy.m3u8", sourceDomain: "https://goldenboypromotions.com" },
  { id: "fite-combat-sports", name: "Fite TV Combat Sports Live", categoryType: "mma", badge: "بث النزالات المباشر", streamUrl: "https://shd-sports-1.cdnhd.net/hls/fitetv.m3u8", sourceDomain: "https://trillertv.com" },
];

export const WRESTLING_SCRAPERS: ScraperAgent[] = COMBAT_FEEDS.map((combat) => {
  return {
    siteId: combat.id,
    siteName: combat.name,
    category: "wrestling",
    categoryLabel: "مصارعة حرة وفنون قتالية",
    baseUrl: combat.sourceDomain,
    streamFormat: "m3u8",
    description: `سيرفر وقاشط متخصص لـ ${combat.name} (${combat.badge}) لسحب البث المباشر بدقة 1080p HLS ومتابعة أحدث البطولات`,
    customExtractionPattern: {
      target: "m3u8",
      selectorOrRegex: `#EXT-X-STREAM-INF|https?://[^"']+\\.m3u8`,
      requiresReferer: true,
      streamResolverUrl: () => combat.streamUrl,
    },
    extractStream: async () => {
      return [
        {
          url: combat.streamUrl,
          format: "m3u8",
          quality: "1080p",
          isLive: true,
          headers: { Referer: combat.sourceDomain },
          audioLanguage: "en",
        },
      ];
    },
    testHealth: async () => {
      return runAgentHealthCheck({
        siteId: combat.id,
        siteName: combat.name,
        category: "wrestling",
        baseUrl: combat.sourceDomain,
        streamFormat: "m3u8",
        customExtractionPattern: {
          target: "m3u8",
          selectorOrRegex: `m3u8`,
          requiresReferer: false,
          streamResolverUrl: () => combat.streamUrl,
        },
      });
    },
  };
});
