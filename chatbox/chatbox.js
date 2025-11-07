<script>
(async function(){
  /* 1) Xác định thí nghiệm hiện tại từ body/meta/URL */
  function getExperimentId(){
    const d = document.body?.dataset?.experiment;
    if (d) return d;
    const m = document.querySelector('meta[name="sl-experiment"]')?.content;
    if (m) return m;
    const url = location.pathname.toLowerCase();
    if (url.includes('pendulum')) return 'pendulum';
    if (url.includes('freefall') || url.includes('roi')) return 'freefall';
    if (url.includes('rc')) return 'rc';
    return 'global';
  }
  const EXP = getExperimentId();

  /* 2) Tải KB (global + theo thí nghiệm) */
  async function loadKB(id){ try{
    const r = await fetch(`/study-lab/chatbox/kb/${id}.json`); if(!r.ok) throw 0; return r.json();
  }catch{ return { topics: [] }; } }
  const KB = await loadKB(EXP);
  const KB_GLOBAL = await loadKB('global');
  const TOPICS = [...KB_GLOBAL.topics, ...KB.topics];

  /* 3) Tạo UI chatbox */
  const box = document.createElement('div');
  box.innerHTML = `
    <div id="sl-wrap" role="dialog" aria-label="Trợ lý thí nghiệm">
      <div id="sl-hd">
        <div style="width:8px;height:20px;border-radius:4px;background:#2563eb"></div>
        <b style="font:600 13px system-ui">Trợ lý • ${EXP}</b>
      </div>
      <div id="sl-bd"></div>
      <div id="sl-in">
        <textarea id="sl-t" placeholder="Hỏi về thí nghiệm hiện tại..."></textarea>
        <button id="sl-s">Gửi</button>
      </div>
    </div>
    <button id="sl-btn">Hỏi trợ lý</button>
  `;
  document.body.appendChild(box);

  const $ = s => box.querySelector(s);
  const wrap=$("#sl-wrap"), bd=$("#sl-bd"), t=$("#sl-t");
  function add(text, who='a'){ const d=document.createElement('div'); d.className='bub '+(who==='u'?'u':'a'); d.textContent=text; bd.appendChild(d); bd.scrollTop=bd.scrollHeight; }

  /* 4) Chọn câu trả lời tốt nhất từ KB */
  function bestMatch(q){
    const s = q.toLowerCase();
    let best = {score:0, item:null};
    for (const it of TOPICS){
      let sc = 0;
      for (const p of it.patterns){
        const pat = String(p).toLowerCase();
        if (s.includes(pat)) sc += Math.min(3, Math.floor(pat.length/4));
      }
      if (sc > best.score) best = {score:sc, item:it};
    }
    return best.item;
  }
  function section(title, arr, bullet='•'){ return (arr&&arr.length)? `\n${title}\n`+arr.map(x=>`${bullet} ${x}`).join('\n') : ''; }
  function formatAnswer(item, q){
    const askExplain = /tại sao|vì sao|giải thích|explain/i.test(q);
    const askGuide   = /làm sao|thao tác|cách chạy|how to|bước/i.test(q);
    let out = 'Thao tác & Giải thích thí nghiệm:';
    if (askGuide || !askExplain) out += section('\n\nThao tác', item.guide);
    if (askExplain || !askGuide) out += section('\n\nGiải thích', item.explain);
    out += section('\n\nKiểm tra nhanh', item.checks, '✓');
    out += section('\n\nLỗi thường gặp', item.pitfalls, '⚠');
    return out.trim();
  }
  function reply(q){
    const it = bestMatch(q);
    if (!it) return `Mình chưa có nội dung soạn sẵn cho chủ đề này trong “${EXP}”. Bạn thử mô tả rõ hơn hoặc chọn thí nghiệm khác.`;
    return formatAnswer(it, q);
  }

  /* 5) Sự kiện UI */
  const btn = box.querySelector('#sl-btn');
  btn.onclick = ()=> wrap.style.display = (wrap.style.display==='block'?'none':'block');
  box.querySelector('#sl-s').onclick = ()=>{
    const q = t.value.trim(); if(!q) return;
    add(q,'u'); t.value=''; setTimeout(()=> add(reply(q),'a'), 180);
  };
  t.addEventListener('keydown', e=>{
    if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); box.querySelector('#sl-s').click(); }
  });

  /* 6) Lời chào */
  add("Xin chào! Mình sẽ hướng dẫn THAO TÁC và GIẢI THÍCH cho thí nghiệm hiện tại.");
})();
</script>
