'use strict';
/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep=ms=>new Promise(r=>setTimeout(r,RM?Math.min(ms,20):ms));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function hl(o){return JSON.stringify(o,null,2).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?|true|false|null)\b/g,(m,s,c,n)=>s?(c?`<span class="k">${s}</span>${c}`:`<span class="s">${s}</span>`):`<span class="n">${n}</span>`)}
const curve=(a,b,min=46)=>{const dx=Math.max(min,Math.abs(b.x-a.x)*.5);return`M${a.x},${a.y} C${a.x+dx},${a.y} ${b.x-dx},${b.y} ${b.x},${b.y}`};
const bez=(a,b,t,min=46)=>{const dx=Math.max(min,Math.abs(b.x-a.x)*.5),u=1-t,x1=a.x+dx,x2=b.x-dx;
  return{x:u*u*u*a.x+3*u*u*t*x1+3*u*t*t*x2+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*a.y+3*u*t*t*b.y+t*t*t*b.y}};

/* ---------- photos ----------
   Put Ayan's real photos here. Each value can be a data: URI or the path of an image file published with this page
   (for example 'photos/ayan.jpg'). Empty means the slot shows a placeholder that a visitor can click to try a photo,
   which is kept only in their own browser. */
const PHOTOS={
  portrait:'',   // hero node and the "Who is Ayan?" page, 4:5
  work:'',       // about section, ideally at work, 4:5
  p1:'',p2:'',p3:'',p4:'',p5:'',  // project screenshots, 16:10
  q1:'',q2:'',q3:''               // client photos for the quotes, square
};
const PH_KEY='ayan-photos-v1',PH_TXT={person:['Your photo','Click to try one. Best at 4:5.'],shot:['Project screenshot','Click to try one. Best at 16:10.'],face:['Client photo','Square']};
const PH_ICO={person:'<circle cx="12" cy="8.5" r="4"/><path d="M4 21c1.2-4.4 4.4-6.3 8-6.3s6.8 1.9 8 6.3"/>',
  shot:'<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5-8.5 8.5"/>',
  face:'<circle cx="12" cy="9" r="3.6"/><path d="M5.5 19c1-3.4 3.6-5 6.5-5s5.5 1.6 6.5 5"/>'};
let phLocal=store.get(PH_KEY)||{},phTarget=null;
function fillPhotos(root=document){$$('[data-photo]',root).forEach(f=>{const k=f.dataset.photo,kind=f.dataset.ph||'shot',src=PHOTOS[k]||phLocal[k];
  if(src){f.innerHTML=`<img src="${esc(src)}" alt="${kind==='person'?'Ayan':kind==='face'?'Client':'Project screenshot'}" loading="lazy">`+(PHOTOS[k]?'':`<button class="ph-x" data-ph-clear="${k}" aria-label="Remove this trial photo">Remove</button>`)}
  else{const t=PH_TXT[kind];f.innerHTML=`<button class="ph-empty" data-ph-pick="${k}" aria-label="${t[0]}: add a photo to try it here"><svg viewBox="0 0 24 24" aria-hidden="true">${PH_ICO[kind]}</svg><b>${t[0]}</b><small>${t[1]}</small></button>`}})}
function phSet(k,v){if(v)phLocal[k]=v;else delete phLocal[k];store.set(PH_KEY,phLocal);fillPhotos()}
function phRead(file,k){const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const m=900,sc=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');
    c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);let url;try{url=c.toDataURL('image/jpeg',.86)}catch(e){url=fr.result}phSet(k,url)};im.src=fr.result};fr.readAsDataURL(file)}
document.addEventListener('click',e=>{const p=e.target.closest('[data-ph-pick]'),x=e.target.closest('[data-ph-clear]');
  if(p){e.preventDefault();e.stopPropagation();phTarget=p.dataset.phPick;const inp=$('#phFile');inp.value='';inp.click()}
  else if(x){e.preventDefault();e.stopPropagation();phSet(x.dataset.phClear,'')}},true);
