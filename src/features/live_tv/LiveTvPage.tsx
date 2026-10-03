import { useState, useMemo } from "react";
import { Radio, Trophy, Play, Search, X, Tv, Star } from "lucide-react";
import { Card, Badge } from "../../design_system/components";

export interface LiveChannel {
  id: string;
  name: string;
  country: string;
  category: "sports" | "news" | "movies" | "entertainment" | "kids" | "religious" | "documentary" | "music";
  url: string;
  logo?: string;
}

export interface LiveMatch {
  id: string;
  home: string;
  away: string;
  time: string;
  tournament: string;
  url: string;
}

export const COUNTRIES = [
  { code: "all", name: "الكل", flag: "🌐" },
  { code: "sa", name: "السعودية", flag: "🇸🇦" },
  { code: "eg", name: "مصر", flag: "🇪🇬" },
  { code: "ae", name: "الإمارات", flag: "🇦🇪" },
  { code: "qa", name: "قطر", flag: "🇶🇦" },
  { code: "kw", name: "الكويت", flag: "🇰🇼" },
  { code: "bh", name: "البحرين", flag: "🇧🇭" },
  { code: "om", name: "عُمان", flag: "🇴🇲" },
  { code: "jo", name: "الأردن", flag: "🇯🇴" },
  { code: "lb", name: "لبنان", flag: "🇱🇧" },
  { code: "ps", name: "فلسطين", flag: "🇵🇸" },
  { code: "sy", name: "سوريا", flag: "🇸🇾" },
  { code: "iq", name: "العراق", flag: "🇮🇶" },
  { code: "ma", name: "المغرب", flag: "🇲🇦" },
  { code: "dz", name: "الجزائر", flag: "🇩🇿" },
  { code: "tn", name: "تونس", flag: "🇹🇳" },
  { code: "ly", name: "ليبيا", flag: "🇱🇾" },
  { code: "sd", name: "السودان", flag: "🇸🇩" },
  { code: "int", name: "عالمي", flag: "🌍" },
];

export const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "favorites", label: "⭐ المفضلة" },
  { id: "sports", label: "رياضة" },
  { id: "news", label: "أخبار" },
  { id: "movies", label: "أفلام ومسلسلات" },
  { id: "entertainment", label: "ترفيه ومنوعات" },
  { id: "kids", label: "أطفال وكرتون" },
  { id: "religious", label: "إسلامية وقرآن" },
  { id: "documentary", label: "وثائقي ومعرفة" },
  { id: "music", label: "موسيقى وفن" },
];

