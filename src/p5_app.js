
/* =====================================================================
   The canvas: state, drawing, input, execution, pages
   ===================================================================== */
const KEY='ayan-canvas-v1';
const S={nodes:{trigger:{x:0,y:0}},edges:[],view:{x:0,y:0,k:1},done:new Set(),seen:new Set(),
  params:{about:{tone:'friendly'},projects:{type:'All'}},stickies:{start:{x:-84,y:176}},
  busy:false,tour:[],cur:null,json:false,celebrated:false};
const els={},stEls={},EST={};
let selEdge=null,pkSrc='trigger',pkPos=null,inited=false,kb=false,tgt=null,pageAt=0;
const land=$('#land'),app=$('#app'),boot=$('#boot'),mainEl=$('#main'),stage=$('#stage'),world=$('#world'),glowEl=$('.glow',stage),
  gEdges=$('#edges'),gFx=$('#fx'),ghost=$('#ghost'),nodesEl=$('#nodes'),stickiesEl=$('#stickies'),
  pickerEl=$('#picker'),pageEl=$('#page'),modalEl=$('#modal'),toastEl=$('#toast'),execBtn=$('#exec'),runstat=$('#runstat');
mainEl.appendChild(toastEl);
const isMob=()=>stage.clientWidth<760;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const pickerOpen=()=>!pickerEl.hidden;

/* ---------- geometry and graph ---------- */
const dim=id=>id==='agent'?{w:214,h:92}:{w:92,h:92};
const fp=id=>id==='agent'?{w:214,h:226}:{w:92,h:170};
const outPt=id=>{const n=S.nodes[id];return{x:n.x+dim(id).w+8,y:n.y+46}};
const inPt=id=>{const n=S.nodes[id];return{x:n.x-9,y:n.y+46}};
const kids=id=>S.edges.filter(e=>e[0]===id).map(e=>e[1]).sort((a,b)=>S.nodes[a].y-S.nodes[b].y||S.nodes[a].x-S.nodes[b].x);
const parents=id=>S.edges.filter(e=>e[1]===id).map(e=>e[0]);
const hasEdge=(a,b)=>S.edges.some(e=>e[0]===a&&e[1]===b);
function reach(from){const seen=new Set([from]),q=[from];while(q.length){const c=q.pop();for(const k of kids(c))if(!seen.has(k)){seen.add(k);q.push(k)}}return seen}
const canLink=(a,b)=>a!==b&&b!=='trigger'&&!!S.nodes[a]&&!!S.nodes[b]&&!hasEdge(a,b)&&!reach(b).has(a);
function order(){const out=[],seen=new Set(['trigger']);(function go(id){for(const k of kids(id)){if(seen.has(k))continue;seen.add(k);out.push({id:k,from:id});go(k)}})('trigger');return out}
function lastLeaf(){const o=order();return o.length?o[o.length-1].id:'trigger'}
function pathTo(id){const prev={trigger:null},q=['trigger'];while(q.length){const c=q.shift();if(c===id)break;for(const k of kids(c))if(!(k in prev)){prev[k]=c;q.push(k)}}
  if(!(id in prev))return null;const p=[];for(let c=id;c;c=prev[c])p.unshift(c);return p}
const itemsOf=id=>id==='projects'?T.projects.data(S.params.projects||{}).length:T[id].items;

/* ---------- nodes, wires, notes ---------- */
function nodeHTML(id){const t=T[id],trig=id==='trigger',nm=esc(t.name);
  return `<div class="n-tools">${trig?`<button data-act="exec" title="Execute workflow" aria-label="Execute workflow">${ICO.play}</button>`
      :`<button data-act="open" title="Run and open" aria-label="Run and open ${nm}">${ICO.play}</button><button data-act="del" title="Delete" aria-label="Delete ${nm}">${ICO.trash}</button>`}</div>`+
    `<div class="nbox">${trig?`<span class="n-bolt">${ICO.bolt}</span>`:'<span class="n-in"></span>'}${ico(id)}${id==='agent'?`<span class="a-txt"><b>${t.name}</b><small>${t.sub}</small></span>`:''}<span class="n-chk">✓</span><span class="n-out" data-port title="Drag to another node to connect"></span></div>`+
    `<span class="n-stub"></span><button class="n-plus" data-act="add" title="Add a node after this one" aria-label="Add a node after ${nm}">+</button>`+
    (id==='agent'?AGENT_SUBS:`<div class="nlabel"><b>${t.name}</b><small>${t.sub}</small></div>`)}
function place(id){const n=S.nodes[id],el=els[id];if(!n||!el)return;el.style.left=n.x+'px';el.style.top=n.y+'px'}
function mk(id,pop){const t=T[id],el=document.createElement('div');
  el.className='node t-'+id+(pop?' is-new':'')+(S.done.has(id)?' is-done':'');el.dataset.id=id;el.tabIndex=0;
  el.setAttribute('role','group');el.setAttribute('aria-label',id==='trigger'?'Trigger. Press Enter to execute the workflow.':`${t.name} node. Press Enter to run and open it.`);
  el.style.setProperty('--c',`var(--${t.color})`);el.innerHTML=nodeHTML(id);nodesEl.appendChild(el);els[id]=el;place(id);
  if(pop)setTimeout(()=>el.classList.remove('is-new'),520);return el}
function draw(){let h='';
  for(const [a,b] of S.edges){if(!S.nodes[a]||!S.nodes[b])continue;const k=a+'>'+b,p=outPt(a),q=inPt(b),d=curve(p,q),m=bez(p,q,.5),n=itemsOf(a);
    h+=`<g class="edge ${EST[k]||''}${selEdge===k?' is-sel':''}" data-k="${k}"><path class="e-hit" d="${d}"/><path class="e-line" d="${d}"/>`+
       `<text class="e-lbl" x="${m.x.toFixed(1)}" y="${(m.y-9).toFixed(1)}">${n} item${n===1?'':'s'}</text>`+
       `<g class="e-del" transform="translate(${(m.x-11).toFixed(1)} ${(m.y+5).toFixed(1)})"><rect width="22" height="22" rx="7"/><path d="M7 7l8 8M15 7l-8 8"/></g></g>`}
  gEdges.innerHTML=h;
  for(const id in els)els[id].classList.toggle('has-out',S.edges.some(e=>e[0]===id))}
const STICKY={start:`<button class="st-x" aria-label="Dismiss this note">✕</button><b>Start here</b><ol><li>Press <span class="k">+</span> next to the trigger</li><li>Pick what you want to know</li><li>Press <span class="k">Execute workflow</span></li></ol><button class="st-btn" data-tpl="tour">No time? Build it for me</button>`};
function mkSticky(id){const s=S.stickies[id];if(!s||!STICKY[id])return;const el=document.createElement('div');el.className='sticky';el.dataset.st=id;el.innerHTML=STICKY[id];
  el.style.left=s.x+'px';el.style.top=s.y+'px';stickiesEl.appendChild(el);stEls[id]=el}
