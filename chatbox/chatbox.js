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

  btn.onclick = () => (wrap.style.display = "flex");
  xBtn.onclick = () => (wrap.style.display = "none");
  mBtn.onclick = () => {
    wrap.classList.toggle("min");
  };

  function addMsg(text, who = "bot") {
    const el = document.createElement("div");
    el.className = `sl-msg ${who}`;
    el.innerHTML = `<div class="sl-bubble">${text}</div>`;
    bd.appendChild(el);
    bd.scrollTop = bd.scrollHeight;
  }

  addMsg(
    "Xin chào! Mình sẽ hướng dẫn THAO TÁC và GIẢI THÍCH cho thí nghiệm này."
  );

  sBtn.onclick = () => {
    const msg = tBox.value.trim();
    if (!msg) return;
    addMsg(msg, "you");
    tBox.value = "";

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

    addMsg(`<b>Hướng dẫn:</b><br>${found.guide.join("<br>")}<br><br>
            <b>Giải thích:</b><br>${found.explain.join("<br>")}`);
  };
})();