export const CHANNELS: LiveChannel[] = [
  // ==================== SAUDI ARABIA ====================
  { id: "sa-1", name: "السعودية الأولى (KSA 1)", country: "sa", category: "entertainment", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:saudi1.smil/playlist.m3u8" },
  { id: "sa-quran", name: "القرآن الكريم (مكة مباشر)", country: "sa", category: "religious", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:quran.smil/playlist.m3u8" },
  { id: "sa-sunnah", name: "السنة النبوية (المدينة مباشر)", country: "sa", category: "religious", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:sunnah.smil/playlist.m3u8" },
  { id: "sa-ekhbariya", name: "الإخبارية السعودية", country: "sa", category: "news", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:ekhbariya.smil/playlist.m3u8" },
  { id: "sa-sbc", name: "قناة SBC السعودية", country: "sa", category: "entertainment", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:sbc.smil/playlist.m3u8" },
  { id: "sa-sports-1", name: "السعودية الرياضية 1", country: "sa", category: "sports", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:ksasports1.smil/playlist.m3u8" },
  { id: "sa-sports-2", name: "السعودية الرياضية 2", country: "sa", category: "sports", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:ksasports2.smil/playlist.m3u8" },
  { id: "sa-sports-3", name: "السعودية الرياضية 3", country: "sa", category: "sports", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:ksasports3.smil/playlist.m3u8" },
  { id: "sa-sports-4", name: "السعودية الرياضية 4", country: "sa", category: "sports", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:ksasports4.smil/playlist.m3u8" },
  { id: "sa-rotana-cinema", name: "روتانا سينما", country: "sa", category: "movies", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:rotanacinema.smil/playlist.m3u8" },
  { id: "sa-rotana-classic", name: "روتانا كلاسيك", country: "sa", category: "movies", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:rotanaclassic.smil/playlist.m3u8" },
  { id: "sa-rotana-drama", name: "روتانا دراما", country: "sa", category: "entertainment", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:rotanadrama.smil/playlist.m3u8" },
  { id: "sa-rotana-khalijia", name: "روتانا خليجية", country: "sa", category: "entertainment", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:rotanakhalijia.smil/playlist.m3u8" },
  { id: "sa-rotana-comedy", name: "روتانا كوميدي", country: "sa", category: "entertainment", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:rotanacomedy.smil/playlist.m3u8" },
  { id: "sa-rotana-music", name: "روتانا موسيقى", country: "sa", category: "music", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:rotanamusic.smil/playlist.m3u8" },
  { id: "sa-alarabiya", name: "العربية (Al Arabiya)", country: "sa", category: "news", url: "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8" },
  { id: "sa-alhadath", name: "الحدث (Al Hadath)", country: "sa", category: "news", url: "https://live.alarabiya.net/alarabiapublish/alhadath.smil/playlist.m3u8" },
  { id: "sa-asharq", name: "الشرق للأخبار (Asharq)", country: "sa", category: "news", url: "https://asharq.akamaized.net/hls/live/2017125/asharq/master.m3u8" },
  { id: "sa-resalah", name: "قناة الرسالة", country: "sa", category: "religious", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:resalah.smil/playlist.m3u8" },
  { id: "sa-zad", name: "قناة زاد العلمية", country: "sa", category: "religious", url: "https://stream.zad.tv/live/smil:live.smil/playlist.m3u8" },

  // ==================== EGYPT ====================
  { id: "eg-oula", name: "القناة الأولى المصرية", country: "eg", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/aloula_egypt@297929/playlist.m3u8" },
  { id: "eg-thanya", name: "القناة الثانية المصرية", country: "eg", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/althanya_egypt@297929/playlist.m3u8" },
  { id: "eg-nile-news", name: "نايل نيوز (Nile News)", country: "eg", category: "news", url: "https://hiplayer.hibridcdn.net/t/nile_news@297929/playlist.m3u8" },
  { id: "eg-nile-drama", name: "نايل دراما (Nile Drama)", country: "eg", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/nile_drama@297929/playlist.m3u8" },
  { id: "eg-nile-life", name: "نايل لايف (Nile Life)", country: "eg", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/nile_life@297929/playlist.m3u8" },
  { id: "eg-nile-cinema", name: "نايل سينما (Nile Cinema)", country: "eg", category: "movies", url: "https://hiplayer.hibridcdn.net/t/nile_cinema@297929/playlist.m3u8" },
  { id: "eg-nile-intl", name: "نايل الدولية (Nile TV)", country: "eg", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/nile_international@297929/playlist.m3u8" },
  { id: "eg-dmc", name: "قناة DMC العامة", country: "eg", category: "entertainment", url: "https://dmc-live.erc.cdn.ooredoo.mobi/dmc/smil:dmc1.smil/playlist.m3u8" },
  { id: "eg-dmc-drama", name: "قناة DMC دراما", country: "eg", category: "entertainment", url: "https://dmc-live.erc.cdn.ooredoo.mobi/dmc/smil:dmcdrama.smil/playlist.m3u8" },
  { id: "eg-cbc", name: "قناة CBC العامة", country: "eg", category: "entertainment", url: "https://cbc-live.erc.cdn.ooredoo.mobi/cbc/smil:cbc1.smil/playlist.m3u8" },
  { id: "eg-cbc-drama", name: "قناة CBC دراما", country: "eg", category: "entertainment", url: "https://cbc-live.erc.cdn.ooredoo.mobi/cbc/smil:cbcdrama.smil/playlist.m3u8" },
  { id: "eg-cbc-extra", name: "إكسترا نيوز (Extra News)", country: "eg", category: "news", url: "https://cbc-live.erc.cdn.ooredoo.mobi/cbc/smil:extranews.smil/playlist.m3u8" },
  { id: "eg-one", name: "قناة ON E", country: "eg", category: "entertainment", url: "https://on-live.erc.cdn.ooredoo.mobi/on/smil:one1.smil/playlist.m3u8" },
  { id: "eg-on-drama", name: "قناة ON دراما", country: "eg", category: "entertainment", url: "https://on-live.erc.cdn.ooredoo.mobi/on/smil:ondrama.smil/playlist.m3u8" },
  { id: "eg-on-sports", name: "أون تايم سبورتس (ON Time)", country: "eg", category: "sports", url: "https://on-live.erc.cdn.ooredoo.mobi/on/smil:onsports.smil/playlist.m3u8" },
  { id: "eg-hayah", name: "شبكة تلفزيون الحياة", country: "eg", category: "entertainment", url: "https://alhayah-live.erc.cdn.ooredoo.mobi/alhayah/smil:alhayah1.smil/playlist.m3u8" },
  { id: "eg-hayah-drama", name: "الحياة دراما", country: "eg", category: "entertainment", url: "https://alhayah-live.erc.cdn.ooredoo.mobi/alhayah/smil:alhayahdrama.smil/playlist.m3u8" },
  { id: "eg-nahar", name: "قناة النهار المصرية", country: "eg", category: "entertainment", url: "https://alnahar-live.erc.cdn.ooredoo.mobi/alnahar/smil:alnahar1.smil/playlist.m3u8" },
  { id: "eg-nahar-drama", name: "النهار دراما", country: "eg", category: "entertainment", url: "https://alnahar-live.erc.cdn.ooredoo.mobi/alnahar/smil:alnahardrama.smil/playlist.m3u8" },
  { id: "eg-ten", name: "قناة Ten TV", country: "eg", category: "entertainment", url: "https://tentv-live.erc.cdn.ooredoo.mobi/tentv/smil:tentv.smil/playlist.m3u8" },
  { id: "eg-mehwar", name: "قناة المحور", country: "eg", category: "entertainment", url: "https://mehwar-live.erc.cdn.ooredoo.mobi/mehwar/smil:mehwar.smil/playlist.m3u8" },
  { id: "eg-sada", name: "صدى البلد", country: "eg", category: "entertainment", url: "https://sadabalad-live.erc.cdn.ooredoo.mobi/sada/smil:sada1.smil/playlist.m3u8" },
  { id: "eg-cairo-news", name: "القاهرة الإخبارية", country: "eg", category: "news", url: "https://caironews-live.erc.cdn.ooredoo.mobi/cairo/smil:cairo.smil/playlist.m3u8" },
  { id: "eg-nas", name: "قناة الناس الدينية", country: "eg", category: "religious", url: "https://alnas-live.erc.cdn.ooredoo.mobi/nas/smil:nas.smil/playlist.m3u8" },
  { id: "eg-azhari", name: "قناة أزهري", country: "eg", category: "religious", url: "https://azhari-live.erc.cdn.ooredoo.mobi/azhari/smil:azhari.smil/playlist.m3u8" },

  // ==================== UNITED ARAB EMIRATES ====================
  { id: "ae-dubai-tv", name: "تلفزيون دبي (Dubai TV)", country: "ae", category: "entertainment", url: "https://dmivll.mangomolo.com/dubaitv/smil:dubaitv.stream.smil/playlist.m3u8" },
  { id: "ae-dubai-one", name: "دبي ون (Dubai One)", country: "ae", category: "movies", url: "https://dmivll.mangomolo.com/dubaione/smil:dubaione.stream.smil/playlist.m3u8" },
  { id: "ae-sama-dubai", name: "سما دبي (Sama Dubai)", country: "ae", category: "entertainment", url: "https://dmivll.mangomolo.com/samadubai/smil:samadubai.stream.smil/playlist.m3u8" },
  { id: "ae-dubai-sports1", name: "دبي الرياضية 1", country: "ae", category: "sports", url: "https://dmivll.mangomolo.com/dubaisports/smil:dubaisports.stream.smil/playlist.m3u8" },
  { id: "ae-dubai-sports2", name: "دبي الرياضية 2", country: "ae", category: "sports", url: "https://dmivll.mangomolo.com/dubaisports2/smil:dubaisports2.stream.smil/playlist.m3u8" },
  { id: "ae-dubai-racing", name: "دبي ريسنج (Dubai Racing)", country: "ae", category: "sports", url: "https://dmivll.mangomolo.com/dubairacing/smil:dubairacing.stream.smil/playlist.m3u8" },
  { id: "ae-noor-dubai", name: "نور دبي (Noor Dubai)", country: "ae", category: "religious", url: "https://dmivll.mangomolo.com/noordubai/smil:noordubai.stream.smil/playlist.m3u8" },
  { id: "ae-abudhabi-tv", name: "قناة أبوظبي (Abu Dhabi TV)", country: "ae", category: "entertainment", url: "https://admdn1.cdn.mangomolo.com/adtv/smil:adtv.stream.smil/playlist.m3u8" },
  { id: "ae-emarat", name: "قناة الإمارات (Al Emarat)", country: "ae", category: "entertainment", url: "https://admdn1.cdn.mangomolo.com/al-emarat/smil:al-emarat.stream.smil/playlist.m3u8" },
  { id: "ae-adsports-1", name: "أبوظبي الرياضية 1", country: "ae", category: "sports", url: "https://admdn1.cdn.mangomolo.com/adsports1/smil:adsports1.stream.smil/playlist.m3u8" },
  { id: "ae-adsports-2", name: "أبوظبي الرياضية 2", country: "ae", category: "sports", url: "https://admdn1.cdn.mangomolo.com/adsports2/smil:adsports2.stream.smil/playlist.m3u8" },
  { id: "ae-yas-sports", name: "قناة ياس الرياضية (YAS)", country: "ae", category: "sports", url: "https://admdn1.cdn.mangomolo.com/yas/smil:yas.stream.smil/playlist.m3u8" },
  { id: "ae-sharjah-tv", name: "تلفزيون الشارقة", country: "ae", category: "entertainment", url: "https://sba-hls.mangomolo.com/sharjah/smil:sharjah.stream.smil/playlist.m3u8" },
  { id: "ae-sharjah-sports", name: "الشارقة الرياضية", country: "ae", category: "sports", url: "https://sba-hls.mangomolo.com/sharjah-sports/smil:sharjah-sports.stream.smil/playlist.m3u8" },
  { id: "ae-alwousta", name: "قناة الوسطى من الذيد", country: "ae", category: "documentary", url: "https://sba-hls.mangomolo.com/wousta/smil:wousta.stream.smil/playlist.m3u8" },
  { id: "ae-sharqiya", name: "الشرقية من كلباء", country: "ae", category: "entertainment", url: "https://sba-hls.mangomolo.com/sharqiya/smil:sharqiya.stream.smil/playlist.m3u8" },
  { id: "ae-dhafra", name: "قناة الظفرة", country: "ae", category: "entertainment", url: "https://dhafra-live.erc.cdn.ooredoo.mobi/dhafra/smil:dhafra.smil/playlist.m3u8" },
  { id: "ae-skynews-ar", name: "سكاي نيوز عربية (Sky News)", country: "ae", category: "news", url: "https://stream.skynewsarabia.com/hls/sna.m3u8" },
  { id: "ae-majid", name: "ماجد للأطفال (Majid Kids)", country: "ae", category: "kids", url: "https://admdn1.cdn.mangomolo.com/majid/smil:majid.stream.smil/playlist.m3u8" },

  // ==================== QATAR ====================
  { id: "qa-aljazeera-ar", name: "الجزيرة الإخبارية (Al Jazeera)", country: "qa", category: "news", url: "https://live-hls-web-aje.getaj.net/AJE/01.m3u8" },
  { id: "qa-aljazeera-en", name: "Al Jazeera English", country: "qa", category: "news", url: "https://live-hls-web-aje.getaj.net/AJE-EN/01.m3u8" },
  { id: "qa-aljazeera-mubasher", name: "الجزيرة مباشر", country: "qa", category: "news", url: "https://live-hls-web-ajm.getaj.net/AJM/01.m3u8" },
  { id: "qa-aljazeera-doc", name: "الجزيرة الوثائقية", country: "qa", category: "documentary", url: "https://live-hls-web-ajd.getaj.net/AJD/01.m3u8" },
  { id: "qa-qatar-tv", name: "تلفزيون قطر (Qatar TV)", country: "qa", category: "entertainment", url: "https://qtv-live.erc.cdn.ooredoo.mobi/qtv/smil:qtv1.smil/playlist.m3u8" },
  { id: "qa-alrayyan", name: "قناة الريان", country: "qa", category: "entertainment", url: "https://alrayyan-live.erc.cdn.ooredoo.mobi/alrayyan/smil:alrayyan1.smil/playlist.m3u8" },
  { id: "qa-alkass-1", name: "قناة الكأس 1 (Al Kass 1)", country: "qa", category: "sports", url: "https://live.alkassdigital.net/alkass/one/index.m3u8" },
  { id: "qa-alkass-2", name: "قناة الكأس 2 (Al Kass 2)", country: "qa", category: "sports", url: "https://live.alkassdigital.net/alkass/two/index.m3u8" },
  { id: "qa-alkass-4", name: "قناة الكأس 4 (Al Kass 4)", country: "qa", category: "sports", url: "https://live.alkassdigital.net/alkass/four/index.m3u8" },
  { id: "qa-baraem", name: "براعم للأطفال (Baraem)", country: "qa", category: "kids", url: "https://baraem-live.erc.cdn.ooredoo.mobi/baraem/smil:baraem.smil/playlist.m3u8" },
  { id: "qa-jeem", name: "جيم للأطفال (Jeem TV)", country: "qa", category: "kids", url: "https://jeem-live.erc.cdn.ooredoo.mobi/jeem/smil:jeem.smil/playlist.m3u8" },

  // ==================== KUWAIT ====================
  { id: "kw-tv1", name: "تلفزيون الكويت 1", country: "kw", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/kuwait_1@297929/playlist.m3u8" },
  { id: "kw-tv2", name: "تلفزيون الكويت 2", country: "kw", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/kuwait_2@297929/playlist.m3u8" },
  { id: "kw-sports", name: "الكويت الرياضية", country: "kw", category: "sports", url: "https://hiplayer.hibridcdn.net/t/kuwait_sports@297929/playlist.m3u8" },
  { id: "kw-qurain", name: "قناة القرين التراثية", country: "kw", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/kuwait_qurain@297929/playlist.m3u8" },
  { id: "kw-arabi", name: "الكويت العربي", country: "kw", category: "documentary", url: "https://hiplayer.hibridcdn.net/t/kuwait_arabi@297929/playlist.m3u8" },
  { id: "kw-ithraa", name: "قناة إثراء الدينية", country: "kw", category: "religious", url: "https://hiplayer.hibridcdn.net/t/kuwait_ithraa@297929/playlist.m3u8" },

  // ==================== BAHRAIN & OMAN ====================
  { id: "bh-tv", name: "تلفزيون البحرين", country: "bh", category: "entertainment", url: "https://btv-live.erc.cdn.ooredoo.mobi/btv/smil:btv1.smil/playlist.m3u8" },
  { id: "bh-sports-1", name: "البحرين الرياضية 1", country: "bh", category: "sports", url: "https://btv-live.erc.cdn.ooredoo.mobi/btv/smil:bsports1.smil/playlist.m3u8" },
  { id: "bh-sports-2", name: "البحرين الرياضية 2", country: "bh", category: "sports", url: "https://btv-live.erc.cdn.ooredoo.mobi/btv/smil:bsports2.smil/playlist.m3u8" },
  { id: "bh-quran", name: "البحرين القرآن الكريم", country: "bh", category: "religious", url: "https://btv-live.erc.cdn.ooredoo.mobi/btv/smil:bquran.smil/playlist.m3u8" },
  { id: "om-tv", name: "تلفزيون سلطنة عُمان", country: "om", category: "entertainment", url: "https://omantv-live.erc.cdn.ooredoo.mobi/omantv/smil:omantv1.smil/playlist.m3u8" },
  { id: "om-sports", name: "عُمان الرياضية", country: "om", category: "sports", url: "https://omantv-live.erc.cdn.ooredoo.mobi/omantv/smil:osports.smil/playlist.m3u8" },
  { id: "om-live", name: "عُمان مباشر", country: "om", category: "news", url: "https://omantv-live.erc.cdn.ooredoo.mobi/omantv/smil:omantvlive.smil/playlist.m3u8" },
  { id: "om-culture", name: "عُمان الثقافية", country: "om", category: "documentary", url: "https://omantv-live.erc.cdn.ooredoo.mobi/omantv/smil:oculture.smil/playlist.m3u8" },

  // ==================== JORDAN, LEBANON, SYRIA, PALESTINE ====================
  { id: "jo-tv", name: "التلفزيون الأردني", country: "jo", category: "entertainment", url: "https://jrtv-live.erc.cdn.ooredoo.mobi/jrtv/smil:jrtv1.smil/playlist.m3u8" },
  { id: "jo-sports", name: "الأردن الرياضية", country: "jo", category: "sports", url: "https://jrtv-live.erc.cdn.ooredoo.mobi/jrtv/smil:jsports.smil/playlist.m3u8" },
  { id: "jo-roya", name: "قناة رؤيا (Roya TV)", country: "jo", category: "entertainment", url: "https://royatv.erc.cdn.ooredoo.mobi/roya/smil:roya.smil/playlist.m3u8" },
  { id: "jo-roya-drama", name: "رؤيا دراما", country: "jo", category: "entertainment", url: "https://royatv.erc.cdn.ooredoo.mobi/roya/smil:royadrama.smil/playlist.m3u8" },
  { id: "jo-roya-news", name: "رؤيا الإخبارية", country: "jo", category: "news", url: "https://royatv.erc.cdn.ooredoo.mobi/roya/smil:royanews.smil/playlist.m3u8" },
  { id: "lb-lbci", name: "قناة LBCI اللبنانية", country: "lb", category: "entertainment", url: "https://hiplayer.hibridcdn.net/t/lbci@297929/playlist.m3u8" },
  { id: "lb-mtv", name: "إم تي في اللبنانية (MTV)", country: "lb", category: "entertainment", url: "https://mtv-live.erc.cdn.ooredoo.mobi/mtv/smil:mtv1.smil/playlist.m3u8" },
  { id: "lb-aljadeed", name: "قناة الجديد (Al Jadeed)", country: "lb", category: "entertainment", url: "https://aljadeed-live.erc.cdn.ooredoo.mobi/aljadeed/smil:aljadeed.smil/playlist.m3u8" },
  { id: "lb-teleliban", name: "تلفزيون لبنان الرسمي", country: "lb", category: "entertainment", url: "https://teleliban-live.erc.cdn.ooredoo.mobi/tl/smil:tl.smil/playlist.m3u8" },
  { id: "lb-nbn", name: "شبكة NBN اللبنانية", country: "lb", category: "news", url: "https://nbn-live.erc.cdn.ooredoo.mobi/nbn/smil:nbn.smil/playlist.m3u8" },
  { id: "lb-almanar", name: "قناة المنار", country: "lb", category: "religious", url: "https://hiplayer.hibridcdn.net/t/almanar@297929/playlist.m3u8" },
  { id: "ps-palestine-tv", name: "تلفزيون فلسطين الرسمي", country: "ps", category: "news", url: "https://pbc-live.erc.cdn.ooredoo.mobi/pbc/smil:palestinetv.smil/playlist.m3u8" },
  { id: "ps-palestine-live", name: "فلسطين مباشر", country: "ps", category: "news", url: "https://pbc-live.erc.cdn.ooredoo.mobi/pbc/smil:palestinelive.smil/playlist.m3u8" },
  { id: "ps-alaqsa", name: "قناة الأقصى الفضائية", country: "ps", category: "news", url: "https://live.alaqsa.tv/aqsaphd/myStream/playlist.m3u8" },
  { id: "ps-falastin-alyawm", name: "فلسطين اليوم", country: "ps", category: "news", url: "https://falastin-live.erc.cdn.ooredoo.mobi/falyawm/smil:falyawm.smil/playlist.m3u8" },
  { id: "sy-satellite", name: "الفضائية السورية", country: "sy", category: "entertainment", url: "https://syriatv-live.erc.cdn.ooredoo.mobi/syriatv/smil:syriatv.smil/playlist.m3u8" },
  { id: "sy-drama", name: "سورية دراما", country: "sy", category: "entertainment", url: "https://syriatv-live.erc.cdn.ooredoo.mobi/syriatv/smil:syriadrama.smil/playlist.m3u8" },
  { id: "sy-sama", name: "قناة سما الفضائية", country: "sy", category: "entertainment", url: "https://samatv-live.erc.cdn.ooredoo.mobi/sama/smil:sama.smil/playlist.m3u8" },
  { id: "sy-syriatv", name: "تلفزيون سوريا (إسطنبول)", country: "sy", category: "news", url: "https://syriatvnet-live.erc.cdn.ooredoo.mobi/syriatvnet/smil:syriatvnet.smil/playlist.m3u8" },

  // ==================== IRAQ ====================
  { id: "iq-iraqiya", name: "قناة العراقية الإخبارية", country: "iq", category: "news", url: "https://cdn.cri.megalive.tv/hls/kbsworld.m3u8" },
  { id: "iq-iraqiya-gen", name: "شبكة الإعلام العراقي (العامة)", country: "iq", category: "entertainment", url: "https://imn-live.erc.cdn.ooredoo.mobi/imn/smil:imn.smil/playlist.m3u8" },
  { id: "iq-iraqiya-sports", name: "العراقية الرياضية", country: "iq", category: "sports", url: "https://imn-live.erc.cdn.ooredoo.mobi/imn/smil:imnsports.smil/playlist.m3u8" },
  { id: "iq-sharqiya", name: "قناة الشرقية نيوز", country: "iq", category: "news", url: "https://alsharqiya-live.erc.cdn.ooredoo.mobi/sharqiya/smil:sharqiya.smil/playlist.m3u8" },
  { id: "iq-dijlah", name: "قناة دجلة الفضائية", country: "iq", category: "entertainment", url: "https://dijlah-live.erc.cdn.ooredoo.mobi/dijlah/smil:dijlah.smil/playlist.m3u8" },
  { id: "iq-sumeria", name: "قناة السومرية الفضائية", country: "iq", category: "entertainment", url: "https://alsumeria-live.erc.cdn.ooredoo.mobi/sumeria/smil:sumeria.smil/playlist.m3u8" },
  { id: "iq-kurdsat", name: "كوردسات (KurdSat)", country: "iq", category: "entertainment", url: "https://kurdsat-live.erc.cdn.ooredoo.mobi/kurdsat/smil:kurdsat.smil/playlist.m3u8" },

  // ==================== MOROCCO, ALGERIA, TUNISIA, LIBYA, SUDAN ====================
  { id: "ma-almaghribia", name: "المغربية الإخبارية (Al Maghribia)", country: "ma", category: "news", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/5760b8d3815aa1dd6c87dc1e0c3a1b91/playlist.m3u8" },
  { id: "ma-2m", name: "دوزيم القناة الثانية (2M Maroc)", country: "ma", category: "entertainment", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/8c69be88a101f3e9b11910ef0b6861fb/playlist.m3u8" },
  { id: "ma-arryadia", name: "الرياضية المغربية (Arryadia)", country: "ma", category: "sports", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/9cbaf691dfa3a78ea38a6a166be4aef5/playlist.m3u8" },
  { id: "ma-aoula", name: "الأولى المغربية (Al Aoula)", country: "ma", category: "entertainment", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/653243d6af7a83d45ef8a901ba1bf3ce/playlist.m3u8" },
  { id: "ma-medi1", name: "ميدي 1 تيفي (Medi1 TV)", country: "ma", category: "news", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/4ba1a88dfabda734f1ae8d2c2c01995f/playlist.m3u8" },
  { id: "ma-telemaroc", name: "تيلي ماروك (Télé Maroc)", country: "ma", category: "entertainment", url: "https://telemaroc-live.erc.cdn.ooredoo.mobi/telemaroc/smil:telemaroc.smil/playlist.m3u8" },
  { id: "ma-assadissa", name: "السادسة الدينية المغربية", country: "ma", category: "religious", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/9d3ef841cf33ef528c771da4b72ef1ba/playlist.m3u8" },
  { id: "dz-entv", name: "التلفزيون الجزائري الأول (ENTV)", country: "dz", category: "entertainment", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/9da8a857dfcbef0d56561f52b61ef2ae/playlist.m3u8" },
  { id: "dz-canal-algerie", name: "كنال ألجيري (Canal Algérie)", country: "dz", category: "entertainment", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/9da8a857dfcbef0d56561f52b61ef2ae/playlist.m3u8" },
  { id: "dz-algerie3", name: "الجزائرية الثالثة (A3)", country: "dz", category: "news", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/748bc635fcceef528c771da4b72ef1ad/playlist.m3u8" },
  { id: "dz-algerie4", name: "الجزائرية الرابعة الأمازيغية", country: "dz", category: "entertainment", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/536ea628fcbaef28c771da4b72ef1cc/playlist.m3u8" },
  { id: "dz-algerie5", name: "الجزائرية الخامسة للقرآن", country: "dz", category: "religious", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/3a598a28ccbaf48a4369a471b87a93cc/playlist.m3u8" },
  { id: "dz-echourouk", name: "قناة الشروق الجزائرية", country: "dz", category: "entertainment", url: "https://echourouk-live.erc.cdn.ooredoo.mobi/echourouk/smil:echourouk.smil/playlist.m3u8" },
  { id: "dz-elbilad", name: "قناة البلاد الجزائرية", country: "dz", category: "news", url: "https://elbilad-live.erc.cdn.ooredoo.mobi/elbilad/smil:elbilad.smil/playlist.m3u8" },
  { id: "tn-wataniya1", name: "الوطنية التونسية 1", country: "tn", category: "entertainment", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/3a598a28ccbaf48a4369a471b87a93ef/playlist.m3u8" },
  { id: "tn-wataniya2", name: "الوطنية التونسية 2", country: "tn", category: "entertainment", url: "https://cdnamd-hls-globecast.akamaized.net/encoded/1c7849e7bdfa14389025e1dfba4953c8/playlist.m3u8" },
  { id: "tn-attessia", name: "قناة التاسعة التونسية", country: "tn", category: "entertainment", url: "https://attessia-live.erc.cdn.ooredoo.mobi/attessia/smil:attessia.smil/playlist.m3u8" },
  { id: "tn-hannibal", name: "قناة حنبعل التونسية", country: "tn", category: "entertainment", url: "https://hannibal-live.erc.cdn.ooredoo.mobi/hannibal/smil:hannibal.smil/playlist.m3u8" },
  { id: "ly-alahrar", name: "ليبيا الأحرار", country: "ly", category: "news", url: "https://libyaalahrar-live.erc.cdn.ooredoo.mobi/alahrar/smil:alahrar.smil/playlist.m3u8" },
  { id: "ly-rasmiya", name: "قناة ليبيا الرسمية", country: "ly", category: "entertainment", url: "https://libya-live.erc.cdn.ooredoo.mobi/libya/smil:libya.smil/playlist.m3u8" },
  { id: "sd-sudan-tv", name: "تلفزيون السودان الرسمي", country: "sd", category: "entertainment", url: "https://sudantv-live.erc.cdn.ooredoo.mobi/sudan/smil:sudan.smil/playlist.m3u8" },

  // ==================== PAN-ARABIC KIDS & CARTOONS ====================
  { id: "kids-spacetoon", name: "سبيستون (Spacetoon)", country: "sa", category: "kids", url: "https://spacetoon-live.erc.cdn.ooredoo.mobi/spacetoon/smil:spacetoon.smil/playlist.m3u8" },
  { id: "kids-toyor", name: "طيور الجنة (Toyor Al Janah)", country: "jo", category: "kids", url: "https://toyor-live.erc.cdn.ooredoo.mobi/toyor/smil:toyor.smil/playlist.m3u8" },
  { id: "kids-karameesh", name: "قناة كراميش (Karameesh)", country: "jo", category: "kids", url: "https://karameesh-live.erc.cdn.ooredoo.mobi/karameesh/smil:karameesh.smil/playlist.m3u8" },
  { id: "kids-rawdat", name: "قناة روضة للأطفال", country: "sa", category: "kids", url: "https://rawdat-live.erc.cdn.ooredoo.mobi/rawdat/smil:rawdat.smil/playlist.m3u8" },
  { id: "kids-atfal", name: "أطفال ومواهب", country: "sa", category: "kids", url: "https://atfal-live.erc.cdn.ooredoo.mobi/atfal/smil:atfal.smil/playlist.m3u8" },

  // ==================== PAN-ARABIC RELIGIOUS ====================
  { id: "rel-almajd-quran", name: "المجد للقرآن الكريم", country: "sa", category: "religious", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:majdquran.smil/playlist.m3u8" },
  { id: "rel-almajd-hadith", name: "المجد للحديث النبوي", country: "sa", category: "religious", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:majdhadith.smil/playlist.m3u8" },
  { id: "rel-iqraa-ar", name: "قناة اقرأ الفضائية (العربية)", country: "sa", category: "religious", url: "https://iqraa-live.erc.cdn.ooredoo.mobi/iqraa/smil:iqraa1.smil/playlist.m3u8" },
  { id: "rel-iqraa-intl", name: "Iqraa International", country: "sa", category: "religious", url: "https://iqraa-live.erc.cdn.ooredoo.mobi/iqraa/smil:iqraaintl.smil/playlist.m3u8" },
  { id: "rel-huda", name: "قناة هدى الإنجليزية (Huda TV)", country: "sa", category: "religious", url: "https://hudatv-live.erc.cdn.ooredoo.mobi/huda/smil:huda.smil/playlist.m3u8" },

  // ==================== INTERNATIONAL IN ARABIC ====================
  { id: "int-bbc-arabic", name: "بي بي سي عربي (BBC Arabic)", country: "int", category: "news", url: "https://vs-hls-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_arabic_tv/pc_hd_abr_v2.m3u8" },
  { id: "int-france24-ar", name: "فرانس 24 عربي (France 24)", country: "int", category: "news", url: "https://static.france24.com/live/F24_AR_LO_HLS/live_web.m3u8" },
  { id: "int-rt-arabic", name: "روسيا اليوم (RT Arabic)", country: "int", category: "news", url: "https://rt-arab.gcdn.co/live/rtarab/playlist.m3u8" },
  { id: "int-trt-arabic", name: "تي آر تي عربي (TRT Arabic)", country: "int", category: "news", url: "https://tv-trtarabic.live.trt.com.tr/master.m3u8" },
  { id: "int-dw-arabic", name: "دويتشه فيله (DW Arabic)", country: "int", category: "news", url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwaarabic/master.m3u8" },
  { id: "int-alhurra", name: "قناة الحرة (Al Hurra)", country: "int", category: "news", url: "https://mbn-channel-01.akamaized.net/hls/live/2015385/alhurra/master.m3u8" },
  { id: "int-euronews-ar", name: "يورونيوز عربي (Euronews)", country: "int", category: "news", url: "https://euronews-euronews-arabic-1-eu.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "int-cgtn-ar", name: "سي جي تي إن العربية (CGTN)", country: "int", category: "news", url: "https://news.cgtn.com/resource/live/arabic/cgtn-arabic.m3u8" },

  // ==================== GLOBAL SPORTS & OUTDOORS ====================
  { id: "sp-redbull", name: "ريد بُل تي في (Red Bull TV)", country: "int", category: "sports", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
  { id: "sp-olympic", name: "القناة الأولمبية (Olympic Channel)", country: "int", category: "sports", url: "https://olympic-live.akamaized.net/hls/live/2002778/olympic/master.m3u8" },
  { id: "sp-motorvision", name: "موتور فيجن (Motorvision TV)", country: "int", category: "sports", url: "https://motorvision-live.akamaized.net/hls/live/2005412/motorvision/master.m3u8" },
  { id: "sp-fightsports", name: "فايت سبورتس (Fight Sports)", country: "int", category: "sports", url: "https://fightsports-live.akamaized.net/hls/live/2004523/fightsports/master.m3u8" },
  { id: "sp-edgesport", name: "إيدج سبورت (Edge Sport)", country: "int", category: "sports", url: "https://edgesport-live.akamaized.net/hls/live/2003891/edgesport/master.m3u8" },
  { id: "sp-sportsgrid", name: "سبورتس جريد (SportsGrid)", country: "int", category: "sports", url: "https://sportsgrid-klowdtv.amagi.tv/playlist.m3u8" },
  { id: "sp-fueltv", name: "فيول تي في للمغامرات (Fuel TV)", country: "int", category: "sports", url: "https://fueltv-live.akamaized.net/hls/live/2004812/fueltv/master.m3u8" },
  { id: "sp-mtrspt1", name: "موتور سبورت 1 (MTRSPT1)", country: "int", category: "sports", url: "https://mtrspt1-live.akamaized.net/hls/live/2007812/mtrspt1/master.m3u8" },
  { id: "sp-poker", name: "بطولات البوكر العالمية (WPT)", country: "int", category: "sports", url: "https://wpt-samsung.amagi.tv/playlist.m3u8" },

  // ==================== GLOBAL NEWS (ENGLISH & INTERNATIONAL) ====================
  { id: "news-cnn", name: "سي إن إن إنترناشونال (CNN)", country: "int", category: "news", url: "https://cnn-cnninternational-1-gb.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "news-euronews-en", name: "يورونيوز الدولية (Euronews English)", country: "int", category: "news", url: "https://euronews-euronews-world-1-au.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "news-bloomberg", name: "بلومبرغ الاقتصادية (Bloomberg TV)", country: "int", category: "news", url: "https://bloomberg.com/media-manifest/streams/us.m3u8" },
  { id: "news-abc", name: "إيه بي سي نيوز لايف (ABC News Live)", country: "int", category: "news", url: "https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8" },
  { id: "news-cbs", name: "سي بي إس نيوز لايف (CBS News 24/7)", country: "int", category: "news", url: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f13459e980b5e786b03914a/master.m3u8" },
  { id: "news-nbc", name: "إن بي سي نيوز ناو (NBC News NOW)", country: "int", category: "news", url: "https://nbcnews-lh.akamaihd.net/i/nbcnews_hls@107412/master.m3u8" },
  { id: "news-skynews-uk", name: "سكاي نيوز البريطانية (Sky News UK)", country: "int", category: "news", url: "https://skynews-live.akamaized.net/hls/live/2002777/skynews/master.m3u8" },
  { id: "news-reuters", name: "رويترز تي في (Reuters TV)", country: "int", category: "news", url: "https://reuters-reuters-1-us.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "news-nhk", name: "إن إتش كيه اليابانية (NHK World)", country: "int", category: "news", url: "https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8" },
  { id: "news-tvp", name: "تي في بي وورلد (TVP World)", country: "int", category: "news", url: "https://stream.tvp.pl/live/hls/tvpworld/master.m3u8" },
  { id: "news-france24-ar", name: "فرانس 24 عربي (France 24 AR)", country: "int", category: "news", url: "https://stream.france24.com/hls/live/2037768/F24_AR_HI/master.m3u8" },
  { id: "news-france24-en", name: "France 24 English", country: "int", category: "news", url: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8" },
  { id: "news-bbc-ar", name: "بي بي سي عربي (BBC Arabic)", country: "int", category: "news", url: "https://stream.ecable.tv/bbc-arabic/index.m3u8" },
  { id: "news-dw-en", name: "DW English (ألمانيا)", country: "int", category: "news", url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream1/master.m3u8" },

  // ==================== DOCUMENTARY & SCIENCE ====================
  { id: "doc-dw", name: "دويتشه فيله وثائقي (DW Doc)", country: "int", category: "documentary", url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream4/master.m3u8" },
  { id: "doc-cgtn", name: "سي جي تي إن وثائقي (CGTN Doc)", country: "int", category: "documentary", url: "https://news.cgtn.com/resource/live/document/cgtn-doc.m3u8" },
  { id: "doc-nasa", name: "وكالة ناسا الفضائية (NASA TV)", country: "int", category: "documentary", url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8" },
  { id: "doc-docubox", name: "دوكيو بوكس العالمية (DocuBox)", country: "int", category: "documentary", url: "https://docubox-live.akamaized.net/hls/live/2006712/docubox/master.m3u8" },
  { id: "doc-rtdoc", name: "آر تي الوثائقية (RT Documentary)", country: "int", category: "documentary", url: "https://rt-doc.gcdn.co/live/rtdoc/playlist.m3u8" },

  // ==================== MOVIES, ACTION & INTERNATIONAL ENTERTAINMENT ====================
  { id: "mov-filmrise-action", name: "فيلم رايز أكشن (FilmRise Action)", country: "int", category: "movies", url: "https://filmrise-action-1-us.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "mov-filmrise-comedy", name: "فيلم رايز كوميدي (FilmRise Comedy)", country: "int", category: "movies", url: "https://filmrise-comedy-1-us.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "mov-filmrise-classic", name: "فيلم رايز كلاسيك (FilmRise Classic)", country: "int", category: "movies", url: "https://filmrise-classic-tv-1-us.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "mov-filmrise-western", name: "فيلم رايز ويسترن (FilmRise Western)", country: "int", category: "movies", url: "https://filmrise-western-1-us.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "mov-pluto-movies", name: "بلوتو تي في سينما (Pluto TV Movies)", country: "int", category: "movies", url: "https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5d8b8e0e843c08000969566d/master.m3u8" },
  { id: "mov-rakuten-action", name: "راكوتن أكشن (Rakuten TV Action)", country: "int", category: "movies", url: "https://rakuten-actionmovies-1-eu.rakuten.wurl.com/manifest/playlist.m3u8" },
  { id: "mov-shout-factory", name: "شاوت فاكتوري (Shout! Factory TV)", country: "int", category: "movies", url: "https://shoutfactory-samsung.amagi.tv/playlist.m3u8" },
  { id: "mov-scifi", name: "ساي فاي سنترال (Sci-Fi Central)", country: "int", category: "movies", url: "https://scifi-central-1-us.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "mov-retrocrush", name: "ريترو كراش أنمي (RetroCrush Anime)", country: "int", category: "movies", url: "https://retrocrush-samsung.amagi.tv/playlist.m3u8" },

  // ==================== MUSIC & LIFESTYLE ====================
  { id: "mus-trace-urban", name: "تريس أوربان (Trace Urban Music)", country: "int", category: "music", url: "https://trace-urban-1-eu.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "mus-clubbing", name: "كلوبينغ تي في (Clubbing TV)", country: "int", category: "music", url: "https://clubbingtv-hls.secure.footprint.net/hls/live/2006782/clubbingtv/master.m3u8" },
  { id: "mus-deluxe-music", name: "ديلوكس ميوزيك (Deluxe Music)", country: "int", category: "music", url: "https://deluxemusic.akamaized.net/hls/live/2004512/deluxemusic/master.m3u8" },
  { id: "mus-deluxe-lounge", name: "ديلوكس لاونج هادئ (Deluxe Lounge)", country: "int", category: "music", url: "https://deluxelounge.akamaized.net/hls/live/2004513/deluxelounge/master.m3u8" },
  { id: "mus-qwest", name: "كويست جاز وفنون (Qwest TV)", country: "int", category: "music", url: "https://qwest-jazz-1-us.samsung.wurl.com/manifest/playlist.m3u8" },
  { id: "mus-fashion", name: "فاشن تي في للموضة (Fashion TV)", country: "int", category: "entertainment", url: "https://fashiontv-fashiontv-1-eu.samsung.wurl.com/manifest/playlist.m3u8" },
];

export const MATCHES: LiveMatch[] = [
  { id: "m1", home: "الهلال", away: "النصر", time: "21:00", tournament: "دوري روشن السعودي", url: "https://shd-hls-ksa-med.erc.cdn.ooredoo.mobi/ksa/smil:ksasports1.smil/playlist.m3u8" },
  { id: "m2", home: "ريال مدريد", away: "برشلونة", time: "22:00", tournament: "كلاسيكو الدوري الإسباني", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
  { id: "m3", home: "الأهلي", away: "الزمالك", time: "20:00", tournament: "قمة الدوري المصري الممتاز", url: "https://on-live.erc.cdn.ooredoo.mobi/on/smil:onsports.smil/playlist.m3u8" },
  { id: "m4", home: "مانشستر سيتي", away: "ليفربول", time: "18:30", tournament: "الدوري الإنجليزي الممتاز", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
  { id: "m5", home: "باريس سان جيرمان", away: "مرسيليا", time: "21:45", tournament: "كلاسيكو الدوري الفرنسي", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
];

interface LiveTvPageProps {
  onPlayLive: (name: string, url: string) => void;
}

export function LiveTvPage({ onPlayLive }: LiveTvPageProps) {
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favChannels, setFavChannels] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("matv_fav_channels");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleFavChannel = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavChannels((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      try {
        localStorage.setItem("matv_fav_channels", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const filteredChannels = useMemo(() => {
    return CHANNELS.filter((c) => {
      if (selectedCategory === "favorites") {
        if (!favChannels.includes(c.id)) return false;
      } else if (selectedCategory !== "all" && c.category !== selectedCategory) {
        return false;
      }
      if (selectedCountry !== "all" && c.country !== selectedCountry) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCountry, selectedCategory, searchQuery, favChannels]);

  return (
    <div style={{ paddingTop: "20px", paddingBottom: "40px" }}>
      {/* Page Title */}
      <div style={{ padding: "0 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{
          fontSize: "24px", fontWeight: 700, color: "var(--text-primary)",
          fontFamily: "var(--font-arabic)", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <Radio size={24} style={{ color: "var(--gold-400)" }} />
          البث المباشر والقنوات
          <Badge variant="gold">{filteredChannels.length} قناة</Badge>
        </h1>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "var(--bg-elevated)", padding: "8px 16px",
          borderRadius: "var(--radius-full)", border: "1px solid var(--border-default)",
          minWidth: "240px",
        }}>
          <Search size={16} style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن قناة بالاسم..."
            style={{
              background: "none", border: "none", outline: "none",
              color: "var(--text-primary)", fontSize: "14px",
              fontFamily: "var(--font-arabic)", width: "100%",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ color: "var(--text-tertiary)", cursor: "pointer", background: "none", border: "none" }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Featured Matches */}
      <div style={{ padding: "0 16px", marginBottom: "24px" }}>
        <h2 style={{
          fontSize: "17px", fontWeight: 700, color: "var(--text-primary)",
          marginBottom: "12px", fontFamily: "var(--font-arabic)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <Trophy size={18} style={{ color: "var(--gold-400)" }} />
          أبرز مباريات اليوم المباشرة
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {MATCHES.map((m) => (
            <Card
              key={m.id}
              onClick={() => onPlayLive(`${m.home} vs ${m.away} (${m.tournament})`, m.url)}
              style={{
                padding: "14px 16px", cursor: "pointer",
                transition: "all var(--transition-fast)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--gold-400)", fontWeight: 700, fontFamily: "var(--font-arabic)" }}>{m.tournament}</span>
                <Badge variant="success">مباشر {m.time}</Badge>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>{m.home}</span>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", padding: "0 8px" }}>VS</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>{m.away}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayLive(`${m.home} vs ${m.away} (${m.tournament})`, m.url);
                }}
                style={{
                  width: "100%", marginTop: "10px", padding: "6px",
                  background: "rgba(212,175,55,0.15)", color: "var(--gold-400)",
                  border: "1px solid var(--border-gold)", borderRadius: "var(--radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-arabic)",
                }}
              >
                <Play size={12} fill="currentColor" />
                مشاهدة البث
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Country Filter Carousel */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{
          display: "flex", gap: "8px", overflowX: "auto",
          padding: "4px 16px", scrollbarWidth: "none",
        }}>
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c.code)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "var(--radius-full)",
                background: selectedCountry === c.code ? "var(--gold-400)" : "var(--bg-elevated)",
                color: selectedCountry === c.code ? "var(--neutral-0)" : "var(--text-secondary)",
                fontSize: "13px", fontWeight: 600, border: "1px solid",
                borderColor: selectedCountry === c.code ? "var(--gold-400)" : "var(--border-default)",
                cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "var(--font-arabic)", transition: "all var(--transition-fast)",
              }}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{
          display: "flex", gap: "8px", overflowX: "auto",
          padding: "4px 16px", scrollbarWidth: "none",
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "6px 14px", borderRadius: "var(--radius-md)",
                background: selectedCategory === cat.id ? "rgba(212,175,55,0.2)" : "transparent",
                color: selectedCategory === cat.id ? "var(--gold-400)" : "var(--text-tertiary)",
                fontSize: "13px", fontWeight: 600, border: "1px solid",
                borderColor: selectedCategory === cat.id ? "var(--gold-400)" : "var(--border-subtle)",
                cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "var(--font-arabic)", transition: "all var(--transition-fast)",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Grid */}
      <div style={{ padding: "0 16px" }}>
        {filteredChannels.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-tertiary)" }}>
            <Tv size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p style={{ fontFamily: "var(--font-arabic)", fontSize: "15px" }}>لا توجد قنوات تطابق البحث الحالي</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {filteredChannels.map((ch) => {
              const countryInfo = COUNTRIES.find((c) => c.code === ch.country);
              return (
                <Card
                  key={ch.id}
                  onClick={() => onPlayLive(ch.name, ch.url)}
                  style={{
                    padding: "16px", cursor: "pointer",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    minHeight: "110px", transition: "all var(--transition-fast)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-gold)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "16px" }}>{countryInfo?.flag || "📺"}</span>
                      <button
                        onClick={(e) => toggleFavChannel(ch.id, e)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: favChannels.includes(ch.id) ? "var(--gold-400)" : "var(--text-tertiary)",
                          display: "flex", alignItems: "center", padding: "2px",
                          transition: "transform 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        title={favChannels.includes(ch.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                      >
                        <Star size={15} fill={favChannels.includes(ch.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <Badge variant="gold">مباشر</Badge>
                  </div>

                  <div>
                    <h3 style={{
                      fontSize: "14px", fontWeight: 700, color: "var(--text-primary)",
                      fontFamily: "var(--font-arabic)", marginBottom: "4px",
                      lineHeight: 1.3,
                    }}>
                      {ch.name}
                    </h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>
                        {CATEGORIES.find((cat) => cat.id === ch.category)?.label || ch.category}
                      </span>
                      <Play size={14} style={{ color: "var(--gold-400)" }} fill="currentColor" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
