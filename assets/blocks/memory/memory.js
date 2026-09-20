/* memory 板块脚本
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。 */
/* ═══ 记忆翻牌(移植正式版 memInit/memLayout/memStart/memTap/memWin) ═══
   正式版配对的是「中文词 ↔ 英文释义」;二级数据包未提供词的英文,
   本样张改配「中文词 ↔ 拼音」——数据齐全,并顺带复习本课注音。 */
const MEM = {}, MEM_BEST = {};
/* opts.split(2026-09-15,一级 v5 翻卡站):拼音挪到译文那张牌,中文牌只剩中文,
   配对时得真的认字。默认不传,二级第一课的牌面不变。 */
function memBuild(id, words, opts){
  opts = opts || {};
  const box = document.getElementById(id);
  if(!box) return;
  box.innerHTML = '';
  const st = MEM[id] = {phase:'review', round:0, cards:[], first:null, lock:false, matched:0, t0:0, tid:null};
  words.forEach(w=>{
    ['zh','en'].forEach(kind=>{
      const c = document.createElement('div');
      c.className = 'mcard'; c.dataset.w = w; c.dataset.kind = kind;
      c.setAttribute('role','button'); c.tabIndex = -1;   /* roving:组内只有一张进 Tab 序列 */
      c.setAttribute('aria-label', kind==='zh' ? w : ((opts.split ? (PY[w]||[]).join(' ') + ' ' : '') + (wordTr(w) || w)));
      c.onkeydown = e=>{
        if(e.key===' '||e.key==='Enter'){ e.preventDefault(); memTap(c); return; }
        rove(e, box, '.mcard');
      };
      let face, cls = kind;
      const py = "<span class='cpy'>" + ((PY[w]||[]).join(' ')) + "</span>";
      if(kind === 'zh'){
        face = (opts.split ? '' : py) + "<span class='czh'>" + w + "</span>";
      } else {
        const en = wordTr(w);
        face = (opts.split ? py : '') + "<span class='cen'>" + (en || T('memTodo')) + "</span>";
        if(opts.split) cls += ' split';
        if(!en) cls += ' todo';
      }
      c.innerHTML = "<div class='inn'><div class='fa " + cls + "'>" + face + "</div><div class='bk'>?</div></div>";
      c.onclick = ()=>memTap(c);
      box.append(c); st.cards.push(c);
    });
  });
  memLayout(id, 'review');
  roveInit(box, '.mcard');
}
function memLayout(id, arrange){
  const box = document.getElementById(id), st = MEM[id];
  if(!box || !st) return;
  const fs = parseFloat(getComputedStyle(document.body).getPropertyValue('--fs')) || 1;
  const W = box.clientWidth || box.parentElement.clientWidth || 640;
  /* 窄屏收紧:牌高压到 0.72,最小列宽降到 88,让 18 张牌排成三列。
     门槛降了以后英文最长的那张会折三行,牌高够放。 */
  const narrow = W < 430;
  const gap = narrow ? 6 : 8;
  const ch = Math.round((+box.dataset.ch || 66) * fs * (narrow ? 0.72 : 1));
  const MINW = narrow ? 84 : Math.round(104 * fs);   /* 窄屏门槛不随字号放大,否则永远退回两列 */
  let cols = +box.dataset.cols || 4;
  while(cols > 2 && (W - gap*(cols-1))/cols < MINW) cols--;
  const n = st.cards.length;
  if(cols > 2 && n % cols === 1) cols--;            /* 别让末行落单 */
  const cw = Math.floor((W - gap*(cols-1)) / cols);
  box.style.height = (Math.ceil(n/cols)*(ch+gap) - gap) + 'px';
  let order;
  if(arrange === 'review') order = st.cards;         /* 词与拼音成对相邻 */
  else if(arrange === 'shuffle'){ order = [...st.cards].sort(()=>Math.random()-0.5); st.order = order; }
  else order = st.order || st.cards;
  order.forEach((c,i)=>{
    c.style.width = cw + 'px'; c.style.height = ch + 'px';
    c.style.left = (i % cols)*(cw+gap) + 'px';
    c.style.top  = Math.floor(i/cols)*(ch+gap) + 'px';
  });
}
function memRelayoutAll(){ Object.keys(MEM).forEach(id=>{ if(document.getElementById(id)) memLayout(id); }); }
/* round 1 = 明牌配对(牌一直正面朝上) · round 2 = 进阶挑战(扣牌凭记忆) */
function memStart(id, round){
  const st = MEM[id], box = document.getElementById(id);
  if(!st || !box) return;
  st.round = round || 1;
  st.phase = 'flip'; st.matched = 0; st.first = null; st.lock = false;
  const done = box.querySelector('.mdone'); if(done) done.remove();
  st.cards.forEach(c=>{
    c.classList.remove('won','peek','miss');
    if(st.round === 2) c.classList.add('down'); else c.classList.remove('down');
  });
  memLevel(id);
  const bar = document.getElementById(id + '_t');
  const btn = document.getElementById(id + '_go'); if(btn) btn.style.display = 'none';
  const wait = st.round === 2 ? 430 : 60;
  setTimeout(()=>{ memLayout(id, 'shuffle');
    setTimeout(()=>{ st.phase = st.round === 2 ? 'play' : 'open'; st.t0 = Date.now();
      clearInterval(st.tid);
      st.tid = setInterval(()=>{ if(bar) bar.textContent = '⏱ ' + Math.floor((Date.now()-st.t0)/1000) + ' s'; }, 250);
    }, 560);
  }, wait);
}
function memLevel(id){
  const st = MEM[id], el = document.getElementById(id + '_lv');
  if(!el) return;
  if(!st || !st.round){ el.className = 'mlevel idle'; el.textContent = T('memPick'); return; }
  el.className = 'mlevel' + (st.round === 2 ? ' adv' : '');
  el.textContent = st.round === 2 ? T('memLv2') : T('memLv1');
}
function memTap(card){
  const box = card.closest('.memory'), id = box.id, st = MEM[id];
  if(!st || st.lock) return;
  if(st.phase === 'review'){ speak(card.dataset.w); return; }

  /* ── 第一关:明牌配对,牌始终正面朝上,只做选中/配对 ── */
  if(st.phase === 'open'){
    if(card.classList.contains('won')) return;
    if(st.first === card){ card.classList.remove('peek'); st.first = null; return; }
    card.classList.add('peek');
    speak(card.dataset.w);
    if(!st.first){ st.first = card; return; }
    const a = st.first, b = card; st.first = null;
    if(a.dataset.w === b.dataset.w && a.dataset.kind !== b.dataset.kind){
      a.classList.remove('peek'); b.classList.remove('peek');
      a.classList.add('won'); b.classList.add('won');
      st.matched++;
      if(st.matched === st.cards.length/2) memWin(id, st);
    } else {
      st.lock = true;
      a.classList.add('miss'); b.classList.add('miss');
      setTimeout(()=>{ [a,b].forEach(x=>x.classList.remove('peek','miss')); st.lock = false; }, 620);
    }
    return;
  }

  /* ── 第二关:扣牌记忆,点开才看得见 ── */
  if(st.phase !== 'play' || !card.classList.contains('down')) return;
  card.classList.remove('down'); card.classList.add('peek');
  speak(card.dataset.w);                              /* 翻开就读中文,两种卡都读中文 */
  if(!st.first){ st.first = card; return; }
  const a = st.first, b = card; st.first = null;
  if(a.dataset.w === b.dataset.w && a.dataset.kind !== b.dataset.kind){
    a.classList.remove('peek'); b.classList.remove('peek');
    a.classList.add('won'); b.classList.add('won');
    st.matched++;
    if(st.matched === st.cards.length/2) memWin(id, st);
  } else {
    st.lock = true;
    setTimeout(()=>{ a.classList.add('down'); b.classList.add('down');
      a.classList.remove('peek'); b.classList.remove('peek'); st.lock = false; }, 750);
  }
}
function memWin(id, st){
  st.phase = 'done'; clearInterval(st.tid);
  const t = Math.floor((Date.now() - st.t0)/1000);
  const key = id + '_r' + st.round;
  if(MEM_BEST[key] === undefined || t < MEM_BEST[key]) MEM_BEST[key] = t;
  EV('memory_done', LID + '.memory', {round:st.round, seconds:t, pairs:st.cards.length/2});
  const bar = document.getElementById(id + '_t'); if(bar) bar.textContent = '';
  const box = document.getElementById(id);
  const d = document.createElement('div'); d.className = 'mdone';
  if(st.round === 1){
    d.innerHTML = "<div class='big'>" + TF('memWin1', {t:t}) + "</div>"
      + "<div class='sm'>" + TF('memBest1', {t:MEM_BEST[key]}) + "</div>"
      + "<div style='display:flex;gap:8px;flex-wrap:wrap;justify-content:center'>"
      + "<button class='abtn orange' onclick=\"memStart('" + id + "',2)\">" + T('memGo2') + "</button>"
      + "<button class='abtn' onclick=\"memStart('" + id + "',1)\">" + T('memAgain1') + "</button>"
      + "<button class='abtn ghost' onclick=\"memReview('" + id + "')\">" + T('memBack') + "</button></div>";
    speak('很好');
  } else {
    d.innerHTML = "<div class='big'>" + TF('memWin2', {t:t}) + "</div>"
      + "<div class='sm'>" + TF('memBest2', {t:MEM_BEST[key]}) + "</div>"
      + "<div style='display:flex;gap:8px;flex-wrap:wrap;justify-content:center'>"
      + "<button class='abtn orange' onclick=\"memStart('" + id + "',2)\">" + T('memAgain2') + "</button>"
      + "<button class='abtn' onclick=\"memStart('" + id + "',1)\">" + T('memTo1') + "</button>"
      + "<button class='abtn ghost' onclick=\"memReview('" + id + "')\">" + T('memBack') + "</button></div>";
    speak('太好了');
    confetti();
  }
  box.append(d);
}
function memReview(id){
  const st = MEM[id], box = document.getElementById(id);
  if(!st || !box) return;
  st.phase = 'review'; st.round = 0; clearInterval(st.tid);
  const bar = document.getElementById(id + '_t'); if(bar) bar.textContent = '';
  const done = box.querySelector('.mdone'); if(done) done.remove();
  st.cards.forEach(c=>c.classList.remove('down','won','peek','miss'));
  memLayout(id, 'review'); memLevel(id);
  const btn = document.getElementById(id + '_go'); if(btn) btn.style.display = '';
}
function confetti(){
  let cv = document.getElementById('cfx');
  if(!cv){ cv = document.createElement('div'); cv.id = 'cfx'; document.body.append(cv); }
  const colors = ['#6EB9E5','#F4A9C0','#F0873A','#4A9E6B','#F5C95C','#3D86C6'];
  for(let i=0;i<70;i++){
    const p = document.createElement('i');
    p.style.left = Math.random()*100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = (1.7 + Math.random()*1.2) + 's';
    p.style.animationDelay = (Math.random()*.35) + 's';
    p.style.transform = 'rotate(' + Math.random()*360 + 'deg)';
    cv.append(p); setTimeout(()=>p.remove(), 3400);
  }
}

