/* hanzi 板块脚本
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。 */
/* 认一认翻牌用词:11 个认读字映射到的例词,去重保序 */
const HZMETA    = JSON.parse(document.getElementById('hzmeta-data').textContent);
const CHAR_WORD = HZMETA.CHAR_WORD, CHAR_PY = HZMETA.CHAR_PY;
const RZ_WORDS = [...new Set(L.renyiren.map(c=>CHAR_WORD[c]||CHARWORD[c]||c))];

/* ═══ 汉字时间(照搬正式版 initHanzi / hzShow / 全屏 quiz) ═══ */
/* 笔顺库全九级共用一份。bundle 内联,分离式由 assets/vendor/hanzi-data.js
   定义全局 HZ_DATA_RAW —— 38 KB 不必每课复制一遍。 */
const HZ_DATA   = (typeof HZ_DATA_RAW !== 'undefined') ? HZ_DATA_RAW
                : JSON.parse(document.getElementById('hz-data').textContent);
const WRITE_CHARS = L.xiexie.map(x=>x.char).join('');
const hasHZ = ch => !!HZ_DATA[ch];
const wordPy = w => (PY[w]||[]).join(' ');
const HZ_OPT = {strokeColor:'#25313C', radicalColor:'#3A8265', outlineColor:'#E4DCCB',
                delayBetweenStrokes:210, strokeAnimationSpeed:0.95};

const hzW = {};                        /* 每个大格一个实例,重渲染时重建 */
/* mark:{字:角标} —— 一级 v5 写字站把「当课复写」的字标「复」(2026-09-15) */
function hzPanel(id, chars, mark){
  mark = mark || {};
  return '<div class="hztop">'
   + '<div class="hzbig" id="big_'+id+'"></div>'
   + '<div class="hzinfo" id="info_'+id+'"><div class="tip">' + T('hzTip') + '</div></div>'
   + '</div><div class="hzall" id="all_'+id+'">'
   + chars.map((ch,i)=>'<div class="hzc'+(hasHZ(ch)?'':' nodata')+'" data-hz="'+ch+'" data-panel="'+id+'"'
       + ' onclick="hzPick(this)" role="button" tabindex="'+(i===0?0:-1)+'"'
       + ' onkeydown="hzKey(event,this)" aria-label="'+ch+(mark[ch]?'('+mark[ch]+'写)':'')+'"'
       + (hasHZ(ch)?' ':' title="笔顺数据待扩库" ')+'>'+ch
       + (mark[ch] ? '<i class="hzmark" aria-hidden="true">'+mark[ch]+'</i>' : '') + '</div>').join('')
   + '</div>';
}
/* 一级 v5:课程 JSON 带 chars{write,review} 时,写字站的字 = 首写字 + 当课复写 */
function hzWriteMarks(){
  const m = {};
  ((L.chars && L.chars.review) || []).forEach(c => { m[c] = '复'; });
  return m;
}
function hzWriteSub(){
  if(!(L.chars && L.chars.write)) return '回炉 ' + L.xiexie.length + ' 字';
  /* 2026-09-19 用户拍板:写字站只写首写字,当课复写不进写字站 */
  return '本课写 ' + L.xiexie.length + ' 字';
}
function hzKey(e, el){
  if(e.key===' '||e.key==='Enter'){ e.preventDefault(); hzPick(el); return; }
  rove(e, el.parentElement, '.hzc');
}
function hzPick(el){
  const ch = el.dataset.hz, id = el.dataset.panel;
  document.querySelectorAll('#all_'+id+' .hzc.on').forEach(x=>x.classList.remove('on'));
  el.classList.add('on');
  roveFocus(el.parentElement, '.hzc', el);
  hzShow(id, ch);
  EV('char_view', LID + '.hz.' + ch, {ch:ch, has_stroke:hasHZ(ch)});
  speak(ch);
  const info = document.getElementById('info_'+id);
  if(info){
    const w = CHAR_WORD[ch];
    let h = '<div class="ir"><span class="ich">'+ch+'</span><span class="ipy">'+(CHAR_PY[ch]||'')+'</span>'
          + '<span class="ien t-only">单字英文释义:正本未提供</span></div>';
    if(w && w === ch && wordTr(w))   /* 例词就是这个字:单字直接给译文(用户 2026-09-15) */
      h += '<div class="ir"><span class="ien">'+wordTr(w)+'</span>'
         + '<button class="mini" onclick="speak(\''+w+'\')">' + T('hzListen') + '</button></div>';
    if(w && w !== ch)
      h += '<div class="ir"><span class="iwd">'+w+'</span><span class="ipy">'+wordPy(w)+'</span>'
         + (wordTr(w) ? '<span class="ien">'+wordTr(w)+'</span>' : '')   /* 译文按界面语言(2026-09-15) */
         + '<button class="mini" onclick="speak(\''+w+'\')">' + T('hzListen') + '</button></div>';
    if(!hasHZ(ch)) h += '<div class="tip" style="color:var(--accent-deep)">本字笔顺数据待入库,大格暂显楷体字形。</div>';
    info.innerHTML = h;
  }
}
function hzShow(id, ch){
  const box = document.getElementById('big_'+id);
  if(!box) return;
  if(!hasHZ(ch) || typeof HanziWriter === 'undefined'){
    box.innerHTML = '<span class="fallback">'+ch+'</span>'
      + (hasHZ(ch)?'':'<span class="nodata">笔顺数据待扩库</span>');
    hzW[id] = null; return;
  }
  if(!hzW[id]){
    box.innerHTML = '';
    hzW[id] = HanziWriter.create(box, ch, Object.assign({width:228, height:228, padding:16,
      showOutline:true, charDataLoader:(c,onC)=>onC(HZ_DATA[c])}, HZ_OPT));
  } else {
    hzW[id].setCharacter(ch);
  }
  setTimeout(()=>{ try{ hzW[id].animateCharacter(); }catch(e){} }, 80);
}
function hzReplay(id){
  const sel = document.querySelector('#all_'+id+' .hzc.on');
  if(!sel){ toast(T('hzPickFirst')); return; }
  hzShow(id, sel.dataset.hz);
}

