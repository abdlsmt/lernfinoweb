"use strict";

const root = document.documentElement;
const pageLang = root.dataset.pageLang;
const base = root.dataset.base;
const languageLinks = [...document.querySelectorAll("[data-language]")];

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function languageRoute(href) {
  const target = new URL(href, window.location.href);
  const params = new URLSearchParams(window.location.search);
  params.delete("lang");
  target.search = params;
  target.hash = window.location.hash;
  return target;
}

function changeLanguage(event) {
  const link = event.currentTarget;
  if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  storageSet("lernfino_web_lang", link.dataset.language);
  event.preventDefault();
  window.location.assign(languageRoute(link.href));
}

for (const link of languageLinks) link.addEventListener("click", changeLanguage);
const queryLanguage = new URLSearchParams(window.location.search).get("lang")?.toLowerCase().split("-")[0];
const legacyLink = languageLinks.find(link => link.dataset.language === queryLanguage);
if (legacyLink && queryLanguage !== pageLang) window.location.replace(languageRoute(legacyLink.href));

const menu = document.querySelector(".web-language");
if (menu) {
  document.addEventListener("click", event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  menu.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
}

const themeButton = document.getElementById("themeToggle");
function applyTheme(theme) {
  root.dataset.theme = theme;
  themeButton?.setAttribute("aria-pressed", String(theme === "dark"));
}
applyTheme(storageGet("lernfino_web_theme") === "dark" ? "dark" : "light");
themeButton?.addEventListener("click", () => {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  storageSet("lernfino_web_theme", theme);
});

if ("IntersectionObserver" in window && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("revealed");
      observer.unobserve(entry.target);
    }
  }, {threshold: .12});
  for (const element of document.querySelectorAll("[data-reveal]")) observer.observe(element);
}

function suggestLanguage(suggestions) {
  if (storageGet("lernfino_web_lang") || queryLanguage) return;
  const preferred = (navigator.languages || [navigator.language])
    .map(locale => locale.toLowerCase().split("-")[0])
    .find(code => Object.hasOwn(suggestions, code));
  if (!preferred || preferred === pageLang || storageGet("lernfino_web_language_dismissed") === preferred) return;

  const {name, text, locale, href} = suggestions[preferred];
  const banner = document.getElementById("languageSuggestion");
  const copy = document.getElementById("suggestionText");
  const link = document.getElementById("suggestionLink");
  copy.textContent = text;
  copy.lang = locale;
  copy.dir = "auto";
  link.textContent = name;
  link.lang = locale;
  link.href = href;
  link.dataset.language = preferred;
  link.addEventListener("click", changeLanguage);
  document.getElementById("dismissSuggestion").addEventListener("click", () => {
    banner.hidden = true;
    storageSet("lernfino_web_language_dismissed", preferred);
  });
  banner.hidden = false;
}

function initDemo({levels, dictionary, status}) {
  const byId = id => document.getElementById(id);
  const sentenceEl = byId("demoGermanSentence");
  const levelButtons = [...document.querySelectorAll(".cefr-btn")];
  let level = "A1";
  let word = levels[level].words[0].key;
  let audio;
  const savedWords = new Set();

  function play(file) {
    audio?.pause();
    if (!file) return;
    audio = new Audio(base + file.slice(1));
    audio.play().catch(() => {});
  }

  function showWord() {
    const entry = dictionary[word];
    const fields = {
      dictArticle: entry.article, dictHeadword: entry.headword, dictMeaning: entry.meaning,
      dictGrammarNote: entry.grammar, dictExampleDe: entry.exampleDe, dictExampleTr: entry.exampleTr,
    };
    for (const [id, value] of Object.entries(fields)) byId(id).textContent = value;
    const isSaved = savedWords.has(word);
    byId("saveWordBtn").setAttribute("aria-pressed", String(isSaved));
    byId("saveWordIcon").textContent = isSaved ? "✓" : "＋";
    byId("saveWordText").textContent = isSaved ? status.savedWord : status.saveWord;
    for (const button of sentenceEl.querySelectorAll("button")) {
      const selected = button.dataset.word === word;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
  }

  function showLevel() {
    const item = levels[level];
    byId("demoStoryTitle").textContent = item.storyTitle;
    byId("demoLevelBadge").textContent = item.badge;
    byId("demoSentenceTranslation").textContent = item.translation;
    sentenceEl.replaceChildren();
    for (const token of item.words) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "interactive-word";
      button.dataset.word = token.key;
      button.textContent = token.label;
      button.addEventListener("click", () => {
        word = token.key;
        showWord();
        play(dictionary[word].audioFile);
      });
      sentenceEl.append(button, " ");
    }
    showWord();
  }

  for (const button of levelButtons) {
    button.addEventListener("click", () => {
      if (level === button.dataset.level) return;
      audio?.pause();
      level = button.dataset.level;
      word = levels[level].words[0].key;
      for (const option of levelButtons) {
        const active = option === button;
        option.classList.toggle("active", active);
        option.setAttribute("aria-pressed", String(active));
      }
      showLevel();
    });
  }
  byId("speakSentenceBtn").addEventListener("click", () => play(levels[level].audioFile));
  byId("speakWordBtn").addEventListener("click", () => play(dictionary[word].audioFile));
  byId("saveWordBtn").addEventListener("click", () => {
    if (savedWords.has(word)) savedWords.delete(word);
    else savedWords.add(word);
    showWord();
  });
  showLevel();
}

