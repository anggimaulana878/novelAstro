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

/**
 * Sanitize HTML attributes, keeping only allowed ones
 * @param attrs - Attribute string from HTML tag
 * @returns Cleaned attribute string
 */
function sanitizeAttributes(attrs: string): string {
  const allowed = ['id', 'class', 'lang', 'role'];
  const ariaPattern = /^aria-[\w-]+$/;
  
  // Match all attributes: name="value"
  const attrMatches = [...attrs.matchAll(/(\w+(?:-\w+)*)="([^"]*)"/g)];
  const cleanAttrs: string[] = [];
  
  for (const [, name, value] of attrMatches) {
    if (allowed.includes(name) || ariaPattern.test(name)) {
      cleanAttrs.push(`${name}="${value}"`);
    }
  }
  
  return cleanAttrs.length > 0 ? ' ' + cleanAttrs.join(' ') : '';
}

/**
 * Sanitize HTML content for Google Assistant compatibility
 * Removes dangerous tags, converts divs to semantic tags, strips inline styles
 * @param html - Raw HTML content
 * @returns Sanitized HTML
 */
export function sanitizeContent(html: string): string {
  let clean = html;
  
  // Remove dangerous tags completely
  const dangerousTags = ['script', 'style', 'button', 'form', 'input', 'iframe'];
  for (const tag of dangerousTags) {
    // Remove opening and closing tags with content
    clean = clean.replace(new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis'), '');
    // Remove self-closing tags
    clean = clean.replace(new RegExp(`<${tag}[^>]*/>`, 'gi'), '');
  }
  
  // Convert div to p or section based on content
  clean = clean.replace(/<div([^>]*)>(.*?)<\/div>/gis, (match, attrs, content) => {
    // If div contains block elements, convert to section
    const hasBlockElements = /<(p|h[1-6]|section|article|div)/.test(content);
    const tag = hasBlockElements ? 'section' : 'p';
    const cleanAttrs = sanitizeAttributes(attrs);
    return `<${tag}${cleanAttrs}>${content}</${tag}>`;
  });
  
  // Strip all attributes except allowed ones
  clean = clean.replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
    const cleanAttrs = sanitizeAttributes(attrs);
    return `<${tag}${cleanAttrs}>`;
  });
  
  // Remove inline styles
  clean = clean.replace(/\s+style="[^"]*"/gi, '');
  
  return clean;
}
