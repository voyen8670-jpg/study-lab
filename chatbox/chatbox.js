(async function () {
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
      const r = await fetch(`chatbox/kb/${id}.json`);
      if (!r.ok) throw 0;
      return r.json();
    } catch {
      return { topics: [] };
    }
  }

  const KB_GLOBAL = await loadKB("global");
  const KB = await loadKB(EXP);
  const TOPICS = [...KB_GLOBAL.topics, ...KB.topics];

  const box = document.createElement("div");
  box.innerHTML = `
    <div id="sl-wrap" role="dialog" aria-label="Trợ lý thí nghiệm">
      <div id="sl-hd">
        <span class="sl-dot"></span>
        <div style="display:flex;flex-direction:column">
          <span class="sl-title">Trợ lý • ${EXP}</span>
          <span class="sl-sub">Hướng dẫn thao tác & giải thích</span>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button id="sl-min" class="sl-x">—</button>
          <button id="sl-x" class="sl-x">×</button>
        </div>
      </div>
      <div id="sl-bd"></div>
      <div id="sl-in">
        <textarea id="sl-t" placeholder="Hỏi về thí nghiệm hiện tại..."></textarea>
        <button id="sl-s">Gửi</button>
      </div>
    </div>
    <button id="sl-btn">💬 Hỗ trợ</button>
  `;
  document.body.appendChild(box);

  const wrap = box.querySelector("#sl-wrap");
  const btn = box.querySelector("#sl-btn");
  const xBtn = box.querySelector("#sl-x");
  const mBtn = box.querySelector("#sl-min");
  const tBox = box.querySelector("#sl-t");
  const sBtn = box.querySelector("#sl-s");
  const bd = box.querySelector("#sl-bd");

  // hiệu ứng typing...
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
    } else if (!on && ex) {
      ex.remove();
    }
  }

  // mở/đóng lưu trạng thái
  btn.onclick = () => {
    wrap.style.display = "flex";
    localStorage.setItem("sl-open", "1");
  };
  xBtn.onclick = () => {
    wrap.style.display = "none";
    localStorage.removeItem("sl-open");
  };
  mBtn.onclick = () => {
    wrap.classList.toggle("min");
    localStorage.setItem("sl-min", wrap.classList.contains("min") ? "1" : "");
  };
  if (localStorage.getItem("sl-open") === "1") wrap.style.display = "flex";
  if (localStorage.getItem("sl-min") === "1") wrap.classList.add("min");

  // in tin nhắn + thời gian + lưu lịch sử
  function addMsg(text, who = "bot") {
    const el = document.createElement("div");
    el.className = `sl-msg ${who}`;
    el.innerHTML = `<div class="sl-bubble">${text}<div class="time">${new Date().toLocaleTimeString(
      "vi-VN",
      { hour: "2-digit", minute: "2-digit" }
    )}</div></div>`;
    bd.appendChild(el);
    bd.scrollTop = bd.scrollHeight;
    const mem = JSON.parse(localStorage.getItem("sl-hist") || "[]");
    mem.push({ who, text });
    localStorage.setItem("sl-hist", JSON.stringify(mem).slice(-500));
  }
  JSON.parse(localStorage.getItem("sl-hist") || "[]").forEach((m) =>
    addMsg(m.text, m.who)
  );

  addMsg(
    "Xin chào! Mình sẽ hướng dẫn THAO TÁC và GIẢI THÍCH cho thí nghiệm này."
  );

  sBtn.onclick = () => {
    const msg = tBox.value.trim();
    if (!msg) return;
    addMsg(msg, "you");
    tBox.value = "";

    typing(true);
    setTimeout(() => {
      typing(false);
      const lower = msg.toLowerCase();
      let found = null;
      for (const t of TOPICS) {
        if (t.patterns.some((p) => lower.includes(p))) {
          found = t;
          break;
        }
      }

      if (!found)
        return addMsg(
          "Mình chưa có nội dung phù hợp. Hãy hỏi về thao tác, quan sát, hoặc giải thích nhé."
        );

      addMsg(
        `<b>Hướng dẫn:</b><br>${found.guide.join(
          "<br>"
        )}<br><br><b>Giải thích:</b><br>${found.explain.join("<br>")}`
      );
    }, 600);
  };

  // gợi ý nhanh
  const hints = ["thao tác", "giải thích", "lỗi thường gặp"];
  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:6px;margin-top:8px;flex-wrap:wrap";
  hints.forEach((t) => {
    const b = document.createElement("button");
    b.textContent = t;
    b.type = "button";
    b.style.cssText =
      "background:rgba(255,255,255,.07);border:1px solid var(--sl-border);color:var(--sl-text);padding:6px 10px;border-radius:999px;font:600 12px system-ui;cursor:pointer";
    b.onclick = () => {
      tBox.value = t;
      sBtn.click();
    };
    row.appendChild(b);
  });
  box.querySelector("#sl-in").appendChild(row);
})();
