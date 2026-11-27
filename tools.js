/* ==========================================================================
   Lernfino Serverless Free Tools Engine (TR | EN | DE)
   Shared logic with lernfinoapp: exam-readiness.ts, practice.ts, placement.ts
   ========================================================================== */

(function (globalScope) {
  "use strict";

  // --------------------------------------------------------------------------
  // 1. EXAM SCORE CALCULATOR (Oturum J & K13 rules from exam-readiness.ts)
  // --------------------------------------------------------------------------

  var SKILLS = ["listen", "read", "write", "speak"];

  function parseScore(raw) {
    if (raw === null || raw === undefined || raw === "") return null;
    var n = typeof raw === "number" ? raw : Number(String(raw).trim().replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(100, n));
  }

  function formatExamScore(score) { return String(Math.floor(score * 100) / 100); }

  function goethePassRule(level) {
    return level === "A1" || level === "A2" ? "total" : "modular";
  }

  function evaluateScore(exam, level, rawScores) {
    var safeExam = exam === "osd" ? "osd" : "goethe";
    var safeLevel = ["A1", "A2", "B1", "B2"].indexOf(level) !== -1 ? level : "B1";
    var scores = {};
    var missing = [];

    SKILLS.forEach(function (skill) {
      var val = parseScore(rawScores ? rawScores[skill] : null);
      scores[skill] = val;
      if (val === null) missing.push(skill);
    });

    if (safeExam === "osd") {
      var osdModules = {};
      SKILLS.forEach(function (s) {
        osdModules[s] = {
          score: scores[s],
          status: scores[s] === null ? "missing" : "measured"
        };
      });
      return {
        exam: safeExam,
        level: safeLevel,
        rule: "unverified",
        verifiable: false,
        verdict: missing.length > 0 ? "incomplete" : "unverified",
        missing: missing,
        modules: osdModules,
        written: null,
        oral: null,
        total: null,
        failedReason: null
      };
    }

    var rule = goethePassRule(safeLevel);
    var modules = {};

    if (rule === "total") {
      SKILLS.forEach(function (s) {
        var sc = scores[s];
        modules[s] = {
          score: sc,
          points25: sc === null ? null : sc / 4,
          status: sc === null ? "missing" : "measured"
        };
      });

      if (missing.length > 0) {
        return {
          exam: safeExam,
          level: safeLevel,
          rule: rule,
          verifiable: true,
          verdict: "incomplete",
          missing: missing,
          modules: modules,
          written: null,
          oral: null,
          total: null,
          failedReason: "missing_modules"
        };
      }

      var written = (scores.listen + scores.read + scores.write) / 4;
      var oral = scores.speak / 4;
      var total = written + oral;
      var a2MinOk = safeLevel !== "A2" || (written >= 45 && oral >= 15);
      var passedTotal = total >= 60 && a2MinOk;
      var failedReason = null;
      if (!passedTotal) {
        if (safeLevel === "A2" && written < 45) failedReason = "a2_written_min";
        else if (safeLevel === "A2" && oral < 15) failedReason = "a2_oral_min";
        else failedReason = "total_below_60";
      }

      return {
        exam: safeExam,
        level: safeLevel,
        rule: rule,
        verifiable: true,
        verdict: passedTotal ? "pass" : "fail",
        missing: missing,
        modules: modules,
        written: written,
        oral: oral,
        total: total,
        failedReason: failedReason
      };
    }

    // Modular B1 / B2 (>= 60 in every module independently)
    var failedModules = [];
    SKILLS.forEach(function (s) {
      var sc = scores[s];
      var st = sc === null ? "missing" : sc >= 60 ? "pass" : "fail";
      if (st === "fail") failedModules.push(s);
      modules[s] = {
        score: sc,
        points25: null,
        status: st
      };
    });

    var verdict = missing.length > 0 ? "incomplete" : failedModules.length === 0 ? "pass" : "fail";
    return {
      exam: safeExam,
      level: safeLevel,
      rule: rule,
      verifiable: true,
      verdict: verdict,
      missing: missing,
      modules: modules,
      failedModules: failedModules,
      written: null,
      oral: null,
      total: null,
      failedReason: failedModules.length > 0 ? "module_below_60" : missing.length > 0 ? "missing_modules" : null
    };
  }

  // --------------------------------------------------------------------------
  // 2. SCHREIBEN WORD COUNTER (practice.ts + content/practice/writing/*.json)
  // --------------------------------------------------------------------------

  var WRITING_PROFILES = {
    "a1-t2": { id: "a1-t2", level: "A1", minWords: 30, maxWords: 50, register: "informal", label: { tr: "A1 Teil 2 — E-Posta / Kısa Not (30–50 kelime)", en: "A1 Teil 2 — Email / Short Note (30–50 words)", de: "A1 Teil 2 — E-Mail / Kurze Notiz (30–50 Wörter)" } },
    "a1-t1": { id: "a1-t1", level: "A1", minWords: 10, maxWords: 25, register: "neutral", label: { tr: "A1 Teil 1 — Form Bilgileri (10–25 kelime)", en: "A1 Teil 1 — Form Entries (10–25 words)", de: "A1 Teil 1 — Formularangaben (10–25 Wörter)" } },
    "a2-t1": { id: "a2-t1", level: "A2", minWords: 20, maxWords: 40, register: "informal", label: { tr: "A2 Teil 1 — SMS / Kısa Mesaj (20–40 kelime)", en: "A2 Teil 1 — SMS / Short Message (20–40 words)", de: "A2 Teil 1 — SMS / Kurznachricht (20–40 Wörter)" } },
    "a2-t2": { id: "a2-t2", level: "A2", minWords: 30, maxWords: 50, register: "formal", label: { tr: "A2 Teil 2 — Resmî/Yarı Resmî E-Posta (30–50 kelime)", en: "A2 Teil 2 — Formal/Semi-Formal Email (30–50 words)", de: "A2 Teil 2 — E-Mail (30–50 Wörter)" } },
    "b1-t12": { id: "b1-t12", level: "B1", minWords: 80, maxWords: 110, register: "either", label: { tr: "B1 Teil 1 & 2 — E-Posta / Forum Görüşü (80–110 kelime)", en: "B1 Teil 1 & 2 — Email / Forum Post (80–110 words)", de: "B1 Teil 1 & 2 — E-Mail / Forumsbeitrag (80–110 Wörter)" } },
    "b1-t3": { id: "b1-t3", level: "B1", minWords: 40, maxWords: 60, register: "formal", label: { tr: "B1 Teil 3 — Kısa Resmî E-Posta (40–60 kelime)", en: "B1 Teil 3 — Short Formal Email (40–60 words)", de: "B1 Teil 3 — Kurze formelle E-Mail (40–60 Wörter)" } },
    "b2-t1": { id: "b2-t1", level: "B2", minWords: 150, maxWords: 190, register: "neutral", label: { tr: "B2 Teil 1 — Forum Yazısı / Tartışma (150–190 kelime)", en: "B2 Teil 1 — Forum Post / Argumentation (150–190 words)", de: "B2 Teil 1 — Forumsbeitrag / Erörterung (150–190 Wörter)" } },
    "b2-t2": { id: "b2-t2", level: "B2", minWords: 100, maxWords: 140, register: "formal", label: { tr: "B2 Teil 2 — Resmî E-Posta (100–140 kelime)", en: "B2 Teil 2 — Formal Email (100–140 words)", de: "B2 Teil 2 — Formelle E-Mail (100–140 Wörter)" } }
  };

  var CONNECTORS_BY_LEVEL = {
    A1: ["und", "aber", "oder", "dann", "auch", "denn"],
    A2: ["und", "aber", "oder", "denn", "weil", "dass", "wenn", "dann", "danach", "deshalb", "zuerst", "auch"],
    B1: ["weil", "dass", "wenn", "obwohl", "deshalb", "trotzdem", "ausserdem", "damit", "als", "danach", "zuerst", "zum schluss", "einerseits", "andererseits", "denn", "aber"],
    B2: ["obwohl", "trotzdem", "dennoch", "deshalb", "daher", "folglich", "ausserdem", "darueber hinaus", "einerseits", "andererseits", "waehrend", "indem", "sodass", "zwar", "jedoch", "allerdings", "meiner meinung nach", "zudem", "sowie", "aus diesem grund", "infolgedessen", "dass", "damit", "da ich", "da es", "da das", "da wir", "da sie", "da er", "weil", "wenn", "falls"]
  };

  var INFORMAL_OPENINGS = ["liebe ", "lieber ", "hallo", "hi", "servus", "moin"];
  var FORMAL_OPENINGS = ["sehr geehrte", "sehr geehrter", "guten tag", "sehr geehrte damen und herren"];
  var INFORMAL_SIGNOFFS = ["viele gruesse", "liebe gruesse", "bis bald", "herzliche gruesse", "lg", "dein ", "deine ", "bis dann", "gruss"];
  var FORMAL_SIGNOFFS = ["mit freundlichen gruessen", "freundliche gruesse", "viele gruesse", "mit besten gruessen"];

  function normalizeGerman(value) {
    return String(value || "")
      .normalize("NFC")
      .toLocaleLowerCase("de")
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss");
  }

  function wordCount(value) {
    return String(value || "")
      .split(/\s+/)
      .filter(function (token) {
        return /[\p{L}\p{N}]/u.test(token);
      }).length;
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function hasPhrase(haystack, needle) {
    var tokens = normalizeGerman(needle).trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return false;
    return new RegExp("(^|[^\\p{L}\\p{N}])" + tokens.map(escapeRegex).join("\\s+") + "(?=$|[^\\p{L}\\p{N}])", "u").test(normalizeGerman(haystack));
  }

  // Letter and sentence rules mirrored from app practice.ts; parity is checked by argon-j3.test.ts.
  const letterOpening = /^(?:sehr geehrte(?:r|n)?\b|guten tag\b|liebe(?:r)?\b|hallo\b|hi\b|servus\b|moin\b)/u;
  const letterSignoff = /^(?:mit freundlichen gruessen|freundliche gruesse|viele gruesse|liebe gruesse|herzliche gruesse|mit besten gruessen|bis bald|bis dann|lg|dein|deine|gruss)\b/u;
  const hasWritingOpening = (line, openings) => openings.some(o => {
      const tokens = normalizeGerman(o).trim().split(/\s+/).filter(Boolean);
      return tokens.length > 0 && new RegExp(`^${tokens.map(escapeRegex).join('\\s+')}(?=$|[^\\p{L}\\p{N}])`, 'u').test(normalizeGerman(line).trim());
  });
  /** Preserve common abbreviations and date ordinals; greeting/closing lines aren't body sentences. */
  function writingSentences(draft) {
      let closed = false;
      const body = draft.normalize('NFC').split(/\n/).map(line => {
          const plain = normalizeGerman(line).trim();
          if (closed)
              return '';
          if (letterSignoff.test(plain)) {
              closed = true;
              return '';
          }
          if (letterOpening.test(plain)) {
              const comma = line.indexOf(',');
              return comma < 0 ? '' : line.slice(comma + 1);
          }
          return line;
      }).join('\n');
      return body.replace(/\b(?:z\.\s*b\.|d\.\s*h\.|u\.\s*a\.|(?:prof|dr|bzw|usw|ca|nr)\.)/giu, m => m.replace(/\./g, '\uE000'))
          .replace(/\b\d+\.(?=\s+\p{L})/gu, m => m.replace('.', '\uE000'))
          .split(/[.!?\n]+/).map(s => s.replace(/\uE000/g, '.').trim()).filter(s => wordCount(s) >= 3);
  }

  function analyzeWriting(profileId, draft) {
    var profile = WRITING_PROFILES[profileId] || WRITING_PROFILES["b1-t12"];
    var raw = String(draft || "");
    var plain = normalizeGerman(raw);
    var words = wordCount(raw);
    var chars = raw.length;
    var charsNoSpace = raw.replace(/\s+/g, "").length;
    var sentences = writingSentences(raw).length;

    var pool = CONNECTORS_BY_LEVEL[profile.level] || CONNECTORS_BY_LEVEL.B1;
    var connectorsFound = pool.filter(function (c) {
      return hasPhrase(plain, c);
    });

    var openings =
      profile.register === "formal"
        ? FORMAL_OPENINGS
        : profile.register === "informal"
          ? INFORMAL_OPENINGS
          : INFORMAL_OPENINGS.concat(FORMAL_OPENINGS);

    var signoffs =
      profile.register === "formal"
        ? FORMAL_SIGNOFFS
        : profile.register === "informal"
          ? INFORMAL_SIGNOFFS
          : INFORMAL_SIGNOFFS.concat(FORMAL_SIGNOFFS);

    var lines = raw
      .split(/\n/)
      .map(function (l) {
        return normalizeGerman(l.trim());
      })
      .filter(Boolean);

    var hasOpening = openings.some(function (op) {
      return hasWritingOpening(lines[0] || "", [op]);
    });
    var hasSignoff = signoffs.some(function (sg) {
      return hasPhrase(lines.slice(-3).join(" "), sg.trim());
    });

    var lengthStatus = "empty";
    if (words > 0) {
      if (words < profile.minWords) lengthStatus = "under";
      else if (words > profile.maxWords) lengthStatus = "over";
      else lengthStatus = "in_range";
    }

    var pct = profile.minWords > 0 ? Math.min(100, Math.round((words / profile.maxWords) * 100)) : 0;

    return {
      profile: profile,
      words: words,
      chars: chars,
      charsNoSpace: charsNoSpace,
      sentences: sentences,
      lengthStatus: lengthStatus,
      pct: pct,
      connectorsPool: pool,
      connectorsFound: connectorsFound,
      hasOpening: hasOpening,
      hasSignoff: hasSignoff
    };
  }

  // --------------------------------------------------------------------------
  // 3. PLACEMENT LEVEL TEST (Exact 12 items & placementLevel from placement.ts)
  // --------------------------------------------------------------------------

  var PLACEMENT_ITEMS = [
    { id: "a1-1", level: "A1", promptDe: "Wie ___ du? – Ich heiße Mia.", options: ["heißen", "heißt", "heiße"], answer: 1 },
    { id: "a1-2", level: "A1", promptDe: "Ich komme ___ der Türkei.", options: ["aus", "von", "in"], answer: 0 },
    { id: "a1-3", level: "A1", promptDe: "Das ist ___ Tisch.", options: ["eine", "einen", "ein"], answer: 2 },
    { id: "a2-1", level: "A2", promptDe: "Gestern ___ ich ins Kino gegangen.", options: ["habe", "bin", "war"], answer: 1 },
    { id: "a2-2", level: "A2", promptDe: "Ich lerne Deutsch, ___ ich in Berlin arbeiten möchte.", options: ["weil", "denn", "aber"], answer: 0 },
    { id: "a2-3", level: "A2", promptDe: "Kannst du ___ bitte helfen?", options: ["mich", "mir", "ich"], answer: 1 },
    { id: "b1-1", level: "B1", promptDe: "Das ist der Mann, ___ ich gestern gesehen habe.", options: ["der", "dem", "den"], answer: 2 },
    { id: "b1-2", level: "B1", promptDe: "Obwohl es regnet, ___ spazieren.", options: ["wir gehen", "gehen wir", "gegangen wir"], answer: 1 },
    { id: "b1-3", level: "B1", promptDe: "Wenn ich mehr Zeit ___, würde ich öfter reisen.", options: ["hätte", "habe", "hatte"], answer: 0 },
    { id: "b2-1", level: "B2", promptDe: "Der Vertrag muss bis Freitag ___ werden.", options: ["unterschreiben", "unterschrieb", "unterschrieben"], answer: 2 },
    { id: "b2-2", level: "B2", promptDe: "___ der schlechten Wetterlage wurde das Konzert abgesagt.", options: ["Aufgrund", "Obwohl", "Trotzdem"], answer: 0 },
    { id: "b2-3", level: "B2", promptDe: "Er tat so, als ___ er nichts gehört.", options: ["hat", "hätte", "habe"], answer: 1 }
  ];

  function placementLevel(answers) {
    var safeAnswers = answers || {};
    var result = "A1";
    var levels = ["A1", "A2", "B1", "B2"];
    for (var i = 0; i < levels.length; i++) {
      var lv = levels[i];
      var items = PLACEMENT_ITEMS.filter(function (it) {
        return it.level === lv;
      });
      var correct = items.filter(function (it) {
        return safeAnswers[it.id] === it.answer;
      }).length;
      if (correct >= 2) {
        result = lv;
      } else {
        break;
      }
    }
    return result;
  }

  function placementBreakdown(answers) {
    var safeAnswers = answers || {};
    var levels = ["A1", "A2", "B1", "B2"];
    return levels.map(function (lv) {
      var items = PLACEMENT_ITEMS.filter(function (it) {
        return it.level === lv;
      });
      var correct = items.filter(function (it) {
        return safeAnswers[it.id] === it.answer;
      }).length;
      return { level: lv, correct: correct, total: items.length };
    });
  }

  // --------------------------------------------------------------------------
  // 4. SHARED UI I18N & BROWSER CONTROLLERS
  // --------------------------------------------------------------------------

  var TOOL_I18N = {
    en: {
      backHome: "Back to Lernfino Home",
      tabCalc: "Exam Score Calculator",
      tabCounter: "Schreiben Word Counter",
      tabLevel: "Placement Level Test",
      ctaTitle: "Practice stories, interactive audio & timed mock exams in Lernfino",
      ctaDesc: "Lernfino is available on Google Play and the App Store. Start free and continue your German there.",
      ctaBtn: "Get the App",
      skillListen: "Hören (Listening)",
      skillRead: "Lesen (Reading)",
      skillWrite: "Schreiben (Writing)",
      skillSpeak: "Sprechen (Speaking)",
      // Calculator
      calcPageTitle: "Goethe & ÖSD Exam Score Calculator (A1–B2) | Lernfino",
      calcTitle: "Goethe & ÖSD Score Calculator",
      calcSubtitle: "Enter module scores separately on a 0–100 scale. Modules are never averaged together; passing rules follow each exam format.",
      calcInstitution: "Exam Format",
      calcLevel: "CEFR Level",
      calcReset: "Reset Scores",
      calcInputLabel: "Score (0–100, leave blank if unmeasured)",
      calcPlaceholder: "e.g. 72",
      calcRuleA1A2: "Combined format (written / 75 + oral / 25)",
      calcRuleModular: "Modular format (each module >= 60)",
      calcRuleOsd: "Unverified external rule (modules shown separately)",
      calcStatusMissing: "Unmeasured",
      calcStatusMeasured: "Recorded",
      calcStatusPass: "Pass (>= 60)",
      calcStatusFail: "Below 60",
      calcPointsOf25: "{val} / 25 pts",
      calcVerdictIncompleteTitle: "Incomplete — Enter all 4 modules to check result",
      calcVerdictIncompleteDesc: "Blank modules are treated as unmeasured, not 0. Recorded: {count}/4.",
      calcVerdictPassTitle: "Goethe {level} Passing Threshold Met",
      calcVerdictPassA1Desc: "Written: {w}/75 · Oral: {o}/25 · Total: {t}/100 (minimum 60).",
      calcVerdictPassA2Desc: "Written: {w}/75 (min 45) · Oral: {o}/25 (min 15) · Total: {t}/100 (min 60).",
      calcVerdictPassModDesc: "All 4 modules reached at least 60 points independently.",
      calcVerdictFailTitle: "Below Passing Requirement",
      calcVerdictFailA2Written: "Written component is {w}/75 (minimum 45 required for Goethe A2 even when total >= 60). Total: {t}/100.",
      calcVerdictFailA2Oral: "Oral component is {o}/25 (minimum 15 required for Goethe A2). Total: {t}/100.",
      calcVerdictFailTotal: "Combined total is {t}/100 (minimum 60 required). Written: {w}/75 · Oral: {o}/25.",
      calcVerdictFailMod: "Modules below 60: {list}. In {level} modular exams each module must reach 60 independently.",
      calcVerdictOsdTitle: "ÖSD Modules Shown Individually (No Auto-Verdict)",
      calcVerdictOsdDesc: "Lernfino does not hardcode ÖSD passing rules as verified; module scores are displayed individually without averaging or claiming an overall pass.",
      // Word counter
      counterPageTitle: "Goethe & ÖSD Schreiben Word Counter (A1–B2) | Lernfino",
      counterTitle: "Schreiben Word Counter & Connector Check",
      counterSubtitle: "Check exact word targets matching Goethe & ÖSD Schreiben tasks from A1 to B2, plus greeting, closing, and connector coverage.",
      counterProfileLabel: "Exam Level & Writing Task",
      counterTextareaLabel: "Write or paste your German text",
      counterTextareaPlaceholder: "Sehr geehrte Damen und Herren,\nich schreibe Ihnen wegen...",
      counterClear: "Clear Text",
      counterWords: "Words",
      counterTarget: "Target Range",
      counterSentences: "Sentences (>=3 words)",
      counterChars: "Characters",
      counterLenEmpty: "Start typing to measure your draft against {min}–{max} words.",
      counterLenUnder: "{diff} more words needed to reach the minimum target ({min}–{max}).",
      counterLenIn: "Inside target range ({min}–{max} words)!",
      counterLenOver: "{diff} words above the upper bound ({min}–{max}). Keep it concise.",
      counterStructTitle: "Structure & Connectors ({level})",
      counterOpeningOk: "Greeting detected",
      counterOpeningMiss: "Add a greeting (e.g. Hallo / Sehr geehrte...)",
      counterSignoffOk: "Closing detected",
      counterSignoffMiss: "Add a closing (e.g. Viele Grüße / Mit freundlichen Grüßen)",
      counterConnLabel: "Detected connectors for {level} ({hit}/{total}):",
      // Placement test
      levelPageTitle: "Quick German Placement Test (A1–B2) | Lernfino",
      levelTitle: "Check Your Level (A1–B2)",
      levelSubtitle: "12 short items from A1 to B2. Stops advancing at the first level below 2/3 correct answers.",
      levelQuestionProgress: "Question {n} / {total}",
      levelPrev: "Previous",
      levelNext: "Next",
      levelFinish: "See Result",
      levelDontKnow: "I don't know — stop here & evaluate",
      levelResultTitle: "Suggested starting level: {level}",
      levelResultNote: "Quick self-check only, not an official placement certificate. It stops at the first level below 2/3.",
      levelRetake: "Retake Test",
      levelUseCta: "Continue with {level} in the App"
    },
    tr: {
      backHome: "Lernfino Ana Sayfaya Dön",
      tabCalc: "Sınav Puan Hesaplayıcı",
      tabCounter: "Schreiben Kelime Sayacı",
      tabLevel: "Seviye Tespit (A1–B2)",
      ctaTitle: "Hikâyeler, yapay zekâ sesleri ve süreli denemeler Lernfino'da",
      ctaDesc: "Lernfino, Google Play ve App Store'da. Ücretsiz başla ve Almancana orada devam et.",
      ctaBtn: "Uygulamayı İndir",
      skillListen: "Hören (Dinleme)",
      skillRead: "Lesen (Okuma)",
      skillWrite: "Schreiben (Yazma)",
      skillSpeak: "Sprechen (Konuşma)",
      // Calculator
      calcPageTitle: "Goethe & ÖSD Puan Hesaplayıcı (A1–B2) | Lernfino",
      calcTitle: "Goethe & ÖSD Sınav Puanı Hesaplayıcı",
      calcSubtitle: "Modül puanlarını 0–100 ölçeğinde ayrı ayrı girin. Modüllerin ortalaması alınmaz; geçme kuralı seçilen sınav formatına göre değerlendirilir.",
      calcInstitution: "Sınav Kurumu",
      calcLevel: "CEFR Seviyesi",
      calcReset: "Puanları Sıfırla",
      calcInputLabel: "Puan (0–100, ölçülmediyse boş bırakın)",
      calcPlaceholder: "Örn. 72",
      calcRuleA1A2: "Bütünleşik kural (yazılı / 75 + sözlü / 25)",
      calcRuleModular: "Modüler kural (her modül >= 60)",
      calcRuleOsd: "Doğrulanmamış kural (modüller ayrı gösterilir)",
      calcStatusMissing: "Ölçülmedi",
      calcStatusMeasured: "Kaydedildi",
      calcStatusPass: "Geçti (>= 60)",
      calcStatusFail: "60 altı",
      calcPointsOf25: "{val} / 25 puan",
      calcVerdictIncompleteTitle: "Eksik Veri — Sonuç için 4 modülü de girin",
      calcVerdictIncompleteDesc: "Boş bırakılan modüller 0 sayılmaz, ölçülmedi olarak kalır. Girilen: {count}/4.",
      calcVerdictPassTitle: "Goethe {level} Geçme Koşulu Sağlandı",
      calcVerdictPassA1Desc: "Yazılı: {w}/75 · Sözlü: {o}/25 · Toplam: {t}/100 (en az 60).",
      calcVerdictPassA2Desc: "Yazılı: {w}/75 (min 45) · Sözlü: {o}/25 (min 15) · Toplam: {t}/100 (min 60).",
      calcVerdictPassModDesc: "4 modülün her biri bağımsız olarak en az 60 puana ulaştı.",
      calcVerdictFailTitle: "Geçme Koşulunun Altında",
      calcVerdictFailA2Written: "Yazılı bölüm {w}/75 (Goethe A2'de toplam >= 60 olsa bile yazılı en az 45 olmalı). Toplam: {t}/100.",
      calcVerdictFailA2Oral: "Sözlü bölüm {o}/25 (Goethe A2'de en az 15 olmalı). Toplam: {t}/100.",
      calcVerdictFailTotal: "Toplam puan {t}/100 (en az 60 gerekir). Yazılı: {w}/75 · Sözlü: {o}/25.",
      calcVerdictFailMod: "60 altındaki modüller: {list}. {level} modüler sınavında her modül ayrı ayrı >= 60 olmalıdır.",
      calcVerdictOsdTitle: "ÖSD Modülleri Ayrı Ayrı Gösteriliyor (Otomatik Karar Yok)",
      calcVerdictOsdDesc: "Lernfino, ÖSD geçme kurallarını doğrulanmış olarak sabitlemez; modül puanları ortalanmadan ayrı gösterilir ve genel geçerlik iddiası sunulmaz.",
      // Word counter
      counterPageTitle: "Goethe & ÖSD Schreiben Kelime Sayacı (A1–B2) | Lernfino",
      counterTitle: "Schreiben Kelime Sayacı & Bağlaç Kontrolü",
      counterSubtitle: "A1'den B2'ye Goethe ve ÖSD Schreiben görevleriyle uyumlu kelime hedeflerini, selamlama/kapanış kalıplarını ve bağlaç kullanımını ölçün.",
      counterProfileLabel: "Sınav Seviyesi ve Yazma Görevi",
      counterTextareaLabel: "Almanca metninizi yazın veya yapıştırın",
      counterTextareaPlaceholder: "Sehr geehrte Damen und Herren,\nich schreibe Ihnen wegen...",
      counterClear: "Metni Temizle",
      counterWords: "Kelime",
      counterTarget: "Hedef Aralık",
      counterSentences: "Cümle (>=3 kelime)",
      counterChars: "Karakter",
      counterLenEmpty: "{min}–{max} kelime hedefini ölçmek için metninizi yazın.",
      counterLenUnder: "Alt sınıra ({min}–{max} kelime) ulaşmak için {diff} kelime daha ekleyin.",
      counterLenIn: "Hedef aralığın içindesiniz ({min}–{max} kelime)!",
      counterLenOver: "Üst sınırı ({min}–{max} kelime) {diff} kelime aştınız; gereksiz tekrarları kısaltabilirsiniz.",
      counterStructTitle: "Yapı & Bağlaç Kontrolü ({level})",
      counterOpeningOk: "Açılış selamlaması algılandı",
      counterOpeningMiss: "Açılış selamlaması ekleyin (örn. Hallo / Sehr geehrte...)",
      counterSignoffOk: "Kapanış ifadesi algılandı",
      counterSignoffMiss: "Kapanış ifadesi ekleyin (örn. Viele Grüße / Mit freundlichen Grüßen)",
      counterConnLabel: "{level} için algılanan bağlaçlar ({hit}/{total}):",
      // Placement test
      levelPageTitle: "Hızlı Almanca Seviye Tespit Testi (A1–B2) | Lernfino",
      levelTitle: "Seviyeni Ölç (A1–B2)",
      levelSubtitle: "A1'den B2'ye 12 kısa soru. Bir seviyede 2/3 altına düşüldüğünde ilerleme durur.",
      levelQuestionProgress: "Soru {n} / {total}",
      levelPrev: "Önceki",
      levelNext: "Sonraki",
      levelFinish: "Sonucu Gör",
      levelDontKnow: "Bilmiyorum — burada bitir ve değerlendir",
      levelResultTitle: "Önerilen başlangıç seviyesi: {level}",
      levelResultNote: "Bu yalnızca hızlı bir ön değerlendirmedir, resmî seviye belgesi değildir. İlk 2/3 altı seviyede durur.",
      levelRetake: "Testi Tekrarla",
      levelUseCta: "{level} Seviyesiyle Uygulamada Devam Et"
    },
    de: {
      backHome: "Zurück zur Lernfino-Startseite",
      tabCalc: "Prüfungspunkterechner",
      tabCounter: "Schreiben-Wortzähler",
      tabLevel: "Einstufungstest (A1–B2)",
      ctaTitle: "Geschichten, klares Audio & Prüfungsübungen in Lernfino",
      ctaDesc: "Lernfino gibt es bei Google Play und im App Store. Starten Sie kostenlos und lernen Sie dort weiter.",
      ctaBtn: "App holen",
      skillListen: "Hören",
      skillRead: "Lesen",
      skillWrite: "Schreiben",
      skillSpeak: "Sprechen",
      // Calculator
      calcPageTitle: "Goethe & ÖSD Punkterechner (A1–B2) | Lernfino",
      calcTitle: "Goethe & ÖSD Prüfungspunkterechner",
      calcSubtitle: "Geben Sie die Modulpunkte getrennt auf einer Skala von 0–100 ein. Module werden nicht gemittelt; Bestehensregeln folgen dem jeweiligen Prüfungsformat.",
      calcInstitution: "Prüfungsformat",
      calcLevel: "GER-Niveau",
      calcReset: "Zurücksetzen",
      calcInputLabel: "Punkte (0–100, leer lassen falls nicht gemessen)",
      calcPlaceholder: "z. B. 72",
      calcRuleA1A2: "Gesamtprüfung (schriftlich / 75 + mündlich / 25)",
      calcRuleModular: "Modulare Prüfung (jedes Modul >= 60)",
      calcRuleOsd: "Ungeprüfte externe Regel (Module einzeln angezeigt)",
      calcStatusMissing: "Nicht gemessen",
      calcStatusMeasured: "Erfasst",
      calcStatusPass: "Bestanden (>= 60)",
      calcStatusFail: "Unter 60",
      calcPointsOf25: "{val} / 25 Pkt.",
      calcVerdictIncompleteTitle: "Unvollständig — Alle 4 Module eingeben",
      calcVerdictIncompleteDesc: "Leere Module zählen als nicht gemessen, nicht als 0. Erfasst: {count}/4.",
      calcVerdictPassTitle: "Goethe {level} Bestehensgrenze erreicht",
      calcVerdictPassA1Desc: "Schriftlich: {w}/75 · Mündlich: {o}/25 · Gesamt: {t}/100 (mind. 60).",
      calcVerdictPassA2Desc: "Schriftlich: {w}/75 (mind. 45) · Mündlich: {o}/25 (mind. 15) · Gesamt: {t}/100 (mind. 60).",
      calcVerdictPassModDesc: "Alle 4 Module haben jeweils mindestens 60 Punkte erreicht.",
      calcVerdictFailTitle: "Bestehensgrenze nicht erreicht",
      calcVerdictFailA2Written: "Schriftlicher Teil liegt bei {w}/75 (bei Goethe A2 sind mind. 45 schriftlich nötig, auch bei Gesamt >= 60). Gesamt: {t}/100.",
      calcVerdictFailA2Oral: "Mündlicher Teil liegt bei {o}/25 (mind. 15 bei Goethe A2 erforderlich). Gesamt: {t}/100.",
      calcVerdictFailTotal: "Gesamtpunktzahl beträgt {t}/100 (mind. 60 erforderlich). Schriftlich: {w}/75 · Mündlich: {o}/25.",
      calcVerdictFailMod: "Module unter 60: {list}. In {level} müssen alle Module einzeln >= 60 erreichen.",
      calcVerdictOsdTitle: "ÖSD-Module einzeln dargestellt (kein automatisches Gesamturteil)",
      calcVerdictOsdDesc: "Lernfino legt keine eigenen ÖSD-Bestehensregeln als verifiziert fest; Module werden einzeln und ohne Mittelwert angezeigt.",
      // Word counter
      counterPageTitle: "Goethe & ÖSD Schreiben-Wortzähler (A1–B2) | Lernfino",
      counterTitle: "Schreiben-Wortzähler & Konnektorencheck",
      counterSubtitle: "Prüfen Sie Ihren Text auf die genauen Wortvorgaben der Goethe- & ÖSD-Schreibaufgaben von A1 bis B2 sowie Anrede, Grußformel und Konnektoren.",
      counterProfileLabel: "Niveau & Schreibaufgabe",
      counterTextareaLabel: "Deutschen Text schreiben oder einfügen",
      counterTextareaPlaceholder: "Sehr geehrte Damen und Herren,\nich schreibe Ihnen wegen...",
      counterClear: "Text leeren",
      counterWords: "Wörter",
      counterTarget: "Zielbereich",
      counterSentences: "Sätze (>=3 Wörter)",
      counterChars: "Zeichen",
      counterLenEmpty: "Schreiben Sie Ihren Text, um ihn am Zielbereich ({min}–{max} Wörter) zu messen.",
      counterLenUnder: "Es fehlen noch {diff} Wörter bis zum Mindestumfang ({min}–{max}).",
      counterLenIn: "Im Zielbereich ({min}–{max} Wörter)!",
      counterLenOver: "{diff} Wörter über dem Richtwert ({min}–{max}). Eventuell etwas kürzen.",
      counterStructTitle: "Aufbau & Konnektoren ({level})",
      counterOpeningOk: "Anrede erkannt",
      counterOpeningMiss: "Anrede hinzufügen (z. B. Hallo / Sehr geehrte...)",
      counterSignoffOk: "Grußformel erkannt",
      counterSignoffMiss: "Grußformel hinzufügen (z. B. Viele Grüße / Mit freundlichen Grüßen)",
      counterConnLabel: "Erkannte Konnektoren für {level} ({hit}/{total}):",
      // Placement test
      levelPageTitle: "Kurzer Deutsch-Einstufungstest (A1–B2) | Lernfino",
      levelTitle: "Niveau einschätzen (A1–B2)",
      levelSubtitle: "12 kurze Aufgaben von A1 bis B2. Die Auswertung stoppt auf der ersten Stufe unter 2/3 richtigen Antworten.",
      levelQuestionProgress: "Frage {n} / {total}",
      levelPrev: "Zurück",
      levelNext: "Weiter",
      levelFinish: "Ergebnis anzeigen",
      levelDontKnow: "Weiß nicht — hier beenden & auswerten",
      levelResultTitle: "Empfohlenes Startniveau: {level}",
      levelResultNote: "Nur ein kurzer Selbstcheck, kein offizielles Einstufungszertifikat. Stoppt bei der ersten Stufe unter 2/3.",
      levelRetake: "Test wiederholen",
      levelUseCta: "Mit {level} in der App weitermachen"
    }
  };

  function fmt(str, vars) {
    var out = String(str || "");
    if (!vars) return out;
    Object.keys(vars).forEach(function (k) {
      out = out.split("{" + k + "}").join(String(vars[k]));
    });
    return out;
  }

  function initBrowserTools() {
    if (typeof document === "undefined") return;

    var currentLang = (function () {
      try {
        var q = new URLSearchParams(window.location.search).get("lang");
        if (q && TOOL_I18N[q.toLowerCase()]) return q.toLowerCase();
      } catch (e) {}
      try {
        var saved = localStorage.getItem("lernfino_web_lang");
        if (saved && TOOL_I18N[saved]) return saved;
      } catch (e) {}
      var nav = (navigator.language || "en").toLowerCase();
      if (nav.indexOf("tr") === 0) return "tr";
      if (nav.indexOf("de") === 0) return "de";
      return "en";
    })();

    var savedTheme = null;
    try {
      savedTheme = localStorage.getItem("lernfino_web_theme");
    } catch (e) {}
    if (savedTheme === "dark" || savedTheme === "light") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    var themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", function () {
        var cur = document.documentElement.getAttribute("data-theme") || "light";
        var next = cur === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem("lernfino_web_theme", next);
        } catch (e) {}
      });
    }

    function homeRouteFor(lang, levelParam) {
      var suffix = levelParam ? "?level=" + encodeURIComponent(levelParam) + "#download" : "";
      if (lang === "tr") return "../tr/" + suffix;
      if (lang === "de") return "../de/" + suffix;
      return "../" + suffix;
    }

    var renderCurrentTool = function () {};

    function applySharedI18n() {
      var t = TOOL_I18N[currentLang] || TOOL_I18N.en;
      document.documentElement.lang = currentLang;

      document.querySelectorAll("[data-tool-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-tool-i18n");
        if (t[key] !== undefined) el.textContent = t[key];
      });

      document.querySelectorAll(".lang-btn").forEach(function (btn) {
        var active = btn.getAttribute("data-lang") === currentLang;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
      });

      document.querySelectorAll("[data-home-link]").forEach(function (link) {
        var useLaunch = link.getAttribute("data-home-link") === "launch";
        link.setAttribute("href", homeRouteFor(currentLang, "") + (useLaunch ? "#download" : ""));
      });

      var toolType = document.body.getAttribute("data-tool");
      if (toolType === "calculator") document.title = t.calcPageTitle;
      else if (toolType === "counter") document.title = t.counterPageTitle;
      else if (toolType === "level-test") document.title = t.levelPageTitle;

      renderCurrentTool();
    }

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang = btn.getAttribute("data-lang");
        if (!lang || !TOOL_I18N[lang]) return;
        currentLang = lang;
        try {
          localStorage.setItem("lernfino_web_lang", lang);
        } catch (e) {}
        applySharedI18n();
      });
    });

    var toolType = document.body.getAttribute("data-tool");

    // ------------------ TOOL 1: EXAM SCORE CALCULATOR ------------------
    if (toolType === "calculator") {
      var calcState = {
        exam: "goethe",
        level: "B1",
        scores: { listen: "", read: "", write: "", speak: "" }
      };

      var calcExamBtns = document.querySelectorAll("[data-calc-exam]");
      var calcLevelBtns = document.querySelectorAll("[data-calc-level]");
      var calcInputsWrap = document.getElementById("calcModuleGrid");
      var calcVerdictEl = document.getElementById("calcVerdict");
      var calcRulePill = document.getElementById("calcRulePill");
      var calcResetBtn = document.getElementById("calcResetBtn");

      calcExamBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          calcState.exam = btn.getAttribute("data-calc-exam");
          renderCalculator();
        });
      });

      calcLevelBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          calcState.level = btn.getAttribute("data-calc-level");
          renderCalculator();
        });
      });

      if (calcResetBtn) {
        calcResetBtn.addEventListener("click", function () {
          calcState.scores = { listen: "", read: "", write: "", speak: "" };
          renderCalculator();
        });
      }

      function renderCalculator() {
        var t = TOOL_I18N[currentLang];
        calcExamBtns.forEach(function (btn) {
          var active = btn.getAttribute("data-calc-exam") === calcState.exam;
          btn.classList.toggle("active", active);
          btn.setAttribute("aria-pressed", String(active));
        });
        calcLevelBtns.forEach(function (btn) {
          var active = btn.getAttribute("data-calc-level") === calcState.level;
          btn.classList.toggle("active", active);
          btn.setAttribute("aria-pressed", String(active));
        });

        var res = evaluateScore(calcState.exam, calcState.level, calcState.scores);

        if (calcRulePill) {
          calcRulePill.textContent =
            res.rule === "total" ? t.calcRuleA1A2 : res.rule === "modular" ? t.calcRuleModular : t.calcRuleOsd;
        }

        if (calcInputsWrap) {
          var existingInputs = calcInputsWrap.querySelectorAll("[data-skill-input]");
          if (existingInputs.length === 0) {
            calcInputsWrap.innerHTML = "";
            SKILLS.forEach(function (skill) {
              var card = document.createElement("div");
              card.className = "tool-module-row";
              card.innerHTML =
                '<div class="tool-module-head">' +
                '<span class="tool-module-name" data-skill-label="' + skill + '"></span>' +
                '<span class="tool-badge" data-skill-badge="' + skill + '"></span>' +
                "</div>" +
                '<label class="tool-label" for="score-' + skill + '" data-skill-input-label="' + skill + '"></label>' +
                '<input id="score-' + skill + '" class="tool-input" type="number" min="0" max="100" step="1" data-skill-input="' + skill + '" />' +
                '<div class="tool-module-note" data-skill-note="' + skill + '"></div>';
              calcInputsWrap.appendChild(card);

              var inp = card.querySelector("[data-skill-input]");
              inp.addEventListener("input", function () {
                calcState.scores[skill] = inp.value;
                updateCalculatorOutputs();
              });
            });
          }
        }
        updateCalculatorOutputs();
      }

      function updateCalculatorOutputs() {
        var t = TOOL_I18N[currentLang];
        var res = evaluateScore(calcState.exam, calcState.level, calcState.scores);
        var skillNames = {
          listen: t.skillListen,
          read: t.skillRead,
          write: t.skillWrite,
          speak: t.skillSpeak
        };

        SKILLS.forEach(function (skill) {
          var mod = res.modules[skill];
          var lbl = document.querySelector('[data-skill-label="' + skill + '"]');
          var badge = document.querySelector('[data-skill-badge="' + skill + '"]');
          var inpLbl = document.querySelector('[data-skill-input-label="' + skill + '"]');
          var inp = document.querySelector('[data-skill-input="' + skill + '"]');
          var note = document.querySelector('[data-skill-note="' + skill + '"]');

          if (lbl) lbl.textContent = skillNames[skill];
          if (inpLbl) inpLbl.textContent = t.calcInputLabel;
          if (inp) {
            inp.placeholder = t.calcPlaceholder;
            if (inp.value !== String(calcState.scores[skill])) {
              inp.value = calcState.scores[skill];
            }
          }
          if (badge) {
            badge.className = "tool-badge";
            if (mod.status === "missing") {
              badge.classList.add("is-incomplete");
              badge.textContent = t.calcStatusMissing;
            } else if (mod.status === "pass") {
              badge.classList.add("is-pass");
              badge.textContent = t.calcStatusPass;
            } else if (mod.status === "fail") {
              badge.classList.add("is-fail");
              badge.textContent = t.calcStatusFail;
            } else {
              badge.classList.add(res.verifiable ? "is-measured" : "is-unverified");
              badge.textContent = t.calcStatusMeasured;
            }
          }
          if (note) {
            if (mod.score === null) note.textContent = "";
            else if (res.rule === "total" && mod.points25 !== null) {
              note.textContent = fmt(t.calcPointsOf25, { val: formatExamScore(mod.points25) });
            } else {
              note.textContent = mod.score + " / 100";
            }
          }
        });

        if (calcVerdictEl) {
          calcVerdictEl.className = "tool-verdict";
          var title = "";
          var desc = "";

          if (res.exam === "osd") {
            calcVerdictEl.classList.add("is-unverified");
            title = t.calcVerdictOsdTitle;
            desc = t.calcVerdictOsdDesc;
          } else if (res.verdict === "incomplete") {
            calcVerdictEl.classList.add("is-incomplete");
            title = t.calcVerdictIncompleteTitle;
            desc = fmt(t.calcVerdictIncompleteDesc, { count: 4 - res.missing.length });
          } else if (res.verdict === "pass") {
            calcVerdictEl.classList.add("is-pass");
            title = fmt(t.calcVerdictPassTitle, { level: res.level });
            if (res.rule === "total") {
              desc = fmt(res.level === "A2" ? t.calcVerdictPassA2Desc : t.calcVerdictPassA1Desc, {
                w: formatExamScore(res.written),
                o: formatExamScore(res.oral),
                t: formatExamScore(res.total)
              });
            } else {
              desc = t.calcVerdictPassModDesc;
            }
          } else {
            calcVerdictEl.classList.add("is-fail");
            title = t.calcVerdictFailTitle;
            if (res.failedReason === "a2_written_min") {
              desc = fmt(t.calcVerdictFailA2Written, { w: formatExamScore(res.written), t: formatExamScore(res.total) });
            } else if (res.failedReason === "a2_oral_min") {
              desc = fmt(t.calcVerdictFailA2Oral, { o: formatExamScore(res.oral), t: formatExamScore(res.total) });
            } else if (res.failedReason === "total_below_60") {
              desc = fmt(t.calcVerdictFailTotal, { w: formatExamScore(res.written), o: formatExamScore(res.oral), t: formatExamScore(res.total) });
            } else {
              var failedLabels = (res.failedModules || []).map(function (s) {
                return skillNames[s];
              });
              desc = fmt(t.calcVerdictFailMod, { list: failedLabels.join(", "), level: res.level });
            }
          }

          calcVerdictEl.innerHTML =
            '<div class="tool-verdict-title"></div><div class="tool-verdict-desc"></div>';
          calcVerdictEl.querySelector(".tool-verdict-title").textContent = title;
          calcVerdictEl.querySelector(".tool-verdict-desc").textContent = desc;
        }
      }

      renderCurrentTool = renderCalculator;
    }

    // ------------------ TOOL 2: SCHREIBEN WORD COUNTER ------------------
    if (toolType === "counter") {
      var profileSel = document.getElementById("writingProfile");
      var draftEl = document.getElementById("writingDraft");
      var clearBtn = document.getElementById("writingClearBtn");
      var selectedProfile = "b1-t12";

      if (profileSel) {
        profileSel.addEventListener("change", function () {
          selectedProfile = profileSel.value;
          renderCounter();
        });
      }
      if (draftEl) {
        draftEl.addEventListener("input", function () {
          renderCounter();
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (draftEl) draftEl.value = "";
          renderCounter();
        });
      }

      function renderCounter() {
        var t = TOOL_I18N[currentLang];
        if (profileSel) {
          var prevVal = selectedProfile;
          profileSel.innerHTML = "";
          Object.keys(WRITING_PROFILES).forEach(function (id) {
            var opt = document.createElement("option");
            opt.value = id;
            opt.textContent = WRITING_PROFILES[id].label[currentLang];
            if (id === prevVal) opt.selected = true;
            profileSel.appendChild(opt);
          });
        }

        if (draftEl) {
          draftEl.placeholder = t.counterTextareaPlaceholder;
        }

        var analysis = analyzeWriting(selectedProfile, draftEl ? draftEl.value : "");
        var statWords = document.getElementById("statWords");
        var statTarget = document.getElementById("statTarget");
        var statSentences = document.getElementById("statSentences");
        var statChars = document.getElementById("statChars");
        var fillEl = document.getElementById("writingProgressFill");
        var statusEl = document.getElementById("writingLengthStatus");
        var structTitle = document.getElementById("writingStructTitle");
        var openingBadge = document.getElementById("writingOpeningBadge");
        var signoffBadge = document.getElementById("writingSignoffBadge");
        var connTitle = document.getElementById("writingConnTitle");
        var connChips = document.getElementById("writingConnChips");

        if (statWords) statWords.textContent = String(analysis.words);
        if (statTarget) statTarget.textContent = analysis.profile.minWords + "–" + analysis.profile.maxWords;
        if (statSentences) statSentences.textContent = String(analysis.sentences);
        if (statChars) statChars.textContent = String(analysis.chars);

        if (fillEl) {
          fillEl.style.width = analysis.pct + "%";
          fillEl.className = "tool-progress-fill";
          if (analysis.lengthStatus === "in_range") fillEl.classList.add("is-pass");
          else if (analysis.lengthStatus === "over") fillEl.classList.add("is-over");
        }

        if (statusEl) {
          statusEl.className = "tool-verdict";
          var msg = "";
          if (analysis.lengthStatus === "empty") {
            msg = fmt(t.counterLenEmpty, { min: analysis.profile.minWords, max: analysis.profile.maxWords });
          } else if (analysis.lengthStatus === "under") {
            msg = fmt(t.counterLenUnder, {
              diff: analysis.profile.minWords - analysis.words,
              min: analysis.profile.minWords,
              max: analysis.profile.maxWords
            });
          } else if (analysis.lengthStatus === "in_range") {
            statusEl.classList.add("is-pass");
            msg = fmt(t.counterLenIn, { min: analysis.profile.minWords, max: analysis.profile.maxWords });
          } else {
            statusEl.classList.add("is-unverified");
            msg = fmt(t.counterLenOver, {
              diff: analysis.words - analysis.profile.maxWords,
              min: analysis.profile.minWords,
              max: analysis.profile.maxWords
            });
          }
          statusEl.textContent = msg;
        }

        if (structTitle) {
          structTitle.textContent = fmt(t.counterStructTitle, { level: analysis.profile.level });
        }
        if (openingBadge) {
          openingBadge.className = "tool-badge " + (analysis.hasOpening ? "is-pass" : "is-incomplete");
          openingBadge.textContent = analysis.hasOpening ? t.counterOpeningOk : t.counterOpeningMiss;
        }
        if (signoffBadge) {
          signoffBadge.className = "tool-badge " + (analysis.hasSignoff ? "is-pass" : "is-incomplete");
          signoffBadge.textContent = analysis.hasSignoff ? t.counterSignoffOk : t.counterSignoffMiss;
        }
        if (connTitle) {
          connTitle.textContent = fmt(t.counterConnLabel, {
            level: analysis.profile.level,
            hit: analysis.connectorsFound.length,
            total: analysis.connectorsPool.length
          });
        }
        if (connChips) {
          connChips.innerHTML = "";
          analysis.connectorsPool.forEach(function (c) {
            var hit = analysis.connectorsFound.indexOf(c) !== -1;
            var chip = document.createElement("span");
            chip.className = "tool-chip" + (hit ? " is-hit" : "");
            chip.textContent = c;
            connChips.appendChild(chip);
          });
        }
      }

      renderCurrentTool = renderCounter;
    }

    // ------------------ TOOL 3: PLACEMENT LEVEL TEST ------------------
    if (toolType === "level-test") {
      var quizState = {
        idx: 0,
        answers: {},
        finished: false
      };

      var quizArea = document.getElementById("placementQuizArea");
      var resultArea = document.getElementById("placementResultArea");

      function renderPlacement() {
        var t = TOOL_I18N[currentLang];
        if (!quizArea || !resultArea) return;

        if (!quizState.finished) {
          quizArea.hidden = false;
          resultArea.hidden = true;

          var item = PLACEMENT_ITEMS[quizState.idx];
          var selectedAns = quizState.answers[item.id];
          var isLast = quizState.idx === PLACEMENT_ITEMS.length - 1;

          quizArea.innerHTML =
            '<div class="tool-quiz-meta">' +
            '<span id="quizProgress"></span>' +
            '<span class="tool-badge is-measured">' + item.level + "</span>" +
            "</div>" +
            '<div class="tool-progress-wrap"><div class="tool-progress-fill" style="width:' +
            Math.round(((quizState.idx + 1) / PLACEMENT_ITEMS.length) * 100) +
            '%"></div></div>' +
            '<div class="tool-quiz-prompt" id="quizPrompt"></div>' +
            '<div class="tool-options-grid" id="quizOptions"></div>' +
            '<div class="tool-quiz-actions">' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-secondary btn-sm" id="quizPrevBtn"></button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="quizNextBtn"></button>' +
            "</div>" +
            '<button type="button" class="text-link" id="quizStopBtn"></button>' +
            "</div>";

          quizArea.querySelector("#quizProgress").textContent = fmt(t.levelQuestionProgress, {
            n: quizState.idx + 1,
            total: PLACEMENT_ITEMS.length
          });
          quizArea.querySelector("#quizPrompt").textContent = item.promptDe;

          var optWrap = quizArea.querySelector("#quizOptions");
          item.options.forEach(function (optText, optIdx) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "tool-option-btn" + (selectedAns === optIdx ? " selected" : "");
            btn.textContent = optText;
            btn.addEventListener("click", function () {
              quizState.answers[item.id] = optIdx;
              if (!isLast) {
                quizState.idx += 1;
              } else {
                quizState.finished = true;
              }
              renderPlacement();
            });
            optWrap.appendChild(btn);
          });

          var prevBtn = quizArea.querySelector("#quizPrevBtn");
          prevBtn.textContent = t.levelPrev;
          prevBtn.disabled = quizState.idx === 0;
          prevBtn.addEventListener("click", function () {
            if (quizState.idx > 0) {
              quizState.idx -= 1;
              renderPlacement();
            }
          });

          var nextBtn = quizArea.querySelector("#quizNextBtn");
          nextBtn.textContent = isLast ? t.levelFinish : t.levelNext;
          nextBtn.addEventListener("click", function () {
            if (isLast) {
              quizState.finished = true;
            } else {
              quizState.idx += 1;
            }
            renderPlacement();
          });

          var stopBtn = quizArea.querySelector("#quizStopBtn");
          stopBtn.textContent = t.levelDontKnow;
          stopBtn.addEventListener("click", function () {
            quizState.finished = true;
            renderPlacement();
          });
        } else {
          quizArea.hidden = true;
          resultArea.hidden = false;

          var lvl = placementLevel(quizState.answers);
          var breakdown = placementBreakdown(quizState.answers);

          resultArea.innerHTML =
            '<div class="tool-verdict is-pass">' +
            '<div class="tool-verdict-title" id="resultTitle"></div>' +
            '<div class="tool-verdict-desc" id="resultNote"></div>' +
            '<div class="tool-breakdown-list" id="resultBreakdown"></div>' +
            "</div>" +
            '<div class="tool-quiz-actions" style="margin-top:20px;">' +
            '<a class="btn btn-primary" id="resultUseBtn"></a>' +
            '<button type="button" class="btn btn-secondary" id="resultRetakeBtn"></button>' +
            "</div>";

          resultArea.querySelector("#resultTitle").textContent = fmt(t.levelResultTitle, { level: lvl });
          resultArea.querySelector("#resultNote").textContent = t.levelResultNote;

          var bdWrap = resultArea.querySelector("#resultBreakdown");
          breakdown.forEach(function (b) {
            var pill = document.createElement("span");
            pill.className = "tool-badge " + (b.correct >= 2 ? "is-pass" : "is-incomplete");
            pill.textContent = b.level + ": " + b.correct + "/" + b.total;
            bdWrap.appendChild(pill);
          });

          var useBtn = resultArea.querySelector("#resultUseBtn");
          useBtn.textContent = fmt(t.levelUseCta, { level: lvl });
          useBtn.setAttribute("href", homeRouteFor(currentLang, lvl));

          resultArea.querySelector("#resultRetakeBtn").textContent = t.levelRetake;
          resultArea.querySelector("#resultRetakeBtn").addEventListener("click", function () {
            quizState = { idx: 0, answers: {}, finished: false };
            renderPlacement();
          });
        }
      }

      renderCurrentTool = renderPlacement;
    }

    applySharedI18n();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initBrowserTools);
  }

  var api = {
    SKILLS: SKILLS,
    goethePassRule: goethePassRule,
    evaluateScore: evaluateScore,
    WRITING_PROFILES: WRITING_PROFILES,
    CONNECTORS_BY_LEVEL: CONNECTORS_BY_LEVEL,
    normalizeGerman: normalizeGerman,
    wordCount: wordCount,
    hasPhrase: hasPhrase,
    analyzeWriting: analyzeWriting,
    PLACEMENT_ITEMS: PLACEMENT_ITEMS,
    placementLevel: placementLevel,
    placementBreakdown: placementBreakdown
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  globalScope.LernfinoTools = api;
})(typeof window !== "undefined" ? window : globalThis);
