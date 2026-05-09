// src/utils/content.ts

/**
 * Detect content language from text sample
 * @param text - Plain text or HTML content
 * @returns ISO 639-1 language code
 */
export function detectLanguage(text: string): string {
  // Remove HTML tags and get sample
  const plainText = text.replace(/<[^>]*>/g, '').slice(0, 500);
  
  // CJK characters (Chinese/Japanese Kanji)
  // Unicode range: U+4E00–U+9FFF (CJK Unified Ideographs)
  //                U+3400–U+4DBF (CJK Extension A)
  const cjkMatches = plainText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  if (cjkMatches && cjkMatches.length > plainText.length * 0.3) {
    return 'zh';
  }
  
  // Hiragana (U+3040–U+309F) or Katakana (U+30A0–U+30FF)
  const hiragana = /[\u3040-\u309f]/;
  const katakana = /[\u30a0-\u30ff]/;
  if (hiragana.test(plainText) || katakana.test(plainText)) {
    return 'ja';
  }
  
  // Hangul (Korean) - U+AC00–U+D7AF
  const hangul = /[\uac00-\ud7af]/;
  if (hangul.test(plainText)) {
    return 'ko';
  }
  
  // Indonesian keywords
  const indonesianKeywords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan'];
  const words = plainText.toLowerCase().split(/\s+/);
  const indonesianCount = words.filter(w => indonesianKeywords.includes(w)).length;
  if (indonesianCount > 3) {
    return 'id';
  }
  
  // Default to English
  return 'en';
}