$('#phFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(f&&phTarget&&/^image\//.test(f.type))phRead(f,phTarget)});

/* ---------- icons ---------- */
const IC={
  trigger:'<path d="M6 4l12 6.5-5 1.6-1.8 5z"/><path d="M13 12.2l4.5 4.5"/>',
  about:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.3-6.5 8-6.5s7 2 8 6.5"/>',
  journey:'<path d="M5 21V4"/><path d="M5 5h11l-2.5 3.5L16 12H5"/>',
  values:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  now:'<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  projects:'<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2.5h8.5A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z"/>',
  services:'<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5L12 21l9-4.5"/>',
  stack:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M17 14v6M14 17h6"/>',
  results:'<path d="M4 20V11M10 20V4M16 20v-7M22 20H2"/>',
  testimonials:'<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>',
  resume:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  agent:'<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4.5"/><circle cx="12" cy="3.5" r="1"/><path d="M9.5 13v1.5M14.5 13v1.5M2 13v2M22 13v2"/>',
  call:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/>',
  contact:'<path d="M21 3L10.5 13.5"/><path d="M21 3l-6.5 18-4-7.5L3 9.500z"/>',
  socials:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.200 1.200"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.200-1.200"/>',
  surprise:'<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" stroke-width="2.6"/>'
};
const ico=(id,cls='nico')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[id]}</svg>`;
const svgi=d=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICO={
  play:svgi('<path d="M7 4.5l12 7.5-12 7.5z"/>'),
  trash:svgi('<path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  bolt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/></svg>',
  x:svgi('<path d="M6 6l12 12M18 6L6 18"/>'),
  left:svgi('<path d="M15 18l-6-6 6-6"/>'),
  right:svgi('<path d="M9 6l6 6-6 6"/>')
};
const AGENT_SUBS=`<div class="a-subs"><svg viewBox="0 0 214 112" aria-hidden="true"><path d="M47 4V44M107 4V44M167 4V44"/><rect x="43" y="-4" width="8" height="8" transform="rotate(45 47 0)"/><rect x="103" y="-4" width="8" height="8" transform="rotate(45 107 0)"/><rect x="163" y="-4" width="8" height="8" transform="rotate(45 167 0)"/></svg>
  <span class="a-sub" style="left:47px"><svg viewBox="0 0 24 24"><path d="M12 4l1.8 4.7L18.5 10l-4.7 1.300L12 16l-1.800-4.700L5.500 10l4.700-1.300z"/></svg><small>Model</small></span>
  <span class="a-sub" style="left:107px"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v11c0 1.700 3.100 3 7 3s7-1.300 7-3v-11M5 12c0 1.700 3.100 3 7 3s7-1.300 7-3"/></svg><small>Memory</small></span>
  <span class="a-sub" style="left:167px"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M18.400 5.600l-2.100 2.100M7.700 16.300l-2.100 2.100"/></svg><small>Tools</small></span></div>`;

/* ---------- content (sample copy for the preview) ---------- */
const head=(eb,h,lede)=>`<div class="pg-hero"><h1>${h}</h1>${lede?`<p class="lede">${lede}</p>`:''}</div>`;

