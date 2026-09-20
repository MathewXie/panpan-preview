/* classroom 板块脚本
   从 REFERENCE-v47.html 原样切出,第一步只搬家、逐字不改。 */
/* ── 盼盼课堂的用法说明 ──
   正本的「对照」字段只有中文;例句有中英对照,说明没有。
   下表为拟稿,待核改后回填正本。键用 tag,不用中文原文——原文标点一改键就失效。 */
const NOTE_TR = {
  '二级-要快要…了': {
    en:'Use this when something is about to happen. The sentence ends with 了.',
    id:'Dipakai untuk hal yang segera terjadi. Kalimat diakhiri dengan 了.',
    km:'ប្រើពេលអ្វីមួយជិតកើតឡើង។ ប្រយោគបញ្ចប់ដោយ 了។'},
  '二级-动态助词-过·经历': {
    en:'The negative is 没……过, never 不……过.',
    id:'Bentuk negatifnya 没……过, bukan 不……过.',
    km:'ទម្រង់អវិជ្ជមានគឺ 没……过 មិនមែន 不……过 ទេ។'},
  '二级-动量词-次': {
    en:'次 counts how many times an action happens. It often goes with 过.',
    id:'次 menghitung berapa kali suatu tindakan terjadi, sering bersama 过.',
    km:'次 រាប់ចំនួនដងនៃសកម្មភាព ហើយច្រើនប្រើជាមួយ 过។'}
};
function noteText(g){
  if(LANG === 'zh') return g.note;
  const t = NOTE_TR[g.tag];
  return (t && t[LANG]) || g.note;
}

/* 外语讲解里夹的中文(如 "ask 你叫什么名字")也要有拼音:把每一段连续汉字包成 kk(2026-09-15) */
function kkRuns(text){
  return String(text || '').replace(/[\u4e00-\u9fff]+/g, run => kk(run));
}

/* ═══ 片段注册(第二步)═══ 原 engine/sections.js 的 s6 站。 */
PP.block({
  kind: 'classroom',
  key:  () => 's6',
  icon: () => '★',
  sub:  (L) => L.classroom.length + ' 个说法 · 例句大声朗读',
  needs: [],
  /* 一级 v5:课程 JSON 的 classroom[].tr {en,id,km} 带结构说明、规则、注意与例句译文(2026-09-15)。
     选了外语:规则与注意直接出该语言(母语提示,不叠中文);结构行保留中文原式,下面加一行译文;
     例句保持中文,译文行常显(不受「译」开关)。选中文时与从前一样。 */
  render: (L) => L.classroom.map((g,i)=>{
    const tr = (LANG !== 'zh' && g.tr && g.tr[LANG]) || null;
    return '<div class="card"><h3><span class="mod-no">'+CN_NUM[i]+'</span>'+kk(g.pattern)+'</h3>'
    + (g.structure ? '<div class="grammar-structure">'+kk(g.structure)
        + (tr && tr.structure ? '<div class="grammar-structure-tr">'+kkRuns(tr.structure)+'</div>' : '') + '</div>' : '')
    + g.examples.map((e,j)=>'<div class="gram-ex"><button class="mini" onclick="speak(\''+e.zh+'\')">🔊</button>'
      + '<span class="zh">'+kk(e.zh)+'</span><span class="trline' + (tr ? ' tr-lang' : '') + '">'
      + ((tr && tr.examples && tr.examples[j]) || e.en) + '</span></div>').join('')
    + '<div class="drow side-hero note-row" aria-label="' + T('howToUse') + '">'
    +   '<span class="who"><span class="avatar" data-avatar="panpan" style="background:' + WHO['盼盼'] + '"'
    +   ' title="盼盼"><img alt=""><span>盼</span></span><b class="who-name">盼盼</b></span>'
    +   '<span class="bubble note-bubble">' + (tr && tr.note ? kkRuns(tr.note) : kk(noteText(g))) + '</span>'
    + '</div>'
    + (g.caution ? '<p class="grammar-caution"><b>' + T('caution') + '</b>' + (tr && tr.caution ? kkRuns(tr.caution) : kk(g.caution)) + '</p>' : '')
    + '</div>'; }).join('')
});
