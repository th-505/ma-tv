const LS_SUB_LANG = "matv_sub_lang";
const LS_SUB_OFFSET = "matv_sub_offset";
const LS_SUB_SIZE = "matv_sub_size";
const LS_SUB_OPENSUBS_KEY = "matv_opensubs_key";

export interface SubtitleTrack {
  label: string;
  language: string;
  srclang: string;
  url?: string;
  isExternal?: boolean;
}

export function getSubtitleLanguage(): string {
  return localStorage.getItem(LS_SUB_LANG) || "ar";
}

export function setSubtitleLanguage(lang: string): void {
  localStorage.setItem(LS_SUB_LANG, lang);
}

export function getSubtitleOffset(): number {
  const v = localStorage.getItem(LS_SUB_OFFSET);
  return v ? parseFloat(v) : 0;
}

export function setSubtitleOffset(offset: number): void {
  localStorage.setItem(LS_SUB_OFFSET, String(offset));
}

export function getSubtitleSize(): string {
  return localStorage.getItem(LS_SUB_SIZE) || "medium";
}

export function setSubtitleSize(size: string): void {
  localStorage.setItem(LS_SUB_SIZE, size);
}

export function getOpenSubsKey(): string {
  return localStorage.getItem(LS_SUB_OPENSUBS_KEY) || "";
}

export function setOpenSubsKey(key: string): void {
  if (key.trim()) localStorage.setItem(LS_SUB_OPENSUBS_KEY, key.trim());
  else localStorage.removeItem(LS_SUB_OPENSUBS_KEY);
}

export function getSubtitleSizePx(): string {
  const size = getSubtitleSize();
  switch (size) {
    case "small": return "14px";
    case "medium": return "18px";
    case "large": return "22px";
    case "xlarge": return "28px";
    default: return "18px";
  }
}

export const SUBTITLE_LANGUAGES = [
  { code: "ar", label: "العربية", srclang: "ar" },
  { code: "en", label: "الإنجليزية", srclang: "en" },
  { code: "tr", label: "التركية", srclang: "tr" },
  { code: "ko", label: "الكورية", srclang: "ko" },
  { code: "fr", label: "الفرنسية", srclang: "fr" },
  { code: "off", label: "إيقاف", srclang: "off" },
];

export function parseSrt(content: string): { start: number; end: number; text: string }[] {
  const blocks = content.trim().split(/\n\s*\n/);
  const cues: { start: number; end: number; text: string }[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const timeMatch = lines.find((l) => l.includes("-->"));
    if (!timeMatch) continue;

    const [startStr, endStr] = timeMatch.split("-->").map((s) => s.trim());
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);
    const text = lines.filter((l) => !l.match(/^\d+$/) && !l.includes("-->")).join("\n");
    cues.push({ start, end, text });
  }

  return cues;
}

function parseTimestamp(ts: string): number {
  const match = ts.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
}

export function formatVttTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function srtToVtt(srtContent: string, offsetSec: number = 0): string {
  const cues = parseSrt(srtContent);
  let vtt = "WEBVTT\n\n";
  for (const cue of cues) {
    const start = Math.max(0, cue.start + offsetSec);
    const end = Math.max(start + 0.1, cue.end + offsetSec);
    vtt += `${formatVttTimestamp(start)} --> ${formatVttTimestamp(end)}\n`;
    vtt += `${cue.text}\n\n`;
  }
  return vtt;
}

export function loadExternalSubtitleFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
