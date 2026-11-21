const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const origin = 'https://lernfino.com';
const languages = {
  en: ['en', 'English'],
  de: ['de', 'Deutsch'],
  tr: ['tr', 'Türkçe'],
  es: ['es', 'Español'],
  pt: ['pt-BR', 'Português (Brasil)'],
  fr: ['fr', 'Français'],
  it: ['it', 'Italiano'],
  pl: ['pl', 'Polski'],
  ar: ['ar', 'العربية'],
  ru: ['ru', 'Русский'],
  uk: ['uk', 'Українська'],
  hi: ['hi', 'हिन्दी'],
  vi: ['vi', 'Tiếng Việt'],
  id: ['id', 'Bahasa Indonesia'],
  zh: ['zh-Hans', '简体中文'],
};
const officialLanguages = ['en', 'de', 'tr'];
const legalPages = ['privacy', 'terms', 'imprint'];
const helpPages = ['support', 'delete-account'];
const localizedPages = [...legalPages, ...helpPages];
const tools = ['level-test', 'exam-calculator', 'word-counter'];
const codes = Object.keys(languages);
const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const escape = (value) => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const lookup = (code) => code === 'en' ? {home: json('home.en.json'), help: json('help.en.json')} : json(`${code}.json`);
const sitePath = (code, page = '') => `/${[code === 'en' ? '' : code, page].filter(Boolean).join('/')}${code !== 'en' || page ? '/' : ''}`;
const relative = (base, url) => `${base}${url}`;
const render = (template, values) => template.replace(/{{(\w+)}}/g, (token, key) => {
  if (!Object.hasOwn(values, key)) throw new Error(`Unresolved substitution ${token}`);
  return values[key];
});

const contents = Object.fromEntries(codes.map(code => [code, lookup(code)]));
const official = json('official.json');
const demo = json('demo.json');
const homeTemplate = read('home.html');
const legalTemplate = read('legal.html');
function validateKeys(code, type, source, translation) {
  const expected = Object.keys(source);
  const missing = expected.filter(key => typeof translation?.[key] !== 'string' || !translation[key].trim());
  const extra = Object.keys(translation || {}).filter(key => !expected.includes(key));
  if (missing.length || extra.length) throw new Error(`${code} ${type}: missing keys [${missing}], extra keys [${extra}]`);
  for (const key of expected) {
    for (const [placeholder] of source[key].matchAll(/\{\w+\}/g)) {
      if (!translation[key].includes(placeholder)) throw new Error(`${code} ${type}.${key}: missing ${placeholder}`);
    }
  }
}
for (const code of codes) {
  for (const type of ['home','help']) validateKeys(code, type, contents.en[type], contents[code][type]);
}

const icons = {
  path: '<path d="M4 19h4v-6h5V7h7M16 3l4 4-4 4"/>',
  exams: '<path d="M8 4H5v16h14V4h-3M9 3h6v4H9zM8 12h8m-8 4h8"/>',
  ai: '<path d="M4 5h16v11H9l-5 4V5Zm4 6h.01m4 0h.01m4 0h.01"/>',
  life: '<path d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  trainers: '<path d="M5 7h14M5 12h14M5 17h14"/><circle cx="8" cy="7" r="2" fill="var(--surface)"/><circle cx="15" cy="12" r="2" fill="var(--surface)"/><circle cx="10" cy="17" r="2" fill="var(--surface)"/>',
  games: '<path d="M7 7h10a4 4 0 0 1 4 4l1 5a2 2 0 0 1-3 2l-4-3H9l-4 3a2 2 0 0 1-3-2l1-5a4 4 0 0 1 4-4Zm1 3v4m-2-2h4m6 0h.01m2 1h.01"/>',
  reading: '<path d="M12 6c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v13"/>',
  review: '<path d="M20 10a8 8 0 1 0 0 5m0-10v5h-5m-6 3 2 2 4-4"/>',
};
function cards(t) {
  const entries = {
    path: 'pathText', exams: 'examsText', ai: 'aiText', life: 'lifeText',
    trainers: ['articles', 'cases', 'sentences', 'prepVerbs', 'verbs'],
    games: ['rain', 'race', 'wordle'], reading: 'readingText', review: 'reviewText',
  };
  return Object.entries(entries).map(([key, content]) => {
    const detail = Array.isArray(content) ? `<ul>${content.map(item => `<li>${t[item]}</li>`).join('')}</ul>` : `<p>${t[content]}</p>`;
    return `<article class="web-feature" data-reveal><span class="web-feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[key]}</svg></span><h3>${t[key]}</h3>${detail}</article>`;
  }).join('\n');
}