/* ── 全屏:练一练(带轮廓与下一笔提示) / 听写(只给拼音与例词) ── */
let dW=null, dList=[], dI=0, dMiss=0, dCur='', dMode='dict', dStroke=0;
function fullOpen(mode){
  const pool = WRITE_CHARS.split('').filter(hasHZ);
  if(!pool.length){ toast('本课写一写的笔顺数据尚未接入'); return; }
  dMode = mode;
  dList = pool.sort(()=>Math.random()-0.5); dI = 0; dMiss = 0;
  document.getElementById('full').classList.add('on');
  document.getElementById('fTitle').textContent = T(mode==='practice' ? 'fullPractice' : 'fullDict');
  document.getElementById('fTip').textContent = T(mode==='practice' ? 'fullTipP' : 'fullTipD');
  /* 全屏面板的按钮是骨架里的静态件,每次打开按当前语言写一遍 */
  [['dPlay','fPlay'],['dHint','fHint'],['dSkip','fSkip'],['dAgain','fAgain'],['fBack','back']].forEach(([el,k])=>{
    const b = document.getElementById(el); if(b) b.textContent = T(k);
  });
  document.getElementById('dHint').style.display = mode==='practice' ? '' : 'none';
  document.getElementById('dEnd').style.display = 'none';
  document.getElementById('dPad').style.display = '';
  document.getElementById('fRow').style.display = '';
  document.getElementById('fPrompt').style.display = '';
  document.getElementById('fTip').style.display = '';
  const mf = document.getElementById('memFull');   /* 与翻牌共用 #full,进来先收起对方 */
  if(mf){ mf.style.display = 'none'; mf.innerHTML = ''; }
  if(!dW && typeof HanziWriter !== 'undefined')
    dW = HanziWriter.create('dPad', dList[0], Object.assign({width:290, height:290, padding:14,
      showCharacter:false, showOutline:false, highlightColor:'#3A8265', drawingWidth:16,
      charDataLoader:(c,onC)=>onC(HZ_DATA[c])}, HZ_OPT));
  dictAsk();
}
function dictAsk(){
  dCur = dList[dI]; dStroke = 0;
  document.getElementById('fProg').textContent = (dI+1) + ' / ' + dList.length;
  const w = CHAR_WORD[dCur];
  document.getElementById('fPrompt').innerHTML =
    '<span class="fpy">' + (CHAR_PY[dCur]||'') + '</span>'
    + '<span class="fword">' + (dMode==='practice' ? w : wordPy(w)) + '</span>'
    + '<span class="fen">' + T(dMode==='practice' ? 'fExample' : 'fExamplePy') + (wordTr(w) ? ' · ' + wordTr(w) : '') + '</span>';
  const go = ()=>{
    if(dMode==='practice') dW.showOutline(); else dW.hideOutline();
    dW.quiz({ showOutline: dMode==='practice',
      showHintAfterMisses: dMode==='practice' ? 2 : false,
      onCorrectStroke: d=>{ dStroke = d.strokeNum + 1; },
      onMistake: ()=>{ dMiss++; },
      onComplete: ()=>{ EV('hz_quiz', LID + '.hz.' + dCur, {mode:dMode, ok:true}); speak('对了'); setTimeout(dictNext, 700); } });
  };
  if(dW) dW.setCharacter(dCur).then(go).catch(()=>{});
  speak(dCur);
}
function dictNext(){
  dI++;
  if(dI >= dList.length){
    document.getElementById('dPad').style.display = 'none';
    document.getElementById('fRow').style.display = 'none';
    document.getElementById('fPrompt').style.display = 'none';
    document.getElementById('dEnd').style.display = '';
    document.getElementById('dScore').textContent = dMiss===0
      ? T('fAllRight')
      : TF('fScore', {n:dList.length, m:dMiss});
    return;
  }
  dictAsk();
}
function fullClose(){
  document.getElementById('full').classList.remove('on');
  if(dW) dW.cancelQuiz();
  if(typeof memFullStop === 'function') memFullStop();   /* 翻牌共用本容器,停掉它的计时器 */
}
document.getElementById('fBack').onclick = fullClose;
document.getElementById('dAgain').onclick = ()=>fullOpen(dMode);
document.getElementById('dPlay').onclick = ()=>speak(dCur);
document.getElementById('dHint').onclick = ()=>{ if(dW) dW.highlightStroke(dStroke); };
document.getElementById('dSkip').onclick = ()=>{ dMiss++; dictNext(); };

