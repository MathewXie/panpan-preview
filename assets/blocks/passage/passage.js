/* passage(朗读故事 / 课文四)板块脚本。
   渲染逻辑原在 engine/sections.js 的 s7 站里内联,第二步随片段接口搬到这里,逐字未改。 */

PP.block({
  kind: 'passage',
  key:  () => 's7',
  icon: () => '读',
  sub:  () => '不带新词,全是学过的',
  needs: [],
  render: (L) =>
    '<div class="card">' + artHTML('text4', {ratio:'16/9'}) + '<p class="p4">'+kk(L.text4.zh)+'</p>'
    + '<p class="trline blk">'+L.text4.en+'</p>'
    + '<div class="tools"><button class="abtn" onclick="speak(L.text4.zh)">▶ 朗读全文</button></div>'
    + '<div style="margin-top:14px">' + L.text4.questions.map(q=>
      '<div class="qa-row"><span class="q">'+kk(q.q)+'</span>'
      + '<button class="mini" onclick="this.nextElementSibling.classList.add(\'show\');this.remove()">看答案</button>'
      + '<span class="a">'+kk(q.a)+'</span></div>').join('') + '</div></div>'
});
