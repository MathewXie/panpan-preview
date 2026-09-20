/* quiz 板块脚本
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。 */
/* ═══ 小考场 ═══ */
const E = L.exam;
/* 答题状态存在 DOM 之外,切站重渲染后回填,不再清零 */
const STATE = { exam:{}, drill:{} };
function examCount(){
  const v = Object.values(STATE.exam);
  return { answered: v.length, correct: v.filter(x=>x.good).length };
}
function examHTML(){
  return ''
   /* ── 每个小节独立成卡 ── */
   + '<div class="card"><div class="exam-hint" data-t="examHint"></div></div>'

   /* ① 听1 判断:图在上、对错在下,三题横排,窄屏自动折行 ── */
   + '<div class="card"><h3>' + modTitle(0,'exL1') + '</h3><div class="tf-grid">'
   + E.l1.map((q,i)=>
       '<div class="tf-item" id="l1row'+i+'">'
       + '<div class="qhead"><span class="qn">' + (i+1) + '</span>'
       + '<button class="abtn play-audio" onclick="speak(\'' + q.audio + '\')" data-t="btnPlay"></button></div>'
       + '<span class="audio-note t-only">音轨:' + q.audio + '</span>'
       + artHTML('l1_'+(i+1), {ratio:'4/3'})
       + '<div class="opts tf-opts">'
       + [['√','tfYes'],['×','tfNo']].map(v=>
           '<button class="opt tf" data-v="'+v[0]+'" onclick="ansL1('+i+',\''+v[0]+'\')"'
           + ' aria-label="'+T(v[1])+'">' + v[0] + '</button>').join('')
       + '<button class="retry" id="rtl1'+i+'" onclick="examRetry(\'l1'+i+'\')" style="display:none">↺ <span data-t="btnRetry"></span></button>'
       + '</div></div>').join('')
   + '</div></div>'

   /* ② 听2 对话选图 ── */
   + '<div class="card"><h3>' + modTitle(1,'exL2') + '</h3><div class="pool">'
   + Object.entries(E.l2pool).map(([k,v])=>
       '<div class="pcard" id="pl'+k+'"><span class="letter">'+k+'</span>'
        + artHTML('l2_'+k, {ratio:'4/3'})
        + '<div class="cap t-only">'+kk(v)+'</div></div>').join('')
   + '</div>'
   + E.l2.map((q,i)=>
       '<div class="qrow" id="l2row'+i+'">'
       + '<div class="qhead"><span class="qn">' + (i+4) + '</span>'
       + '<button class="abtn play-audio" onclick="playDialog(\'' + q.d1 + '\',\'' + q.d2 + '\')" data-t="btnPlay"></button>'
       + '<span class="audio-note t-only">对话:' + q.d1 + ' / ' + q.d2 + '</span></div>'
       + '<div class="opts">'
       + ['A','B','C','D'].map(k=>'<button class="opt" data-v="'+k+'" onclick="ansL2('+i+',\''+k+'\')">'+k+'</button>').join('')
       + '<button class="retry" id="rtl2'+i+'" onclick="examRetry(\'l2'+i+'\')" style="display:none">↺ <span data-t="btnRetry"></span></button>'
       + '</div></div>').join('')
   + '</div>'

   /* ③ 读1 看句子选图 ── */
   + '<div class="card"><h3>' + modTitle(2,'exR1') + '</h3><div class="pool">'
   + Object.entries(E.r1pool).map(([k,v])=>
       '<div class="pcard" id="pc'+k+'"><span class="letter">'+k+'</span>'
        + artHTML('r1_'+k, {ratio:'4/3'})
        + '<div class="cap t-only">'+kk(v)+'</div></div>').join('')
   + '</div>'
   + E.r1.map((q,i)=>'<div class="qrow" id="r1row'+i+'">'
       + '<div class="qhead"><span class="qn">' + (i+7) + '</span><span class="sent">'+kk(q.sentence)+'</span></div>'
       + '<div class="opts">'
       + ['A','B','C','D'].map(k=>'<button class="opt" data-v="'+k+'" onclick="ansR1('+i+',\''+k+'\')">'+k+'</button>').join('')
       + '<button class="retry" id="rt1'+i+'" onclick="examRetry('+i+')" style="display:none">↺ <span data-t="btnRetry"></span></button>'
       + '</div></div>').join('')
   + '</div>'

   /* ④ 读4 选词填空 ── */
   + '<div class="card"><h3>' + modTitle(3,'exR4') + '</h3>'
   + E.r4.map((q,i)=>'<div class="qrow" id="r4row'+i+'">'
       + '<div class="qhead"><span class="qn">' + (i+9) + '</span><span class="sent">'+stemHTML(q.stem,'bl'+i)+'</span></div>'
       + '<div class="opts">'
       + q.bank.map(w=>'<button class="opt" data-v="'+w+'" onclick="ansR4('+i+',\''+w+'\')">'+kk(w)+'</button>').join('')
       + '<button class="retry" id="rt4'+i+'" onclick="examRetry('+(i+2)+')" style="display:none">↺ <span data-t="btnRetry"></span></button>'
       + '</div></div>').join('')
   + '</div>'

   /* ⑤ 交卷 ── */
   + '<div class="card"><div class="submit-bar">'
   +   '<span class="fill-note" id="fillNote"></span>'
   +   '<button class="abtn orange" id="submitBtn" onclick="examSubmit()" data-t="btnSubmit"></button>'
   + '</div><div class="result" id="result"></div></div>';
}
function playDialog(a, b){
  stopSpeak();
  speak(a, ()=>setTimeout(()=>speak(b), 400));
}
/* 题号 → STATE 键。听力用 l1n/l2n,阅读沿用数字 */
const EX_KEYS = ['l10','l11','l12','l20','l21','l22', 0, 1, 2, 3];
function examCount(){
  const v = EX_KEYS.map(k=>STATE.exam[k]).filter(Boolean);
  return { answered: v.length, correct: v.filter(x=>x.good).length, total: EX_KEYS.length };
}
function setAns(key, good, pick, cid){
  const prev = STATE.exam[key];
  if(prev && prev.good && SUBMITTED) return;
  STATE.exam[key] = {good:good, pick:pick, tries:(prev?prev.tries+1:1)};
  EV('exam_answer', cid, {correct:good, pick:pick, first_try:!prev});
  examPaint();
}
function ansL1(i,v){ setAns('l1'+i, v === E.l1[i].key, v, LID + '.exam.l1.' + (i+1)); }
function ansL2(i,k){ setAns('l2'+i, k === E.l2[i].key, k, LID + '.exam.l2.' + (i+1)); }
function ansR1(i,k){ setAns(i,   k === E.r1[i].key,   k, LID + '.exam.r1.' + (i+1)); }
function ansR4(i,w){ setAns(i+2, w === E.r4[i].answer,w, LID + '.exam.r4.' + (i+1)); }