const PROJECTS=[
  {photo:'p1',title:'Inbound leads, scored and routed',client:'B2B SaaS team',tag:'Sales',chain:['Form','Enrich','AI score','IF hot','CRM','Slack'],
   problem:'Sales replied to inbound leads after about four hours. Good leads went cold.',
   built:'Every lead is enriched, scored against their ideal customer and sent to the right rep in Slack.',
   result:[['4h → 10 min','time to first reply'],['+18%','demos booked']]},
  {photo:'p2',title:'Supplier invoices booked from email',client:'Accounting firm',tag:'Operations',chain:['Gmail','OCR','AI extract','Check totals','Zoho Books'],
   problem:'Two people spent most of every month typing supplier invoices into the books.',
   built:'Invoices are read from the inbox, checked and booked. Anything uncertain goes to a human queue.',
   result:[['~20h','saved a month'],['1 in 20','checked by a person']]},
  {photo:'p3',title:'WhatsApp answers for order questions',client:'D2C skincare brand',tag:'AI agents',chain:['WhatsApp','AI agent','Shopify','IF human?','Reply'],
   problem:'The support team was buried in "where is my order" messages.',
   built:'An agent answers order and return questions from live Shopify data, and hands over to a person when it isn\'t sure.',
   result:[['About half','of chats solved without a person'],['< 1 min','reply time']]},
  {photo:'p4',title:'CV screening with a reason for each score',client:'Recruitment agency',tag:'AI agents',chain:['Email','Parse CV','AI match','IF shortlist','Notion'],
   problem:'Recruiters read a lot of CVs for each role, and most were not a fit.',
   built:'CVs are scored against a written rubric. Recruiters get a short brief that gives the reason for every score.',
   result:[['About 60%','less time on first screening'],['Every score','comes with a reason']]},
  {photo:'p5',title:'Posts drafted from each new video',client:'Content creator',tag:'Operations',chain:['YouTube','Transcript','AI write','Check format','LinkedIn'],
   problem:'Each video took half a day to turn into posts and a newsletter.',
   built:'A new upload becomes drafts for LinkedIn and email, checked for format before anything is queued.',
   result:[['4h → 30 min','per video'],['5 drafts','checked before posting']]}
];
const QA=[
  {q:"What's your best project?",re:/best|proud|favou?rite|top/i,tools:['search_projects(sort: "impact")','get_project("lead-routing")'],
   a:'The lead routing workflow for a B2B SaaS team. First replies went from about four hours to ten minutes. Add the Projects node to see how it works.'},
  {q:'Can you build a WhatsApp agent?',re:/whatsapp|bot|agent|support|chat/i,tools:['search_projects("whatsapp")'],
   a:'Yes. Ayan built one for a skincare brand that answers order and return questions from live Shopify data. It answers about half of the chats on its own and hands over to a person when it isn\'t sure.'},
  {q:'How do you price projects?',re:/price|pricing|cost|charge|budget|rate|much/i,tools:['get_services()'],
   a:'Fixed quotes, agreed before any work starts. A single workflow usually takes one to two weeks, and an AI agent two to four. The first call is free.'},
  {q:'Are you available?',re:/availab|free|start|when|hire|book|busy/i,tools:['check_availability()'],
   a:'Ayan is open to new projects. Add the Book a call node, or send a message and expect a reply within a day.'}
];
const FACTS=[
  'My first automation reminded me to drink water. It still runs.',
  'I would happily spend three hours automating a ten-minute task. After that it takes zero minutes.',
  'I name my workflows like pets. The invoice one answers to Munshi.',
  'The longest I have stared at a 429 error is two hours. Now I add retries before anything else.',
  'I have strong opinions about error handling, and I will share them if you ask.',
  'I draw every workflow on paper first. The canvas comes second.'
];
let factI=-1;
function slots(){const out=[],d=new Date();while(out.length<4){d.setDate(d.getDate()+1);const w=d.getDay();if(w===0||w===6)continue;
  out.push({day:d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}),times:['11:00 AM','2:30 PM','5:00 PM']})}return out}
function ask(q,root){q=(q||'').trim();if(!q)return;const chat=$('#chat',root);
  const hit=QA.find(x=>x.re.test(q))||{tools:[`search_projects("${q.slice(0,24)}")`],a:"I don't have a good answer to that yet. Send it through the Send a message node and Ayan will reply personally within a day."};
  chat.insertAdjacentHTML('beforeend',`<div class="msg me">${esc(q)}</div><div class="msg ai"><div class="trace"><span><b>agent</b> thinking…</span></div></div>`);
  const b=chat.lastElementChild;chat.scrollTop=chat.scrollHeight;
  setTimeout(()=>{b.innerHTML=`<div class="trace">${hit.tools.map(t=>`<span><b>tool</b> ${esc(t)} ✓</span>`).join('')}</div>${esc(hit.a)}`;chat.scrollTop=chat.scrollHeight},RM?0:850)}

const CATS=[
  {name:'About me',nodes:['about','journey','values','now']},
  {name:'My work',nodes:['projects','services','stack']},
  {name:'Proof',nodes:['results','testimonials','resume']},
  {name:'Talk to me',nodes:['agent','call','contact','socials']},
  {name:'Just for fun',nodes:['surprise']}
];

