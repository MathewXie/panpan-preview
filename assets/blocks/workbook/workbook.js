/* Workbook source is Markdown; no lesson-specific questions live in this renderer.
   2026-09-15:练习答错只提示不给答案;填空题输入框只放韵母/声母,横线上回显补全后的拼音;
   模拟测练合成一页,先看说明再点开始,限时倒计时,到时自动交卷,中途离开有提醒。 */
const WB = (() => {
  const data = L.workbook;
  const items = data ? data.exam.flatMap(g=>g.items) : [];
  const practice = data ? data.practice.flatMap(g=>g.items) : [];
  let account='local';
  try {account=JSON.parse(localStorage.getItem(PP.LS.session))?.user?.id||'local';} catch (_) {}
  const key = 'panpan.workbook.' + [account,PP.getLearner().id,LID,L.content_version].map(encodeURIComponent).join('.');
  const fresh = () => ({exam:{}, practice:{}, submitted:false, rounds:[], examStart:null, examEnd:null});
  let state = fresh();
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if(stored && stored.exam && stored.practice && Array.isArray(stored.rounds)) state=Object.assign(fresh(),stored);
  } catch (_) { /* Missing or unavailable local storage leaves a usable in-memory session. */ }
  const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  /* 键盘打不出声调符号:允许 hao3 / i3 / iao4 这种写法,判分前转成 hǎo / ǐ / iào。
     标调位置按通行规则:有 a 或 e 标在上面;ou 标 o;其余标最后一个元音。v 当 ü。 */
  const TONES={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù','ü':'ǖǘǚǜ'};
  const toneMark = s=>s.replace(/([a-zü]+)([1-4])/g,(m,syl,t)=>{
    syl=syl.replace(/v/g,'ü'); const n=+t-1; let i=-1;
    if(syl.includes('a')) i=syl.indexOf('a'); else if(syl.includes('e')) i=syl.indexOf('e');
    else if(syl.includes('ou')) i=syl.indexOf('o');
    else { for(let k=syl.length-1;k>=0;k--) if('aeiouü'.includes(syl[k])){ i=k; break; } }
    return i<0 ? syl : syl.slice(0,i)+TONES[syl[i]][n]+syl.slice(i+1);
  });
  const normalize = v=>toneMark(String(v??'').normalize('NFC').trim().toLowerCase());
  /* 补韵母题两步走:先只输不带调的韵母 → 确认 → 弹四个声调按钮 → 选一个判对错。
     输入框里只留带调的韵母,补全后的整个拼音回显在题干的横线上。已经带调或用数字写调的,直接判。 */
  const HAS_TONE=/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
  const toneButtons=(q,final)=>[1,2,3,4].map(t=>'<button type="button" class="wb-tone" data-wb-tone="'+t+'">'
    +'<small>'+t+'</small>'+esc((q.initial||'')+toneMark(final+t))+'</button>').join('');
  const save = ()=>{try {localStorage.setItem(key,JSON.stringify(state));} catch (_) {}};
  const find = id=>[...items,...practice].find(q=>q.id===id);
  const answered = ()=>items.filter(q=>q.options.some(o=>o.value===state.exam[q.id])).length;
  const score = skill=>data.exam.filter(g=>!skill||g.skill===skill).flatMap(g=>g.items)
    .filter(q=>state.exam[q.id]===q.answer).length;
  const count = skill=>data.exam.filter(g=>g.skill===skill).flatMap(g=>g.items).length;
  let minutes = 16;                     /* 限时,由 plan 节点给;默认按 HSK 一级听力 15 分钟 + 阅读 17 分钟折半 */
  let token=0, timer=null, tickId=null;
  function stop(){
    token++; clearTimeout(timer);
    if('speechSynthesis' in window) speechSynthesis.cancel();
    document.querySelectorAll('[data-wb-play]').forEach(b=>{b.textContent=T('wbListen'); b.removeAttribute('aria-busy');});
  }
  function play(id){
    stopSpeak(); stop();
    if(!('speechSynthesis' in window)) {toast(T('wbNoTts'));return;}
    const q=find(id); if(!q || !q.audio.length)return;
    const mine=token;
    const queue=[...q.audio,...q.audio]; let i=0;
    const button=document.querySelector(`[data-wb-id="${id}"] [data-wb-play]`);
    if(button){button.textContent=T('wbStop');button.setAttribute('aria-busy','true');}
    EV('line_play', LID+'.workbook.'+id, {mode:'device-speech',repetitions:2});
    function step(){
      if(mine!==token)return;
      if(i===queue.length){stop();return;}
      const utterance=new SpeechSynthesisUtterance(queue[i++]);
      utterance.lang='zh-CN'; utterance.rate=SLOW ? .55 : .85;
      utterance.onend=()=>{if(mine===token)timer=setTimeout(step,i===q.audio.length?1800:500);};
      utterance.onerror=e=>{if(mine===token&&e.error!=='canceled'){stop();toast(T('wbTtsErr'));}};
      speechSynthesis.speak(utterance);
    }
    step();
  }
  function question(q, isPractice){
    const speech=q.audio.length?'<button class="abtn ghost" data-wb-play="'+q.id+'">'+T('wbListen')+'</button>':'';
    let controls='';
    if(q.type==='input') controls='<div class="wb-input"><label>'+T('wbFill')+' <input autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="'+q.id+'答案"></label>'
        +'<button class="abtn" data-wb-check="'+q.id+'">'+T(q.tone==='pick'?'wbConfirm':'wbCheck')+'</button></div>'
        +(q.tone==='pick'?'<div class="wb-tones" data-wb-tones hidden><span class="wb-tones-label">'+esc(T('wbPickTone'))+'</span></div>':'');
    else if(q.type==='read') controls='<button class="abtn ghost" data-wb-read="'+q.id+'">'+T('wbRead')+'</button>';
    else controls='<div class="wb-options" role="group" aria-label="第'+q.id+'题选项">'+q.options.map(o=>
      '<button class="wb-option" data-wb-value="'+esc(o.value)+'" aria-pressed="false">'
      +'<span class="wb-letter">'+esc(o.value)+'</span><span class="wb-option-text">'+(o.html===o.value?'':o.html)+'</span></button>').join('')+'</div>';
    /* 填空题的题干横线:答完后把补全的拼音回显在这里 */
    const prompt=q.blank?'<p class="wb-fillline" data-wb-blank="'+esc(q.blank)+'">'+esc(q.blank)+'</p>':q.prompt;
    return '<article class="wb-question" data-wb-id="'+q.id+'" data-wb-practice="'+isPractice+'">'
      +'<div class="wb-question-top"><span class="wb-number">'+q.id+'</span>'+speech+'</div>'
      +'<div class="wb-prompt">'+prompt+'</div>'+controls
      +'<p class="wb-feedback" role="status" hidden></p>'
      +(isPractice?'<button class="retry wb-practice-retry" data-wb-reset="'+q.id+'" hidden>'+T('wbRetryOne')+'</button>':'')
      +(!isPractice&&q.audio.length?'<details class="t-only wb-audio-script"><summary>教师朗读稿</summary>'+q.audio.map(esc).join('<br>')+'</details>':'')
      +'</article>';
  }
  const trOf=g=>(LANG!=='zh'&&g.tr&&g.tr[LANG])||null;
  const group=(g,isPractice)=>'<section class="card wb-group"><h3>'+esc(g.title)
      +(trOf(g)?'<span class="wb-title-tr">'+esc(trOf(g).title)+'</span>':'')+'</h3>'
      +'<div class="wb-directions">'+g.intro+(trOf(g)&&trOf(g).intro?'<p class="wb-tr">'+esc(trOf(g).intro)+'</p>':'')+'</div>'
      +'<div class="wb-questions">'+g.items.map(q=>question(q,isPractice)).join('')+'</div></section>';
  function render(mode, node){
    if(node&&node.minutes) minutes=node.minutes;
    if(mode==='practice'){
      return '<div class="wb" data-wb-mode="practice"><div class="wb-intro"><p>'+T('wbIntroP')+'</p><small>'+T('wbTts')+'</small></div>'
        +data.practice.map(g=>group(g,true)).join('')+'</div>';
    }
    /* 模拟测练:没开始先看说明,点「开始答题」才出题并计时 */
    const vars={l:count('listening'),r:count('reading'),n:items.length,m:minutes};
    if(!state.examStart){
      return '<div class="wb wb-exam-gate" data-wb-mode="exam"><section class="card">'
        +'<p class="wb-exam-intro">'+esc(TF('wbExamIntro',vars))+'</p>'
        +'<p class="wb-exam-rules">'+esc(TF('wbExamRules',vars))+'</p>'
        +'<small>'+T('wbTts')+'</small>'
        +'<div class="tools"><button class="abtn orange" data-wb-start>'+T('wbExamStart')+'</button></div></section></div>';
    }
    return '<div class="wb" data-wb-mode="exam">'
      +'<div class="wb-timer" data-wb-timer role="timer" aria-live="off"><b class="wb-timer-left"></b><span class="wb-timer-note">'+esc(T('wbNoLeave'))+'</span></div>'
      +'<div class="wb-intro"><p>'+esc(TF('wbExamIntro',vars))+'</p><small>'+T('wbTts')+'</small></div>'
      +data.exam.map(g=>group(g,false)).join('')
      +'<div class="card wb-submit"><div class="wb-score" role="status"></div><p class="wb-progress"></p>'
      +'<button class="abtn" data-wb-submit disabled>'+T('wbSubmit')+'</button><button class="abtn ghost" data-wb-retry hidden>'+T('wbRedo')+'</button></div></div>';
  }
  const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
  function remaining(){ return state.examStart ? state.examStart+minutes*60000-Date.now() : 0; }
  function tick(){
    const bar=document.querySelector('[data-wb-timer]'); if(!bar)return;
    bar.hidden=state.submitted;
    if(state.submitted)return;
    const left=remaining();
    bar.querySelector('.wb-timer-left').textContent=TF('wbTimeLeft',{t:fmt(left)});
    bar.classList.toggle('wb-timer-low',left<60000);
    if(left<=0) submit(true);
  }
  function submit(timeout){
    if(state.submitted)return;
    state.submitted=true; state.examEnd=Date.now();
    state.rounds.push({at:new Date().toISOString(),answers:{...state.exam},score:score(),timeout:!!timeout});
    save();paint();
    EV('exam_done',LID+'.workbook',{score:score(),total:items.length,attempt:state.rounds.length,timeout:!!timeout,seconds:Math.round((state.examEnd-state.examStart)/1000)});
    if(timeout) toast(T('wbTimeUp'));
  }
  function paint(){
    document.querySelectorAll('[data-wb-id]').forEach(el=>{
      const q=find(el.dataset.wbId), p=el.dataset.wbPractice==='true';
      const result=state.practice[q.id], pick=p?result?.value:state.exam[q.id];
      const reveal=p?!!result?.checked:state.submitted;
      const correct=p?result?.good:pick===q.answer;
      const input=el.querySelector('input');if(input&&document.activeElement!==input)input.value=pick||'';
      const tones=el.querySelector('[data-wb-tones]');
      if(tones){
        const wait=!!(result&&result.stage==='tone'&&!result.checked);
        tones.hidden=!wait;
        if(wait) tones.innerHTML='<span class="wb-tones-label">'+esc(T('wbPickTone'))+'</span>'+toneButtons(q,result.value);
      }
      const line=el.querySelector('[data-wb-blank]');
      if(line){ const part=result&&result.checked?(result.final||result.value):''; line.textContent=part?line.dataset.wbBlank.replace('＿',part):line.dataset.wbBlank; line.classList.toggle('wb-filled',!!part); }
      el.querySelectorAll('[data-wb-value]').forEach(b=>{
        const selected=b.dataset.wbValue===pick;
        b.setAttribute('aria-pressed',String(selected));
        b.classList.toggle('selected',selected);
        b.classList.toggle('ok',reveal&&selected&&correct);
        b.classList.toggle('no',reveal&&selected&&!correct);
        b.disabled=!p&&state.submitted;
      });
      const feedback=el.querySelector('.wb-feedback');
      feedback.hidden=!reveal;
      feedback.classList.toggle('wb-good',!!correct);
      /* 答错只提示再试,不给答案;答对才带说明 */
      feedback.textContent=reveal?(q.type==='read'?T('wbReadLogged')+' '+q.note:correct?T('wbOk')+' '+q.note:T('wbNo')):'';
      const retry=el.querySelector('[data-wb-reset]');if(retry)retry.hidden=!reveal||correct;
      const read=el.querySelector('[data-wb-read]');if(read)read.textContent=T(result?.checked?'wbReadDone':'wbRead');
    });
    document.querySelectorAll('.wb-progress').forEach(el=>el.textContent=TF('wbProgress',{n:answered(),t:items.length})+(answered()<items.length&&!state.submitted?' · '+T('wbNeedAll'):''));
    document.querySelectorAll('[data-wb-submit]').forEach(el=>{el.disabled=answered()!==items.length;el.hidden=state.submitted;});
    document.querySelectorAll('[data-wb-retry]').forEach(el=>el.hidden=!state.submitted);
    document.querySelectorAll('.wb-score').forEach(el=>{
      el.hidden=!state.submitted;
      el.textContent=state.submitted?TF('wbScore',{s:score(),l:score('listening'),r:score('reading')})+(state.rounds.length&&state.rounds[state.rounds.length-1].timeout?' · '+T('wbTimeUp'):''):'';
    });
    tick();
  }
  function practiceAnswer(q,value){
    value=q.type==='read'?value:normalize(value);
    const good=q.type==='read'||value===normalize(q.answer);
    const previous=state.practice[q.id];
    state.practice[q.id]={value,checked:true,good};
    EV('drill_answer',LID+'.'+q.id,{mode:'workbook',good,attempt:previous?.checked?'retry':'first'});
    save();paint();
  }
  function start(root){
    state.examStart=Date.now(); state.examEnd=null; state.submitted=false; state.exam={};
    save(); EV('exam_answer',LID+'.workbook',{mode:'exam-start',attempt:state.rounds.length+1,minutes});
    const wrap=document.createElement('div'); wrap.innerHTML=render('exam');
    root.replaceWith(wrap.firstElementChild); mount();
  }
  function mount(){
    clearInterval(tickId); tickId=null;
    if(document.querySelector('[data-wb-timer]')) tickId=setInterval(tick,1000);
    document.querySelectorAll('.wb').forEach(root=>{
      if(root.dataset.bound)return;root.dataset.bound='true';
      root.addEventListener('input',e=>{
        if(e.target.matches('input')){const id=e.target.closest('[data-wb-id]').dataset.wbId;state.practice[id]={value:e.target.value,checked:false};save();}
      });
      root.addEventListener('click',e=>{
        const b=e.target.closest('button'); if(!b)return;
        if(b.hasAttribute('data-wb-start')){start(root);return;}
        const el=b.closest('[data-wb-id]'),q=el?find(el.dataset.wbId):null;
        if(b.hasAttribute('data-wb-play')) {b.hasAttribute('aria-busy')?stop():play(q.id);return;}
        if(b.hasAttribute('data-wb-value')){
          if(el.dataset.wbPractice==='true')practiceAnswer(q,b.dataset.wbValue);
          else if(!state.submitted){state.exam[q.id]=b.dataset.wbValue;save();paint();EV('exam_answer',LID+'.workbook.'+q.id,{pick:b.dataset.wbValue,mode:'workbook',attempt:state.rounds.length+1});}
        }
        if(b.hasAttribute('data-wb-check')){
          const raw=el.querySelector('input').value, v=normalize(raw);
          if(q.tone==='pick'&&v&&!HAS_TONE.test(v)){ state.practice[q.id]={value:v,checked:false,stage:'tone'};save();paint();return; }
          practiceAnswer(q,raw);
        }
        if(b.hasAttribute('data-wb-tone')){
          const st=state.practice[q.id]; if(!st||st.stage!=='tone')return;
          const marked=toneMark(st.value+b.dataset.wbTone), good=marked===normalize(q.answer);
          state.practice[q.id]={value:marked,final:marked,checked:true,good};
          EV('drill_answer',LID+'.'+q.id,{mode:'workbook',good,attempt:'first',tone:+b.dataset.wbTone});
          save();paint();
        }
        if(b.hasAttribute('data-wb-read'))practiceAnswer(q,'read');
        if(b.hasAttribute('data-wb-reset')){delete state.practice[q.id];save();paint();EV('drill_retry',LID+'.'+q.id,{mode:'workbook'});}
        if(b.hasAttribute('data-wb-submit')&&answered()===items.length&&!state.submitted) submit(false);
        if(b.hasAttribute('data-wb-retry')){
          const wrong=items.filter(q=>state.exam[q.id]!==q.answer);
          (wrong.length?wrong:items).forEach(q=>delete state.exam[q.id]);
          state.submitted=false; state.examStart=Date.now(); state.examEnd=null;   /* 重做重新计时 */
          save();paint();EV('exam_retry',LID+'.workbook',{mode:'workbook',attempt:state.rounds.length+1});
        }
      });
    });
    paint();
  }
  PP.onAfterRender(()=>{stop();mount();});
  window.addEventListener('pagehide',stop);
  /* 考试进行中关页面或刷新,浏览器会弹确认;计时照走(开始时间已存本地) */
  window.addEventListener('beforeunload',e=>{ if(state.examStart&&!state.submitted){ e.preventDefault(); e.returnValue=''; } });
  return {render,mount};
})();
PP.block({kind:'workbook',key:()=>'',icon:node=>node.mode==='practice'?'读':'练',
  sub:()=>'',needs:[],render:(_,node)=>WB.render(node.mode,node),mount:()=>WB.mount()});
