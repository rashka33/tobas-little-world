"use strict";
// All spoken guidance lives here. Somali is recordings-only and intentionally silent.
const STRINGS = {
  home: { en: "Let’s play!", so: "" },
  welcome: { en: "Help Hippo smile!", so: "" },
  cleaning: { en: "Brush the teeth!", so: "" },
  repair: { en: "Tap the sleepy tooth!", so: "" },
  braces: { en: "Decorate the teeth!", so: "" },
  celebration: { en: "You did it!", so: "" },
  book: { en: "Your lovely stickers!", so: "" },
};
const SAVE_KEY = "tobas-little-world:v1";
const defaults = () => ({
  version: 1,
  stickers: [],
  settings: {
    sound: true,
    music: true,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    language: "en",
  },
});
let save = defaults();
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (s?.version === 1) {
    save.settings = { ...save.settings, ...s.settings };
    save.stickers = Array.isArray(s.stickers)
      ? [
          ...new Set(
            s.stickers.filter((x) => Number.isInteger(x) && x >= 0 && x < 5),
          ),
        ]
      : [];
  }
} catch {}
const persist = () => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {}
};
const $ = (s) => document.querySelector(s),
  scene = $("#scene"),
  panel = $("#panel"),
  ghost = $("#ghost");
let state = "home",
  timers = new Set(),
  drag = null,
  selected = null,
  spots = [],
  placed = new Set(),
  earned = false,
  lastAction = performance.now(),
  lastScrub = 0,
  holdTimer = null,
  holdStart = 0,
  holdPointer = null,
  voiceKey = "home",
  transitioning = false;
const svg = (content, box = "0 0 100 100") =>
  `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content}</svg>`;