function alternates(page, xml = false) {
  const links = [...codes.map(code => [languages[code][0], sitePath(code, page)]), ['x-default', sitePath('en', page)]];
  return links.map(([locale, url]) => `<${xml ? 'xhtml:' : ''}link rel="alternate" hreflang="${locale}" href="${origin}${url}"${xml ? ' /' : ''}>`).join('\n  ');
}

function footer(code, base, t) {
  const social = [['YouTube', 'https://www.youtube.com/@LernfinoDeutsch'], ['Instagram', 'https://www.instagram.com/lernfinodeutsch/'], ['Facebook', 'https://www.facebook.com/lernfinodeutsch'], ['TikTok', 'https://www.tiktok.com/@lernfino.deutsch']];
  const footerPages = [...legalPages, 'support', 'delete-account'];
  return `<footer class="web-footer" id="channel"><div class="container web-footer-inner">
  <strong>Lernfino</strong>
  <div class="web-footer-links">${footerPages.map(page => `<a href="${relative(base, sitePath(code, page))}">${page === 'delete-account' ? t.deleteAccount : t[page]}</a>`).join('')}</div>
  <div class="web-footer-links" dir="ltr">${social.map(([label, href]) => `<a href="${href}" rel="noopener noreferrer">${label}</a>`).join('')}</div>
  <small>${t.independent}</small><small>© 2026 Lernfino · Respecode. ${t.rights}</small>
  </div></footer>`;
}

function common(code, page = '') {
  const [locale, name] = languages[code];
  const direction = code === 'ar' ? 'rtl' : 'ltr';
  const current = sitePath(code, page);
  const depth = current.split('/').filter(Boolean).length;
  const base = Array(depth).fill('..').join('/') || '.';
  const t = Object.fromEntries(Object.entries(contents[code].home).map(([key, value]) => [key, escape(value)]));
  const privacyPath = relative(base, sitePath(code, 'privacy'));
  const canonical = origin + current;
  const brand = `<a class="web-brand" href="${relative(base, sitePath(code))}" aria-label="Lernfino · ${t.home}"><img src="${base}/assets/fino-icon.webp" width="37" height="37" alt=""><span>Lernfino</span></a>`;
  const localeLink = (target) => {
    const [targetLocale, targetName] = languages[target];
    const state = target === code ? ' aria-current="page"' : '';
    return [`href="${relative(base, sitePath(target, page))}" hreflang="${targetLocale}" lang="${targetLocale}" dir="auto" data-language="${target}"${state}`, escape(targetName)];
  };
  const languageMenu = `<details class="web-language"><summary aria-label="${t.languageLabel} · ${escape(name)}"><span aria-hidden="true">◎</span><span lang="${locale}">${escape(name)}</span><span aria-hidden="true">⌄</span></summary><ul>${codes.map(target => {
    const [attributes, label] = localeLink(target);
    return `<li><a ${attributes}>${label}</a></li>`;
  }).join('')}</ul></details>`;
  const themeButton = `<button type="button" id="themeToggle" class="web-theme" aria-label="${t.theme}" aria-pressed="false"><span class="moon" aria-hidden="true">☾</span><span class="sun" aria-hidden="true">☀</span></button>`;
  const flags = codes.map((target, index) => {
    const [attributes, label] = localeLink(target);
    const short = target.toUpperCase();
    return `<li><a ${attributes} aria-label="${short} · ${label}" title="${label}"><span class="language-flag" style="background-position:0 -${index * 18}px" aria-hidden="true"></span><small aria-hidden="true">${short}</small></a></li>`;
  }).join('');
  return {...t, t, code, locale, direction, base, canonical, privacyPath, brand, languageMenu, themeButton, flags,
    alternates: `<link rel="canonical" href="${canonical}">\n  ${alternates(page)}`, footer: footer(code, base, t)};
}

function inlineJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function demoData(code) {
  const localized = contents[code].demo;
  const levels = Object.fromEntries(Object.entries(demo.DEMO_LEVELS).map(([level, {storyTitle, badge, audioFile, words, translation}]) => {
    const text = localized ? localized.sentences[level] : translation[code];
    if (!text) throw new Error(`Missing ${code} example ${level}`);
    return [level, {storyTitle, badge: badge[code] || level, audioFile, words, translation: text}];
  }));
  const dictionary = Object.fromEntries(Object.entries(demo.WORD_DICTIONARY).map(([key, entry]) => {
    const fields = ['article', 'meaning', 'grammar', 'exampleTr'];
    const result = {headword: entry.headword, exampleDe: entry.exampleDe, audioFile: entry.audioFile};
    for (const field of fields) {
      result[field] = localized ? localized.dictionary[key]?.[field] : entry[field][code];
      if (!result[field]) throw new Error(`Missing ${code} dictionary key ${key}.${field}`);
    }
    return [key, result];
  }));
  for (const {words} of Object.values(levels)) {
    for (const {key} of words) if (!dictionary[key]) throw new Error(`Unknown demo word ${key}`);
  }
  return {levels, dictionary};
}

function home(code) {
  const values = common(code);
  const {base, t} = values;
  const messages = contents[code].home;
  const runtimeKeys = ['pending', 'success', 'duplicate', 'error', 'retry', 'saveWord', 'savedWord'];
  const status = Object.fromEntries(runtimeKeys.map(key => [key, messages[key]]));
  const suggestions = Object.fromEntries(codes.map(target => [target, {name: languages[target][1], locale: languages[target][0], text: contents[target].home.suggestion, href: relative(base, sitePath(target))}]));
  return render(homeTemplate, {...values,
    featureCards: cards(t),
    steps: [1,2,3].map(index => `<li><h3>${t[`step${index}`]}</h3><p>${t[`step${index}Text`]}</p></li>`).join(''),
    demoLevels: ['A1', 'A2', 'B1', 'B2'].map((level, index) => `<button type="button" class="cefr-btn${index === 0 ? ' active' : ''}" data-level="${level}" aria-pressed="${index === 0}">${level}</button>`).join(''),
    toolQuery: `?lang=${code}`,
    runtime: inlineJson({...demoData(code), status, suggestions}),
  });
}

function legal(code, page) {
  const values = common(code, page);
  const {base, t, privacyPath} = values;
  const isOfficial = officialLanguages.includes(code);
  const text = isOfficial ? official[page][code] : contents[code].legal?.[page];
  if (!text) throw new Error(`Missing ${page} article for ${code}`);
  const article = text.replaceAll('{privacyPath}', privacyPath).replaceAll('{deleteAccountPath}', relative(base, sitePath(code, 'delete-account')));
  const officialNotice = isOfficial ? '' : `<p class="callout-box callout-amber">${t.officialNotice} <a href="${relative(base, sitePath('en', page))}" lang="en">English</a> · <a href="${relative(base, sitePath('de', page))}" lang="de">Deutsch</a></p>`;
  return render(legalTemplate, {...values, heading: t[page], kind: page, dateLabel: `<p>${t.updated}</p>`, article, officialNotice});
}