/* ═══ 翻卡 / 描红 ═══ */

/* ═══ 片段注册(第二步)═══
   原 engine/sections.js 的 s4(认字)与 s5(写字)两站,同一个片段按 node.mode 区分。
   node.memory 为真时,认字站的 hzbar 上出现翻牌入口(决议 2026-09-05:
   memory 不占 plan 的 kind,由本片段按参数唤起,站数恒定 10)。 */
PP.block({
  kind: 'hanzi',
  key:  node => node.mode === 'write' ? 's5' : 's4',
  icon: node => node.mode === 'write' ? '写' : '认',
  sub:  (L, node) => node.mode === 'write'
        ? hzWriteSub()
        : '新认读字 ' + L.renyiren.length + ' 字 · 只认不写',
  needs: ['hanzi-writer', 'hanzi-data'],
  mount: (L, node) => hzBoot(node.mode === 'write' ? 'w' : 'r'),
  render: (L, node) => node.mode === 'write'
    ? '<div class="card"><h3 data-t="secXz"></h3>'
      + '<div class="hzbar">'
      + '<button class="abtn ghost" onclick="hzReplay(\'w\')" data-t="btnReplay"></button>'
      + '<button class="abtn" onclick="fullOpen(\'practice\')">' + T('hzPractice') + '</button>'
      + '<button class="abtn orange" onclick="fullOpen(\'dict\')">' + T('hzDict') + '</button></div>'
      + hzPanel('w', L.xiexie.map(x=>x.char), hzWriteMarks())
      + '<div class="write-note">' + T('hzNote') + '</div>'
      + '</div>'
    : '<div class="card"><h3 data-t="secRz"></h3>'
      + '<div class="hzbar"><button class="abtn ghost" onclick="hzReplay(\'r\')" data-t="btnReplay"></button>'
      + (node.memory ? '<button class="abtn orange" onclick="memFullOpen()">🃏 记忆翻牌</button>' : '')
      + '</div>'
      + hzPanel('r', L.renyiren)
      + (L.renyiren.every(hasHZ) ? '' :
         '<div class="write-note">部分字的笔顺数据尚未入库,大格暂显楷体字形;读音与例词照常。</div>')
      + '</div>'
});

/* 从 core 移来:只有汉字站用得着,core 不该认识它。
   artHTML 生成的 onclick 与站的 mount 都在全局作用域里找它,片段加载了就找得到。 */
function hzBoot(id){
  hzW[id] = null;
  const first = document.querySelector('#all_'+id+' .hzc');
  if(first) hzPick(first);
}

