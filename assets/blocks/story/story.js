/* story 板块脚本
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。 */
/* ══ 对话分边规则 ══
   本书主角是盼盼。台词气泡只把盼盼放右侧,其余角色(朵朵、爸爸、妈妈,
   以及后面各课出现的飞飞、阿虎、乐乐、老师等)一律左侧。
   这样孩子一眼认得出「哪句是主角说的」,也贴合聊天界面「自己在右」的习惯。
   换主角或加角色时只改这一行。 */
const HERO = ['盼盼'];

/* ═══ 内容构件 ═══ */
function dialogHTML(t0,ti){
  const t = nzText(t0, ti);
  return '<div class="card">'
   + (t0.art === false ? '' : artHTML('text'+(ti+1), {ratio:'16/9', story:'text'+(ti+1), ti:ti,
       cap:T('artCap')}))
   + (t0.materials || []).map(m=>'<div class="story-material'+(m.rows?' has-table':'')+'"><strong>'+m.title+'</strong>'
       + (m.rows ? '<table><thead><tr>'+m.headers.map(s=>'<th scope="col">'+kk(s)+'</th>').join('')
           +'</tr></thead><tbody>'+m.rows.map(r=>'<tr>'+r.map(s=>'<td>'+kk(s)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'
           : m.lines.map(s=>'<div>'+kk(s)+'</div>').join(''))+'</div>').join('')
   + (t.scene ? '<div class="scene-chip t-only"><b>场景 · </b>' + t.scene + '</div>' : '')
   + '<div class="words">' + t.words.map(w=>'<button class="wtag" onclick="speak(\'' + w + '\')">' + kk(w) + '</button>').join('') + '</div>'
   + '<div id="lines-' + ti + '">' + t.lines.map(l =>
       '<div class="drow ' + (HERO.indexOf(l.who)>=0 ? 'side-hero' : 'side-other') + '"'
       + ' data-t="' + l.text + '" onclick="rowClick(this)" role="button" tabindex="0"'
       + ' aria-label="' + l.who + '说:' + l.text + '">'
       /* 说话人:头像圆 + 名字(用户 2026-09-20)。有头像图就显示图,没有的退回名字首字色圆。 */
       + '<span class="who">'
         + '<span class="avatar" data-avatar="' + (VMAP[l.who]||'') + '" style="background:' + WHO[l.who] + '"'
         + ' title="' + l.who + '"><img alt=""><span>' + l.who[0] + '</span></span>'
         + '<b class="who-name">' + l.who + '</b>'
       + '</span>'
       + '<span class="bubble"><span class="dtxt">' + kk(l.text) + '</span>' + lineTr(l) + '</span>'
       + '</div>').join('')
   + '</div>'
   + '<div class="tools">'
   + '<button class="abtn seq-play" onclick="playScene(' + ti + ')">' + T('playAll') + '</button>'
   + '<button class="abtn seq-pause" style="display:none" onclick="seqPause()">' + T('pause') + '</button>'
   + '<button class="abtn seq-resume" style="display:none" onclick="seqResume()">' + T('resume') + '</button>'
   + '<button class="abtn ghost seq-stop" style="display:none" onclick="stopSpeak()">' + T('stop') + '</button>'
   + '</div></div>';
}
/* 台词译文(用户 2026-09-19:课文一二三缺英文译文,先做英文):课程 JSON 的 lines[].tr {en,id?,km?}。
   按界面语言取,没有该语言就退回英文。只在设置里「译文」开着时显示(用户 2026-09-19:默认不显示)。 */
function lineTr(l){
  const t = l.tr && (l.tr[LANG] || l.tr.en);
  return t ? '<span class="dtr trline blk">' + t + '</span>' : '';   /* trline:跟设置里「译文 关/开」走,默认关 */
}
function rowClick(el){
  stopSpeak(); el.classList.add('playing');
  EV('line_play', LID + '.line', {text_len:el.dataset.t.length});
  speak(el.dataset.t, ()=>el.classList.remove('playing'));
}
/* 整段朗读:可暂停、可继续。paused 时记住停在第几句 */
const SEQ = { ti:null, i:0, rows:[], paused:false };
function playScene(ti){
  stopSpeak();
  SEQ.ti = ti; SEQ.i = 0; SEQ.paused = false;
  SEQ.rows = [...document.querySelectorAll('#lines-'+ti+' .drow')];
  EV('story_play', LID + '.text' + (ti+1), {lines:SEQ.rows.length});
  playingSeq = true;
  seqStep();
  seqBtns();
}
function seqStep(){
  if(!playingSeq || SEQ.paused || SEQ.i >= SEQ.rows.length){
    if(SEQ.i >= SEQ.rows.length){ stopSpeak(); seqBtns(); }
    return;
  }
  SEQ.rows.forEach(r=>r.classList.remove('playing'));
  SEQ.rows[SEQ.i].classList.add('playing');
  speak(SEQ.rows[SEQ.i].dataset.t, ()=>{ if(SEQ.paused) return; SEQ.i++; setTimeout(seqStep, 300); });
}
function seqPause(){
  SEQ.paused = true;
  if('speechSynthesis' in window) speechSynthesis.cancel();
  seqBtns();
}
function seqResume(){
  if(SEQ.ti === null || SEQ.i >= SEQ.rows.length) return;
  SEQ.paused = false; playingSeq = true;
  seqStep(); seqBtns();
}
function seqBtns(){
  const on = playingSeq && !SEQ.paused;
  document.querySelectorAll('.seq-play').forEach(b=>b.style.display = (on || SEQ.paused) ? 'none' : '');
  document.querySelectorAll('.seq-pause').forEach(b=>b.style.display = on ? '' : 'none');
  document.querySelectorAll('.seq-resume').forEach(b=>b.style.display = SEQ.paused ? '' : 'none');
  document.querySelectorAll('.seq-stop').forEach(b=>b.style.display = (on || SEQ.paused) ? '' : 'none');
}
function stemHTML(stem, blankId){
  return stem.split('___').map(p => p ? kk(p) : '').join('<span class="blank" id="'+blankId+'">　</span>');
}
function drillHTML(ci){
  const d = L.drills[ci];
  return '<div class="card"><h3 data-t="secDrill"></h3><div class="drill">'
   + '<div class="box"><h4>听一听 · 选一选</h4>'
   + '<button class="playword" onclick="speak(\'' + d.pick.audio + '\')" aria-label="播放词语">🔊</button>'
   + '<div class="opts" id="dp'+ci+'">' + d.pick.options.map(o=>'<button class="opt" data-v="'+o+'" onclick="pickAns('+ci+',\''+o+'\',this)">'+kk(o)+'</button>').join('')
   + '<button class="retry" id="dprt'+ci+'" onclick="drillRetry('+ci+',\'pick\')" style="display:none">↺ 再试一次</button></div></div>'
   + '<div class="box"><h4>读一读 · 填一填</h4>'
   + '<div class="stem">' + stemHTML(d.fill.stem, 'fb'+ci) + '</div>'
   + '<div class="opts" id="df'+ci+'">' + d.fill.bank.map(o=>'<button class="opt" data-v="'+o+'" onclick="fillAns('+ci+',\''+o+'\',this)">'+kk(o)+'</button>').join('')
   + '<button class="retry" id="dfrt'+ci+'" onclick="drillRetry('+ci+',\'fill\')" style="display:none">↺ 再试一次</button></div></div>'
   + '</div></div>';
}
function drillKey(ci,kind){ return 'c'+ci+'.'+kind; }
function drillPaint(){
  if(!L.drills) return;                     // 一级过渡期没有随文练习数据
  L.drills.forEach((d,ci)=>{
    [['pick','dp'],['fill','df']].forEach(function(pair){
      const kind = pair[0], pre = pair[1];
      const row = document.getElementById(pre+ci);
      if(!row) return;
      const st = STATE.drill[drillKey(ci,kind)];
      row.querySelectorAll('.opt').forEach(o=>{
        o.classList.remove('ok','no','dim');
        if(!st) return;
        if(o.dataset.v === st.pick) o.classList.add(st.good?'ok':'no');
        if(st.good) o.classList.add('dim');
      });
      const rt = document.getElementById(pre+'rt'+ci);
      if(rt) rt.style.display = (st && !st.good) ? '' : 'none';
      if(kind === 'fill'){
        const b = document.getElementById('fb'+ci);
        if(b){
          if(st && st.good){ b.innerHTML = kk(d.fill.answer); kkAll(b); }
          else b.innerHTML = '　';
        }
      }
    });
  });
}
function drillAns(ci, kind, o){
  const key = drillKey(ci,kind), prev = STATE.drill[key];
  if(prev && prev.good) return;
  const good = o === (kind === 'pick' ? L.drills[ci].pick.answer : L.drills[ci].fill.answer);
  STATE.drill[key] = {good:good, pick:o};
  EV('drill_answer', LID + '.drill.' + key, {correct:good, pick:o, first_try:!prev});
  drillPaint();
  if(kind === 'pick') speak(good ? '对了' : '再听一听');
}
function drillRetry(ci, kind){
  delete STATE.drill[drillKey(ci,kind)];
  EV('drill_retry', LID + '.drill.' + drillKey(ci,kind), {});
  drillPaint();
}
function pickAns(ci,o,el){ drillAns(ci,'pick',o); }
function fillAns(ci,o,el){ drillAns(ci,'fill',o); }

/* ═══ 片段注册(第二步)═══
   原 engine/sections.js 的 s1/s2/s3 三站,同一个片段按 node.idx 取第几篇课文。 */
PP.block({
  kind: 'story',
  key:  node => 's' + (node.idx + 1),
  icon: node => String(node.idx + 1),
  sub:  (L, node) => L.texts[node.idx].words.join(' · '),
  needs: [],
  /* 二级每篇课文跟一个循环练(L.drills);一级的随文练在 texts[].ex 里,
     题型也不同(pick 是三行多选、fill 是排序),那部分随 practice 片段一起做。 */
  render: (L, node) => dialogHTML(L.texts[node.idx], node.idx)
    + (L.drills && L.drills[node.idx] ? drillHTML(node.idx) : '')
});

/* 从 core 移来:点插图播放整段,只有课文站有。 */
function storyClick(fig, ti){
  const on = fig.classList.contains('playing');
  stopSpeak();
  if(on) return;
  playScene(ti);
  fig.classList.add('playing');
}
PP.onAfterRender(() => { if(typeof drillPaint === 'function') drillPaint(); });
