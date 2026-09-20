/* flashcard 板块脚本(2026-09-15)
   翻卡 = 记忆翻牌,沿用原来的模式(用户 2026-09-15 拍板):一对牌,一张「拼音 + 译文」,一张「中文」。
   第一关连连看:牌全摊开,把中文和它的拼音译文点成对;第二关全部扣成白板,凭记忆翻牌配对。
   按课文分局(用户同日拍板):每篇课文后面紧跟一站翻卡,只摆那一篇的生词(第一课 6 / 8 / 5 词),
   一局不超过 8 对,孩子的短时记忆装得下。plan 节点用 idx 指第几篇课文。
   玩法、计时、两关结算全部复用 blocks/memory/memory.js(memBuild / memStart / memTap),
   这里只负责把牌桌放进站内卡片里(不走 #full 全屏)。
   译文来自课程 JSON 的 vocab(第一课预览为拟稿,EN_DRAFT 时教师层提示),缺的牌面标「英文待补」。 */
function fcWords(idx){
  const t = (L.texts || [])[idx];
  return t ? [...new Set((t.words || []).map(w => typeof w === 'string' ? w : w[0]))] : [];
}
/* 分拨(2026-09-19,用户拍板):plan 节点带 decks 时一站里按拨摆几张牌桌(一到十自成一拨,其余生词三局摊平);
   没有 decks 的旧节点仍是整篇生词一拨。第一拨的牌桌 id 仍是 memFC<idx>,后面的拨加 _<n>。 */
function fcDecks(node){
  return (node.decks && node.decks.length) ? node.decks : [fcWords(node.idx)];
}
function fcDeckId(node, di){ return 'memFC' + node.idx + (di ? '_' + di : ''); }
const FC_NUMBERS = '一二三四五六七八九十';
function fcDeckTitle(node, di, words){
  const isNum = words.length && words.every(w => FC_NUMBERS.indexOf(w) >= 0);
  return TF('fcDeck', {n: di + 1}) + ' · ' + (isNum ? T('fcDeckNumbers') : T('fcDeckWords')) + ' · ' + TF('fcPairs', {n: words.length});
}
/* 说明文字里的课文名跟界面语言走:故事一 / Story 1 / Cerita 1 / រឿងទី ១ */
function fcName(idx){
  return (typeof secLabel === 'function' && SEC['text' + (idx + 1)]) ? secLabel('text' + (idx + 1)) : ('课文' + (idx + 1));
}

PP.block({
  kind: 'flashcard',
  key:  () => 'flash',
  icon: () => '卡',
  sub:  (L, node) => '课文' + '一二三'[node.idx] + '的生词 ' + fcDecks(node).reduce((a, d) => a + d.length, 0) + ' 个 · '
        + (fcDecks(node).length > 1 ? fcDecks(node).length + ' 拨 · ' : '') + '两关翻牌',
  needs: [],
  render: (L, node) => {
    const decks = fcDecks(node), total = decks.reduce((a, d) => a + d.length, 0);
    return '<div class="card"><h3 data-t="secGame"></h3>'
    + '<div class="msub"><span class="mtip">' + TF('fcIntro', {name: fcName(node.idx), n: total})
    + T('fcL1') + T('fcL2')
    + (typeof EN_DRAFT !== 'undefined' && EN_DRAFT ? '<b class="t-only" style="color:var(--accent-deep)"> ⚠ 译文为拟稿,待核定。</b>' : '')
    + '</span></div>'
    + decks.map((words, di) => {
        const id = fcDeckId(node, di);
        return (decks.length > 1 ? '<h4 class="fc-deck">' + fcDeckTitle(node, di, words) + '</h4>' : '')
        + '<div class="memory" id="' + id + '" data-ch="78" data-cols="4"></div>'
        + '<div class="mbar">'
        + '<span class="mlevel idle" id="' + id + '_lv">' + T('memPick') + '</span>'
        + '<span class="mtime" id="' + id + '_t"></span>'
        + '<span style="flex:1"></span>'
        + '<span class="mgo" id="' + id + '_go">'
        +   '<button class="abtn" onclick="memStart(\'' + id + '\',1)">' + T('fcBtn1') + '</button>'
        +   '<button class="abtn orange" onclick="memStart(\'' + id + '\',2)">' + T('fcBtn2') + '</button>'
        + '</span></div>';
      }).join('')
    + '</div>';
  },
  /* 切站会重建 DOM:先停掉上一局的计时器,再重新摆牌 */
  mount: (L, node) => {
    const decks = fcDecks(node);
    decks.forEach((words, di) => {
      const id = fcDeckId(node, di);
      const old = MEM[id]; if(old) clearInterval(old.tid);
      memBuild(id, words, {split: true});
    });
    EV('memory_open', LID + '.flash.text' + (node.idx + 1),
       {words: decks.reduce((a, d) => a + d.length, 0), decks: decks.length, mode: 'flashcard', text: node.idx + 1});
  }
});
