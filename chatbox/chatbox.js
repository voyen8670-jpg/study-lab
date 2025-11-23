// chatbox/chatbox.js
/* eslint-disable no-undef */
(async function () {
  "use strict";

  // ============ utils ============
  const $ = (sel, root = document) => root.querySelector(sel);
  const escapeHTML = (s) =>
    String(s).replace(
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

  // bỏ dấu + lowercase để match tiếng Việt
  const foldVN = (s) =>
    String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  // ============ experiment scope ============
  function getExperimentId() {
    // 1. Ưu tiên data-experiment (nếu bạn có dùng)
    const d = document.body?.dataset?.experiment?.trim();
    if (d) return d;

    // 2. Sau đó tới meta name="sl-experiment"
    const m = document
      .querySelector('meta[name="sl-experiment"]')
      ?.content?.trim();
    if (m) return m;

    // 3. Nếu không có gì, tự lấy theo tên file HTML
    //    vd: /html/5_chemistry.html -> 5_chemistry
    const file = window.location.pathname.split("/").pop() || "";
    const base = file.split(".")[0];
    if (base) return base;

    // 4. Fallback cuối cùng
    return "global";
  }

  const EXP = getExperimentId();
  console.log("[SL] experiment id:", EXP);

  const LS_HIST = `sl-hist-${EXP}`;
  const LS_OPEN = `sl-open-${EXP}`;
  const LS_MIN = `sl-min-${EXP}`;

  const getHist = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_HIST) || "[]");
    } catch {
      return [];
    }
  };
  const setHist = (arr) =>
    localStorage.setItem(LS_HIST, JSON.stringify(arr.slice(-200)));

  // ============ mount UI ============
  const wrapBox = document.createElement("div");
  wrapBox.innerHTML = `
    <div id="sl-wrap" role="dialog" aria-label="Trợ lý thí nghiệm" aria-modal="false">
      <div id="sl-hd">
        <span class="sl-dot" aria-hidden="true"></span>
        <div style="display:flex;flex-direction:column">
          <span class="sl-title">Trợ lý</span>
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
        <div>
          <button class="sl-pill" data-q="thao tác">thao tác</button>
          <button class="sl-pill" data-q="giải thích">giải thích</button>
          <button class="sl-pill" data-q="lỗi thường gặp">lỗi thường gặp</button>
        </div>
      </div>
    </div>
    <button id="sl-btn" aria-controls="sl-wrap" aria-expanded="false" type="button">💬 Hỗ trợ</button>
  `;
  document.body.appendChild(wrapBox);

  // shortcuts
  const wrap = $("#sl-wrap", wrapBox);
  const bd = $("#sl-bd", wrapBox);
  const tBox = $("#sl-t", wrapBox);
  const sBtn = $("#sl-s", wrapBox);
  const btn = $("#sl-btn", wrapBox);
  const xBtn = $("#sl-x", wrapBox);
  const mBtn = $("#sl-min", wrapBox);

  // ============ render helpers ============
  function typing(on = true) {
    const ex = document.getElementById("sl-typing");
    if (on && !ex) {
      const el = document.createElement("div");
      el.className = "sl-msg";
      el.id = "sl-typing";
      el.innerHTML = `<div class="sl-bubble sl-typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
      bd.appendChild(el);
      bd.scrollTop = bd.scrollHeight;
    } else if (!on && ex) {
      ex.remove();
    }
  }

  function addMsg(text, who = "bot", { persist = true } = {}) {
    const el = document.createElement("div");
    el.className = `sl-msg ${who}`;
    el.innerHTML = `
      <div class="sl-bubble">
        ${who === "you" ? escapeHTML(text) : text}
        <div class="time">${new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}</div>
      </div>`;
    bd.appendChild(el);
    bd.scrollTop = bd.scrollHeight;

    if (persist) {
      const hist = getHist();
      hist.push({ who, text });
      setHist(hist);
    }
  }

  // khôi phục lịch sử / lời chào
  const old = getHist();
  if (old.length) old.forEach((m) => addMsg(m.text, m.who, { persist: false }));
  else
    addMsg(
      "Xin chào! Mình sẽ hướng dẫn <b>THAO TÁC</b> và <b>GIẢI THÍCH</b> cho thí nghiệm này."
    );

  // ============ open/close/min ============
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
  btn.addEventListener("click", openBox);
  xBtn.addEventListener("click", closeBox);
  mBtn.addEventListener("click", toggleMin);

  // Luôn đóng khi vào trang
  wrap.classList.remove("open");
  wrap.classList.remove("min");
  localStorage.removeItem(LS_OPEN);
  localStorage.removeItem(LS_MIN);

  // ============ input behaviors ============
  function autoresize() {
    tBox.style.height = "42px";
    tBox.style.height = Math.min(tBox.scrollHeight, 120) + "px";
  }
  tBox.addEventListener("input", autoresize);
  autoresize();
  tBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sBtn.click();
    }
    if (e.key === "Escape") closeBox();
  });

  wrapBox.querySelectorAll(".sl-pill").forEach((p) => {
    p.addEventListener("click", () => {
      tBox.value = p.dataset.q || "";
      autoresize();
      sBtn.click();
    });
  });

  // ============ KB loader ============
  async function loadKB(id) {
    try {
      const url = `chatbox/kb/${id}.json?v=1`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) {
        console.warn("[SL] KB not found:", url);
        throw new Error("kb not found");
      }
      const data = await r.json();
      console.log("[SL] KB loaded:", id, data);
      return data;
    } catch (e) {
      console.warn("[SL] KB load error for", id, e);
      return { topics: [] };
    }
  }

  const KB_GLOBAL = await loadKB("global");
  const KB_LOCAL = await loadKB(EXP);
  const TOPICS = [...(KB_GLOBAL.topics || []), ...(KB_LOCAL.topics || [])];

  // ============ handle send ============
  async function handleSend() {
    const msg = tBox.value.trim();
    if (!msg) return;
    addMsg(msg, "you");
    tBox.value = "";
    autoresize();

    typing(true);
    setTimeout(() => {
      typing(false);

      const q = foldVN(msg);
      let found = null;

      for (const t of TOPICS) {
        if (!t?.patterns) continue;
        if (t.patterns.some((p) => q.includes(foldVN(p)))) {
          found = t;
          break;
        }
      }

      if (!found) {
        addMsg(
          "Mình chưa có nội dung phù hợp. Hãy hỏi về <b>thao tác</b> hoặc <b>giải thích</b> nhé."
        );
        return;
      }

      const wantGuide =
        /(thao tac|huong dan|thuc hien|cach lam)/.test(q) ||
        /thao tác|hướng dẫn|thực hiện|cách làm/i.test(msg);
      const wantExplain =
        /(giai thich|vi sao|tai sao|muc dich|y nghia)/.test(q) ||
        /giải thích|vì sao|tại sao|mục đích|ý nghĩa/i.test(msg);

      const showGuide = wantGuide || (!wantGuide && !wantExplain);
      const showExplain = wantExplain || (!wantGuide && !wantExplain);

      const parts = [];
      if (showGuide && Array.isArray(found.guide) && found.guide.length) {
        parts.push(
          `<b>Hướng dẫn:</b><br>${found.guide.map(escapeHTML).join("<br>")}`
        );
      }
      if (showExplain && Array.isArray(found.explain) && found.explain.length) {
        parts.push(
          `<b>Giải thích:</b><br>${found.explain.map(escapeHTML).join("<br>")}`
        );
      }

      addMsg(
        parts.join("<br><br>") || "Mình chưa có thêm nội dung cho câu hỏi này."
      );
    }, 450);
  }

  sBtn.addEventListener("click", handleSend);
})();
