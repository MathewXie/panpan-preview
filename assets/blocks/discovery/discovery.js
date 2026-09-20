/* discovery(盼盼的发现)板块脚本。
   渲染逻辑原在 engine/sections.js 的 s10 站里内联,第二步随片段接口搬到这里,逐字未改。 */

PP.block({
  kind: 'discovery',
  key:  () => 's10',
  icon: () => '🐼',
  sub:  (L) => '字词 · ' + L.discovery.word,
  needs: [],
  render: (L) =>
    '<div class="card"><div class="disc">'
    + '<div style="flex:0 0 auto;width:150px">' + artHTML('culture', {ratio:'1/1'}) + '</div>'
    + '<div style="flex:1;min-width:200px"><div class="bigword" style="margin-bottom:10px">'+kk(L.discovery.word)+'</div>'
    + '<p class="trline blk">🐼 '+L.discovery.en+'</p>'
    + '<p class="tr-hint">🐼 英文说明在顶栏「译」里。</p></div></div></div>'
});