function interpretWaitlistResponse(ok, status, rawText) {
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }
  const statusVal = String((data && (data.status || data.result || data.state)) || "").toLowerCase();
  if (
    data &&
    (data.duplicate === true ||
      statusVal === "duplicate" ||
      statusVal === "already_registered" ||
      statusVal === "exists")
  ) {
    return { kind: "duplicate" };
  }
  if (
    ok &&
    data &&
    data.ok !== false &&
    data.success !== false &&
    (data.ok === true ||
      data.success === true ||
      statusVal === "ok" ||
      statusVal === "success" ||
      statusVal === "created" ||
      statusVal === "subscribed" ||
      statusVal === "added")
  ) {
    return { kind: "success" };
  }
  const reason = (data && (data.error || data.message)) || (status ? `HTTP ${status}` : "network");
  return { kind: "error", reason: String(reason) };
}

function initWaitlist(status) {
  const form = document.getElementById("notifyForm");
  const email = document.getElementById("emailInput");
  const consent = document.getElementById("consentCheckbox");
  const level = document.getElementById("levelSelect");
  const feedback = document.getElementById("formFeedback");
  const message = document.getElementById("feedbackMessage");
  const retry = document.getElementById("formRetryBtn");
  const submit = form.querySelector("button[type=submit]");
  const endpoint = "https://script.google.com/macros/s/AKfycbz0gSh1Sguut_86bbIYPC1Dtd4Y7MxpNpJceBm8p7lxmB6bhQwha20FN-L49fGmtGEk/exec";
  const requestedLevel = new URLSearchParams(window.location.search).get("level")?.toUpperCase();
  if (["A1", "A2", "B1", "B2"].includes(requestedLevel)) level.value = requestedLevel;

  try { localStorage.removeItem("lernfino_waitlist"); } catch {}

  function show(kind) {
    feedback.hidden = false;
    feedback.className = "form-feedback is-visible" + (kind === "success" ? "" : " is-" + kind);
    message.textContent = status[kind];
    retry.hidden = kind !== "error";
  }

  async function submitWaitlist(event) {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;
    submit.disabled = true;
    show("pending");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {"Content-Type": "text/plain;charset=utf-8"},
        body: JSON.stringify({
          email: email.value.trim(), level: level.value, lang: pageLang, consent: consent.checked,
          source: "lernfino.com", page: window.location.pathname,
        }),
      });
      const outcome = interpretWaitlistResponse(response.ok, response.status, await response.text());
      show(outcome.kind);
      if (outcome.kind === "success") {
        email.value = "";
        consent.checked = false;
      }
    } catch {
      show("error");
    } finally {
      submit.disabled = false;
    }
  }
  form.addEventListener("submit", submitWaitlist);
  retry.addEventListener("click", () => form.requestSubmit());
}

const homeMessages = document.getElementById("home-messages");
if (homeMessages) {
  const messages = JSON.parse(homeMessages.textContent);
  suggestLanguage(messages.suggestions);
  initDemo(messages);
  initWaitlist(messages.status);
}

const deleteEmail = document.getElementById("deleteEmailInput");
const deletionLink = document.getElementById("sendDeleteEmailBtn");
deleteEmail?.addEventListener("input", () => {
  const {emailLabel, emailMessage, emailSubject} = deletionLink.dataset;
  const body = emailMessage + "\n\n" + emailLabel + ": " + deleteEmail.value.trim();
  deletionLink.href = `mailto:support@lernfino.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
});

function openLinkedDetails() {
  const id = window.location.hash.slice(1);
  const details = document.getElementById(id);
  if (details?.tagName === "DETAILS") details.open = true;
}
openLinkedDetails();
window.addEventListener("hashchange", openLinkedDetails);
