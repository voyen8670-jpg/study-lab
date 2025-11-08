(async function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const escapeHTML = (s) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );

  function getExperimentId() {
    const d = document.body?.dataset?.experiment;
    if (d) return d;
    const m = document.querySelector('meta[name="sl-experiment"]')?.content;
    if (m) return m;
    const url = location.pathname.toLowerCase();
    if (url.includes("pendulum")) return "pendulum";
    if (url.includes("freefall") || url.includes("roi")) return "freefall";
    if (url.includes("rc")) return "rc";
    return "global";
  }
  const EXP = getExperimentId();

  async function loadKB(id) {
    try {
      const r = await fetch(`chatbox/kb/${id}.json`, { cache: "no-store" });
      if (!r.ok) throw 0;
      return r.json();
    } catch {
      return { topics: [] };
    }
  }

  const KB_GLOBAL = await loadKB("global");
  const KB = await loadKB(EXP);
  const TOPICS = [...(KB_GLOBAL.topics || []), ...(KB.topics || [])];

  const box = document.createElement("div");
  box.innerHTML = `
    <div id="sl-wrap" role="dialog" aria-label="Trợ lý thí nghiệm" aria-modal="false">
      <div id="sl-hd">
        <span class="sl-dot" aria-hidden="true"></span>
        <div style="display:flex;flex-direction:column">
          <span class="sl-title">Trợ lý • ${escapeHTML(EXP)}</span>
          <span class="sl-sub">Hướng dẫn thao tác & giải thích</span>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button id="sl-min" class="sl-x" title="Thu gọn" aria-label="Thu gọn">—</button>
          <button id="sl-x" class="sl-x" title="Đóng" aria-label="Đóng">×</button>
        </div>
      </div>
      <div id="sl-bd" aria-live="polite"></div>
      <div id="sl-in">
        <textarea id="sl-t" placeholder="Hỏi về thí nghiệm hiện tại..." aria-label="Ô nhập nội dung"></textarea>
        <button id="sl-s" type="button" aria-label="Gửi tin nhắn">Gửi</button>
      </div>
    </div>
    <button id="sl-btn" aria-controls="sl-wrap" aria-expanded="false" type="button">💬 Hỗ trợ</button>
  `;
  document.body.appendChild(box);

  const wrap = $("#sl-wrap", box);
  const btn = $("#sl-btn", box);
  const xBtn = $("#sl-x", box);
  const mBtn = $("#sl-min", box);
  const tBox = $("#sl-t", box);
  const sBtn = $("#sl-s", box);
  const bd = $("#sl-bd", box);
  const inBar = $("#sl-in", box);

  const LS_HIST = "sl-hist";
  const LS_OPEN = "sl-open";
  const LS_MIN = "sl-min";
  const HISTORY_LIMIT = 200;

  function getHist() {
    try {
      return JSON.parse(localStorage.getItem(LS_HIST) || "[]");
    } catch {
      return [];
    }
  }
  function setHist(arr) {
    if (arr.length > HISTORY_LIMIT) arr = arr.slice(-HISTORY_LIMIT);
    localStorage.setItem(LS_HIST, JSON.stringify(arr));
  }

  function typing(on = true) {
    const ex = document.getElementById("sl-typing");
    if (on && !ex) {
      const el = document.createElement("div");
      el.className = "sl-msg";
      el.id = "sl-typing";
      el.innerHTML = `<div class="sl-bubble sl-typing">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>`;
      bd.appendChild(el);
      bd.scrollTop = bd.scrollHeight;
    } else if (!on && ex) ex.remove();
  }

  function addMsg(text, who = "bot", { persist = true } = {}) {
    const el = document.createElement("div");
    el.className = `sl-msg ${who}`;
    const safe = who === "you" ? escapeHTML(text) : text; // user input -> escape
    el.innerHTML = `<div class="sl-bubble">${safe}
      <div class="time">${new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}</div>
    </div>`;
    bd.appendChild(el);
    bd.scrollTop = bd.scrollHeight;

    if (persist) {
      const mem = getHist();
      mem.push({ who, text });
      setHist(mem);
    }
  }

  const old = getHist();
  if (old.length) old.forEach((m) => addMsg(m.text, m.who, { persist: false }));
  else
    addMsg(
      "Xin chào! Mình sẽ hướng dẫn <b>THAO TÁC</b> và <b>GIẢI THÍCH</b> cho thí nghiệm này."
    );

  function openBox() {
    wrap.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    localStorage.setItem(LS_OPEN, "1");
    tBox.focus();
  }
  function closeBox() {
    wrap.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    localStorage.removeItem(LS_OPEN);
  }
  function toggleMin() {
    wrap.classList.toggle("min");
    if (wrap.classList.contains("min")) localStorage.setItem(LS_MIN, "1");
    else localStorage.removeItem(LS_MIN);
  }

  btn.onclick = openBox;
  xBtn.onclick = closeBox;
  mBtn.onclick = toggleMin;

  if (localStorage.getItem(LS_OPEN) === "1") openBox();
  if (localStorage.getItem(LS_MIN) === "1") wrap.classList.add("min");

  tBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sBtn.click();
    }
    if (e.key === "Escape") closeBox();
  });

  const autoresize = () => {
    tBox.style.height = "42px";
    tBox.style.height = Math.min(tBox.scrollHeight, 120) + "px";
  };
  tBox.addEventListener("input", autoresize);
  autoresize();

  async function handleSend() {
    const msg = tBox.value.trim();
    if (!msg) return;
    addMsg(msg, "you");
    tBox.value = "";
    autoresize();
    typing(true);

    setTimeout(() => {
      typing(false);
      const lower = msg.toLowerCase();
      let found = null;
      for (const t of TOPICS) {
        if (t.patterns?.some((p) => lower.includes(p))) {
          found = t;
          break;
        }
      }
      if (!found) {
        addMsg(
          "Mình chưa có nội dung phù hợp. Hãy hỏi về <b>thao tác</b>, <b>quan sát</b>, hoặc <b>giải thích</b> nhé."
        );
        return;
      }
      const guide = (found.guide || []).map(escapeHTML).join("<br>");
      const explain = (found.explain || []).map(escapeHTML).join("<br>");
      addMsg(
        `<b>Hướng dẫn:</b><br>${guide}<br><br><b>Giải thích:</b><br>${explain}`
      );
    }, 600);
  }
  sBtn.onclick = handleSend;

  const hints = ["thao tác", "giải thích", "lỗi thường gặp"];
  const row = document.createElement("div");
  row.style.cssText =
    "display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;width:100%";
  hints.forEach((t) => {
    const b = document.createElement("button");
    b.textContent = t;
    b.type = "button";
    b.className = "sl-pill";
    b.onclick = () => {
      tBox.value = t;
      autoresize();
      sBtn.click();
    };
    row.appendChild(b);
  });
  inBar.appendChild(row);
})();