let SUBMITTED = false;
function paintRow(rowId, key, retryId, extra){
  const row = document.getElementById(rowId); if(!row) return;
  const st = STATE.exam[key];
  row.querySelectorAll('.opt').forEach(o=>{
    o.classList.remove('ok','no','dim','picked');
    if(!st) return;
    if(o.dataset.v === st.pick) o.classList.add(SUBMITTED ? (st.good?'ok':'no') : 'picked');
    if(SUBMITTED && st.good) o.classList.add('dim');
  });
  const rt = document.getElementById(retryId);
  if(rt) rt.style.display = (SUBMITTED && st && !st.good) ? '' : 'none';
  if(extra) extra(st);
}
function examPaint(){
  if(!document.getElementById('result')) return;
  E.l1.forEach((q,i)=>paintRow('l1row'+i, 'l1'+i, 'rtl1'+i));
  E.l2.forEach((q,i)=>paintRow('l2row'+i, 'l2'+i, 'rtl2'+i));
  E.r1.forEach((q,i)=>paintRow('r1row'+i, i, 'rt1'+i, st=>{
    const pc = document.getElementById('pc'+E.r1[i].key);
    if(pc) pc.classList.toggle('glow', !!(SUBMITTED && st && st.good));
  }));
  E.r4.forEach((q,i)=>paintRow('r4row'+i, i+2, 'rt4'+i, st=>{
    const b = document.getElementById('bl'+i);
    if(!b) return;
    if(st && SUBMITTED && st.good){ b.innerHTML = kk(E.r4[i].answer); kkAll(b); }
    else if(st){ b.innerHTML = kk(st.pick); kkAll(b); }
    else b.innerHTML = '　';
  }));
  const c = examCount();
  const note = document.getElementById('fillNote');
  if(note) note.textContent = SUBMITTED ? '' : T('fillNote').replace('{n}', c.answered).replace('{t}', c.total);
  const btn = document.getElementById('submitBtn');
  if(btn){ btn.disabled = (c.answered < c.total) && !SUBMITTED; label2(btn, T(SUBMITTED ? 'btnResubmit' : 'btnSubmit')); }
  const r = document.getElementById('result');
  if(SUBMITTED){
    r.innerHTML = '<b>' + T('score').replace('{c}', c.correct).replace('{t}', c.total) + '</b>'
      + '<div style="margin-top:5px;color:var(--ink-soft);font-size:var(--u-sub)">'
      + T(c.correct === c.total ? 'allRight' : 'someWrong') + '</div>';
    r.classList.add('show');
  } else r.classList.remove('show');
}
function label2(btn, txt){ const t = btn.querySelector('[data-t]'); if(t) t.textContent = txt; else btn.textContent = txt; }
function examSubmit(){
  const c = examCount();
  if(!SUBMITTED && c.answered < c.total) return;
  SUBMITTED = true;
  EV('exam_done', LID + '.exam', {correct:c.correct, total:c.total});
  examPaint();
  speak(c.correct === c.total ? '太好了' : '继续加油');
}
function examRetry(key){
  delete STATE.exam[key];
  SUBMITTED = false;
  EV('exam_retry', LID + '.exam.' + key, {});
  examPaint();
}

/* ═══ 片段注册(第二步)═══ 原 engine/sections.js 的 s9 站。 */
PP.block({
  kind: 'quiz',
  key:  () => 's9',
  icon: () => '考',
  sub:  () => '10 题',
  needs: [],
  render: () => examHTML()
});

PP.onAfterRender(examPaint);