function helpPage(code, page) {
  const values = common(code, page);
  const {base, t} = values;
  const m = contents[code].help;
  const h = Object.fromEntries(Object.entries(m).map(([key, value]) => [key, escape(value)]));
  const subject = encodeURIComponent(m.emailSubject);
  const message = encodeURIComponent(m.emailBody);
  const heading = page === 'support' ? t.support : t.deleteAccount;
  let article;
  if (page === 'support') {
    const questions = ['offline', 'backup', 'exam', 'audio'];
    const details = questions.map((key, index) => `<details${key === 'backup' ? ' id="backup-guide"' : ''}${index === 0 ? ' open' : ''}><summary>${h[`${key}Question`]}</summary><p>${h[`${key}Answer`]}</p></details>`).join('\n');
    article = `<h2>${h.contact}</h2><p>${h.contactText} <a dir="ltr" href="mailto:support@lernfino.com">support@lernfino.com</a></p>${details}
      <details><summary>${h.deletionQuestion}</summary><p><a href="${relative(base, sitePath(code, 'delete-account'))}">${t.deleteAccount}</a></p></details>`;
  } else {
    article = `<h2>${h.localTitle}</h2><p>${h.localText}</p><h2>${h.accountTitle}</h2><p>${h.accountText}</p><h2>${h.emailTitle}</h2><p>${h.emailText}</p>
      <div class="delete-tool-box"><label for="deleteEmailInput">${h.emailLabel}</label><input class="form-input" type="email" id="deleteEmailInput" autocomplete="email" dir="ltr">
      <a id="sendDeleteEmailBtn" class="web-button web-button-primary" data-email-label="${h.emailLabel}" data-email-message="${h.emailBody}" data-email-subject="${h.emailSubject}" href="mailto:support@lernfino.com?subject=${subject}&amp;body=${message}">${h.emailButton}</a>
      <p><a dir="ltr" href="mailto:support@lernfino.com">support@lernfino.com</a></p></div>`;
  }
  return render(legalTemplate, {...values, heading, kind: page, dateLabel: '', article, officialNotice: ''});
}

const generated = new Map();
const addRoute = (route, html) => generated.set(`${route.slice(1)}index.html`, html);
for (const code of codes) {
  addRoute(sitePath(code), home(code));
  for (const page of legalPages) addRoute(sitePath(code, page), legal(code, page));
  for (const page of helpPages) addRoute(sitePath(code, page), helpPage(code, page));
}
const sitemapEntries = ['', ...localizedPages].flatMap(page => codes.map(code => `<url><loc>${origin}${sitePath(code, page)}</loc>\n  ${alternates(page, true)}\n</url>`));
sitemapEntries.push(...tools.map(page => `<url><loc>${origin}${sitePath('en', page)}</loc></url>`));
generated.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapEntries.join('\n')}\n</urlset>\n`);

const {TOOL_I18N, WRITING_PROFILES} = require('../tools.js');
const toolSource = {tools: TOOL_I18N.en, profiles: Object.fromEntries(Object.entries(WRITING_PROFILES).map(([id, item]) => [id, item.label.en]))};
const data = Object.fromEntries(codes.map(code => {
  if (!officialLanguages.includes(code)) {
    for (const type of ['tools','profiles']) validateKeys(code, type, toolSource[type], contents[code][type]);
  }
  return [code, {locale: languages[code][0], name: languages[code][1], messages: contents[code].tools,
    profileLabels: contents[code].profiles, pages: Object.fromEntries(localizedPages.map(page => [page, contents[code].home[page === 'delete-account' ? 'deleteAccount' : page]])),
    languageLabel: contents[code].home.languageLabel, theme: contents[code].home.theme}];
}));
generated.set('tool-locales.js', `/* Generated by node site-src/build.cjs. */\nconst TOOL_LOCALES = ${inlineJson(data)};\n`);

const check = process.argv.includes('--check');
for (const [file, output] of generated) {
  const dest = path.join(root, file);
  if (check) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8').replaceAll('\r\n', '\n') !== output.replaceAll('\r\n', '\n')) {
      console.error(`Out of date: ${file}`);
      process.exitCode = 1;
    }
  } else {
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.writeFileSync(dest, output);
  }
}
if (!process.exitCode) console.log(`${generated.size} files, ${codes.length} languages, 0 missing translation keys`);
