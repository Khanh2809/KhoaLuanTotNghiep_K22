const BANNED_KEYWORDS = [
  'lon',
  'lon~', // loose accent matching
  'cac', // cặc (after normalize)
  'cak',
  'cakz',
  'c*k',
  'cl',
  'dm',
  'dmm',
  'dit',
  'ditme',
  'ditmemay',
  'ditconme',
  'duma',
  'duma~',
  'dume',
  'địt',
  'đụ',
  'đĩ',
  'bú cu',
  'chich',
  'chịch',
  'sex',
  'porn',
  'fuck',
  'shit',
  'bitch',
  'rape',
];

function normalize(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function containsBannedKeyword(text) {
  const normalized = normalize(text);
  return BANNED_KEYWORDS.some((kw) => normalized.includes(normalize(kw)));
}

export function assertCleanContent(text) {
  if (containsBannedKeyword(text)) {
    const err = new Error('Nội dung chứa từ ngữ không phù hợp');
    err.code = 'BAD_CONTENT';
    throw err;
  }
}
