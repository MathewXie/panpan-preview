/* ═══ 按 plan 装配站序(第二步)═══
   取代原来硬编码的 engine/sections.js。课程 JSON 的 plan 数组说「这一课有哪几站、
   每站用哪个片段、带什么参数」,这里逐条取出片段、生成 core 认得的 SECTIONS。

   一级与二级结构不同的问题由此解决 —— 不是让一个模板吃两种数据,
   而是两种 plan 挑不同片段(施工说明第四节)。

   必须在全部 blocks/*.js 之后、engine/boot.js 之前执行:片段要先报到,
   boot 里 EV('lesson_open') 又要读 SECTIONS.length。 */
const SECTIONS = (L.plan || []).map((node, i) => {
  const b = PP.blocks[node.kind];
  if(!b){
    console.error('plan 第 ' + (i+1) + ' 项的 kind「' + node.kind + '」没有对应片段');
    return { key:'', name:node.kind, icon:'?', sub:'缺片段', render:()=>
      '<div class="card"><h3>缺片段:' + node.kind + '</h3></div>', after:null };
  }
  const pick = (v, ...a) => (typeof v === 'function' ? v(...a) : v);
  /* node.key 指定四语站名键(一级 v5 预览);node.name 是只有中文的兜底,尽量别用 */
  const key  = node.key || (node.name ? '' : (pick(b.key, node) || ''));
  return {
    key,
    /* core 的 stopName 优先用 key 查 SEC 的四语名,name 只是没 key 时的兜底 */
    name:   node.name || (SEC[key] && SEC[key].zh) || node.kind,
    icon:   pick(b.icon, node),
    sub:    pick(b.sub, L, node) || '',
    render: () => b.render(L, node),
    after:  b.mount ? () => b.mount(L, node) : null
  };
});

/* 装配器认得但本课 plan 没用到的片段,构建时本可以不打包。
   分离式构建按 plan 只引用用到的片段;bundle 模式同理只内联用到的。 */
