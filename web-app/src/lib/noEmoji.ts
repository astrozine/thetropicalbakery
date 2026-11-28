/**
 * Brazilian luxury redesign (2026-11-28): no emoji in what visitors read. Copy that still carries them
 * (keys in shellCopy, older data) is passed through this on the way to the screen, so the stored text and
 * translation keys stay exactly as they are.
 */
const EMOJI = /(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{23F3}\u{231B}\u{2190}-\u{21FF}](?:️|‍[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?)*)/gu;

export function noEmoji(s: string): string {
  return s.replace(EMOJI, '').replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/g, '');
}