function dropSticky(id){if(stEls[id]){stEls[id].remove();delete stEls[id]}delete S.stickies[id];save()}
function rebuild(){nodesEl.innerHTML='';stickiesEl.innerHTML='';for(const k in els)delete els[k];for(const k in stEls)delete stEls[k];for(const k in EST)delete EST[k];
  selEdge=null;for(const id in S.nodes)mk(id,false);for(const id in S.stickies)mkSticky(id);
  for(const [a,b] of S.edges)if(S.done.has(a)&&S.done.has(b))EST[a+'>'+b]='is-done';
  draw();updateProg();updatePicker()}

/* ---------- view ---------- */
function apply(anim){const v=S.view,g=22*v.k*(v.k<.55?2:1);
  world.classList.toggle('anim',!!anim);stage.classList.toggle('anim',!!anim);
  world.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.k})`;
  stage.style.setProperty('--gs',g+'px');stage.style.setProperty('--gx',v.x+'px');stage.style.setProperty('--gy',v.y+'px')}
const toWorld=(cx,cy)=>{const r=stage.getBoundingClientRect();return{x:(cx-r.left-S.view.x)/S.view.k,y:(cy-r.top-S.view.y)/S.view.k}};
function zoomAt(cx,cy,k,anim){const r=stage.getBoundingClientRect(),v=S.view,px=cx-r.left,py=cy-r.top;k=clamp(k,.3,1.6);
  v.x=px-(px-v.x)*(k/v.k);v.y=py-(py-v.y)*(k/v.k);v.k=k;apply(anim)}
function bounds(nodes=S.nodes,withNotes=true){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const id in nodes){const n=nodes[id],f=fp(id);x0=Math.min(x0,n.x-40);y0=Math.min(y0,n.y-10);x1=Math.max(x1,n.x+f.w+(id==='agent'?40:84));y1=Math.max(y1,n.y+f.h)}
  if(withNotes)for(const id in S.stickies){const s=S.stickies[id],hh=stEls[id]?stEls[id].offsetHeight:230;x0=Math.min(x0,s.x);y0=Math.min(y0,s.y);x1=Math.max(x1,s.x+256);y1=Math.max(y1,s.y+hh)}
  return{x:x0,y:y0,w:x1-x0,h:y1-y0}}
function fit(anim,b){b=b||bounds();const r=stage.getBoundingClientRect(),mob=r.width<760,side=!mob&&pickerOpen()?400:0;
  const pl=mob?26:70,pr=(mob?26:80)+side,pt=mob?58:64,pb=mob?112:128;
  const aw=Math.max(140,r.width-pl-pr),ah=Math.max(140,r.height-pt-pb),k=clamp(Math.min(aw/b.w,ah/b.h),mob?.6:.35,1);
  S.view.k=k;
  S.view.x=b.w*k>aw?pl-b.x*k:pl+(aw-b.w*k)/2-b.x*k;
  S.view.y=b.h*k>ah?pt-b.y*k:pt+(ah-b.h*k)/2-b.y*k;apply(anim)}
function homeView(anim){const r=stage.getBoundingClientRect(),mob=r.width<760,t=S.nodes.trigger;S.view.k=1;
  S.view.x=(mob?Math.max(104,r.width*.28):r.width*.3)-t.x;S.view.y=(mob?70:Math.max(96,r.height*.2))-t.y;apply(anim)}
function ensureVisible(id,anim=true){const n=S.nodes[id];if(!n)return;const r=stage.getBoundingClientRect(),v=S.view,f=fp(id),mob=r.width<760;
  const L=mob?30:64,R=r.width-(!mob&&pickerOpen()?420:0)-(mob?34:96),Tp=62,B=r.height-(mob?124:136);
  const x0=(n.x-(id==='trigger'?26:0))*v.k+v.x,x1=(n.x+f.w)*v.k+v.x,y0=n.y*v.k+v.y,y1=(n.y+f.h)*v.k+v.y;let dx=0,dy=0;
  if(x1>R)dx=R-x1;else if(x0<L)dx=L-x0;
  if(y1>B)dy=B-y1;else if(y0<Tp)dy=Tp-y0;
  if(dx||dy){v.x+=dx;v.y+=dy;apply(anim)}}
function tween(ms,fn,done){if(RM){fn(1);if(done)done();return}const t0=performance.now();
  (function f(now){const t=clamp((now-t0)/ms,0,1);fn(ease(t));if(t<1)requestAnimationFrame(f);else if(done)done()})(t0)}
function flash(id){const el=els[id];if(!el)return;ensureVisible(id);el.classList.add('is-target');setTimeout(()=>el.classList.remove('is-target'),1000)}

/* ---------- editing ---------- */
const busyMsg=()=>toast('One moment, the workflow is still running.');
const snap=()=>JSON.stringify({nodes:S.nodes,edges:S.edges,done:[...S.done],stickies:S.stickies});
function restore(s){const d=JSON.parse(s);S.nodes=d.nodes;S.edges=d.edges;S.done=new Set(d.done);S.stickies=d.stickies;rebuild();save()}
function freeSpot(src,id){const p=S.nodes[src],x=p.x+dim(src).w+130,f=fp(id);
  const taken=y=>Object.keys(S.nodes).some(o=>{const n=S.nodes[o],g=fp(o);return x<n.x+g.w+60&&x+f.w+60>n.x&&y<n.y+g.h+16&&y+f.h+16>n.y});
  for(const dy of [0,190,-190,380,-380,570,-570,760,-760])if(!taken(p.y+dy))return{x,y:p.y+dy};
  return{x,y:p.y+950}}
function addNode(id,src,o={}){if(S.nodes[id]||!T[id]||id==='trigger')return false;if(S.busy){busyMsg();return false}
  if(!S.nodes[src])src='trigger';
  S.nodes[id]=o.pos||freeSpot(src,id);$$('.n-plus.pulse',nodesEl).forEach(b=>b.classList.remove('pulse'));
  mk(id,true);S.edges.push([src,id]);draw();save();updatePicker();return true}
function link(a,b){if(a===b||!S.nodes[a]||!S.nodes[b])return false;if(S.busy){busyMsg();return false}
  if(b==='trigger'){toast('The trigger starts the workflow, so nothing can connect into it.');return false}
  if(hasEdge(a,b)){toast('Those two are already connected.');return false}
  if(reach(b).has(a)){toast('That would make a loop. This workflow only runs forward.');return false}
  S.edges.push([a,b]);draw();save();nudgeExec();return true}
function unlink(k){if(S.busy)return busyMsg();const [a,b]=k.split('>');S.edges=S.edges.filter(e=>!(e[0]===a&&e[1]===b));delete EST[k];if(selEdge===k)selEdge=null;draw();save()}
function removeNode(id){if(id==='trigger'||!S.nodes[id])return;if(S.busy)return busyMsg();
  const undo=snap(),ps=parents(id),ks=kids(id);
  S.edges=S.edges.filter(e=>e[0]!==id&&e[1]!==id);delete S.nodes[id];S.done.delete(id);
  if(ps.length===1)for(const k of ks)if(canLink(ps[0],k))S.edges.push([ps[0],k]);
  rebuild();save();toast(`${esc(T[id].name)} removed.`,{label:'Undo',fn(){restore(undo)}})}
function resetCanvas(){if(S.busy)return busyMsg();closePicker();const undo=snap(),t=S.nodes.trigger;
  S.nodes={trigger:t};S.edges=[];S.done.clear();S.tour=[];S.stickies={start:{x:t.x-84,y:t.y+176}};stat('');
  rebuild();save();homeView(true);pulsePlus();
  toast('Canvas cleared. Your explored count is kept.',{label:'Undo',fn(){restore(undo);fit(true)}})}
function pulsePlus(){const b=els.trigger&&$('.n-plus',els.trigger);if(b)b.classList.add('pulse')}
function nudgeExec(){execBtn.classList.remove('pulse','shake');void execBtn.offsetWidth;execBtn.classList.add('pulse')}
function introNote(){const t=S.nodes.trigger;if(!S.stickies.start){S.stickies.start={x:t.x-84,y:t.y+176};mkSticky('start');save()}
  const s=S.stickies.start,r=stage.getBoundingClientRect(),v=S.view;v.x=Math.max(24,(r.width-256*v.k)/2)-s.x*v.k;v.y=Math.max(70,r.height*.3)-s.y*v.k;apply(true);
  const el=stEls.start;el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}

/* ---------- layout and templates ---------- */
function layout(nodes=S.nodes,edges=S.edges){
  const ids=Object.keys(nodes),ch={};ids.forEach(i=>ch[i]=[]);
  const kid=id=>edges.filter(e=>e[0]===id).map(e=>e[1]).sort((a,b)=>nodes[a].y-nodes[b].y||nodes[a].x-nodes[b].x);
  const seen=new Set(['trigger']);(function go(id){for(const k of kid(id)){if(seen.has(k))continue;seen.add(k);ch[id].push(k);go(k)}})('trigger');
  const X={trigger:0};let changed=true,guard=0;
  while(changed&&guard++<40){changed=false;for(const [a,b] of edges){if(X[a]==null||!seen.has(b))continue;const x=X[a]+dim(a).w+130;if(X[b]==null||x>X[b]){X[b]=x;changed=true}}}
  const Y={};let cur=0;
  (function put(id){const c=ch[id];if(!c.length){Y[id]=cur;cur+=fp(id).h+20;return}c.forEach(put);Y[id]=(Y[c[0]]+Y[c[c.length-1]])/2;cur=Math.max(cur,Y[id]+fp(id).h+20)})('trigger');
  const ox=nodes.trigger.x,oy=nodes.trigger.y-Y.trigger,pos={};
  for(const id of seen)pos[id]={x:Math.round(ox+X[id]),y:Math.round(oy+Y[id])};
  let lx=ox,ly=Math.round(oy+cur+50);
  for(const id of ids)if(!seen.has(id)){pos[id]={x:lx,y:ly};lx+=fp(id).w+110}
  return pos}
function tidy(){if(S.busy)return busyMsg();const pos=layout(),from={};for(const id in S.nodes)from[id]={x:S.nodes[id].x,y:S.nodes[id].y};
  tween(340,t=>{for(const id in pos){const n=S.nodes[id];if(!n)continue;n.x=from[id].x+(pos[id].x-from[id].x)*t;n.y=from[id].y+(pos[id].y-from[id].y)*t;place(id)}draw()},()=>{save();fit(true)})}
const TPL={tour:[['about','projects','results','contact']],hire:[['services','projects','testimonials','values','call']],
  all:[['about','journey','values','now','surprise'],['projects','stack','services','results','testimonials','resume'],['agent','call','contact','socials']]};
async function build(key){const chains=TPL[key];if(!chains)return;if(S.busy)return busyMsg();closeMenus();closePicker();if(S.cur)closePage(true);
  const undo=snap(),t=S.nodes.trigger;
  S.nodes={trigger:t};S.edges=[];S.done.clear();S.tour=[];delete S.stickies.start;stat('');rebuild();
  const nodes={trigger:{x:t.x,y:t.y}},edges=[];
  chains.forEach((c,r)=>c.forEach((id,i)=>{nodes[id]={x:t.x+(i+1)*222,y:t.y+r*10};edges.push([i?c[i-1]:'trigger',id])}));
  const pos=layout(nodes,edges);fit(true,bounds(pos,false));
  S.busy=true;execBtn.disabled=true;await sleep(280);
  for(const c of chains){let prev='trigger';for(const id of c){S.nodes[id]=pos[id];mk(id,true);S.edges.push([prev,id]);draw();prev=id;await sleep(chains.length>1?60:130)}}
  S.busy=false;execBtn.disabled=false;save();updatePicker();
  toast('Built. Now press <b>Execute workflow</b>.',{label:'Undo',fn(){restore(undo);fit(true)}});nudgeExec()}

/* ---------- execution ---------- */
let statT;
function stat(txt,ok){clearTimeout(statT);runstat.hidden=!txt;runstat.textContent=txt||'';runstat.classList.toggle('ok',!!ok);if(ok)statT=setTimeout(()=>{runstat.hidden=true},6500)}
async function runNode(id,ms){const el=els[id];if(!el)return;el.classList.remove('is-done');el.classList.add('is-run');await sleep(ms);
  const e2=els[id];if(e2){e2.classList.remove('is-run');e2.classList.add('is-done')}S.done.add(id)}
function flow(a,b,ms){const k=a+'>'+b;EST[k]='is-flow';draw();
  return new Promise(res=>{let over=false;const NS='http://www.w3.org/2000/svg',dots=RM?[]:[0,1,2].map(i=>{const c=document.createElementNS(NS,'circle');c.setAttribute('class','pt');c.setAttribute('r',5.2-i*1.4);c.setAttribute('opacity',1-i*.3);gFx.appendChild(c);return c});
    const fin=()=>{if(over)return;over=true;dots.forEach(c=>c.remove());if(EST[k])EST[k]='is-done';draw();res()};
    if(RM){setTimeout(fin,20);return}
    setTimeout(fin,ms+500);const t0=performance.now();
    (function tick(now){if(over)return;const t=clamp((now-t0)/ms,0,1);if(!S.nodes[a]||!S.nodes[b])return fin();
      const p=outPt(a),q=inPt(b);dots.forEach((c,i)=>{const pt=bez(p,q,ease(clamp(t-i*.07,0,1)));c.setAttribute('cx',pt.x);c.setAttribute('cy',pt.y)});
      if(t<1)requestAnimationFrame(tick);else fin()})(t0)})}
async function execute(){if(S.busy)return;const ord=order();
  if(!ord.length){execBtn.classList.remove('shake','pulse');void execBtn.offsetWidth;execBtn.classList.add('shake');
    toast('Nothing is connected to the trigger yet. Pick a node first.');openPicker('trigger');return}
  closePicker();closeMenus();toastEl.hidden=true;execBtn.classList.remove('pulse');
  S.busy=true;execBtn.disabled=true;S.done.clear();for(const k in EST)delete EST[k];selEdge=null;
  for(const id in els)els[id].classList.remove('is-done','is-run');draw();
  const n=ord.length,ms=n<=3?600:n<=6?460:n<=10?340:260,t0=performance.now();
  stat(`Running… 0 of ${n} nodes`);ensureVisible('trigger');
  await runNode('trigger',ms*.55);let i=0;
  for(const s of ord){if(!S.nodes[s.id]||!S.nodes[s.from])continue;ensureVisible(s.id);await flow(s.from,s.id,ms);await runNode(s.id,ms*.7);stat(`Running… ${++i} of ${n} nodes`)}
  for(const [a,b] of S.edges)if(S.done.has(a)&&S.done.has(b))EST[a+'>'+b]='is-done';
  draw();stat(`Succeeded in ${((performance.now()-t0)/1000).toFixed(1)}s · ${n} node${n===1?'':'s'} ran`,true);
  S.tour=ord.map(s=>s.id).filter(id=>S.nodes[id]);if(S.stickies.start)dropSticky('start');save();
  await sleep(420);S.busy=false;execBtn.disabled=false;
  if(app.hidden||!S.tour.length)return;
  showPage(S.tour.find(id=>!S.seen.has(id))||S.tour[0])}
function markDone(id){const path=pathTo(id);if(!path)return;
  path.forEach((x,i)=>{S.done.add(x);if(els[x]){els[x].classList.remove('is-run');els[x].classList.add('is-done')}if(i)EST[path[i-1]+'>'+x]='is-done'});draw()}
async function openNode(id){if(S.busy||!S.nodes[id])return;if(id==='trigger')return execute();
  const path=pathTo(id);
  if(!path){flash(id);toast(`${esc(T[id].name)} isn’t connected to the trigger, so it can’t run yet.`,
      [{label:'Connect it',fn(){const a=lastLeaf();if(link(canLink(a,id)?a:'trigger',id))openNode(id)}},{label:'Remove',fn(){removeNode(id)}}]);return}
  if(!S.done.has(id)&&!RM){S.busy=true;execBtn.disabled=true;toastEl.hidden=true;
    for(let i=0;i<path.length;i++){const x=path[i];if(S.done.has(x)&&(!i||EST[path[i-1]+'>'+x]==='is-done'))continue;if(i)await flow(path[i-1],x,280);await runNode(x,200)}
    S.busy=false;execBtn.disabled=false;if(app.hidden||!S.nodes[id])return}
  markDone(id);S.tour=order().map(s=>s.id);save();showPage(id)}

/* ---------- node pages ---------- */
function updateProg(){$('#progTxt').textContent=S.seen.size+'/'+N;$('#progBar').style.strokeDashoffset=(69.1*(1-S.seen.size/N)).toFixed(2)}
function showPage(id){if(!T[id]||id==='trigger')return;S.cur=id;if(!S.tour.includes(id))S.tour=[id];S.seen.add(id);updateProg();save();
  closePicker();closeMenus();toastEl.hidden=true;const fresh=pageEl.hidden;pageEl.hidden=false;stage.inert=true;if(fresh)pageAt=performance.now();renderPage(true,fresh)}
function renderPage(run,fresh){const id=S.cur,t=T[id];if(!id||!t)return;
  const p=S.params[id]||(S.params[id]={}),tour=S.tour,i=tour.indexOf(id),prev=tour[i-1],next=tour[i+1],d=t.data(p),n=itemsOf(id),left=N-S.seen.size;
  const P=t.params?`<div class="pg-params"><span class="pp-h">Parameters</span>`+Object.entries(t.params).map(([k,o])=>`<div class="pp"><span>${o.label}</span>`+
    o.opts.map(v=>{const on=(p[k]||o.opts[0])===v;return `<button class="ppb${on?' on':''}" data-param="${k}" data-val="${esc(v)}" aria-pressed="${on}">${esc(v)}</button>`}).join('')+`</div>`).join('')+`</div>`:'';
  const body=S.json?head('Output · JSON',t.name,'The same content as data. This is what the node hands to the next one.')+P+`<pre class="json big">${hl(d)}</pre>`:t.page(d,p,P);
  const chips=tour.length>1&&tour.length<=7?`<div class="sh-tour">`+tour.map((x,j)=>`${j?'<i></i>':''}<button class="tc${x===id?' on':''}${S.seen.has(x)?' seen':''}" data-jump="${x}" style="--c:var(--${T[x].color})" title="${esc(T[x].name)}" aria-label="${esc(T[x].name)}"${x===id?' aria-current="true"':''}>${ico(x,'nico xs')}</button>`).join('')+`</div>`:'';
  const cnt=tour.length>1?`<span class="sh-cnt">${i+1} / ${tour.length}</span>`:'';
  const nav=`<nav class="pg-nav" aria-label="Workflow">`+(prev?`<button class="pn" data-jump="${prev}"><small>← Previous node</small><b>${T[prev].name}</b></button>`:'')+
    (next?`<button class="pn next" data-jump="${next}"><small>Next node →</small><b>${T[next].name}</b></button>`
      :`<div class="pn end"${prev?'':' style="grid-column:1/-1"'}><small>End of this workflow</small><b>${left?`${left} more node${left===1?'':'s'} to discover`:'You have seen every node'}</b><p>${left?'Go back to the canvas and connect another one.':'Thank you for reading all of it.'}</p><div class="end-a">${left?'<button class="btn sm" data-pg="add">Add another node</button>':''}${id==='contact'?'':'<button class="btn hot sm" data-pg="talk">Talk to Ayan</button>'}</div></div>`)+`</nav>`;
  pageEl.innerHTML=`<div class="sheet${fresh?'':' still'}" style="--c:var(--${t.color})"><header class="sh-h"><div class="sh-node"><span class="pk-ico">${ico(id,'nico sm')}</span><div><b>${t.name}</b><small>${t.sub} · ${n} item${n===1?'':'s'}</small></div></div>${chips}${cnt}`+
    `<div class="sh-act"><div class="seg" role="group" aria-label="View"><button data-view="page" aria-pressed="${!S.json}">Page</button><button data-view="json" aria-pressed="${S.json}">JSON</button></div>`+
    `<button class="ib" data-pg="prev" aria-label="Previous node"${prev?'':' disabled'}>${ICO.left}</button><button class="ib" data-pg="next" aria-label="Next node"${next?'':' disabled'}>${ICO.right}</button><button class="ib" data-pg="close" aria-label="Close and go back to the canvas">${ICO.x}</button></div></header>`+
    `<div class="sh-b" id="shBody" tabindex="-1">${run?`<div class="pg-run"><span class="spin"></span>Executing ${t.name}…</div>`:''}<div class="pg-wrap${run?' wait':''}"><div class="pg">${body}</div>${nav}<div class="pg-foot"><span>Preview · sample content</span><button class="lnk" data-pg="remove">Remove this node from the canvas</button></div></div></div></div>`;
  pageEl.setAttribute('aria-label',t.name);fillPhotos(pageEl);
  if(run){const r=$('.pg-run',pageEl),w=$('.pg-wrap',pageEl);setTimeout(()=>{r.remove();w.classList.remove('wait')},RM?0:fresh?480:300)}
  if(!S.json&&t.ready)t.ready(pageEl);
  if(fresh)$('#shBody',pageEl).focus({preventScroll:true})}
function jump(id){if(!S.nodes[id]||!T[id])return;markDone(id);showPage(id)}
function step(d){const n=S.tour[S.tour.indexOf(S.cur)+d];if(n)jump(n)}
function closePage(silent){if(!S.cur)return;const id=S.cur;S.cur=null;pageEl.hidden=true;pageEl.innerHTML='';stage.inert=!modalEl.hidden;save();
  if(kb&&els[id])els[id].focus({preventScroll:true});
  if(!silent)maybeCelebrate()}
pageEl.addEventListener('click',e=>{
  if(e.target===pageEl){if(performance.now()-pageAt>400)closePage();return}
  const b=e.target.closest('[data-pg],[data-jump],[data-view],[data-param]');
  if(b){if(b.disabled)return;const ds=b.dataset;
    if(ds.jump)return jump(ds.jump);
    if(ds.view){S.json=ds.view==='json';return renderPage(false)}
    if(ds.param){(S.params[S.cur]=S.params[S.cur]||{})[ds.param]=ds.val;save();if(S.cur==='projects')draw();return renderPage(false)}
    if(ds.pg==='close')closePage();
    else if(ds.pg==='prev'||ds.pg==='next')step(ds.pg==='next'?1:-1);
    else if(ds.pg==='add'){closePage();openPicker(lastLeaf())}
    else if(ds.pg==='talk')hire();
    else if(ds.pg==='remove'){const id=S.cur;closePage(true);removeNode(id)}
    return}
  const t=T[S.cur];if(t&&t.click&&!S.json)t.click(e,pageEl)});
pageEl.addEventListener('submit',e=>{e.preventDefault();const t=T[S.cur];if(t&&t.submit&&!S.json)t.submit(e,pageEl)});
pageEl.addEventListener('input',e=>{const t=T[S.cur];if(t&&t.input&&!S.json)t.input(e,pageEl)});
async function hire(){if(S.busy)return busyMsg();closeMenus();closePicker();
  if(!S.nodes.contact){const src=lastLeaf();S.nodes.contact=freeSpot(src,'contact');mk('contact',true);S.edges.push([src,'contact']);draw();save();updatePicker()}
  else if(!pathTo('contact')){const a=lastLeaf();S.edges.push([canLink(a,'contact')?a:'trigger','contact']);draw();save()}
  if(S.cur){markDone('contact');S.tour=order().map(s=>s.id);showPage('contact')}
  else{ensureVisible('contact');await sleep(320);openNode('contact')}}
function maybeCelebrate(){if(S.celebrated||S.seen.size<N)return;S.celebrated=true;save();confetti();
  modal(`<span class="eb dot">${N} / ${N} explored</span><h2>You’ve seen the whole workflow.</h2><p>That’s everything I’d tell you over a coffee. If something in here sounded like your problem, I’d love to hear about it.</p><div class="end-a" style="margin-top:20px"><button class="btn hot sm" data-m="talk">Send me a message</button><button class="btn sm" data-m="close">Keep exploring</button></div>`)}

/* ---------- picker, menus, toast, modal ---------- */
function renderPicker(){const q=$('#pkQ').value.trim().toLowerCase();let h='';
  for(const c of CATS){const list=c.nodes.filter(id=>!q||`${T[id].name} ${T[id].sub} ${T[id].desc} ${c.name}`.toLowerCase().includes(q));
    if(!list.length)continue;h+=`<div class="pk-cat">${c.name}</div>`;
    for(const id of list){const t=T[id],on=!!S.nodes[id],seen=S.seen.has(id);
      h+=`<button class="pk-item" data-add="${id}" style="--c:var(--${t.color})"><span class="pk-ico">${ico(id,'nico sm')}</span><span><b>${t.name}</b><small>${t.desc}</small></span><span class="pk-st${seen?' on':''}">${seen?'✓ explored':on?'on canvas':''}</span></button>`}}
  $('#pkList').innerHTML=h||`<div class="pk-empty">Nothing matches “${esc(q)}”. Try “projects” or “contact”.</div>`}
function updatePicker(){if(pickerOpen())renderPicker()}
function openPicker(src,pos){if(S.busy)return busyMsg();closeMenus();pkSrc=S.nodes[src]?src:'trigger';pkPos=pos||null;
  $('#pkSrc').textContent=pkSrc==='trigger'?'the trigger':T[pkSrc].name;
  const was=pickerEl.hidden;pickerEl.hidden=false;if(was)$('#pkQ').value='';renderPicker();
  if(was&&matchMedia('(hover:hover) and (pointer:fine)').matches)$('#pkQ').focus({preventScroll:true});
  if(!isMob())ensureVisible(pkSrc)}
function closePicker(){pickerEl.hidden=true;pkPos=null}
$('#pkList').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;const id=b.dataset.add,mob=isMob();
  if(S.nodes[id]){if(mob)closePicker();flash(id);return}
  const pos=pkPos;pkPos=null;if(!addNode(id,pkSrc,{pos}))return;
  if(mob)closePicker();else{pkSrc=id;$('#pkSrc').textContent=T[id].name}
  ensureVisible(id);nudgeExec()});
$('#pkQ').addEventListener('input',renderPicker);
$('#pkQ').addEventListener('keydown',e=>{if(e.key==='Enter'){const f=$('.pk-item','#pkList'===0?null:$('#pkList'));if(f)f.click()}});
$('#pkX').addEventListener('click',closePicker);
function closeMenus(){$('#tplMenu').hidden=true;$('#moreMenu').hidden=true}
function toggleMenu(sel){const m=$(sel),was=m.hidden;closeMenus();closePicker();if(S.cur)closePage(true);m.hidden=!was}
$('#tplBtn').addEventListener('click',()=>toggleMenu('#tplMenu'));
$('#moreBtn').addEventListener('click',()=>toggleMenu('#moreMenu'));
$('#hireBtn').addEventListener('click',hire);
$('#goHome').addEventListener('click',()=>showLand());
$('#addFab').addEventListener('click',()=>pickerOpen()?closePicker():openPicker(lastLeaf()));
$('#exec').addEventListener('click',execute);
$('#zFit').addEventListener('click',()=>fit(true));
$('#zTidy').addEventListener('click',tidy);
const zoomBy=f=>{const r=stage.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,S.view.k*f,true)};
$('#zIn').addEventListener('click',()=>zoomBy(1.25));
$('#zOut').addEventListener('click',()=>zoomBy(.8));
document.addEventListener('pointerdown',e=>{kb=false;if(!e.target.closest('.menu,#tplBtn,#moreBtn'))closeMenus()},true);
document.addEventListener('keydown',()=>{kb=true},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-tpl]');
  if(b){closeMenus();if(b.dataset.tpl==='reset')resetCanvas();else build(b.dataset.tpl);return}
  const m=e.target.closest('[data-more]');
  if(m){closeMenus();const k=m.dataset.more;if(k==='copy')copyN8n();else if(k==='tidy')tidy();else introNote()}});
let toastT;
function toast(msg,acts){clearTimeout(toastT);acts=acts?[].concat(acts):[];
  toastEl.innerHTML=`<span>${msg}</span>`+acts.map((a,i)=>`<button data-i="${i}">${a.label}</button>`).join('');
  toastEl.hidden=false;toastEl.style.animation='none';void toastEl.offsetWidth;toastEl.style.animation='';
  toastEl.onclick=e=>{const b=e.target.closest('button');if(!b)return;toastEl.hidden=true;acts[+b.dataset.i].fn()};
  toastT=setTimeout(()=>{toastEl.hidden=true},acts.length?7500:3600)}
function modal(html){modalEl.innerHTML=`<div class="mcard"><button class="ib" data-m="close" aria-label="Close">${ICO.x}</button>${html}</div>`;modalEl.hidden=false;stage.inert=true}
function closeModal(){modalEl.hidden=true;modalEl.innerHTML='';stage.inert=!!S.cur}
modalEl.addEventListener('click',e=>{const b=e.target.closest('[data-m]');
  if(e.target===modalEl||(b&&b.dataset.m==='close'))return closeModal();
  if(b&&b.dataset.m==='talk'){closeModal();hire()}});
modalEl.addEventListener('focusin',e=>{if(e.target.tagName==='TEXTAREA')e.target.select()});
function confetti(){if(RM)return;const c=document.createElement('canvas');c.className='confetti';document.body.appendChild(c);
  const dpr=Math.min(2,devicePixelRatio||1),W=innerWidth,H=innerHeight;c.width=W*dpr;c.height=H*dpr;c.style.width=W+'px';c.style.height=H+'px';
  const g=c.getContext('2d');g.scale(dpr,dpr);const cols=['#ff5a1f','#ff8a5c','#3ecf8e','#5ab9fc','#f2b84b','#ff7aa8','#f3d469','#eff0f1'];
  const ps=Array.from({length:150},(_,i)=>({x:W/2+(Math.random()-.5)*140,y:H*.45,vx:(Math.random()-.5)*17,vy:-Math.random()*16-4,s:5+Math.random()*7,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%cols.length]}));
  const t0=performance.now();(function tick(now){const t=now-t0;g.clearRect(0,0,W,H);
    for(const p of ps){p.vy+=.34;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;g.save();g.translate(p.x,p.y);g.rotate(p.r);g.globalAlpha=clamp(1-(t-1800)/800,0,1);g.fillStyle=p.c;g.fillRect(-p.s/2,-p.s/3,p.s,p.s*.66);g.restore()}
    if(t<2600)requestAnimationFrame(tick);else c.remove()})(t0)}

/* ---------- copy as an n8n workflow ---------- */
function n8nJSON(){const uid=()=>{try{return crypto.randomUUID()}catch(e){return 'n'+Math.random().toString(16).slice(2)+Date.now().toString(16)}};
  const nodes=Object.keys(S.nodes).map(id=>{const n=S.nodes[id],t=T[id],position=[Math.round(n.x),Math.round(n.y)];
    if(id==='trigger')return{parameters:{},type:'n8n-nodes-base.manualTrigger',typeVersion:1,position,id:uid(),name:t.name};
    const d=t.data(S.params[id]||{});
    return{parameters:{mode:'raw',jsonOutput:JSON.stringify(Array.isArray(d)?{[id]:d}:d,null,2),options:{}},type:'n8n-nodes-base.set',typeVersion:3.4,position,id:uid(),name:t.name}});
  const b=bounds(S.nodes,false);
  nodes.push({parameters:{content:"## Who is Ayan?\nCopied from Ayan's portfolio canvas. Press **Execute workflow**, then open any node to read its output.\n\nSample content.",height:200,width:360},
    type:'n8n-nodes-base.stickyNote',typeVersion:1,position:[Math.round(b.x),Math.round(b.y-260)],id:uid(),name:'Sticky Note'});
  const connections={};
  for(const [a,c] of S.edges){const k=T[a].name;(connections[k]=connections[k]||{main:[[]]}).main[0].push({node:T[c].name,type:'main',index:0})}
  return JSON.stringify({name:'Who is Ayan?',nodes,connections,pinData:{},meta:{}},null,2)}
function copyN8n(){const txt=n8nJSON();
  const ok=()=>toast('Copied. In n8n, click an empty canvas and paste.');
  const fail=()=>modal(`<span class="eb dot">n8n workflow</span><h2>Copy this JSON</h2><p>Select all of it, copy it, then paste it onto an empty n8n canvas.</p><textarea readonly aria-label="Workflow JSON">${esc(txt)}</textarea>`);
  try{navigator.clipboard.writeText(txt).then(ok,fail)}catch(e){fail()}}

/* ---------- saving ---------- */
function save(){store.set(KEY,{v:1,nodes:S.nodes,edges:S.edges,done:[...S.done],seen:[...S.seen],params:S.params,stickies:S.stickies,celebrated:S.celebrated})}
function load(){const d=store.get(KEY);if(!d||d.v!==1||!d.nodes||!d.nodes.trigger)return false;
  try{const nodes={};for(const id in d.nodes){const n=d.nodes[id];if(T[id]&&n&&isFinite(n.x)&&isFinite(n.y))nodes[id]={x:+n.x,y:+n.y}}
    if(!nodes.trigger)return false;const edges=[],seenE=new Set();
    for(const e of d.edges||[]){if(!Array.isArray(e)||!nodes[e[0]]||!nodes[e[1]]||e[1]==='trigger'||e[0]===e[1]||seenE.has(e[0]+'>'+e[1]))continue;seenE.add(e[0]+'>'+e[1]);edges.push([e[0],e[1]])}
    S.nodes=nodes;S.edges=[];for(const e of edges)if(canLink(e[0],e[1]))S.edges.push(e);
    S.done=new Set((d.done||[]).filter(id=>nodes[id]));S.seen=new Set((d.seen||[]).filter(id=>T[id]&&id!=='trigger'));
    for(const k in d.params||{})if(T[k]&&T[k].params)for(const f in T[k].params)if(T[k].params[f].opts.includes(d.params[k][f]))(S.params[k]=S.params[k]||{})[f]=d.params[k][f];
    S.stickies={};if(d.stickies&&d.stickies.start&&isFinite(d.stickies.start.x)&&isFinite(d.stickies.start.y))S.stickies.start={x:+d.stickies.start.x,y:+d.stickies.start.y};
    S.celebrated=!!d.celebrated;return true}catch(e){return false}}

/* ---------- pointer, wheel and keyboard ---------- */
const ptrs=new Map();let drag=null,pinch=null;
function setTarget(id){if(tgt===id)return;if(tgt&&els[tgt])els[tgt].classList.remove('is-target');tgt=id;if(id&&els[id])els[id].classList.add('is-target')}
function cancelDrag(){drag=null;ghost.setAttribute('d','');setTarget(null);stage.classList.remove('pan')}
function nodeAt(w,ex){let hit=null;for(const id in S.nodes){if(id===ex)continue;const n=S.nodes[id],d=dim(id);if(w.x>=n.x-30&&w.x<=n.x+d.w+16&&w.y>=n.y-16&&w.y<=n.y+d.h+16)hit=id}return hit}
stage.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'){ptrs.clear();if(e.button!==0&&e.button!==1)return}
  const t=e.target;if(t.closest('.zoom,.runbar,.addfab'))return;
  if(e.button===1)e.preventDefault();
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){cancelDrag();const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,k:S.view.k,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};return}
  if(ptrs.size>2)return;
  if(t.closest('[data-act],.st-btn,.st-x,.e-del'))return;
  const nodeEl=t.closest('.node'),stEl=t.closest('.sticky'),edgeEl=t.closest('.edge'),base={pid:e.pointerId,sx:e.clientX,sy:e.clientY,moved:false};
  if(edgeEl){selEdge=edgeEl.dataset.k;draw();return}
  if(selEdge){selEdge=null;draw()}
  if(nodeEl&&e.button===0&&t.closest('[data-port]'))drag=Object.assign(base,{type:'wire',id:nodeEl.dataset.id});
  else if(nodeEl&&e.button===0){const n=S.nodes[nodeEl.dataset.id];drag=Object.assign(base,{type:'node',id:nodeEl.dataset.id,ox:n.x,oy:n.y})}
  else if(stEl&&e.button===0){const s=S.stickies[stEl.dataset.st];drag=Object.assign(base,{type:'sticky',id:stEl.dataset.st,ox:s.x,oy:s.y})}
  else drag=Object.assign(base,{type:'pan',ox:S.view.x,oy:S.view.y})});
addEventListener('pointermove',e=>{
  if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size>=2){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
    S.view.x+=cx-pinch.cx;S.view.y+=cy-pinch.cy;pinch.cx=cx;pinch.cy=cy;zoomAt(cx,cy,pinch.k*d/pinch.d);return}
  if(!drag||e.pointerId!==drag.pid)return;
  const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy,k=S.view.k;
  if(!drag.moved){if(Math.hypot(dx,dy)<(e.pointerType==='mouse'?4:9))return;drag.moved=true;if(drag.type==='pan')stage.classList.add('pan')}
  if(drag.type==='pan'){S.view.x=drag.ox+dx;S.view.y=drag.oy+dy;apply(false)}
  else if(drag.type==='node'){const n=S.nodes[drag.id];if(!n)return;n.x=drag.ox+dx/k;n.y=drag.oy+dy/k;place(drag.id);draw()}
  else if(drag.type==='sticky'){const s=S.stickies[drag.id],el=stEls[drag.id];if(!s||!el)return;s.x=drag.ox+dx/k;s.y=drag.oy+dy/k;el.style.left=s.x+'px';el.style.top=s.y+'px'}
  else if(drag.type==='wire'){if(!S.nodes[drag.id])return cancelDrag();const w=toWorld(e.clientX,e.clientY),hit=nodeAt(w,drag.id);
    setTarget(hit&&canLink(drag.id,hit)?hit:null);ghost.setAttribute('d',curve(outPt(drag.id),tgt?inPt(tgt):w))}});
function endPtr(e){ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;
  if(!drag||e.pointerId!==drag.pid)return;const d=drag;cancelDrag();
  if(e.type==='pointercancel')return;
  if(d.type==='wire'){const n=S.nodes[d.id];if(!n)return;const w=toWorld(e.clientX,e.clientY);
    if(!d.moved){if(w.x<n.x+dim(d.id).w-8)openNode(d.id);else openPicker(d.id);return}
    const hit=nodeAt(w,d.id);if(hit)link(d.id,hit);else openPicker(d.id,{x:Math.round(w.x+9),y:Math.round(w.y-46)})}
  else if(d.type==='node'){if(d.moved)save();else openNode(d.id)}
  else if(d.type==='sticky'){if(d.moved)save()}
  else if(d.type==='pan'&&!d.moved&&pickerOpen())closePicker()}
addEventListener('pointerup',endPtr);addEventListener('pointercancel',endPtr);
addEventListener('blur',()=>{ptrs.clear();pinch=null;cancelDrag()});
stage.addEventListener('click',e=>{const t=e.target,a=t.closest('[data-act]');
  if(a){const nd=a.closest('.node');if(!nd)return;const id=nd.dataset.id,act=a.dataset.act;
    if(act==='add')openPicker(id);else if(act==='exec')execute();else if(act==='open')openNode(id);else if(act==='del')removeNode(id);return}
  const x=t.closest('.st-x');if(x){dropSticky(x.closest('.sticky').dataset.st);return}
  const del=t.closest('.e-del');if(del)unlink(del.closest('.edge').dataset.k)});
stage.addEventListener('wheel',e=>{e.preventDefault();
  if(e.ctrlKey||e.metaKey)zoomAt(e.clientX,e.clientY,S.view.k*Math.exp(-clamp(e.deltaY,-24,24)*.012));
  else{const sx=e.shiftKey&&!e.deltaX;S.view.x-=sx?e.deltaY:e.deltaX;S.view.y-=sx?0:e.deltaY;apply(false)}},{passive:false});
stage.addEventListener('gesturestart',e=>e.preventDefault());
stage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=stage.getBoundingClientRect();glowEl.style.setProperty('--mx',e.clientX-r.left+'px');glowEl.style.setProperty('--my',e.clientY-r.top+'px')});
stage.addEventListener('pointerleave',()=>{glowEl.style.setProperty('--mx','-600px');glowEl.style.setProperty('--my','-600px')});
addEventListener('keydown',e=>{if(app.hidden)return;const ae=document.activeElement,inField=ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName),mod=e.ctrlKey||e.metaKey;
  if(e.key==='Escape'){if(!modalEl.hidden)closeModal();else if(S.cur)closePage();else if(!$('#tplMenu').hidden||!$('#moreMenu').hidden)closeMenus();else if(pickerOpen())closePicker();else if(selEdge){selEdge=null;draw()}return}
  if(!modalEl.hidden)return;
  if(S.cur){if(!inField&&!mod&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();step(e.key==='ArrowRight'?1:-1)}return}
  if(mod&&e.key.toLowerCase()==='k'){e.preventDefault();openPicker(lastLeaf());return}
  if(mod&&e.key==='Enter'){e.preventDefault();execute();return}
  if(inField||mod)return;
  const nd=ae&&ae.classList&&ae.classList.contains('node')?ae:null;
  if(e.key==='Delete'||e.key==='Backspace'){if(selEdge)unlink(selEdge);else if(nd&&nd.dataset.id!=='trigger')removeNode(nd.dataset.id);return}
  if((e.key==='Enter'||e.key===' ')&&nd){e.preventDefault();openNode(nd.dataset.id)}});

/* =====================================================================
   Landing page, boot and routing
   ===================================================================== */
function initCanvas(){load();rebuild();
  if(Object.keys(S.nodes).length>1)fit(false);else{homeView(false);pulsePlus()}}
let booting=false,landY=0;
function setHash(h){try{if(location.hash!=='#'+h)location.hash=h}catch(e){}}
function runBoot(){return new Promise(res=>{const lis=$$('.boot-log li',boot),bar=$('.boot-bar i',boot);let over=false;
  const fin=()=>{if(over)return;over=true;res()};
  lis.forEach(l=>l.classList.remove('on'));bar.style.width='0';boot.classList.remove('out');boot.hidden=false;$('.boot-skip',boot).onclick=fin;
  (async()=>{await sleep(280);for(let i=0;i<lis.length;i++){if(over)return;lis[i].classList.add('on');bar.style.width=(i+1)/lis.length*100+'%';await sleep(340)}await sleep(260);fin()})()})}
async function enter(skip){if(booting||!app.hidden)return;booting=true;landY=scrollY;setHash('canvas');
  if(!skip&&!inited&&!RM)await runBoot();
  land.hidden=true;app.hidden=false;document.documentElement.classList.add('in-app');scrollTo(0,0);
  if(!inited){inited=true;initCanvas()}else apply(false);
  if(!boot.hidden){boot.classList.add('out');setTimeout(()=>{boot.hidden=true;boot.classList.remove('out')},460)}
  booting=false}
function showLand(){if(app.hidden)return;if(S.cur)closePage(true);closeMenus();closePicker();if(!modalEl.hidden)closeModal();
  app.hidden=true;land.hidden=false;document.documentElement.classList.remove('in-app');
  if(location.hash==='#canvas')setHash('home');
  scrollTo({top:landY,behavior:'instant'});ioWires();ioStart()}
addEventListener('hashchange',()=>{if(location.hash==='#canvas'){if(app.hidden&&!booting)enter(true)}else if(!app.hidden)showLand()});
$$('[data-enter]').forEach(b=>b.addEventListener('click',()=>enter()));
$$('[data-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const el=document.getElementById(a.dataset.go);if(el)el.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'})}));
$$('.spot').forEach(sec=>{const lit=$('.dots.lit',sec);if(!lit)return;
  sec.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=sec.getBoundingClientRect();lit.style.setProperty('--mx',e.clientX-r.left+'px');lit.style.setProperty('--my',e.clientY-r.top+'px')});
  sec.addEventListener('pointerleave',()=>{lit.style.setProperty('--mx','-600px');lit.style.setProperty('--my','-600px')})});
/* hero: busywork goes in, results come out */
let ioPaths=[],ioDots=[];
function ioWires(){const io=$('#io'),svg=$('#ioWires');if(!io||land.hidden)return;const r=io.getBoundingClientRect();if(!r.width)return;
  const m=$('#ioMe .io-node').getBoundingClientRect(),cy=m.top-r.top+m.height/2,L={x:m.left-r.left-6,y:cy},R={x:m.right-r.left+9,y:cy};
  ioPaths=[];let h='';
  $$('.io-in .chip-io',io).forEach(c=>{const b=c.getBoundingClientRect(),a={x:b.right-r.left,y:b.top-r.top+b.height/2};ioPaths.push({a,b:L,cls:'in'});h+=`<path class="iw in" d="${curve(a,L,12)}"/>`});
  $$('.io-out .chip-io',io).forEach(c=>{const b=c.getBoundingClientRect(),q={x:b.left-r.left,y:b.top-r.top+b.height/2};ioPaths.push({a:R,b:q,cls:'out'});h+=`<path class="iw out" d="${curve(R,q,12)}"/>`});
  svg.innerHTML=h+(RM?'':ioPaths.map(p=>`<circle class="ip ${p.cls}" r="3.4" opacity="0"/>`).join(''));ioDots=$$('circle',svg)}
let ioT0=0,ioRaf=0;const IO_PER=3400,IO_ROUNDS=4;
function ioStart(){if(RM||ioRaf)return;ioT0=0;ioRaf=requestAnimationFrame(ioTick)}
function ioTick(now){ioRaf=0;if(!ioT0)ioT0=now;if(now-ioT0>IO_PER*IO_ROUNDS){ioDots.forEach(c=>c.setAttribute('opacity',0));return}
  if(!land.hidden&&ioDots.length&&!document.hidden){const per=IO_PER;now-=ioT0;
    ioPaths.forEach((p,i)=>{const c=ioDots[i];if(!c)return;const ph=(now/per+(i%3)*.19)%1,t=p.cls==='in'?ph/.46:(ph-.5)/.46;
      if(t<0||t>1){c.setAttribute('opacity',0);return}const pt=bez(p.a,p.b,t,12);c.setAttribute('cx',pt.x.toFixed(1));c.setAttribute('cy',pt.y.toFixed(1));c.setAttribute('opacity',Math.min(1,Math.sin(Math.PI*t)*2.2).toFixed(2))})}
  ioRaf=requestAnimationFrame(ioTick)}
fillPhotos();
ioWires();
if(window.ResizeObserver)new ResizeObserver(ioWires).observe($('#io'));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(ioWires);
ioStart();
$('#io').addEventListener('pointerenter',ioStart);
updateProg();
if(location.hash==='#canvas')enter(true);