const icons = {
  home: svg(
    '<path d="M15 48 50 17 85 48M25 42V85H75V42M43 85V62H58V85" fill="none" stroke="#73608d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  speaker: svg(
    '<path d="M15 40H32L54 23V77L32 60H15Z" fill="#8864bd"/><path d="M66 36Q83 50 66 65M77 24Q102 50 77 77" fill="none" stroke="#8864bd" stroke-width="7" stroke-linecap="round"/>',
  ),
  lock: svg(
    '<rect x="24" y="44" width="52" height="40" rx="12" fill="#b9acbe"/><path d="M35 44V30A15 15 0 0 1 65 30V44" fill="none" stroke="#b9acbe" stroke-width="9"/><circle cx="50" cy="61" r="5" fill="white"/>',
  ),
  tooth: svg(
    '<path d="M19 19Q32 8 50 19Q68 8 81 19C98 39 78 91 65 86L55 61Q50 54 45 61L35 86C22 91 2 39 19 19" fill="#fffdf5" stroke="#b49bcf" stroke-width="4"/><path d="M37 35Q50 45 63 35" fill="none" stroke="#8a69b4" stroke-width="4" stroke-linecap="round"/>',
  ),
  pencils: svg(
    '<g transform="rotate(-15 50 50)"><path d="M24 72V23Q34 13 44 23V72L34 91Z" fill="#ee898e"/><path d="M49 72V13Q59 3 69 13V72L59 91Z" fill="#8dcdb7"/><path d="M73 72V30Q83 20 93 30V72L83 91Z" fill="#a28ad0"/><path d="M24 72H44L34 91ZM49 72H69L59 91ZM73 72H93L83 91Z" fill="#fff2cf"/></g>',
  ),
  book: svg(
    '<path d="M15 14H76Q88 14 88 27V88H22Q12 88 12 78V23Z" fill="#a88acb"/><path d="M24 14V88" stroke="#73598f" stroke-width="6"/><path d="m56 29 7 15 17 2-12 12 3 17-15-8-15 8 3-17-12-12 17-2Z" fill="#ffdc7b"/>',
  ),
  brush: svg(
    '<rect x="11" y="47" width="77" height="17" rx="8" fill="#ee9f9b"/><rect x="5" y="30" width="35" height="26" rx="7" fill="#b4e1df"/><path d="M12 28V40M20 26V40M28 26V40M36 28V40" stroke="white" stroke-width="6" stroke-linecap="round"/>',
  ),
  hand: svg(
    '<path d="M35 62V25Q35 13 45 18V45L49 39Q55 34 59 42Q70 34 73 46Q84 42 85 55V70Q85 90 66 90H51Q41 90 34 80L19 61Q13 51 23 49Z" fill="#fffaf0" stroke="#8864bd" stroke-width="4"/>',
  ),
};
const colors = ["#ed9fbe", "#ffce68", "#78cfc1", "#ab8cdb", "#f29a77"];
function shape(i) {
  return svg(
    `<g fill="${colors[i]}" stroke="#fff9ed" stroke-width="3">${['<path d="m50 9 12 25 28 4-20 20 5 28-25-13-25 13 5-28-20-20 28-4Z"/>', '<path d="M50 85 16 52C-10 22 28 0 50 28C72 0 110 22 84 52Z"/>', '<circle cx="50" cy="50" r="34"/>', '<path d="M50 27C25-7 5 28 29 46C-5 64 25 94 47 72C65 106 99 76 74 53C110 29 75 3 50 27Z"/><circle cx="51" cy="51" r="12" fill="#ffdc78"/>', '<path d="m50 8 39 42-39 42L11 50Z"/>'][i]}</g>`,
  );
}
function giraffe() {
  return `<svg class="geri" viewBox="0 0 250 460" aria-label="Geri the friendly giraffe"><g class="breathing"><path class="tail" d="M170 337Q225 350 209 299" fill="none" stroke="#d49953" stroke-width="9"/><ellipse cx="118" cy="359" rx="65" ry="53" fill="#f3c768"/><path d="M72 375V437M155 375V437" stroke="#f3c768" stroke-width="28" stroke-linecap="round"/><path d="M101 349 95 171H150L153 349" fill="#f3c768"/><path d="M107 218 132 205 143 227 118 240ZM111 280 141 267 145 292 121 305ZM66 347 85 332 104 351 88 371ZM143 370 163 349 175 368 157 386Z" fill="#d99b56"/><path d="M99 101 88 63M145 99 155 62" stroke="#d89a55" stroke-width="12"/><circle cx="87" cy="60" r="12" fill="#b28157"/><circle cx="156" cy="60" r="12" fill="#b28157"/><ellipse class="ear" cx="64" cy="119" rx="28" ry="14" fill="#f3c768" transform="rotate(25 64 119)"/><ellipse class="ear" cx="179" cy="119" rx="28" ry="14" fill="#f3c768" transform="rotate(-25 179 119)"/><rect x="69" y="89" width="105" height="125" rx="47" fill="#f3c768"/><ellipse cx="123" cy="183" rx="62" ry="39" fill="#ffdfa1"/><g class="eyes" fill="#51415c"><circle cx="98" cy="139" r="7"/><circle cx="147" cy="139" r="7"/></g><ellipse cx="83" cy="160" rx="13" ry="7" fill="#eea487"/><ellipse cx="162" cy="160" rx="13" ry="7" fill="#eea487"/><path d="M107 186Q122 200 139 186" fill="none" stroke="#a47253" stroke-width="4" stroke-linecap="round"/><path d="M72 322Q41 337 35 313" fill="none" stroke="#f3c768" stroke-width="18" stroke-linecap="round"/></g></svg>`;
}
// Audio nodes are created locally; no files, network requests, or recordings.
const audio = {
  ctx: null,
  master: null,
  musicTimer: null,
  note: 0,
  scrub: null,
  sources: new Set(),
  unlock() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    this.startMusic();
  },
  tone(freq, dur = 0.18, vol = 0.14, type = "sine", delay = 0) {
    if (!this.ctx || !save.settings.sound || document.hidden) return;
    const c = this.ctx,
      t = c.currentTime + delay,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    this.sources.add(o);
    o.onended = () => {
      this.sources.delete(o);
      o.disconnect();
      g.disconnect();
    };
    o.start(t);
    o.stop(t + dur + 0.02);
  },
  noise(dur = 0.2, volume = 0.055, cutoff = 900) {
    if (!this.ctx || !save.settings.sound || document.hidden) return null;
    const c = this.ctx,
      b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate),
      data = b.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(),
      g = c.createGain(),
      f = c.createBiquadFilter();
    s.buffer = b;
    f.type = "lowpass";
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(volume, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    this.sources.add(s);
    s.onended = () => {
      this.sources.delete(s);
      s.disconnect();
      f.disconnect();
      g.disconnect();
    };
    s.start();
    s.stop(c.currentTime + dur);
    return s;
  },
  fx(name) {
    if (name === "pop") {
      this.tone(490, 0.09, 0.09);
      this.tone(330, 0.08, 0.04, "sine", 0.02);
    } else if (name === "whoosh") this.noise(0.28, 0.06, 650);
    else if (name === "scrub") {
      this.scrub?.stop();
      this.scrub = this.noise(0.13, 0.045, 1500);
    } else {
      (name === "bing" ? [660, 880] : [660, 830, 990, 1320]).forEach((n, i) =>
        this.tone(n, 0.45, 0.09, "triangle", i * 0.09),
      );
    }
  },
  startMusic() {
    if (
      !this.ctx ||
      this.musicTimer ||
      !save.settings.music ||
      !save.settings.sound ||
      document.hidden
    )
      return;
    const melody = [0, 4, 7, 9, 7, 4, 2, 0, 4, 7, 12, 9, 7, 4, 2, 4];
    const tick = () => {
      if (this.ctx.state === "running")
        this.tone(
          261.63 * 2 ** (melody[this.note++ % melody.length] / 12),
          1.25,
          0.026,
          "triangle",
        );
    };
    tick();
    this.musicTimer = setInterval(tick, 800);
  },
  stop() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.scrub?.stop();
    this.scrub = null;
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {}
    }
    this.sources.clear();
    if (this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(0, this.ctx.currentTime);
      this.ctx.suspend().catch(() => {});
    }
    window.speechSynthesis?.cancel();
  },
  resume() {
    if (this.ctx) {
      this.master.gain.value = 0.55;
      if (save.settings.sound) this.ctx.resume().catch(() => {});
      this.startMusic();
    }
  },
};
function speak(key) {
  voiceKey = key;
  window.speechSynthesis?.cancel();
  if (
    !save.settings.sound ||
    save.settings.language !== "en" ||
    document.hidden ||
    !window.speechSynthesis
  )
    return;
  const u = new SpeechSynthesisUtterance(STRINGS[key].en);
  u.lang = "en-US";
  u.rate = 0.83;
  u.pitch = 1.12;
  u.volume = 0.75;
  const v = speechSynthesis.getVoices().find((v) => v.lang === "en-US");
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function later(fn, ms) {
  const t = setTimeout(() => {
    timers.delete(t);
    if (!document.hidden) fn();
  }, ms);
  timers.add(t);
  return t;
}
function cancelScene() {
  timers.forEach(clearTimeout);
  timers.clear();
  clearDrag();
  audio.stop();
  $("#effects").replaceChildren();
  $(".hint-hand")?.remove();
  transitioning = false;
}
function feedback(el) {
  audio.fx("pop");
  if (el) {
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }
}
function burst(x, y, bubbles = false) {
  if (save.settings.reduced) return;
  for (let i = 0; i < (bubbles ? 2 : 9); i++) {
    const e = document.createElement("i");
    e.className = "particle " + (bubbles ? "bubble" : "spark");
    e.style.cssText = `left:${x + (Math.random() - 0.5) * 60}px;top:${y + (Math.random() - 0.5) * 30}px;--dx:${(Math.random() - 0.5) * 110}px`;
    $("#effects").append(e);
    e.addEventListener("animationend", () => e.remove(), { once: true });
  }
  if (!bubbles) audio.fx("sparkle");
}
function sceneBurst() {
  const r = scene.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2);
}
function setScene(next) {
  cancelScene();
  state = next;
  selected = null;
  lastAction = performance.now();
  audio.resume();
  audio.fx("whoosh");
  scene.className =
    next === "home"
      ? ""
      : "activity" + (next === "celebration" ? " celebrate" : "");
  if (next === "home") renderHome();
  else renderActivity();
  if (next === "celebration") sceneBurst();
  speak(next);
}
function renderHome() {
  scene.innerHTML = `<svg class="landscape" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true"><circle cx="1080" cy="90" r="44" fill="#ffdc82"/><path d="M0 500Q210 340 440 530Q740 410 1200 490V700H0" fill="#a3d6b9"/><path d="M0 610Q450 440 1200 610V700H0" fill="#8cc9a8"/><g fill="#fff9ed"><ellipse cx="160" cy="100" rx="65" ry="18"/><ellipse cx="840" cy="120" rx="60" ry="15"/></g><path d="M610 700Q550 600 650 480H730Q660 600 820 700" fill="#f2dfb7"/></svg><div class="home-title"><h1>A little world. A lot of joy.</h1><p>What shall we play today?</p></div>${giraffe()}<button class="door dentist" id="dentist">${icons.tooth}<span>Happy Smile</span><small>A little dentist adventure</small></button><a class="door coloring" id="coloring" href="https://rashka33.github.io/tobas-coloring-world/">${icons.pencils}<span>Coloring World</span><small>Make something lovely</small></a><button class="book-button" id="book">${icons.book}<span>My stickers · ${save.stickers.length}</span></button>`;
  $("#dentist").onclick = () => startGame();
  $("#book").onclick = showBook;
  $("#coloring").onclick = () => cancelScene();
}
function startGame() {
  spots = [];
  placed.clear();
  earned = false;
  setScene("welcome");
}
const toothX = [250, 330, 410, 490, 570];
function patient() {
  return `<svg class="patient ${state === "welcome" ? "enter" : ""}" viewBox="0 0 900 600" aria-label="Hippo in the dentist chair"><ellipse cx="450" cy="561" rx="230" ry="22" fill="#d7c7e3"/><rect x="240" y="230" width="420" height="315" rx="95" fill="#80c8c1"/><rect x="280" y="290" width="340" height="235" rx="70" fill="#a7ded4"/><path d="M320 490 270 548M580 490 630 548" stroke="#73afa9" stroke-width="25" stroke-linecap="round"/><g class="breathing"><ellipse cx="450" cy="460" rx="152" ry="87" fill="#b398ce"/><ellipse cx="300" cy="148" rx="48" ry="55" fill="#b398ce"/><ellipse cx="600" cy="148" rx="48" ry="55" fill="#b398ce"/><ellipse cx="300" cy="145" rx="25" ry="32" fill="#dfb6cf"/><ellipse cx="600" cy="145" rx="25" ry="32" fill="#dfb6cf"/><rect x="272" y="119" width="356" height="304" rx="138" fill="#bba1d5"/><g class="eyes"><ellipse cx="370" cy="174" rx="21" ry="26" fill="#fffaf2"/><ellipse cx="530" cy="174" rx="21" ry="26" fill="#fffaf2"/><circle class="pupil" cx="373" cy="177" r="10" fill="#514260"/><circle class="pupil" cx="527" cy="177" r="10" fill="#514260"/></g><ellipse cx="450" cy="291" rx="211" ry="100" fill="#d2b7e4"/><ellipse cx="377" cy="270" rx="13" ry="8" fill="#ad8bbe"/><ellipse cx="523" cy="270" rx="13" ry="8" fill="#ad8bbe"/><ellipse cx="280" cy="298" rx="23" ry="12" fill="#edb3c7"/><ellipse cx="620" cy="298" rx="23" ry="12" fill="#edb3c7"/><path d="M236 319Q450 285 664 319L651 393Q450 485 249 393Z" fill="#705075" stroke="#a17cb8" stroke-width="8"/><ellipse cx="450" cy="410" rx="105" ry="23" fill="#df9cbc"/>${toothX.map((x, i) => `<g class="tooth-group" data-tooth="${i}" role="button" tabindex="${["repair", "braces"].includes(state) ? 0 : -1}" aria-label="Tooth ${i + 1}"><rect x="${x - 19}" y="295" width="110" height="115" rx="22" fill="transparent"/><rect class="tooth ${state === "repair" && i === 2 ? "sore" : ""} ${state === "braces" && !placed.has(i) ? "target" : ""}" x="${x}" y="311" width="72" height="80" rx="19"/>${state === "repair" && i === 2 ? '<circle cx="434" cy="338" r="4" fill="#705075"/><circle cx="459" cy="338" r="4" fill="#705075"/><path d="M435 363Q447 350 459 363" stroke="#705075" stroke-width="3" fill="none"/>' : ""}${state === "braces" && !placed.has(i) ? `<g opacity=".28" pointer-events="none" transform="translate(${x + 10} 324) scale(.52)">${shape(i).replace(/<\/?svg[^>]*>/g, "")}</g>` : ""}${placed.has(i) ? `<g class="decoration" transform="translate(${x + 10} 324) scale(.52)">${shape(i).replace(/<\/?svg[^>]*>/g, "")}</g>` : ""}</g>`).join("")}<g id="dirt-layer"></g><path d="M309 460Q280 424 250 462M591 460Q620 424 650 462" fill="none" stroke="#b398ce" stroke-width="38" stroke-linecap="round"/></g></svg>`;
}
function renderActivity() {
  const labels = {
    welcome: "Hello, Hippo!",
    cleaning: "Brush the teeth",
    repair: "A little magic",
    braces: "Make a rainbow smile",
    celebration: "Look at that lovely smile!",
  };
  const stage = [
    "welcome",
    "cleaning",
    "repair",
    "braces",
    "celebration",
  ].indexOf(state);
  scene.innerHTML = `<div class="activity-top"><div class="steps" aria-label="Activity progress">${Array.from({ length: 5 }, (_, i) => `<i class="${i <= stage ? "active" : ""}"></i>`).join("")}</div><h1>${labels[state]}</h1></div>${patient()}${state === "celebration" ? `<div class="award" aria-label="Sticker earned">${shape(save.stickers.at(-1) ?? 0)}</div>` : ""}<div class="tray">${state === "welcome" ? '<button class="primary" id="begin" aria-label="Start brushing">Let’s play ' + icons.tooth.replace("<svg", '<svg style="width:35px;height:35px;vertical-align:middle"') + "</button>" : state === "cleaning" ? `<button class="tool selected" id="brush" aria-label="Pick up toothbrush">${icons.brush}</button>` : state === "repair" ? `<button class="tool" id="magic" aria-label="Magic star">${shape(0)}</button>` : state === "braces" ? colors.map((_, i) => `<button class="piece ${placed.has(i) ? "placed" : ""}" data-piece="${i}" aria-label="${["Pink star", "Yellow heart", "Mint circle", "Purple flower", "Peach diamond"][i]}">${shape(i)}</button>`).join("") : `<button class="primary" id="replay">Play again</button><button class="primary secondary" id="back">Home</button>`}</div>`;
  if (state === "welcome")
    $("#begin").onclick = () => {
      setScene("cleaning");
    };
  if (state === "cleaning") {
    selected = "brush";
    if (!spots.length)
      toothX.forEach((x, i) => {
        for (let j = 0; j < 4; j++)
          spots.push({
            x: x + 20 + (j % 2) * 29,
            y: 335 + Math.floor(j / 2) * 30,
            amount: 1,
            id: i * 4 + j,
          });
      });
    drawDirt();
    $("#brush").onclick = () => {
      selected = "brush";
      $("#brush").classList.add("selected");
    };
  }
  if (state === "repair")
    $("#magic").onclick = () => {
      $("#magic").classList.add("selected");
      scene.querySelector('[data-tooth="2"]').classList.add("hint");
    };
  if (state === "celebration") {
    $("#replay").onclick = startGame;
    $("#back").onclick = () => setScene("home");
  }
  scene.querySelectorAll("[data-tooth]").forEach((el) => {
    el.onclick = () => tapTooth(+el.dataset.tooth);
    el.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        feedback(el);
        tapTooth(+el.dataset.tooth);
      }
    };
  });
}
function drawDirt() {
  const layer = $("#dirt-layer");
  if (layer)
    layer.innerHTML = spots
      .map(
        (s) =>
          `<ellipse data-spot="${s.id}" cx="${s.x}" cy="${s.y}" rx="13" ry="10" fill="#c2ae71" opacity="${s.amount}" pointer-events="none"/>`,
      )
      .join("");
}
function stageDone(next) {
  if (transitioning) return;
  transitioning = true;
  audio.fx("bing");
  sceneBurst();
  clearDrag();
  later(() => setScene(next), 700);
}
function tapTooth(i) {
  if (transitioning) return;
  if (state === "repair") {
    if (i === 2) {
      scene.querySelector('[data-tooth="2"] .tooth').classList.remove("sore");
      scene
        .querySelector('[data-tooth="2"] path')
        .setAttribute("d", "M435 355Q447 370 459 355");
      stageDone("braces");
    } else {
      feedback(scene.querySelector(`[data-tooth="${i}"]`));
    }
  } else if (state === "braces" && Number.isInteger(selected))
    place(selected, i);
  else if (state === "cleaning") {
    const r = scene
      .querySelector(`[data-tooth="${i}"]`)
      .getBoundingClientRect();
    scrubAt(r.left + r.width / 2, r.top + r.height / 2, 0.14);
  }
}
function toSvg(x, y) {
  const p = $(".patient");
  if (!p) return null;
  const point = new DOMPoint(x, y);
  return point.matrixTransform(p.getScreenCTM().inverse());
}
function scrubAt(x, y, amount) {
  if (state !== "cleaning" || transitioning) return;
  const p = toSvg(x, y);
  if (!p) return;
  let touched = false;
  spots.forEach((s) => {
    if (s.amount > 0 && Math.hypot(s.x - p.x, s.y - p.y) < 37) {
      s.amount = Math.max(0, s.amount - amount);
      touched = true;
      const e = scene.querySelector(`[data-spot="${s.id}"]`);
      if (e) e.setAttribute("opacity", s.amount);
    }
  });
  if (touched) {
    const t = performance.now();
    if (t - lastScrub > 85) {
      audio.fx("scrub");
      burst(x, y, true);
      lastScrub = t;
    }
    if (spots.every((s) => s.amount === 0)) stageDone("repair");
  }
}
function place(piece, target) {
  if (state !== "braces" || transitioning || placed.has(piece)) return false;
  if (piece !== target) {
    const el = scene.querySelector(`[data-tooth="${target}"]`);
    feedback(el);
    return false;
  }
  placed.add(piece);
  selected = null;
  audio.fx("bing");
  const r = scene
    .querySelector(`[data-tooth="${target}"]`)
    .getBoundingClientRect();
  burst(r.x + r.width / 2, r.y + r.height / 2);
  renderActivity();
  if (placed.size === 5) {
    if (!earned) {
      earned = true;
      const sticker = [0, 1, 2, 3, 4].find((i) => !save.stickers.includes(i));
      if (sticker !== undefined) save.stickers.push(sticker);
      persist();
    }
    stageDone("celebration");
  }
  return true;
}
function clearDrag() {
  if (drag) {
    try {
      scene.releasePointerCapture(drag.id);
    } catch {}
  }
  drag = null;
  ghost.hidden = true;
  ghost.className = "";
  scene.classList.remove("dragging-targets");
}
function targetAt(x, y) {
  const p = toSvg(x, y);
  if (!p || p.y < 287 || p.y > 420) return -1;
  let best = -1,
    dist = Infinity;
  toothX.forEach((tx, i) => {
    const d = Math.abs(p.x - (tx + 36));
    if (d < dist && d < 65) {
      best = i;
      dist = d;
    }
  });
  return best;
}
scene.addEventListener("pointerdown", (e) => {
  if (drag || transitioning || panel.open || !e.isPrimary) return;
  lastAction = performance.now();
  $(".hint-hand")?.remove();
  scene.querySelectorAll(".hint").forEach((x) => x.classList.remove("hint"));
  const piece = e.target.closest("[data-piece]"),
    brush = e.target.closest("#brush");
  if (
    piece ||
    brush ||
    (state === "cleaning" && e.target.closest(".patient"))
  ) {
    const kind = piece ? +piece.dataset.piece : "brush";
    if (kind !== "brush" && placed.has(kind)) return;
    selected = kind;
    const origin = (piece || $("#brush")).getBoundingClientRect();
    drag = {
      id: e.pointerId,
      kind,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      origin,
      moved: false,
    };
    scene.setPointerCapture(e.pointerId);
    ghost.innerHTML = kind === "brush" ? icons.brush : shape(kind);
    ghost.hidden = false;
    ghost.style.left = e.clientX - 100 + "px";
    ghost.style.top = e.clientY - 100 + "px";
    audio.fx("whoosh");
    if (piece) {
      scene
        .querySelectorAll(".piece")
        .forEach((x) => x.classList.toggle("selected", x === piece));
      scene.classList.add("dragging-targets");
    }
    if (kind === "brush") scrubAt(e.clientX, e.clientY, 0.12);
  }
});
scene.addEventListener("pointermove", (e) => {
  if (drag && e.pointerId === drag.id) {
    const d = drag;
    const distance = Math.hypot(e.clientX - d.lastX, e.clientY - d.lastY);
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) d.moved = true;
    ghost.style.left = e.clientX - 100 + "px";
    ghost.style.top = e.clientY - 100 + "px";
    if (d.kind === "brush" && distance > 1) {
      const steps = Math.min(40, Math.max(1, Math.ceil(distance / 8)));
      for (let i = 1; i <= steps; i++)
        scrubAt(
          d.lastX + ((e.clientX - d.lastX) * i) / steps,
          d.lastY + ((e.clientY - d.lastY) * i) / steps,
          0.1,
        );
      lastAction = performance.now();
    }
    if (drag) {
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    }
  }
  const pupils = scene.querySelectorAll(".pupil");
  pupils.forEach((el, i) => {
    const p = toSvg(e.clientX, e.clientY);
    if (p)
      el.setAttribute(
        "transform",
        `translate(${Math.max(-5, Math.min(5, (p.x - 450) / 70))} ${Math.max(-3, Math.min(5, (p.y - 220) / 70))})`,
      );
  });
});
function release(e, cancel = false) {
  if (!drag || drag.id !== e.pointerId) return;
  const d = drag;
  drag = null;
  try {
    scene.releasePointerCapture(e.pointerId);
  } catch {}
  scene.classList.remove("dragging-targets");
  let success = false;
  if (!cancel && d.kind !== "brush" && d.moved) {
    const target = targetAt(e.clientX, e.clientY);
    if (target >= 0) success = place(d.kind, target);
  }
  if (!success && d.moved && d.kind !== "brush") {
    ghost.className = "returning";
    ghost.style.left = d.origin.x + d.origin.width / 2 - 50 + "px";
    ghost.style.top = d.origin.y + d.origin.height / 2 - 50 + "px";
    audio.fx("whoosh");
    later(() => {
      ghost.hidden = true;
      ghost.className = "";
    }, 400);
  } else ghost.hidden = true;
}
scene.addEventListener("pointerup", (e) => release(e));
scene.addEventListener("pointercancel", (e) => release(e, true));
scene.addEventListener("lostpointercapture", (e) => {
  if (drag?.id === e.pointerId) clearDrag();
});
scene.addEventListener("click", (e) => {
  const p = e.target.closest("[data-piece]");
  if (p && !placed.has(+p.dataset.piece)) {
    selected = +p.dataset.piece;
    scene
      .querySelectorAll(".piece")
      .forEach((x) => x.classList.toggle("selected", x === p));
  }
});
function showBook() {
  clearDrag();
  audio.stop();
  audio.resume();
  panel.innerHTML = `<button class="close" aria-label="Close sticker book">Close</button><h2>My little sticker book</h2><div class="sticker-grid">${save.stickers.length ? save.stickers.map((i) => `<div class="sticker" aria-label="Smile sticker ${i + 1}">${shape(i)}</div>`).join("") : '<p class="empty">A lovely smile earns a sticker.<br>Let’s help Hippo!</p>'}</div>`;
  panel.showModal();
  panel.querySelector(".close").onclick = () => panel.close();
  speak("book");
}
function showSettings() {
  clearDrag();
  audio.stop();
  panel.innerHTML = `<button class="close" aria-label="Close parent settings">Done</button><h2>For grown-ups</h2><label class="setting">Sound & voice<input id="sound-setting" type="checkbox" ${save.settings.sound ? "checked" : ""}></label><label class="setting">Gentle music<input id="music-setting" type="checkbox" ${save.settings.music ? "checked" : ""}></label><label class="setting">Reduced motion<input id="motion-setting" type="checkbox" ${save.settings.reduced ? "checked" : ""}></label><label class="setting">Language<select id="language-setting"><option value="en">English</option><option value="so">Somali · recordings only</option></select></label><p>Somali guidance stays silent until family recordings are added. Visual hints still work.</p><button id="reset">Reset stickers</button><p id="reset-status" role="status"></p>`;
  panel.showModal();
  $("#language-setting").value = save.settings.language;
  panel.querySelector(".close").onclick = () => panel.close();
  [
    ["sound-setting", "sound"],
    ["music-setting", "music"],
    ["motion-setting", "reduced"],
  ].forEach(
    ([id, key]) =>
      ($("#" + id).onchange = (e) => {
        save.settings[key] = e.target.checked;
        persist();
        applySettings();
        audio.stop();
        if (key === "sound" && e.target.checked) audio.unlock();
      }),
  );
  $("#language-setting").onchange = (e) => {
    save.settings.language = e.target.value;
    persist();
    window.speechSynthesis?.cancel();
  };
  let confirm = false;
  $("#reset").onclick = () => {
    if (!confirm) {
      confirm = true;
      $("#reset").textContent = "Tap again to reset";
    } else {
      save.stickers = [];
      persist();
      $("#reset-status").textContent = "Stickers reset.";
      $("#reset").textContent = "Reset stickers";
      confirm = false;
      if (state === "home") renderHome();
    }
  };
}
function applySettings() {
  document.body.classList.toggle("reduced", save.settings.reduced);
}
panel.addEventListener("close", () => {
  lastAction = performance.now();
  voiceKey = state;
  audio.resume();
});
$("#home").innerHTML = icons.home;
$("#speaker").innerHTML = icons.speaker;
$("#parents").innerHTML = icons.lock;
$("#home").onclick = () => {
  if (panel.open) panel.close();
  setScene("home");
};
$("#speaker").onclick = () => speak(voiceKey);
function stopHold() {
  clearTimeout(holdTimer);
  holdTimer = null;
  holdPointer = null;
  $("#parents").classList.remove("holding");
  $("#parents").style.removeProperty("--hold");
}
$("#parents").addEventListener("pointerdown", (e) => {
  if (holdPointer !== null || !e.isPrimary) return;
  holdPointer = e.pointerId;
  holdStart = performance.now();
  $("#parents").setPointerCapture(e.pointerId);
  $("#parents").classList.add("holding");
  holdTimer = setTimeout(() => {
    stopHold();
    showSettings();
  }, 2000);
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
  $("#parents").addEventListener(type, (e) => {
    if (holdPointer === e.pointerId) stopHold();
  }),
);
$("#parents").addEventListener("keydown", (e) => {
  if ((e.key === " " || e.key === "Enter") && !e.repeat) {
    e.preventDefault();
    holdStart = performance.now();
    $("#parents").classList.add("holding");
    holdTimer = setTimeout(() => {
      stopHold();
      showSettings();
    }, 2000);
  }
});
$("#parents").addEventListener("keyup", stopHold);
$("#parents").addEventListener("blur", stopHold);
document.addEventListener(
  "pointerdown",
  (e) => {
    if (!e.isPrimary) return;
    lastAction = performance.now();
    audio.unlock();
    const el = e.target.closest("button,a,input,select,[data-tooth]");
    if (el) feedback(el);
  },
  true,
);
document.addEventListener("visibilitychange", () => {
  document.body.classList.toggle("paused", document.hidden);
  if (document.hidden) {
    stopHold();
    clearDrag();
    audio.stop();
    timers.forEach(clearTimeout);
    timers.clear();
    $("#effects").replaceChildren();
  } else {
    lastAction = performance.now();
    audio.resume();
    if (transitioning) {
      transitioning = false;
      setScene(
        state === "cleaning"
          ? "repair"
          : state === "repair"
            ? "braces"
            : "celebration",
      );
    }
  }
});
setInterval(() => {
  if (holdTimer)
    $("#parents").style.setProperty(
      "--hold",
      Math.min(100, (performance.now() - holdStart) / 20) + "%",
    );
  if (
    document.hidden ||
    panel.open ||
    drag ||
    performance.now() - lastAction < 8000
  )
    return;
  lastAction = performance.now();
  scene.querySelectorAll(".hint").forEach((x) => x.classList.remove("hint"));
  let el =
    state === "home"
      ? $("#dentist")
      : state === "welcome"
        ? $("#begin")
        : state === "cleaning"
          ? $("#brush")
          : state === "repair"
            ? scene.querySelector('[data-tooth="2"]')
            : state === "braces"
              ? Number.isInteger(selected)
                ? scene.querySelector(`[data-tooth="${selected}"]`)
                : scene.querySelector(".piece:not(.placed)")
              : $("#replay");
  if (el) {
    el.classList.add("hint");
    $(".hint-hand")?.remove();
    const h = document.createElement("div");
    h.className = "hint-hand";
    h.innerHTML = icons.hand;
    const r = (
        state === "cleaning" ? scene.querySelector('[data-tooth="2"]') : el
      ).getBoundingClientRect(),
      s = scene.getBoundingClientRect();
    h.style.left = r.left - s.left + r.width / 2 - 15 + "px";
    h.style.top = r.top - s.top + r.height / 2 + "px";
    scene.append(h);
  }
  speak(state);
}, 250);
applySettings();
renderHome();
if ("serviceWorker" in navigator)
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .catch(() => {}),
  );