/* ═══ 全屏入口(2026-09-05)═══
   原先翻牌是认字站的第二张卡,现改为点击后全屏,复用 #full 容器。
   #full 的内层件是给汉字练一练/听写用的,这里先把它们收起来再显示自己;
   hanzi 的 fullOpen 反过来也会收起 #memFull。两边共用 fBack 与 Esc 关闭。 */
function memFullOpen(){
  const box = document.getElementById('memFull');
  if(!box) return;
  ['fPrompt', 'dPad', 'fRow', 'fTip', 'dEnd'].forEach(id=>{
    const e = document.getElementById(id); if(e) e.style.display = 'none';
  });
  box.style.display = '';
  box.innerHTML =
      '<div class="msub"><span class="mtip">先点牌听一遍,记住每个词怎么读、什么意思。'
    + '<b>第一关</b>牌都摊着,把 ' + RZ_WORDS.length + ' 个中文词和它的英文点成对;'
    + '<b>第二关</b>牌全扣过来,凭记忆再配一遍。两关都可以直接选。'
    + (EN_DRAFT ? '<b class="t-only" style="color:var(--accent-deep)"> ⚠ 英文为拟稿,待核定。</b>' : '')
    + '</span></div>'
    + '<div class="memory" id="memR" data-ch="78" data-cols="4"></div>'
    + '<div class="mbar">'
    + '<span class="mlevel idle" id="memR_lv">选一关开始</span>'
    + '<span class="mtime" id="memR_t"></span>'
    + '<span style="flex:1"></span>'
    + '<span class="mgo" id="memR_go">'
    +   '<button class="abtn" onclick="memStart(\'memR\',1)">第一关 · 看牌配对</button>'
    +   '<button class="abtn orange" onclick="memStart(\'memR\',2)">第二关 · 扣牌记忆</button>'
    + '</span></div>';
  document.getElementById('full').classList.add('on');
  document.getElementById('fTitle').textContent = '记忆翻牌';
  document.getElementById('fProg').textContent = '';
  memBuild('memR', RZ_WORDS);
  EV('memory_open', LID + '.memory', {words: RZ_WORDS.length});
}

/* 关闭全屏时停表。翻牌原先在认字站的卡片里,切站会重建 DOM 而 interval 不停
   —— 那是旧有行为;现在有了显式的关闭入口,顺手收干净。 */
function memFullStop(){
  const st = MEM['memR'];
  if(st) clearInterval(st.tid);
}

PP.onResize(memRelayoutAll);
