/* goals 板块脚本。
   渲染逻辑原在 engine/sections.js 的 s0 站里内联,第二步随片段接口搬到这里,逐字未改。 */

PP.block({
  kind: 'goals',
  key:  () => 's0',
  icon: () => '✈',
  sub:  () => '学习目标与本课语法',
  needs: [],
  render: (L) =>
    '<div class="card">' + artHTML('cover', {ratio:'16/8.4'})
    + (L.time
        ? '<h3>登机信息</h3><div class="brief">'
          + '<div class="cell"><b>出发 → 到达</b><span>' + kk('家') + ' ✈ ' + kk('外国') + '</span></div>'
          + '<div class="cell"><b>时间</b><span>' + L.time + '</span></div></div>'
        : '')
    + '</div>'
    + '<div class="card"><h3>我能做</h3>'
    + L.goals.map(g=>'<div class="goal-line"><span class="st">✻</span><span class="zh">'+g.zh+'</span>'
        + '<span class="trline">'+g.en+'</span></div>').join('')
    + '</div>'
    /* 本课语法:二级是一段现成的文字,一级是 grammar[] 数组,取每条的 zh 拼一行 */
    + (L.grammar
        ? '<div class="card"><h3>本课语法</h3><div class="gram-strip">'
          + (typeof L.grammar === 'string' ? L.grammar
             : L.grammar.map(g=>g.zh || g.pattern || '').filter(Boolean).join(' · '))
          + '</div>'
          + (L.zhuyin ? '<div class="tbox t-only"><b>注音提示 · </b>'+L.zhuyin+'</div>' : '')
          + '</div>'
        : '')
});