const T={
  trigger:{name:'When you click ‘Execute workflow’',sub:'Manual trigger',color:'accent',items:1},

  about:{name:'Who is Ayan?',sub:'About',color:'coral',items:1,desc:'The short version of me, in three tones',
    params:{tone:{label:'tone',opts:['friendly','professional','one line']}},
    data(p){const tone=p.tone||'friendly';const bio={
        friendly:["Hey, I'm Ayan. When I see someone copy the same thing between two tabs every day, I want to turn it into a workflow.","I started by automating my own busywork and got hooked. Now I do it for businesses. I'm honest about what AI can't do yet, and I stick around after launch."],
        professional:['I design, build and maintain automations for teams that have outgrown manual work. I work mostly in n8n and add AI agents where they measurably help.','Every workflow ships with error alerts, documentation and a handover, so your team owns it from day one.'],
        'one line':['I turn busywork into workflows, and I stay until they run on their own.']}[tone];
      return{name:'Ayan',role:'n8n + AI automation builder',tone,bio,based_in:'India (IST, UTC+5:30)',works_with:'Founders, ops and support teams',replies_within:'About a day',status:'Open to new projects'}},
    page(d,p,P){return head('About · 1 item',d.tone==='one line'?'Ayan, in one line.':"Hi, I'm Ayan.")+P+
      `<div class="ab"><div class="ab-pic"><figure class="ph-slot" data-photo="portrait" data-ph="person" style="--ar:4/5"></figure></div><div class="ab-txt">${d.bio.map((x,i)=>`<p${i?'':' class="big"'}>${x}</p>`).join('')}</div></div>
      <dl class="kv"><div><dt>Role</dt><dd>${d.role}</dd></div><div><dt>Based in</dt><dd>${d.based_in}</dd></div><div><dt>Works with</dt><dd>${d.works_with}</dd></div><div><dt>Replies in</dt><dd>${d.replies_within}</dd></div></dl>
      <div class="stick"><b>My promise</b>I answer every message myself. If I'm not the right person for your project, I'll tell you who is.<i>Ayan</i></div>`}},

  journey:{name:'Journey',sub:'Timeline',color:'coral',items:4,desc:'How I went from curious to full-time builder',
    data(){return[
      {when:'Now',title:'Full-time automation builder',text:'Production workflows and AI agents for SaaS, e-commerce and service businesses.'},
      {when:'2025',title:'First paying clients',text:'Lead routing and invoice automations for small teams. I learned to plan for retries and rate limits from day one.'},
      {when:'2024',title:'Found n8n',text:"Automated my own busywork, then my friends'. Got hooked on the canvas."},
      {when:'Before',title:'Curious about how things work',text:'Taught myself to code by breaking things and fixing them.'}]},
    page(d){return head('Timeline · 4 items','How I got here','The short history, newest first.')+
      `<div class="tl">${d.map(x=>`<article><span class="when">${x.when}</span><h3>${x.title}</h3><p>${x.text}</p></article>`).join('')}</div>`}},

  values:{name:'How I work',sub:'Process',color:'coral',items:4,desc:'Four steps and three promises',
    data(){return{steps:[
        {step:'Listen',text:'A 30-minute call. You show me the process that hurts and I ask a lot of questions.'},
        {step:'Map',text:'I draw the workflow before I build it, so you can see every step and say no early.'},
        {step:'Build',text:'I build in n8n, test with your real data and show you progress every few days.'},
        {step:'Look after',text:'Alerts, documentation and a handover. I keep an eye on it after launch.'}],
      promises:[
        {title:'You own everything',text:'The workflow, the credentials and the docs live in your accounts.'},
        {title:'No jargon',text:'I explain what each step does in plain words.'},
        {title:'Honest advice',text:"If something shouldn't be automated, I'll say so before you pay for it."}]}},
    page(d){return head('Process · 4 steps','How a project with me runs','The same four steps every time, whatever the size.')+
      `<div class="flow4">${d.steps.map(s=>`<div><h3>${s.step}</h3><p>${s.text}</p></div>`).join('')}</div>
      <div class="prom">${d.promises.map(s=>`<div><b>${s.title}</b><span>${s.text}</span></div>`).join('')}</div>`}},

  now:{name:'Right now',sub:'Status',color:'coral',items:3,desc:"What I'm building, learning and open to",
    data(){return{building:'A voice agent that books appointments for clinics',learning:'Evals for AI agents, so "it seems to work" becomes a number',open_to:'New projects',updated:'November 2026'}},
    page(d){return head('Status',"What I'm up to right now",'Last updated '+d.updated+'.')+
      `<div class="now"><div><span class="dot">Building</span><b>${d.building}</b></div><div><span class="dot">Learning</span><b>${d.learning}</b></div><div><span class="dot">Open to</span><b>${d.open_to}</b></div></div>`}},

  projects:{name:'Projects',sub:'Case studies',color:'sky',items:5,desc:'Automations I shipped, with the node chain behind each',
    params:{type:{label:'type',opts:['All','Sales','Operations','AI agents']}},
    data(p){const t=p.type||'All';return PROJECTS.filter(x=>t==='All'||x.tag===t)},
    page(d,p,P){return head(`Case studies · ${d.length} item${d.length===1?'':'s'}`,'Work I shipped','Each project shows the chain of nodes behind it. Press Run to watch one execute.')+P+
      `<div class="pjs">${d.map(x=>`<article class="pj"><div class="pj-main"><div class="pj-top"><span class="tag">${x.tag}</span><span class="cl">${x.client}</span></div><h3>${x.title}</h3>
        <div class="chain">${x.chain.map((c,i)=>`${i?'<i></i>':''}<span class="cn" style="--i:${i}">${c}</span>`).join('')}<button class="runb" data-run>▶ Run</button></div>
        <div class="pj-cols"><div><h4>Problem</h4><p>${x.problem}</p></div><div><h4>What I built</h4><p>${x.built}</p></div></div>
        <div class="pj-res">${x.result.map(r=>`<div><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div></div><figure class="ph-slot pj-img" data-photo="${x.photo}" data-ph="shot" style="--ar:16/10;--r:12px"></figure></article>`).join('')}</div>`},
    click(e){const b=e.target.closest('[data-run]');if(!b)return;const c=b.closest('.chain');c.classList.remove('run');void c.offsetWidth;c.classList.add('run')}},

  services:{name:'Services',sub:'What I offer',color:'sky',items:3,desc:'Three ways to work with me',
    data(){return[
      {name:'Workflow build',for:'One painful process, automated end to end.',includes:['A process map you approve first','An n8n workflow with error alerts','Docs and a handover call'],time:'1 to 2 weeks'},
      {name:'AI agent',for:'A support, sales or ops agent with guardrails.',includes:['An agent with tools and memory','A test set, so quality is measured','Human handoff built in'],time:'2 to 4 weeks'},
      {name:'Care plan',for:'Someone watching your automations for you.',includes:['Monitoring and alerts','Fixes within one business day','Small changes every month'],time:'Monthly'}]},
    page(d){return head('Services · 3 items','Three ways to work with me','Every project gets a fixed quote before any work starts.')+
      `<div class="plans">${d.map(s=>`<div class="plan"><h3>${s.name}</h3><p>${s.for}</p><ul>${s.includes.map(i=>`<li>${i}</li>`).join('')}</ul><div class="time">Typical time: <b>${s.time}</b></div></div>`).join('')}</div>`}},

  stack:{name:'Tech stack',sub:'Tools',color:'sky',items:5,desc:'The platforms, models and databases I use',
    data(){return[
      {group:'Automation',tools:['n8n','Webhooks','REST APIs']},
      {group:'AI',tools:['OpenAI','Claude','RAG']},
      {group:'Data',tools:['Postgres','Supabase','Google Sheets','Airtable']},
      {group:'Channels',tools:['Slack','WhatsApp','Telegram','Gmail']},
      {group:'Code',tools:['JavaScript','Python','SQL']}]},
    page(d){return head('Tools · 5 groups','What I build with','n8n is home. Everything else gets used when the job calls for it.')+
      `<div class="groups">${d.map(g=>`<div class="grp"><h3>${g.group}</h3><div class="chips">${g.tools.map(t=>`<span${t==='n8n'?' class="main"':''}>${t}</span>`).join('')}</div></div>`).join('')}</div>`}},

  results:{name:'Results',sub:'Numbers',color:'mint',items:4,desc:'What the work added up to',
    data(){return[{value:'18',label:'workflows in production'},{value:'~120h',label:'saved for clients each month'},{value:'9',label:'teams worked with'},{value:'98%',label:'of executions succeed'}]},
    page(d){return head('Numbers · 4 items','What the work adds up to')+
      `<div class="bign">${d.map(x=>`<div><b>${x.value}</b><span>${x.label}</span></div>`).join('')}</div><p class="fine">Sample figures for the preview. Your real numbers go here, with a source for each.</p>`}},

  testimonials:{name:'Testimonials',sub:'Client words',color:'mint',items:3,desc:'What clients say after working with me',
    data(){return[
      {quote:'Weekend leads used to wait until Monday. Now they get a reply the same day, and the workflow is documented well enough that my team can change it themselves.',name:'Founder',role:'B2B SaaS team',photo:'q1'},
      {quote:'Month-end used to take two of us most of a week. Now it takes about a day, and we only check the invoices the workflow flags.',name:'Operations lead',role:'Accounting firm',photo:'q2'},
      {quote:'The WhatsApp agent handles the repetitive questions and passes a chat to us when it isn\'t sure. We spend our time on the harder ones.',name:'Co-founder',role:'D2C skincare brand',photo:'q3'}]},
    page(d){return head('Client words · 3 items','What clients say','Sample quotes for the preview. Only real quotes, with permission, belong here.')+
      `<div class="quotes">${d.map(q=>`<figure class="quote"><blockquote>“${q.quote}”</blockquote><figcaption><figure class="ph-slot" data-photo="${q.photo}" data-ph="face" style="--ar:1/1;--r:50%"></figure><span><b>${q.name}</b> · ${q.role}</span><span class="ph">sample</span></figcaption></figure>`).join('')}</div>`}},

  resume:{name:'Résumé',sub:'One page',color:'mint',items:1,desc:'The formal version, ready to download',
    data(){return{name:'Ayan',title:'n8n + AI automation builder',summary:'Automation builder focused on n8n and AI agents. I take one manual process at a time and turn it into a monitored workflow that the team owns.',
      experience:[{when:'Now',role:'Independent automation builder',text:'Workflows and AI agents for SaaS, e-commerce and service businesses.'},{when:'2025',role:'Freelance automation projects',text:'Lead routing, invoice parsing and reporting for small teams.'}],
      skills:['n8n','AI agents','APIs and webhooks','JavaScript','Python','SQL','Supabase','Process mapping'],education:'Your degree and institution go here.'}},
    page(d){return head('Résumé · 1 page','The formal version')+
      `<div class="cv"><div class="cv-h"><div><h2>${d.name}</h2><p>${d.title} · India (IST)</p></div><button class="btn sm" data-cv>Download PDF</button></div>
      <section><h4>Summary</h4><p>${d.summary}</p></section>
      <section><h4>Experience</h4>${d.experience.map(x=>`<div class="row"><span>${x.when}</span><div><b>${x.role}</b><p>${x.text}</p></div></div>`).join('')}</section>
      <section><h4>Skills</h4><div class="chips">${d.skills.map(s=>`<span>${s}</span>`).join('')}</div></section>
      <section><h4>Education</h4><p>${d.education} <span class="ph">placeholder</span></p></section></div>`},
    click(e){if(e.target.closest('[data-cv]'))toast('Your PDF goes here on the live site.')}},

  agent:{name:'Ask Ayan',sub:'AI Agent',color:'gold',items:1,desc:'Chat with an agent that knows my work',
    data(){return{agent:'Ask Ayan',model:'your own n8n AI Agent on the live site',memory:'this conversation',tools:['search_projects','get_services','check_availability'],preview:'answers are scripted'}},
    page(){return head('AI Agent · chat','Ask anything about my work','An agent that knows my projects, services and availability. You can see which tool it uses for each answer.')+
      `<div class="chat" id="chat" aria-live="polite"><div class="msg ai">Hi! I'm Ayan's agent. Ask what Ayan has built, how a project runs, or what's free this month.</div></div>
      <div class="sugs">${QA.map(q=>`<button class="chipb" data-q="${esc(q.q)}">${esc(q.q)}</button>`).join('')}</div>
      <form class="askf"><input class="fld" id="askQ" placeholder="Type a question" autocomplete="off" aria-label="Your question"><button class="btn hot sm">Ask</button></form>
      <p class="fine">Preview: answers are scripted. On the live site this node calls your own n8n AI Agent.</p>`},
    click(e,root){const b=e.target.closest('[data-q]');if(b)ask(b.dataset.q,root)},
    submit(e,root){const i=$('#askQ',root);ask(i.value,root);i.value=''}},

  call:{name:'Book a call',sub:'Calendar',color:'gold',items:1,desc:'Pick a 30-minute slot',
    data(){return{length:'30 minutes',timezone:'IST (UTC+5:30)',cost:'free',slots:slots()}},
    page(d){return head('Calendar · 30 minutes','Pick a time to talk','A free first call. You show me the process that hurts and I tell you honestly whether I can help.')+
      `<div class="slots">${d.slots.map(s=>`<div class="day"><b>${s.day}</b>${s.times.map(t=>`<button class="slot" data-slot="${s.day}, ${t}">${t}</button>`).join('')}</div>`).join('')}</div>
      <div class="held" id="held" hidden></div><p class="fine">Times are in IST. Preview: nothing is booked. On the live site this opens your booking link.</p>`},
    click(e,root){const b=e.target.closest('[data-slot]');if(!b)return;$$('.slot',root).forEach(s=>s.classList.toggle('on',s===b));
      const h=$('#held',root);h.hidden=false;h.innerHTML=`<b>${esc(b.dataset.slot)} IST</b> selected. This is a preview, so nothing is booked yet.`}},

  contact:{name:'Send a message',sub:'Webhook',color:'gold',items:1,desc:'Write to me and watch the workflow run',
    data(){return{method:'POST',path:'/webhook/contact',fields:['name','email','message'],then:['Check details','Summarise with AI','Notify Ayan on Telegram','Send a confirmation email']}},
    page(){return head('Webhook · POST','Tell me what should run on its own','This form is the first node of a real workflow. Send it and watch each step run.')+
      `<div class="ct"><form class="form"><label>Name<input class="fld" id="ctN" required placeholder="Your name" autocomplete="name"></label><label>Email<input class="fld" id="ctE" type="email" required placeholder="you@company.com" autocomplete="email"></label>
        <label>What should run on its own?<textarea class="fld" id="ctM" required placeholder="We copy leads from our website form into a spreadsheet every morning."></textarea></label><button class="btn hot">Send and run workflow</button></form>
        <div class="ct-side"><div class="jc"><div class="jc-h">POST /webhook/contact<span class="ok">live payload</span></div><pre class="json" id="ctJ"></pre></div><div class="trace2" id="ctT" hidden></div></div></div>
      <p class="fine">Preview: nothing is sent. On the live site this form triggers your real n8n workflow.</p>`},
    ready(root){this.input(null,root)},
    input(e,root){const v=s=>$(s,root).value;$('#ctJ',root).innerHTML=hl({name:v('#ctN'),email:v('#ctE'),message:v('#ctM'),source:'ayan-canvas'})},
    submit(e,root){const box=$('#ctT',root),steps=[['Webhook received','12 ms'],['Check details','4 ms'],['Summarise with AI','880 ms'],['Notify Ayan on Telegram','210 ms'],['Send a confirmation email','340 ms']];
      box.hidden=false;box.innerHTML=`<div class="hd"><span>Execution #${1040+Math.floor(Math.random()*50)}</span><span>running</span></div>`+steps.map(s=>`<div class="wait"><span>${s[0]}</span><span>${s[1]}</span></div>`).join('');
      const rows=$$('.wait',box);rows.forEach((r,i)=>setTimeout(()=>{r.className='done';if(i===rows.length-1){box.firstChild.lastChild.textContent='succeeded in 1.4s';box.insertAdjacentHTML('beforeend','<span class="nt">Preview only. Nothing was sent.</span>')}},(i+1)*(RM?0:420)))}},

  socials:{name:'Find me online',sub:'Links',color:'gold',items:4,desc:'LinkedIn, GitHub and the rest',
    data(){return[{name:'GitHub',handle:'github.com/ayannaayak',url:'https://github.com/ayannaayak'},{name:'LinkedIn',handle:'linkedin.com/in/your-handle'},{name:'X',handle:'x.com/your-handle'},{name:'Email',handle:'hello@your-domain.com'}]},
    page(d){return head('Links · 4 items','Find me online')+
      `<div class="links">${d.map(l=>l.url?`<a class="lk" href="${l.url}" target="_blank" rel="noopener"><span><b>${l.name}</b><small>${l.handle}</small></span><span class="go">Open ↗</span></a>`:`<div class="lk"><span><b>${l.name}</b><small>${l.handle}</small></span><span class="ph">placeholder</span></div>`).join('')}</div>`}},

  surprise:{name:'Surprise me',sub:'Code',color:'rose',items:1,desc:'A random fact about me, new on every run',
    data(){if(factI<0)factI=Math.floor(Math.random()*FACTS.length);return{fact:FACTS[factI],number:factI+1,of:FACTS.length}},
    page(d){return head('Code · 1 item','One thing about me')+
      `<div class="fact"><small>Fact ${d.number} of ${d.of}</small>${d.fact}</div><button class="btn again" data-again>${ICO.play}Execute again</button>`},
    click(e){if(e.target.closest('[data-again]')){factI=(factI+1+Math.floor(Math.random()*(FACTS.length-1)))%FACTS.length;renderPage(false)}}}
};
const N=Object.keys(T).length-1;
