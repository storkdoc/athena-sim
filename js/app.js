/* athenaSim UI. SIMULATION ONLY - all data fictitious. */
(function(){
const C=SIMCORE,D=SIMDATA,S=SIMSTATE,esc=C.esc;
const $=s=>document.querySelector(s);
const ME='P1';
let viewProv=S.get('pref.prov')||ME;
let dashDay=null;

// ---------- sim date ----------
function realToday(){return C.dnFromDate(new Date());}
function curMin(){const d=new Date();return d.getHours()*60+d.getMinutes();}
function simDay(){const v=S.get('pref.date');let n=v?C.fromIso(v):realToday();return Math.min(D.RANGE_END,Math.max(D.RANGE_START,n));}
function syncNow(){D.setNow(simDay(),curMin());}
function setSimDay(n){n=Math.min(D.RANGE_END,Math.max(D.RANGE_START,n));localStorage.setItem('athenaSim.v1.pref.date',JSON.stringify(C.iso(n)));dashDay=null;syncNow();updateBanner();render();}

// ---------- helpers ----------
function pname(p,style){if(!p)return '';return style==='lf'?p.last.toUpperCase()+', '+p.first.toUpperCase():p.first+' '+(style==='mi'?p.mi+' ':'')+p.last;}
function demo(p,n){return C.ageAt(p.dob,n)+'yo F | '+C.mdy(p.dob);}
const AVC=['#9c8f86','#7f8fa6','#a08572','#8b9a7e','#a5868f','#7d8b8b','#9a8fa8','#8f8070','#7f9aa0','#a39079','#8c7f99','#999'];
function avatar(p){if(p.photo%4===0)return '<span class="av">'+esc(p.first[0]+p.last[0])+'</span>';
 const c=AVC[p.photo%AVC.length];return '<span class="av" style="background:#dcdcdf"><svg viewBox="0 0 46 46" aria-hidden="true"><rect width="46" height="46" fill="#e4e2e6"/><circle cx="23" cy="18" r="9" fill="'+c+'"/><path d="M6 46c1-10 8-15 17-15s16 5 17 15z" fill="'+c+'"/></svg></span>';}
function plink(p,txt){return '<a href="#/chart/'+p.id+'">'+esc(txt||pname(p))+'</a>';}
function prov(id){return D.provById(id)||{short:id,last:id,first:'',cred:''};}
function notify(msg){$('#notify').textContent=msg;}
function q(){const h=location.hash.split('?')[1]||'';const o={};h.split('&').filter(Boolean).forEach(kv=>{const [k,v]=kv.split('=');o[decodeURIComponent(k)]=decodeURIComponent(v||'');});return o;}
function route(){const h=(location.hash||'#/dashboard').slice(2).split('?')[0];return h.split('/').map(decodeURIComponent);}
function go(h){location.hash=h;}
function modal(title,html,onmount){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modal').classList.remove('hidden');if(onmount)onmount($('#modalBody'));}
function closeModal(){$('#modal').classList.add('hidden');$('#modalBody').innerHTML='';}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'||e.target.classList.contains('modal-x'))closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
function statusPill(s){const cls=s.split(' ')[0];return '<span class="stat '+cls+'">'+esc(s)+'</span>';}
function apptsFor(day,provId){const s=D.schedule[day];const list=(s&&s.day[provId]?s.day[provId].slice():[]);
 for(const b of D.addedAppts())if(b.day===day&&b.prov===provId&&!(S.get('appt:'+b.id)||{}).deleted)list.push(b);return list.sort((a,b)=>a.start-b.start);}
function provWorks(day,pid){const s=D.schedule[day];return !!(s&&s.day[pid]);}
function freeSlots(day,pid){const s=D.schedule[day];if(!s||!s.free[pid])return [];const taken=new Set();
 for(const v of apptsFor(day,pid)){const st=D.apptStatus(v);if(st==='Cancelled')continue;for(let m=v.start;m<v.start+v.dur;m+=10)taken.add(m);}
 const all=[];const pv=prov(pid);const half=pv.ampm[C.dow(day)];for(let m=8*60;m<16*60+50;m+=10){if(m>=12*60&&m<13*60)continue;if(half==='pm'&&m<13*60)continue;if(half==='am'&&m>=12*60)continue;if(!taken.has(m))all.push(m);}
 const fr=new Set(s.free[pid]);const blocked=all.filter(m=>!fr.has(m)&&!apptsFor(day,pid).some(v=>v.start===m));
 return {open:all.filter(m=>!blocked.includes(m)),blocked};}

// ---------- menus ----------
const MENUS=[
 ['Calendar',[['Appointments (day/week)','#/schedule'],['Schedule appointment','#/schedule?book=1'],['Find open slots','#/openslots'],['Cancelled / no-show list','#/cancellations'],'Recall',['Recall list (due / overdue)','#/recall']]],
 ['Patients',[['Find a patient','#/patients'],['Clinical Inbox','#/inbox/Lab%20%2F%20Imaging'],['Patient Cases','#/inbox/Patient%20Cases'],['OB patients (active episodes)','#/obpatients']]],
 ['Claims',[['Claim worklist','#/claims'],['Denied claims','#/claims?tab=DENIED'],['Missing slips (charges not entered)','#/claims?tab=MISSING%20SLIP'],['Claims on hold','#/claims?tab=HOLD']]],
 ['Financials',[['Payments / remittance (ERA)','#/claims?tab=CLOSED'],['Revenue summary','#/dashboard-practice']]],
 ['Reports',[['Daily practice report','#/report'],['Practice dashboard (weekly)','#/dashboard-practice'],['Report library','#/report']]],
 ['Quality',[['Quality measures (sim)','#/quality']]],
 ['Apps',[['About this simulation','#/about']]],
 ['Support',[['About this simulation','#/about'],['Reset simulation state','#/reset']]],
 ['<span class="gear" aria-label="Settings"></span>',[['Sim settings','#/about']]]];
$('#menus').innerHTML=MENUS.map((m,i)=>'<li class="'+(i>=5&&i<=7?'hide-sm':'')+'" tabindex="0">'+m[0]+'<div class="sub">'+m[1].map(x=>typeof x==='string'?'<div class="grp">'+x+'</div>':'<a href="'+x[1]+'">'+x[0]+'</a>').join('')+'</div></li>').join('');
document.querySelectorAll('.menus>li').forEach(li=>{li.addEventListener('click',e=>{if(e.target.tagName==='A'){li.classList.remove('open');li.blur();return;}document.querySelectorAll('.menus>li.open').forEach(x=>x!==li&&x.classList.remove('open'));li.classList.toggle('open');});});
document.addEventListener('click',e=>{if(!e.target.closest('.menus'))document.querySelectorAll('.menus>li.open').forEach(x=>x.classList.remove('open'));if(!e.target.closest('#psearch'))$('#psearchres').classList.remove('show');});
document.querySelectorAll('.menus .sub a').forEach(a=>a.addEventListener('click',()=>{const li=a.closest('li');li.classList.remove('open');li.style.pointerEvents='none';setTimeout(()=>li.style.pointerEvents='',300);}));
$('#rail').innerHTML='<span class="apps">&#9638;<br>Apps</span><i class="purple">a</i><i class="sq dot">A</i><i class="dot">&#9658;</i><i class="dot">&#10035;</i><i class="sq dot">&#9638;</i><i class="dot">O</i><i class="sq blue">P</i><i class="sq dot">S</i><i style="background:none;color:#2b6aa8;font-size:16px">&#10033;</i>';

// patient search
function searchPatients(qs,limit){qs=qs.trim().toLowerCase();if(!qs)return [];const parts=qs.split(/[ ,]+/).filter(Boolean);
 return D.patients.filter(p=>{const hay=(p.first+' '+p.last+' '+p.id+' '+C.mdy(p.dob)).toLowerCase();return parts.every(x=>hay.includes(x));}).slice(0,limit||25);}
$('#psearchbox').addEventListener('input',e=>{const r=searchPatients(e.target.value,12);const box=$('#psearchres');
 box.innerHTML=r.map(p=>'<a href="#/chart/'+p.id+'">'+esc(pname(p,'lf'))+' <small>#'+p.id+' &middot; '+C.mdy(p.dob)+'</small></a>').join('')||(e.target.value?'<div class="empty">No fictitious patient found</div>':'');box.classList.toggle('show',!!e.target.value);});
$('#psearch').addEventListener('submit',e=>{e.preventDefault();go('#/patients?q='+encodeURIComponent($('#psearchbox').value));$('#psearchres').classList.remove('show');});
$('#psearchres').addEventListener('click',()=>{$('#psearchres').classList.remove('show');$('#psearchbox').value='';});

// banner
function updateBanner(){const n=simDay();$('#simdate').value=C.iso(n);$('#simdate').min=C.iso(D.RANGE_START);$('#simdate').max=C.iso(D.RANGE_END);
 $('#simclock').textContent=C.shortLong(n).slice(0,3)+' '+C.fmtTime(curMin());}
$('#simprev').onclick=()=>setSimDay(simDay()-1);$('#simnext').onclick=()=>setSimDay(simDay()+1);$('#simtoday').onclick=()=>{localStorage.removeItem('athenaSim.v1.pref.date');setSimDay(realToday());};
$('#simdate').addEventListener('change',e=>{if(e.target.value)setSimDay(C.fromIso(e.target.value));});
$('#simreset').onclick=()=>{if(confirm('Reset the simulation? This clears every action you took in the sim (check-ins, closed inbox items, bookings, sign-offs). The generated fictitious data itself never changes.')){S.reset();notify('Simulation state reset. All generated fictitious data restored to its default for each date.');render();}};

function updateStatus(){const c=D.inboxCounts(ME);$('#sbA').textContent=c['Patient in Office'];$('#sbB').textContent=c['Need Followup'];$('#sbTasks').textContent=c.Total+' tasks';}

// ---------- appointment modal ----------
const FLOW=['Scheduled','Confirmed','Checked In','Intake','Exam','Sign-off','Check-out'];
function apptModal(v){
 const p=D.byId[v.pid];const st=D.apptStatus(v);
 const btn=(label,to,dis)=>'<button class="btn'+(to==='Checked In'?' primary':'')+'" data-to="'+to+'"'+(dis?' disabled':'')+'>'+label+'</button>';
 const idx=FLOW.indexOf(st);
 modal('Appointment '+v.id+' (SIM)',
  '<div style="display:flex;gap:12px;align-items:center">'+avatar(p)+'<div><div style="font-size:18px;font-weight:600">'+plink(p,pname(p,'mi'))+'<span class="simid">SIM</span></div><div>'+demo(p,D.now.day)+' &middot; #'+p.id+'</div></div></div>'+
  '<div class="kv"><div>Date / time</div><div>'+C.longDate(v.day)+' '+C.fmtTime(v.start)+' ('+v.dur+' min)</div><div>Provider</div><div>'+esc(prov(v.prov).short+' '+prov(v.prov).cred)+'</div><div>Appointment type</div><div>'+esc(D.ATYPE[v.type].name)+(v.tele?' (telehealth)':'')+'</div><div>Reason / note</div><div>'+esc(v.reason)+' // '+esc(v.initials||'')+'</div><div>Status</div><div>'+statusPill(st)+'</div><div>Insurance</div><div>'+esc(D.PAYERS[p.payer])+' &middot; '+p.memberId+'</div></div>'+
  '<div class="actions">'+btn('Check in','Checked In',!(idx<=1&&idx>=0))+btn('Start intake','Intake',st!=='Checked In')+btn('Exam','Exam',st!=='Intake')+btn('Sign-off','Sign-off',st!=='Exam')+btn('Check out','Check-out',!(st==='Sign-off'||st==='Exam'))+
  btn('Mark no-show','No Show',idx>2||idx<0)+btn('Cancel appointment','Cancelled',idx>2||idx<0)+(S.get('appt:'+v.id)?'<button class="btn" data-to="__undo">Undo my change</button>':'')+'</div>'+
  '<div><a href="#/chart/'+p.id+'">Open chart</a> &middot; <a href="#/encounter/'+v.id+'">Go to encounter</a></div>',
  body=>body.querySelectorAll('button[data-to]').forEach(b=>b.onclick=()=>{const to=b.dataset.to;
   if(to==='__undo'){S.del('appt:'+v.id);}else S.merge('appt:'+v.id,{status:to,at:D.nowAbs()});
   if(to==='Check-out')S.set('sign:'+v.id,{at:D.nowAbs()});
   closeModal();notify(to==='__undo'?'Reverted appointment status.':(to==='Check-out'?'Completed check-out for ':to==='Checked In'?'Checked in ':'Updated ')+(to==='__undo'?'':pname(p)+"'s "+C.fmtTimeC(v.start)+' appointment ('+to+').'));render();}));
}
function bookModal(day,pid,min,presetPid){
 modal('Schedule appointment (SIM)',
  '<div class="form-row"><label>Date / time</label><div>'+C.longDate(day)+' '+C.fmtTime(min)+' &middot; '+esc(prov(pid).short+' '+prov(pid).cred)+'</div></div>'+
  '<div class="form-row"><label for="bkq">Patient (fictitious)</label><input id="bkq" placeholder="Search name or SIM ID" autocomplete="off"><div id="bkres" class="dropdown" style="position:relative"></div><input type="hidden" id="bkpid"></div>'+
  '<div class="form-row"><label for="bktype">Appointment type</label><select id="bktype">'+Object.entries(D.ATYPE).map(([k,a])=>'<option value="'+k+'">'+a.name+'</option>').join('')+'</select></div>'+
  '<div class="form-row"><label for="bkreason">Reason / note</label><input id="bkreason" placeholder="e.g. rob // mq"></div>'+
  '<div class="actions"><button class="btn primary" id="bkgo">Schedule</button><button class="btn" onclick="document.querySelector(\'.modal-x\').click()">Cancel</button></div>',
  body=>{const qi=body.querySelector('#bkq'),res=body.querySelector('#bkres');
   const choose=p=>{body.querySelector('#bkpid').value=p.id;qi.value=pname(p,'lf')+' #'+p.id;res.classList.remove('show');};
   if(presetPid)choose(D.byId[presetPid]);
   qi.oninput=()=>{const r=searchPatients(qi.value,8);res.innerHTML=r.map(p=>'<a href="javascript:void 0" data-id="'+p.id+'">'+esc(pname(p,'lf'))+' <small>#'+p.id+' '+C.mdy(p.dob)+'</small></a>').join('');res.classList.toggle('show',r.length>0);res.querySelectorAll('a').forEach(a=>a.onclick=()=>choose(D.byId[a.dataset.id]));};
   body.querySelector('#bkgo').onclick=()=>{const id=body.querySelector('#bkpid').value;if(!id){alert('Choose a fictitious patient first.');return;}
    const type=body.querySelector('#bktype').value;const key='B'+day+'-'+pid+'-'+min;
    const v={id:key,pid:id,day,start:min,dur:D.ATYPE[type].slots*10,type,reason:body.querySelector('#bkreason').value||D.ATYPE[type].name.toLowerCase(),dx:'Z00.00',prov:pid,fate:'ok',confirmed:false,initials:'',booked:true,cancelDay:99999};
    S.set('book:'+key,v);closeModal();notify('Scheduled '+pname(D.byId[id])+' on '+C.mdySlash(day)+' at '+C.fmtTime(min)+'.');render();};});
}
// booked appts need apptStatus without fate issues
// ---------- dashboard ----------
function scheduleRows(day,pid){
 const list=apptsFor(day,pid);const fs=freeSlots(day,pid);
 if(!provWorks(day,pid))return '<div class="empty">No schedule for '+esc(prov(pid).short)+' on '+C.longDate(day)+(D.isClinicDay(day)?'':' (office closed)')+'.</div>';
 const rows=[];const open=new Set(fs.open);
 const items=[];for(const v of list){const st=D.apptStatus(v);if(st==='Cancelled')continue;items.push({t:v.start,v,st});}
 for(const m of fs.open)if(!items.some(i=>i.v&&i.t<=m&&m<i.t+i.v.dur))items.push({t:m,open:true});
 items.sort((a,b)=>a.t-b.t);
 for(const it of items){
  if(it.open){rows.push('<div class="appt open" data-open="'+it.t+'" data-day="'+day+'" data-prov="'+pid+'"><span></span><span class="tm">'+C.fmtTime(it.t)+'</span><span></span><span class="who">OPEN</span><span class="st"></span></div>');continue;}
  const v=it.v,p=D.byId[v.pid],st=it.st;
  const done=st==='Check-out',inoff=['Checked In','Intake','Exam','Sign-off'].includes(st);
  let s1;
  if(done)s1='Check-out';else if(st==='No Show')s1='No Show';
  else if(inoff)s1='<b>'+esc(st)+'</b>';
  else if(v.tele)s1=(v.selfCheck?'<b>Self Check-in Completed</b><span class="pipe">|</span>':'')+'Not Online';
  else s1=v.selfCheck&&v.day===D.now.day?'<b>Self Check-in Completed</b>':'';
  rows.push('<div class="appt'+(done?' done':'')+(inoff?' inoffice':'')+(st==='No Show'?' noshow':'')+'" data-appt="'+v.id+'"><span>'+(v.tele?'<span class="tele" title="Telehealth"></span>':'')+'</span><span class="tm">'+C.fmtTime(v.start)+'<small>'+v.dur+'min</small></span>'+avatar(p)+
   '<span class="who"><div class="nm">'+esc(pname(p,'mi'))+'</div><div class="demo">'+demo(p,day)+'</div></span><span class="st"><div class="s1">'+s1+'</div><div class="reason">'+esc(v.reason+(v.initials?' // '+v.initials:''))+'</div></span></div>');
 }
 return rows.join('');
}
function bindSchedule(root){root.querySelectorAll('[data-appt]').forEach(el=>el.onclick=()=>{const id=el.dataset.appt;const v=D.apptById[id]||(S.get('book:'+id));apptModal(v);});
 root.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>bookModal(+el.dataset.day,el.dataset.prov,+el.dataset.open));}
function netMessages(n){const r=C.R('net:'+n);const T=['Simulation note: sample release notes are fictitious','Practice tip (sim): close results with follow-up scheduled','Fictitious webinar: getting the most out of your inbox','Sim office closed on holidays','Sim feature preview: ambient notes for OB/GYN','Register for upcoming (fictitious) webinars','Fall release (sim): new schedule filters'];
 const out=[];for(let k=0;k<4;k++){const d=n-k*r.int(1,2);out.push([d,T[(d*7+k)%T.length]]);}return out;}
function viewDashboard(){
 const n=D.now.day;if(dashDay===null)dashDay=n;
 const sun=dashDay-C.dow(dashDay);const counts=D.inboxCounts(ME);
 const tabs=[];for(let i=0;i<7;i++){const d=sun+i;tabs.push('<div class="tab'+(d===dashDay?' on':'')+'" data-day="'+d+'">'+(d===n?'TODAY':C.DOW[C.dow(d)]+' '+C.md(d))+'</div>');}
 const sat=sun+6;const a=C.ymd(sun),b=C.ymd(sat);
 const wk='Week of '+C.MON[a.m-1]+' '+a.d+' - '+(a.m!==b.m?C.MON[b.m-1]+' ':'')+b.d+', '+b.y;
 const msgs=netMessages(n);
 $('#main').innerHTML='<div class="dash">'+
 '<section class="panel" aria-label="Inbox"><div class="phd"><span class="ttl">Inbox<span class="caret">&#9660;</span></span><span class="right">Recently Viewed <button class="plus" aria-label="Add" onclick="location.hash=\'#/patients\'">+</button></span></div>'+
 '<div class="viewby"><span class="dd">View by: Type</span></div><div class="pbd"><div class="inbox-list">'+
 D.FOLDERS.map(f=>'<a href="#/inbox/'+encodeURIComponent(f)+'" class="'+(counts[f]?'':'zero')+'"><span>'+esc(f)+'</span><span>'+counts[f]+'</span></a>').join('')+
 '<div class="total"><span>Total</span><span>'+counts.Total+'</span></div></div>'+
 '<div class="inbox-note">There are outstanding items in your practice\'s Unconfigured User inbox.<br><a href="#/inbox/Unknown%20Documents">View them in your inbox</a><br><br><span class="info-i">i</span>Items must be updated within the last 24 months to appear in the inbox.</div></div></section>'+
 '<section class="panel" aria-label="Schedule"><div class="phd"><span>'+wk+'</span><span class="right"><button class="plus" id="dashbook" aria-label="Schedule appointment">+</button></span></div>'+
 '<div class="viewby"><span class="dd" id="vbprov">View by: Provider</span><span class="sep"></span><span class="dd" id="goto">Go to</span><span style="margin-left:auto;color:#666">'+esc(prov(viewProv).short+' '+prov(viewProv).cred)+'</span></div>'+
 '<div class="weektabs"><span class="arr" id="wkprev">&#10094;</span>'+tabs.join('')+'<span class="arr" id="wknext">&#10095;</span><span class="calicon" id="wkcal" title="Open full schedule"></span></div>'+
 '<div class="pbd" id="dashsched">'+scheduleRows(dashDay,viewProv)+'</div></section>'+
 '<section class="panel netcol netbox" aria-label="Network"><div class="nethd">athenaSim Network<a href="#/schedule">SCHEDULE</a><span class="circ">&#187;</span></div><div class="pbd">'+
 '<div class="netsec"><h3>Messages</h3>'+msgs.map(m=>'<div class="d">'+C.shortLong(m[0])+'</div><a href="#/about">'+esc(m[1])+'</a>').join('')+'<div class="more"><a href="#/about">See more messages</a></div></div>'+
 '<div class="netsec"><h3>Training &amp; Resources</h3><a href="#/about">About this simulation</a><a href="#/report">Daily practice report (sim)</a><a href="#/dashboard-practice">Weekly practice dashboard (sim)</a><a href="#/recall">Recall list (sim)</a></div></div></section></div>';
 document.querySelectorAll('.weektabs .tab').forEach(t=>t.onclick=()=>{dashDay=+t.dataset.day;viewDashboard();});
 $('#wkprev').onclick=()=>{dashDay-=7;viewDashboard();};$('#wknext').onclick=()=>{dashDay+=7;viewDashboard();};
 $('#wkcal').onclick=()=>go('#/schedule?d='+C.iso(dashDay));
 $('#vbprov').onclick=e=>provMenu(e.target,()=>viewDashboard());
 $('#goto').onclick=()=>go('#/schedule?d='+C.iso(dashDay));
 $('#dashbook').onclick=()=>go('#/openslots');
 bindSchedule($('#dashsched'));
 const sc=$('#dashsched');const first=sc.querySelector('.appt:not(.done)');if(first&&dashDay===n)sc.scrollTop=Math.max(0,first.offsetTop-sc.offsetTop-110);
}
function provMenu(anchor,cb){const dd=document.createElement('div');dd.className='dropdown show';dd.style.position='absolute';const r=anchor.getBoundingClientRect();dd.style.left=r.left+'px';dd.style.top=(r.bottom+2)+'px';dd.style.minWidth='220px';
 dd.innerHTML=D.PROVIDERS.map(p=>'<a href="javascript:void 0" data-p="'+p.id+'">'+esc(p.last+', '+p.first+' '+p.cred)+(p.id===viewProv?' &#10003;':'')+'</a>').join('');document.body.appendChild(dd);
 dd.querySelectorAll('a').forEach(a=>a.onclick=()=>{viewProv=a.dataset.p;localStorage.setItem('athenaSim.v1.pref.prov',JSON.stringify(viewProv));dd.remove();cb();});
 setTimeout(()=>document.addEventListener('click',function h(e){if(!dd.contains(e.target)){dd.remove();document.removeEventListener('click',h);}}),0);}

// ---------- full schedule (day, per provider columns / week) ----------
function viewSchedule(){
 const o=q();let day=o.d?C.fromIso(o.d):D.now.day;const mode=o.view||'day';
 const head='<div class="page"><div class="phd"><span>Appointments</span><span class="right" style="font-size:13px">'+(mode==='day'?C.longDate(day):'Week of '+C.longDate(day-C.dow(day)))+'</span></div>'+
 '<div class="toolbar"><button class="btn" id="sprev">&#9664; Prev</button><button class="btn" id="stoday">Today</button><button class="btn" id="snext">Next &#9654;</button><input type="date" id="sdate" value="'+C.iso(day)+'"><span class="sep"></span><label>View <select id="smode"><option value="day"'+(mode==='day'?' selected':'')+'>Day - all providers</option><option value="week"'+(mode==='week'?' selected':'')+'>Week - one provider</option></select></label>'+
 (mode==='week'?'<label>Provider <select id="sprov">'+D.PROVIDERS.map(p=>'<option value="'+p.id+'"'+(p.id===viewProv?' selected':'')+'>'+esc(p.last+', '+p.first+' '+p.cred)+'</option>').join('')+'</select></label>':'')+
 '<span style="margin-left:auto">'+legend()+'</span></div>';
 let cols=[];
 if(mode==='day')cols=D.PROVIDERS.map(p=>({day,pid:p.id,hd:p.last+', '+p.first+' '+p.cred}));
 else{const sun=day-C.dow(day);for(let i=1;i<=5;i++)cols.push({day:sun+i,pid:viewProv,hd:C.DOW[C.dow(sun+i)]+' '+C.mdySlash(sun+i)});}
 const body='<div class="daycols" style="grid-template-columns:repeat('+cols.length+',minmax(240px,1fr))">'+cols.map(c=>{
  const fill=fillRate(c.day,c.pid);
  return '<div class="daycol"><div class="colhd">'+esc(c.hd)+(fill?'<span style="float:right;font-weight:400;font-size:12px">'+fill.booked+'/'+fill.total+' filled</span>':'')+'</div>'+daySlots(c.day,c.pid)+'</div>';}).join('')+'</div></div>';
 $('#main').innerHTML=head+body;
 const nav=d=>go('#/schedule?d='+C.iso(d)+'&view='+mode);
 $('#sprev').onclick=()=>nav(day-(mode==='week'?7:1));$('#snext').onclick=()=>nav(day+(mode==='week'?7:1));$('#stoday').onclick=()=>nav(D.now.day);
 $('#sdate').onchange=e=>nav(C.fromIso(e.target.value));$('#smode').onchange=e=>go('#/schedule?d='+C.iso(day)+'&view='+e.target.value);
 if($('#sprov'))$('#sprov').onchange=e=>{viewProv=e.target.value;localStorage.setItem('athenaSim.v1.pref.prov',JSON.stringify(viewProv));viewSchedule();};
 document.querySelectorAll('.slot [data-appt]').forEach(el=>el.onclick=()=>apptModal(D.apptById[el.dataset.appt]||S.get('book:'+el.dataset.appt)));
 document.querySelectorAll('.slot [data-open]').forEach(el=>el.onclick=()=>bookModal(+el.dataset.day,el.dataset.prov,+el.dataset.open));
 if(o.book==='1'){const fs=freeSlots(day,ME);if(fs.open&&fs.open.length)bookModal(day,ME,fs.open[0]);}
}
function legend(){return ['Confirmed','Scheduled','Checked In','Exam','Sign-off','Check-out','No Show'].map(statusPill).join(' ');}
function daySlots(day,pid){
 if(!provWorks(day,pid))return '<div class="empty">'+(D.isClinicDay(day)?'Not scheduled':'Office closed')+'</div>';
 const list=apptsFor(day,pid).filter(v=>D.apptStatus(v)!=='Cancelled');const fs=freeSlots(day,pid);const out=[];
 const all=new Set([...fs.open,...fs.blocked,...list.map(v=>v.start)]);
 [...all].sort((a,b)=>a-b).forEach(m=>{
  const v=list.find(x=>x.start===m);
  if(v){const p=D.byId[v.pid];const st=D.apptStatus(v);out.push('<div class="slot" style="min-height:'+(v.dur/10*30)+'px"><div class="t">'+C.fmtTimeC(m)+'</div><div class="b" data-appt="'+v.id+'" style="border-left-color:'+D.ATYPE[v.type].color+'"><b>'+esc(pname(p,'lf'))+'</b>'+statusPill(st)+'<br>'+esc(D.ATYPE[v.type].name)+' &middot; '+esc(v.reason)+(v.tele?' &#128249;':'')+'</div></div>');return;}
  if(list.some(x=>x.start<m&&m<x.start+x.dur))return;
  if(fs.blocked.includes(m))out.push('<div class="slot blk"><div class="t">'+C.fmtTimeC(m)+'</div><div class="b">Blocked - admin</div></div>');
  else out.push('<div class="slot open"><div class="t">'+C.fmtTimeC(m)+'</div><div class="b" data-open="'+m+'" data-day="'+day+'" data-prov="'+pid+'">Open</div></div>');});
 return out.join('');
}
function fillRate(day,pid){if(!provWorks(day,pid))return null;const fs=freeSlots(day,pid);const list=apptsFor(day,pid).filter(v=>D.apptStatus(v)!=='Cancelled');
 const booked=list.reduce((s,v)=>s+v.dur/10,0);return {booked,total:booked+fs.open.length,open:fs.open.length};}

// ---------- open slots / cancellations ----------
function viewOpenSlots(){
 const n=D.now.day;const rows=[];
 for(let d=n;d<n+14;d++)for(const p of D.PROVIDERS){if(!provWorks(d,p.id))continue;const fs=freeSlots(d,p.id);for(const m of fs.open){if(d===n&&m<D.now.min)continue;rows.push([d,p,m]);}}
 $('#main').innerHTML='<div class="page"><div class="phd">Find open appointment slots (next 14 days)</div><div class="toolbar">'+rows.length+' open slots &middot; click a slot to schedule</div><div class="pbd"><table class="grid"><thead><tr><th>Date</th><th>Time</th><th>Provider</th><th>Length</th><th></th></tr></thead><tbody>'+
 rows.slice(0,400).map(r=>'<tr><td>'+C.DOW[C.dow(r[0])]+' '+C.mdySlash(r[0])+'</td><td>'+C.fmtTime(r[2])+'</td><td>'+esc(r[1].last+', '+r[1].first+' '+r[1].cred)+'</td><td>10 min</td><td><button class="btn" data-b="'+r[0]+'|'+r[1].id+'|'+r[2]+'">Schedule</button></td></tr>').join('')+'</tbody></table></div></div>';
 document.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const [d,p,m]=b.dataset.b.split('|');bookModal(+d,p,+m);});
}
function viewCancellations(){
 const n=D.now.day;const rows=[];
 for(let d=n-14;d<=n+14;d++)for(const v of D.dayAppts(d)){const st=D.apptStatus(v);if(st==='Cancelled'||st==='No Show')rows.push([v,st]);}
 rows.sort((a,b)=>a[0].day-b[0].day||a[0].start-b[0].start);
 $('#main').innerHTML='<div class="page"><div class="phd">Cancelled and no-show appointments (14 days either side of sim date)</div><div class="pbd"><table class="grid"><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Provider</th><th>Type</th><th>Status</th><th>Next appointment</th></tr></thead><tbody>'+
 rows.map(([v,st])=>{const p=D.byId[v.pid];const nx=D.nextAppt(p,n);return '<tr><td>'+C.mdySlash(v.day)+'</td><td>'+C.fmtTime(v.start)+'</td><td>'+plink(p,pname(p,'lf'))+' <small>#'+p.id+'</small></td><td>'+esc(prov(v.prov).short)+'</td><td>'+esc(D.ATYPE[v.type].name)+'</td><td>'+statusPill(st)+'</td><td>'+(nx?C.mdySlash(nx.day)+' '+C.fmtTime(nx.start):'<span class="pill red">none</span>')+'</td></tr>';}).join('')+'</tbody></table></div></div>';
}

// ---------- inbox ----------
function itemTitle(it){return it.name;}
function viewInbox(folder){
 const o=q();const items=D.inboxItems(o.all?null:ME);const counts={};D.FOLDERS.forEach(f=>counts[f]=0);items.forEach(i=>counts[i.folder]++);
 const fu=S.list('inbox:').filter(x=>x.v.followup&&!x.v.closed);counts['Need Followup']=fu.length;
 let list=folder==='Need Followup'?fu.map(x=>x.v.item).filter(Boolean):items.filter(i=>i.folder===folder);
 const sel=o.item?list.find(i=>i.id===o.item)||null:null;
 const fl=D.FOLDERS.map(f=>'<a href="#/inbox/'+encodeURIComponent(f)+(o.all?'?all=1':'')+'" class="'+(f===folder?'on ':'')+(counts[f]?'':'zero')+'"><span>'+esc(f)+'</span><span>'+counts[f]+'</span></a>').join('');
 const rows=list.map(it=>{const p=D.byId[it.pid];return '<tr class="'+(sel&&sel.id===it.id?'sel':'')+'" data-item="'+it.id+'" style="cursor:pointer"><td>'+(it.priority==='High'||it.abn?'<span class="flag" title="Abnormal / high priority">!</span>':'')+'</td><td>'+esc(pname(p,'lf'))+'<br><small>#'+p.id+'</small></td><td>'+esc(itemTitle(it))+'<br><small>'+esc(it.vendor||'')+'</small></td><td>'+C.mdySlash(it.day)+'<br><small>'+C.fmtTime(it.min)+'</small></td><td>'+esc(prov(it.prov).short)+'</td></tr>';}).join('');
 $('#main').innerHTML='<div class="page"><div class="phd"><span>Clinical Inbox</span><span class="right" style="font-size:13px">'+(o.all?'All providers':'My inbox: '+esc(prov(ME).short+' '+prov(ME).cred))+' &middot; <a style="color:#fff;text-decoration:underline" href="#/inbox/'+encodeURIComponent(folder)+(o.all?'':'?all=1')+'">'+(o.all?'Show my inbox':'Show all providers')+'</a></span></div>'+
 '<div class="split three"><nav class="folders" aria-label="Inbox folders">'+fl+'</nav><div class="list"><div class="toolbar"><b>'+esc(folder)+'</b> &middot; '+list.length+' items'+(list.length?'<button class="btn" id="closenorm" style="margin-left:auto" title="Close all items in this folder that are not flagged abnormal">Close all normal</button>':'')+'</div><table class="grid"><thead><tr><th></th><th>Patient</th><th>Item</th><th>Received</th><th>Provider</th></tr></thead><tbody>'+(rows||'')+'</tbody></table>'+(list.length?'':'<div class="empty">No open items in this folder for the sim date.</div>')+'</div>'+
 '<div class="detail" id="idetail">'+(sel?itemDetail(sel):'<div class="empty">Select an item to review.</div>')+'</div></div></div>';
 document.querySelectorAll('[data-item]').forEach(tr=>tr.onclick=()=>go('#/inbox/'+encodeURIComponent(folder)+'?item='+encodeURIComponent(tr.dataset.item)+(o.all?'&all=1':'')));
 if($('#closenorm'))$('#closenorm').onclick=()=>{let k=0;list.forEach(it=>{if(!it.abn&&it.priority!=='High'&&it.folder!=='Patient in Office'&&it.folder!=='Encounters'){S.merge('inbox:'+it.id,{closed:true,at:D.nowAbs(),by:'sbehram3'});k++;}});notify('Closed '+k+' normal item(s) in '+folder+'.');render();};
 if(sel)bindItem(sel,folder);
}
function itemDetail(it){
 const p=D.byId[it.pid];const nx=D.nextAppt(p,D.now.day);const st=S.get('inbox:'+it.id)||{};
 let body='';
 if(it.comps)body='<table class="grid"><thead><tr><th>Component</th><th>Result</th><th>Flag</th><th>Reference</th><th>Units</th></tr></thead><tbody>'+it.comps.map(c=>'<tr><td>'+esc(c[0])+'</td><td'+(c[4]?' class="flag"':'')+'>'+esc(c[1])+'</td><td class="flag">'+esc(c[4]||'')+'</td><td>'+esc(c[2])+'</td><td>'+esc(c[3])+'</td></tr>').join('')+'</tbody></table>';
 else if(it.text)body='<div class="note">'+esc(it.text)+'</div>';
 const isEnc=it.folder==='Encounters'||it.folder==='Patient in Office';
 return '<h2>'+esc(it.name)+'</h2><div style="font-size:13px;color:#555">'+esc(it.kind)+(it.vendor?' &middot; '+esc(it.vendor):'')+'</div>'+
 '<div class="kv"><div>Patient</div><div>'+plink(p,pname(p,'mi'))+'<span class="simid">SIM</span> &middot; '+demo(p,D.now.day)+' &middot; #'+p.id+'</div><div>Received</div><div>'+C.mdySlash(it.day)+' '+C.fmtTime(it.min)+'</div>'+(it.collected!=null?'<div>Collected</div><div>'+C.mdySlash(it.collected)+'</div>':'')+
 '<div>Assigned to</div><div>'+esc(st.routed||prov(it.prov).short+' '+prov(it.prov).cred)+'</div><div>Priority</div><div>'+(it.abn||it.priority==='High'?'<span class="pill red">Abnormal / High</span>':'<span class="pill">Normal</span>')+'</div>'+
 '<div>Next appointment</div><div>'+(nx?C.DOW[C.dow(nx.day)]+' '+C.mdySlash(nx.day)+' '+C.fmtTime(nx.start)+' ('+esc(D.ATYPE[nx.type].name)+', '+esc(prov(nx.prov).short)+')':'<span class="pill amber">No future appointment</span>')+'</div>'+(st.note?'<div>Note</div><div>'+esc(st.note)+'</div>':'')+'</div>'+body+
 '<div class="actions">'+(isEnc?'<a class="btn primary" href="#/encounter/'+(it.visit||'')+'">Open encounter</a>':'<button class="btn primary" data-act="close">Review &amp; close</button><button class="btn" data-act="route">Route to&hellip;</button><button class="btn" data-act="followup">'+(st.followup?'Remove followup flag':'Flag for followup')+'</button><button class="btn" data-act="note">Add note</button><button class="btn" data-act="sched">Schedule follow-up</button><button class="btn" data-act="recall">Send to recall</button>')+'<a class="btn" href="#/chart/'+p.id+'">Open chart</a></div>';
}
function bindItem(it,folder){const p=D.byId[it.pid];
 document.querySelectorAll('#idetail [data-act]').forEach(b=>b.onclick=()=>{const a=b.dataset.act;
  if(a==='close'){S.merge('inbox:'+it.id,{closed:true,at:D.nowAbs(),by:'sbehram3',followup:false});notify('Closed '+it.name+' for '+pname(p)+'.');go('#/inbox/'+encodeURIComponent(folder));render();}
  if(a==='route'){modal('Route item (SIM)','<div class="form-row"><label>Route to</label><select id="rt">'+D.STAFF.concat(D.PROVIDERS.map(x=>x.short+' '+x.cred)).map(s=>'<option>'+esc(s)+'</option>').join('')+'</select></div><div class="form-row"><label>Note</label><textarea id="rtn" rows="3"></textarea></div><div class="actions"><button class="btn primary" id="rtgo">Route</button></div>',bd=>bd.querySelector('#rtgo').onclick=()=>{const to=bd.querySelector('#rt').value;S.merge('inbox:'+it.id,{routed:to,note:bd.querySelector('#rtn').value,closed:true,at:D.nowAbs()});closeModal();notify('Routed '+it.name+' to '+to+'.');go('#/inbox/'+encodeURIComponent(folder));render();});}
  if(a==='followup'){const s=S.get('inbox:'+it.id)||{};S.merge('inbox:'+it.id,{followup:!s.followup,item:it});render();}
  if(a==='note'){const t=prompt('Add note to this item (stored locally in the sim):');if(t){S.merge('inbox:'+it.id,{note:t});render();}}
  if(a==='sched'){go('#/openslots');setTimeout(()=>notify('Pick a slot to schedule '+pname(p)+' (search her name in the scheduling dialog).'),50);}
  if(a==='recall'){S.set('recall:'+p.id,{at:D.nowAbs(),reason:it.name,item:it.id});notify('Added '+pname(p)+' to the recall list ('+it.name+').');render();}
 });}

// ---------- chart ----------
const PROBS={OB:[['Supervision of normal pregnancy','Z34.80']],AMA:['Advanced maternal age in pregnancy','O09.529'],'GDM A1':['Gestational diabetes, diet controlled','O24.410'],'Chronic HTN':['Pre-existing hypertension in pregnancy','O10.919'],'Gestational HTN':['Gestational hypertension','O13.9'],Hypothyroidism:['Hypothyroidism','E03.9'],'Twin gestation':['Twin pregnancy, dichorionic','O30.049']};
const CHRONIC=[['Polycystic ovary syndrome','E28.2'],['Uterine leiomyoma','D25.9'],['Anxiety','F41.9'],['Hypothyroidism','E03.9'],['Iron deficiency anemia','D50.9'],['Migraine','G43.909'],['Menopausal symptoms','N95.1'],['Obesity, BMI 30-34.9','E66.9'],['Endometriosis','N80.9'],['Asthma, mild intermittent','J45.20']];
function chronic(p){const r=C.R('chr:'+p.id);const k=r.wpick([[45,0],[35,1],[15,2],[5,3]]);const out=[];for(let i=0;i<k;i++){const c=r.pick(CHRONIC);if(!out.includes(c))out.push(c);}return out;}
function allergies(p){const r=C.R('alg:'+p.id);return r.wpick([[70,[]],[15,[['Penicillins','Hives','Moderate']]],[6,[['Sulfa (sulfonamide antibiotics)','Rash','Mild']]],[5,[['Latex','Contact dermatitis','Moderate']]],[4,[['Codeine','Nausea/vomiting','Mild'],['Penicillins','Anaphylaxis','Severe']]]]);}
function meds(p,n){const out=[];const pg=D.pregAt(p,n);const r=C.R('med:'+p.id);
 if(pg&&n-pg.lmp>40)out.push(['Prenatal vitamin w/ DHA','1 tab PO daily',C.mdySlash(pg.lmp+45)]);
 if(pg&&pg.risk.includes('Chronic HTN'))out.push(['Labetalol 200 mg','1 tab PO BID',C.mdySlash(pg.lmp+60)]);
 if(pg&&(pg.risk.length||C.ageAt(p.dob,n)>=35)&&n-pg.lmp>84)out.push(['Aspirin 81 mg','1 tab PO nightly',C.mdySlash(pg.lmp+84)]);
 for(const c of chronic(p)){if(c[1]==='E03.9')out.push(['Levothyroxine 50 mcg','1 tab PO daily','01/2024']);if(c[1]==='E28.2'&&!pg)out.push(['Metformin 500 mg','1 tab PO BID','03/2024']);if(c[1]==='D50.9')out.push(['Ferrous sulfate 325 mg','1 tab PO daily','06/2024']);if(c[1]==='N95.1'&&!pg)out.push(['Estradiol 1 mg','1 tab PO daily','02/2025']);}
 if(!pg&&C.ageAt(p.dob,n)<45&&r.chance(0.35))out.push(['Norgestimate-ethinyl estradiol 0.25-35','1 tab PO daily','05/2024']);
 return out;}
function problems(p,n){const out=[];const pg=D.pregAt(p,n);
 if(pg){out.push(['Supervision of pregnancy, '+C.ga(pg.lmp,n).str,'Z3A.'+C.p2(Math.max(8,Math.min(42,C.ga(pg.lmp,n).w)))]);pg.risk.forEach(x=>PROBS[x]&&out.push(PROBS[x]));if(C.ageAt(p.dob,pg.edd)>=35&&!pg.risk.includes('AMA'))out.push(PROBS.AMA);if(pg.priorCS)out.push(['Previous cesarean delivery','O34.211']);}
 const pp=D.postpartum(p,n);if(pp)out.push(['Postpartum care and examination','Z39.2']);
 return out.concat(chronic(p));}
function chartVisits(p){return p.visits.filter(v=>v.day<=D.now.day).concat(D.addedAppts().filter(b=>b.pid===p.id));}
function viewChart(pid,tab){
 const p=D.byId[pid];if(!p){$('#main').innerHTML='<div class="page"><div class="empty">No fictitious patient '+esc(pid)+'.</div></div>';return;}
 tab=tab||'summary';const n=D.now.day;const pg=D.pregAt(p,n);const pp=D.postpartum(p,n);
 const alerts=[];if(pg)alerts.push('<span class="pill blue">OB: '+C.ga(pg.lmp,n).str+' &middot; EDD '+C.mdySlash(pg.edd)+'</span>');if(pp)alerts.push('<span class="pill green">Postpartum: delivered '+C.mdySlash(pp.end)+'</span>');
 allergies(p).forEach(a=>alerts.push('<span class="pill red">Allergy: '+esc(a[0])+'</span>'));if(!allergies(p).length)alerts.push('<span class="pill">NKDA</span>');
 const NAV=[['Chart',[['summary','Quick view / Summary'],['encounters','Encounters'],['appointments','Appointments']]],['Clinicals',[['problems','Problems'],['medications','Medications'],['allergies','Allergies'],['vitals','Vitals flowsheet'],['ob','OB episode / prenatal flowsheet'],['labs','Lab results'],['imaging','Imaging results'],['documents','Documents / consults']]],['Billing',[['billing','Claims']]]];
 const nav=NAV.map(g=>'<div class="grp">'+g[0]+'</div>'+g[1].map(t=>'<a href="#/chart/'+p.id+'/'+t[0]+'" class="'+(t[0]===tab?'on':'')+'">'+t[1]+'</a>').join('')).join('');
 $('#main').innerHTML='<div class="page"><div class="pbanner">'+avatar(p)+'<div><div class="nm">'+esc(pname(p,'mi'))+'<span class="simid">FICTITIOUS</span></div><div class="sub">'+demo(p,n)+' &middot; #'+p.id+' &middot; '+D.gp(p,n)+' &middot; '+esc(p.lang)+'</div><div class="sub">Primary: '+esc(D.PAYERS[p.payer])+' &middot; Provider: '+esc(prov(p.prov).short+' '+prov(p.prov).cred)+' &middot; '+esc(p.phone)+'</div></div><div class="alerts">'+alerts.join('')+'</div></div>'+
 '<div class="chartwrap"><nav class="chartnav">'+nav+'</nav><div class="chartbody" id="chartbody">'+chartTab(p,tab)+'</div></div></div>';
 document.querySelectorAll('#chartbody [data-appt]').forEach(el=>el.onclick=()=>apptModal(D.apptById[el.dataset.appt]||S.get('book:'+el.dataset.appt)));
 document.querySelectorAll('#chartbody [data-bookfor]').forEach(el=>el.onclick=()=>{const d=D.now.day;let found=null;for(let x=d;x<d+30&&!found;x++){const fs=freeSlots(x,p.prov);if(fs.open&&fs.open.length&&(x>d||fs.open.some(m=>m>D.now.min)))found=[x,fs.open.find(m=>x>d||m>D.now.min)];}if(found)bookModal(found[0],p.prov,found[1],p.id);});
}
function card(t,b,r){return '<div class="card"><div class="hd">'+t+(r?'<span class="r">'+r+'</span>':'')+'</div><div class="bd">'+b+'</div></div>';}
function lastVitals(p){const vs=chartVisits(p).filter(v=>v.fate==='ok'&&D.COMPLETED(D.apptStatus(v)));return vs.length?[vs[vs.length-1],D.vitals(vs[vs.length-1])]:null;}
function chartTab(p,tab){
 const n=D.now.day;
 if(tab==='summary'){
  const lv=lastVitals(p);const pg=D.pregAt(p,n);const nx=D.nextAppt(p,n);const ls=D.lastSeen(p,n);
  const res=D.patientResults(p).slice(-6).reverse();
  return '<div class="cols2"><div>'+
  card('Demographics','<div class="kv" style="margin:0"><div>Name</div><div>'+esc(pname(p,'mi'))+' (fictitious)</div><div>DOB</div><div>'+C.mdy(p.dob)+' ('+C.ageAt(p.dob,n)+'yo)</div><div>Sex</div><div>Female</div><div>Patient ID</div><div>'+p.id+'</div><div>Address</div><div>'+esc(p.addr+', '+p.city+', '+p.st+' '+p.zip)+'</div><div>Phone</div><div>'+esc(p.phone)+'</div><div>Email</div><div>'+esc(p.email)+'</div><div>Portal</div><div>'+(p.portal?'Active':'Not enrolled')+'</div><div>Pharmacy</div><div>'+esc(p.pharm)+'</div><div>Insurance</div><div>'+esc(D.PAYERS[p.payer])+' &middot; Member '+p.memberId+'</div></div>')+
  card('Problems',list(problems(p,n).map(x=>esc(x[0])+' <small>('+x[1]+')</small>')))+card('Medications',list(meds(p,n).map(m=>esc(m[0])+' <small>'+esc(m[1])+'</small>')))+
  card('Allergies',list(allergies(p).map(a=>esc(a[0])+' <small>'+esc(a[1]+', '+a[2])+'</small>'),'No known drug allergies'))+'</div><div>'+
  (pg?card('OB episode','<div class="kv" style="margin:0"><div>LMP</div><div>'+C.mdySlash(pg.lmp)+'</div><div>EDD</div><div>'+C.mdySlash(pg.edd)+'</div><div>Gestational age</div><div>'+C.ga(pg.lmp,n).str+'</div><div>Risk factors</div><div>'+(pg.risk.join(', ')||'None')+(pg.priorCS?', prior C-section':'')+'</div><div>Blood type</div><div>'+p.blood+'</div><div>Delivering hospital</div><div>'+esc(pg.hosp)+'</div></div>','<a href="#/chart/'+p.id+'/ob">Prenatal flowsheet</a>'):'')+
  card('Last vitals',lv?'<div class="kv" style="margin:0"><div>Date</div><div>'+C.mdySlash(lv[0].day)+'</div><div>BP</div><div>'+lv[1].bp+'</div><div>Weight</div><div>'+lv[1].wt+' lb</div><div>Pulse</div><div>'+lv[1].pulse+'</div><div>BMI</div><div>'+lv[1].bmi+'</div></div>':'None recorded')+
  card('Appointments','<div class="kv" style="margin:0"><div>Last seen</div><div>'+(ls?C.mdySlash(ls.day)+' &middot; '+esc(D.ATYPE[ls.type].name)+' ('+(n-ls.day)+' days ago)':'Never')+'</div><div>Next</div><div>'+(nx?C.mdySlash(nx.day)+' '+C.fmtTime(nx.start)+' &middot; '+esc(D.ATYPE[nx.type].name):'<span class="pill amber">None scheduled</span> <button class="btn" data-bookfor="1">Schedule</button>')+'</div></div>')+
  card('Recent results',res.length?'<table class="grid"><tbody>'+res.map(r=>'<tr><td>'+C.mdySlash(r.day)+'</td><td>'+esc(r.name)+'</td><td>'+(r.abn?'<span class="pill red">Abnormal</span>':'<span class="pill green">Normal</span>')+'</td></tr>').join('')+'</tbody></table>':'None')+'</div></div>';}
 if(tab==='problems')return card('Active problems','<table class="grid"><thead><tr><th>Problem</th><th>ICD-10</th><th>Status</th></tr></thead><tbody>'+problems(p,n).map(x=>'<tr><td>'+esc(x[0])+'</td><td>'+x[1]+'</td><td>Active</td></tr>').join('')+'</tbody></table>');
 if(tab==='medications')return card('Active medications','<table class="grid"><thead><tr><th>Medication</th><th>Sig</th><th>Start</th><th>Pharmacy</th></tr></thead><tbody>'+meds(p,n).map(m=>'<tr><td>'+esc(m[0])+'</td><td>'+esc(m[1])+'</td><td>'+m[2]+'</td><td>'+esc(p.pharm)+'</td></tr>').join('')+'</tbody></table>'+(meds(p,n).length?'':'<div class="empty">No active medications</div>'));
 if(tab==='allergies')return card('Allergies',allergies(p).length?'<table class="grid"><thead><tr><th>Allergen</th><th>Reaction</th><th>Severity</th></tr></thead><tbody>'+allergies(p).map(a=>'<tr><td>'+esc(a[0])+'</td><td>'+esc(a[1])+'</td><td>'+a[2]+'</td></tr>').join('')+'</tbody></table>':'No known drug allergies (NKDA)');
 if(tab==='vitals'){const vs=chartVisits(p).filter(v=>v.fate==='ok'&&D.COMPLETED(D.apptStatus(v))).slice(-14).reverse();
  return card('Vitals flowsheet','<div style="overflow:auto"><table class="grid"><thead><tr><th>Date</th><th>BP</th><th>Pulse</th><th>Temp</th><th>RR</th><th>SpO2</th><th>Weight (lb)</th><th>Height</th><th>BMI</th></tr></thead><tbody>'+vs.map(v=>{const x=D.vitals(v);return '<tr><td>'+C.mdySlash(v.day)+'</td><td'+(x.sys>=140||x.dia>=90?' class="flag"':'')+'>'+x.bp+'</td><td>'+x.pulse+'</td><td>'+x.temp+'</td><td>'+x.rr+'</td><td>'+x.spo2+'%</td><td>'+x.wt+'</td><td>'+x.ht+'</td><td>'+x.bmi+'</td></tr>';}).join('')+'</tbody></table></div>'+(vs.length?'':'<div class="empty">No vitals recorded as of the sim date.</div>'));}
 if(tab==='ob'){const eps=p.preg.filter(pg=>pg.lmp<=n).reverse();if(!eps.length)return card('OB episodes','No OB episodes.');
  return eps.map(pg=>{const vs=p.visits.filter(v=>v.preg===pg&&v.day<pg.end&&v.fate==='ok'&&v.day<=n&&D.COMPLETED(D.apptStatus(v)));const open=n<pg.end;
   return card('OB episode: LMP '+C.mdySlash(pg.lmp)+' &middot; EDD '+C.mdySlash(pg.edd)+(open?' &middot; <span class="pill blue">Active</span>':''),
   (open?'':'<div class="kv"><div>Outcome</div><div>'+(pg.outcome==='delivered'?'Delivered '+C.mdySlash(pg.end)+' at '+C.ga(pg.lmp,pg.end).str+' &middot; '+esc(pg.mode)+' &middot; '+pg.baby+' '+pg.weight+' g':pg.outcome==='sab'?'Spontaneous abortion '+C.mdySlash(pg.end):'Transferred care '+C.mdySlash(pg.end))+'</div></div>')+
   '<div style="overflow:auto"><table class="grid"><thead><tr><th>Date</th><th>GA</th><th>Wt</th><th>BP</th><th>Urine prot/glu</th><th>Edema</th><th>Fundal ht</th><th>FHR</th><th>Presentation</th><th>FM</th><th>Ctx/LOF/VB</th><th>Provider</th></tr></thead><tbody>'+
   vs.reverse().map(v=>{const x=D.vitals(v);return '<tr><td>'+C.mdySlash(v.day)+'</td><td>'+x.ga+'</td><td>'+x.wt+'</td><td'+(x.sys>=140||x.dia>=90?' class="flag"':'')+'>'+x.bp+'</td><td>'+x.uprot+' / '+x.uglu+'</td><td>'+x.edema+'</td><td>'+(x.fh||'')+'</td><td>'+(x.fhr||'')+'</td><td>'+(x.pres||'')+'</td><td>'+(x.fm||'')+'</td><td>'+x.ctx+' / '+x.lof+' / '+x.vb+'</td><td>'+esc(prov(v.prov).short)+'</td></tr>';}).join('')+'</tbody></table></div>');}).join('');}
 if(tab==='labs'||tab==='imaging'){const rs=D.patientResults(p).filter(r=>r.kind===(tab==='labs'?'Lab':'Imaging')).reverse();
  return rs.length?rs.map(r=>card(esc(r.name)+' &middot; '+C.mdySlash(r.day)+(r.abn?' <span class="pill red" style="margin-left:6px">Abnormal</span>':''),(r.comps?'<table class="grid"><thead><tr><th>Component</th><th>Result</th><th>Flag</th><th>Reference</th><th>Units</th></tr></thead><tbody>'+r.comps.map(c=>'<tr><td>'+esc(c[0])+'</td><td'+(c[4]?' class="flag"':'')+'>'+esc(c[1])+'</td><td class="flag">'+(c[4]||'')+'</td><td>'+esc(c[2])+'</td><td>'+esc(c[3])+'</td></tr>').join('')+'</tbody></table>':'<div class="note">'+esc(r.text)+'</div>'),esc(r.vendor)+' &middot; collected '+C.mdySlash(r.collected))).join(''):card(tab==='labs'?'Lab results':'Imaging results','None as of the sim date.');}
 if(tab==='documents'){const ds=D.patientDocs(p).reverse();return ds.length?ds.map(d=>card(esc(d.name)+' &middot; '+C.mdySlash(d.day),'<div class="note">'+esc(d.text)+'</div>',esc(d.vendor))).join(''):card('Documents','No documents as of the sim date.');}
 if(tab==='encounters'||tab==='appointments'){const vs=(tab==='encounters'?chartVisits(p).filter(v=>D.COMPLETED(D.apptStatus(v))):p.visits.concat(D.addedAppts().filter(b=>b.pid===p.id))).slice().sort((a,b)=>b.day-a.day||b.start-a.start);
  return card(tab==='encounters'?'Encounters':'Appointments (past and future)','<table class="grid"><thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Reason</th><th>Provider</th><th>Status</th><th></th></tr></thead><tbody>'+vs.map(v=>{const st=D.apptStatus(v);return '<tr><td>'+C.mdySlash(v.day)+'</td><td>'+C.fmtTime(v.start)+'</td><td>'+esc(D.ATYPE[v.type].name)+'</td><td>'+esc(v.reason)+'</td><td>'+esc(prov(v.prov).short)+'</td><td>'+statusPill(st)+'</td><td>'+(D.COMPLETED(st)?'<a href="#/encounter/'+v.id+'">Open</a>':'<a href="javascript:void 0" data-appt="'+v.id+'">Details</a>')+'</td></tr>';}).join('')+'</tbody></table>');}
 if(tab==='billing'){const cl=[];for(const v of p.visits){if(v.day>n||v.fate!=='ok'||!D.COMPLETED(D.apptStatus(v)))continue;const c=D.claimFor(v);if(c.charges>0)cl.push(c);}for(const pg of p.preg)if(pg.outcome==='delivered'&&pg.end<=n)cl.push(D.deliveryClaim(p,pg));
  return card('Claims',claimTable(cl.reverse()));}
 return '';
}
function list(arr,empty){return arr.length?'<ul style="margin:0;padding-left:18px">'+arr.map(x=>'<li>'+x+'</li>').join('')+'</ul>':(empty||'None');}

// ---------- encounter ----------
function viewEncounter(id){
 const v=D.apptById[id]||S.get('book:'+id);if(!v){$('#main').innerHTML='<div class="page"><div class="empty">Encounter not found.</div></div>';return;}
 const p=D.byId[v.pid];const st=D.apptStatus(v);const x=D.vitals(v);const pg=v.preg&&v.day<v.preg.end?v.preg:null;const res=D.resultsForVisit(v);
 const signed=S.get('sign:'+v.id)||(!v.unsigned&&v.day+v.signLag<D.now.day);
 const stages=['Check-in','Intake','Exam','Sign-off','Check-out'];
 const hpi=pg?p.first+' is a '+C.ageAt(p.dob,v.day)+'yo '+D.gp(p,v.day)+' at '+x.ga+' by LMP presenting for '+D.ATYPE[v.type].name.toLowerCase()+' visit. Reports '+(x.fm?'+FM, ':'')+'no VB, no LOF, '+(x.ctx==='None'?'no ctx':'irregular ctx')+'. '+(pg.risk.length?'Pregnancy complicated by '+pg.risk.join(', ')+'.':'Uncomplicated pregnancy to date.'):
  p.first+' is a '+C.ageAt(p.dob,v.day)+'yo '+D.gp(p,v.day)+' presenting for '+esc(v.reason)+'.';
 const plan=(pg?['Routine prenatal care reviewed.',x.ga&&parseInt(x.ga)>=28?'Kick counts and preterm labor/PEC precautions reviewed.':'Nausea, diet and activity counseling.']:['Counseling provided. Questions answered.']).concat(res.map(r=>'Ordered: '+r.name+'.')).concat(['Return '+(pg?(parseInt(x.ga)>=36?'in 1 week':parseInt(x.ga)>=28?'in 2 weeks':'in 4 weeks'):'as needed / 1 year for annual')+'.']);
 const note='CHIEF COMPLAINT\n'+v.reason+'\n\nHISTORY OF PRESENT ILLNESS\n'+hpi+'\n\nVITALS\nBP '+x.bp+'  P '+x.pulse+'  Wt '+x.wt+' lb  BMI '+x.bmi+(pg?'\nFHR '+(x.fhr||'n/a')+'  FH '+(x.fh||'n/a')+'  Urine prot '+x.uprot+' / glu '+x.uglu+'  Edema '+x.edema:'')+
 '\n\nPHYSICAL EXAM\nGeneral: NAD, well appearing.\nAbdomen: soft, non-tender'+(pg&&parseInt(x.ga)>=20?', gravid, size = dates':'')+'.\n'+(v.type==='WWV'?'Breast: no masses bilaterally.\nPelvic: normal external genitalia, cervix without lesions, Pap obtained.\n':'')+
 '\nASSESSMENT / PLAN\n'+(pg?'Supervision of pregnancy, '+x.ga+' ('+v.dx+')':esc(v.reason)+' ('+v.dx+')')+'\n- '+plan.join('\n- ')+'\n\n'+(signed?'Electronically signed by '+prov(v.prov).first+' '+prov(v.prov).last+', '+prov(v.prov).cred+' (SIM)':'NOT YET SIGNED')+'\n\n[SIMULATION - fictitious patient and note]';
 $('#main').innerHTML='<div class="page"><div class="pbanner">'+avatar(p)+'<div><div class="nm">'+plink(p,pname(p,'mi'))+'<span class="simid">FICTITIOUS</span></div><div class="sub">'+demo(p,v.day)+' &middot; #'+p.id+' &middot; Encounter '+C.mdySlash(v.day)+' '+C.fmtTime(v.start)+' &middot; '+esc(D.ATYPE[v.type].name)+' &middot; '+esc(prov(v.prov).short+' '+prov(v.prov).cred)+'</div></div><div class="alerts">'+statusPill(st)+(signed?'<span class="pill green">Signed</span>':'<span class="pill amber">Unsigned</span>')+'</div></div>'+
 '<div class="subtabs">'+stages.map((s,i)=>'<a href="javascript:void 0" class="'+(s==='Exam'?'on':'')+'">'+s+'</a>').join('')+'</div>'+
 '<div class="chartbody" style="padding:12px 16px"><div class="actions">'+(signed?'':'<button class="btn primary" id="signenc">Sign encounter</button>')+'<a class="btn" href="#/chart/'+p.id+'">Back to chart</a><button class="btn" id="copynote">Copy note text</button></div>'+
 card('Encounter note','<pre class="note" id="notetext">'+esc(note)+'</pre>')+
 card('Orders this visit',res.length?'<table class="grid"><tbody>'+res.map(r=>'<tr><td>'+esc(r.kind)+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.vendor)+'</td><td>'+(D.abs(r.day,r.min)<=D.nowAbs()?'Resulted '+C.mdySlash(r.day):'Pending')+'</td></tr>').join('')+'</tbody></table>':'None')+
 card('Billing',(()=>{const c=D.claimFor(v);return claimTable([c]);})())+'</div></div>';
 if($('#signenc'))$('#signenc').onclick=()=>{S.set('sign:'+v.id,{at:D.nowAbs()});notify('Completed signoff for '+pname(p)+"'s "+C.fmtTimeC(v.start)+' encounter.');render();};
 $('#copynote').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText($('#notetext').textContent);notify('Note text copied.');};
}

// ---------- claims ----------
function claimTable(cl){if(!cl.length)return '<div class="empty">No claims.</div>';
 return '<div style="overflow:auto"><table class="grid"><thead><tr><th>Claim #</th><th>Patient</th><th>DOS</th><th>Provider</th><th>Payer</th><th>Procedures</th><th>Dx</th><th>Charges</th><th>Status</th><th>Reason</th><th>Suggested fix</th><th></th></tr></thead><tbody>'+
 cl.map(c=>{const p=D.byId[c.pid];const st=c.status||D.claimStatus(c);const den=st==='DENIED'&&c.den;
  return '<tr><td>'+c.id+'</td><td>'+plink(p,pname(p,'lf'))+'<br><small>#'+p.id+'</small></td><td>'+C.mdySlash(c.dos)+'</td><td>'+esc(prov(c.prov).short)+'</td><td>'+esc(c.payer)+'</td><td>'+c.cpts.join(', ')+'</td><td>'+c.dx+'</td><td>'+C.money(c.charges)+'</td><td>'+claimPill(st)+'</td><td>'+(den?'<b>'+c.den[0]+'</b> '+esc(c.den[1]):st==='MISSING SLIP'?'Charges not entered for completed visit':st==='CLOSED'?'Paid '+C.money(c.paid):'')+'</td><td>'+(den?esc(c.den[2]):st==='MISSING SLIP'?'Enter charges from the signed encounter':'')+'</td><td>'+(den||st==='MISSING SLIP'||st==='HOLD'?'<button class="btn" data-fix="'+c.id+'">'+(st==='MISSING SLIP'?'Enter charges':'Mark corrected')+'</button>':'')+'</td></tr>';}).join('')+'</tbody></table></div>';}
function claimPill(st){const m={'DENIED':'red','MISSING SLIP':'amber','HOLD':'amber','BILLED':'blue','CLOSED':'green','RESUBMITTED':'blue'};return '<span class="pill '+(m[st]||'gray')+'">'+st+'</span>';}
function viewClaims(){
 const o=q();const tab=o.tab||'ALL';const n=D.now.day;const days=+(o.days||45);
 let cl=D.claimsWindow(n-days,n).map(c=>Object.assign(c,{status:D.claimStatus(c)}));
 const counts={};cl.forEach(c=>counts[c.status]=(counts[c.status]||0)+1);
 if(tab!=='ALL')cl=cl.filter(c=>c.status===tab);cl.sort((a,b)=>b.dos-a.dos);
 const tabs=['ALL','DENIED','MISSING SLIP','HOLD','BILLED','CLOSED','RESUBMITTED'];
 $('#main').innerHTML='<div class="page"><div class="phd">Claim worklist <span class="right" style="font-size:13px">Dates of service '+C.mdySlash(n-days)+' - '+C.mdySlash(n)+'</span></div>'+
 '<div class="subtabs">'+tabs.map(t=>'<a href="#/claims?tab='+encodeURIComponent(t)+'&days='+days+'" class="'+(t===tab?'on':'')+'">'+t+(t==='ALL'?' ('+Object.values(counts).reduce((a,b)=>a+b,0)+')':counts[t]?' ('+counts[t]+')':'')+'</a>').join('')+'</div>'+
 '<div class="toolbar">Look-back <select id="cdays">'+[14,30,45,90].map(d=>'<option'+(d===days?' selected':'')+'>'+d+'</option>').join('')+'</select> days &middot; '+cl.length+' claims shown</div><div class="pbd">'+claimTable(cl.slice(0,500))+'</div></div>';
 $('#cdays').onchange=e=>go('#/claims?tab='+encodeURIComponent(tab)+'&days='+e.target.value);
 document.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>{S.set('claim:'+b.dataset.fix,{status:'RESUBMITTED',at:D.nowAbs()});notify('Claim '+b.dataset.fix+' marked corrected and resubmitted.');render();});
}

// ---------- reports ----------
function viewReport(){
 const n=D.now.day;const ob=D.obCensus(n);
 const notSeen=ob.filter(({p})=>{const ls=D.lastSeen(p,n);return !ls||n-ls.day>28;}).map(({p,pg})=>({p,pg,ls:D.lastSeen(p,n),nx:D.nextAppt(p,n)}));
 const due=[];for(const p of D.patients)for(const pg of p.preg)if(pg.outcome!=='sab'&&pg.lmp+42<=n&&pg.end>n&&pg.edd>=n&&pg.edd<=n+30&&ob.some(o=>o.p===p))due.push({p,pg});
 due.sort((a,b)=>a.pg.edd-b.pg.edd);
 const fill=D.PROVIDERS.map(pv=>{let b=0,t=0;for(let d=n;d<n+7;d++){const f=fillRate(d,pv.id);if(f){b+=f.booked;t+=f.total;}}return {pv,b,t};});
 $('#main').innerHTML='<div class="page"><div class="phd">Daily practice report <span class="right" style="font-size:13px">'+C.longDate(n)+' (SIM)</span></div>'+
 '<div class="kpis"><div class="kpi"><div class="v">'+ob.length+'</div><div class="l">Active OB patients</div></div><div class="kpi"><div class="v">'+notSeen.length+'</div><div class="l">Pregnant, not seen in &gt; 28 days</div></div><div class="kpi"><div class="v">'+due.length+'</div><div class="l">Expected deliveries, next 30 days</div></div>'+
 fill.map(f=>'<div class="kpi"><div class="v">'+f.b+'/'+f.t+'</div><div class="l">'+esc(f.pv.short+' '+f.pv.cred)+' filled slots, next 7 days ('+(f.t?Math.round(100*f.b/f.t):0)+'%)</div></div>').join('')+'</div>'+
 '<div style="padding:0 12px 12px">'+card('Pregnant patients not seen in more than 28 days','<table class="grid"><thead><tr><th>Patient</th><th>GA</th><th>EDD</th><th>Last seen</th><th>Days</th><th>Next appointment</th></tr></thead><tbody>'+notSeen.sort((a,b)=>(a.ls?a.ls.day:0)-(b.ls?b.ls.day:0)).map(x=>'<tr><td>'+plink(x.p,pname(x.p,'lf'))+' <small>#'+x.p.id+'</small></td><td>'+C.ga(x.pg.lmp,n).str+'</td><td>'+C.mdySlash(x.pg.edd)+'</td><td>'+(x.ls?C.mdySlash(x.ls.day):'never')+'</td><td>'+(x.ls?n-x.ls.day:'')+'</td><td>'+(x.nx?C.mdySlash(x.nx.day):'<span class="pill red">none</span>')+'</td></tr>').join('')+'</tbody></table>')+
 card('Expected deliveries in the next 30 days (by EDD)','<table class="grid"><thead><tr><th>Patient</th><th>EDD</th><th>GA today</th><th>Risk</th><th>Provider</th></tr></thead><tbody>'+due.map(x=>'<tr><td>'+plink(x.p,pname(x.p,'lf'))+'</td><td>'+C.mdySlash(x.pg.edd)+'</td><td>'+C.ga(x.pg.lmp,n).str+'</td><td>'+(x.pg.risk.join(', ')||'')+(x.pg.priorCS?' prior CS':'')+'</td><td>'+esc(prov(x.p.prov).short)+'</td></tr>').join('')+'</tbody></table>')+'</div></div>';
}
function viewPracticeDash(){
 const n=D.now.day;const start=n-C.dow(n)-6;const weeks=[];
 for(let w=3;w>=0;w--){const s=n-C.dow(n)-7*w-6,e=s+6;let visits=0,newp=0,ns=0,sched=0,rev=0,charges=0;
  for(let d=s;d<=e;d++)for(const v of D.dayAppts(d)){if(d>n)continue;const st=D.apptStatus(v);if(st==='Cancelled')continue;sched++;if(st==='No Show'){ns++;continue;}if(D.COMPLETED(st)){visits++;if(v.type==='NOB'||(D.byId[v.pid].visits[0]===v))newp++;const c=D.claimFor(v);charges+=c.charges;if(D.claimStatus(c)==='CLOSED')rev+=c.paid;}}
  weeks.push({s,e,visits,newp,ns,sched,charges,rev});}
 let nextAvail=null;for(let d=n+1;d<n+60&&nextAvail===null;d++)for(const p of D.PROVIDERS)if(provWorks(d,p.id)&&freeSlots(d,p.id).open.length>2){nextAvail=d-n;break;}
 const cur=weeks[3];
 // retention: patients seen 12-24 months ago who were seen again in last 12 months
 let cohort=0,ret=0;for(const p of D.patients){const a=p.visits.some(v=>v.day>n-730&&v.day<=n-365&&v.fate==='ok');if(!a)continue;cohort++;if(p.visits.some(v=>v.day>n-365&&v.day<=n&&v.fate==='ok'))ret++;}
 $('#main').innerHTML='<div class="page"><div class="phd">Practice dashboard (weekly) <span class="right" style="font-size:13px">SIM data through '+C.mdySlash(n)+'</span></div>'+
 '<div class="kpis"><div class="kpi"><div class="v">'+cur.visits+'</div><div class="l">Completed visits (last full week)</div></div><div class="kpi"><div class="v">'+cur.newp+'</div><div class="l">New patients / new OB</div></div><div class="kpi"><div class="v">'+(cur.sched?(100*cur.ns/cur.sched).toFixed(1):0)+'%</div><div class="l">No-show rate</div></div><div class="kpi"><div class="v">'+C.money(cur.visits?cur.charges/cur.visits:0)+'</div><div class="l">Charges per visit</div></div><div class="kpi"><div class="v">'+(nextAvail==null?'60+':nextAvail)+'</div><div class="l">Days to next available appointment</div></div><div class="kpi"><div class="v">'+(cohort?Math.round(100*ret/cohort):0)+'%</div><div class="l">12-month patient retention</div></div></div>'+
 '<div style="padding:0 12px 12px">'+card('Trend (last 4 weeks)','<table class="grid"><thead><tr><th>Week</th><th>Scheduled</th><th>Completed</th><th>No-shows</th><th>New</th><th>Charges</th><th>Collected (closed claims)</th></tr></thead><tbody>'+weeks.map(w=>'<tr><td>'+C.mdySlash(w.s)+' - '+C.mdySlash(w.e)+'</td><td>'+w.sched+'</td><td>'+w.visits+'</td><td>'+w.ns+'</td><td>'+w.newp+'</td><td>'+C.money(w.charges)+'</td><td>'+C.money(w.rev)+'</td></tr>').join('')+'</tbody></table>')+
 card('Provider schedule fill (next 7 days)','<table class="grid"><thead><tr><th>Provider</th><th>Booked / total slots</th><th></th></tr></thead><tbody>'+D.PROVIDERS.map(pv=>{let b=0,t=0;for(let d=n;d<n+7;d++){const f=fillRate(d,pv.id);if(f){b+=f.booked;t+=f.total;}}const pc=t?Math.round(100*b/t):0;return '<tr><td>'+esc(pv.last+', '+pv.first+' '+pv.cred)+'</td><td>'+b+' / '+t+' ('+pc+'%)</td><td><div class="bar"><i style="width:'+pc+'%"></i></div></td></tr>';}).join('')+'</tbody></table>')+'</div></div>';
}
function viewRecall(){
 const n=D.now.day;const rows=[];
 for(const p of D.patients){const age=C.ageAt(p.dob,n);const pg=D.pregAt(p,n);const nx=D.nextAppt(p,n);
  const lastW=[...p.visits].reverse().find(v=>v.type==='WWV'&&v.day<=n&&v.fate==='ok'&&D.COMPLETED(D.apptStatus(v)));
  const manual=S.get('recall:'+p.id);
  let reason=null;
  if(manual)reason='Results / follow-up: '+manual.reason;
  else if(pg&&n-pg.lmp>=56){const ls=D.lastSeen(p,n);if((!ls||n-ls.day>28)&&!nx)reason='Pregnant ('+C.ga(pg.lmp,n).str+'), not seen in '+(ls?n-ls.day:'>28')+' days';}
  else if(!pg&&!nx&&p.visits.some(v=>v.day<=n&&v.fate==='ok')&&(!lastW||n-lastW.day>365))reason='Annual well-woman '+(lastW?'overdue (last '+C.mdySlash(lastW.day)+')':'never completed');
  if(reason)rows.push({p,reason,lastW,age});}
 rows.sort((a,b)=>/Pregnant/.test(b.reason)-/Pregnant/.test(a.reason)||/Results/.test(b.reason)-/Results/.test(a.reason));
 $('#main').innerHTML='<div class="page"><div class="phd">Recall list (due / overdue, no future appointment)<span class="right" style="font-size:13px">'+rows.length+' patients</span></div><div class="toolbar">Outreach is NOT sent from the simulation. Use this list to test recall workflows.</div><div class="pbd"><table class="grid"><thead><tr><th>Patient</th><th>Age</th><th>Reason</th><th>Contact</th><th>Portal</th><th>Provider</th><th></th></tr></thead><tbody>'+
 rows.slice(0,600).map(r=>'<tr><td>'+plink(r.p,pname(r.p,'lf'))+' <small>#'+r.p.id+'</small></td><td>'+r.age+'</td><td>'+esc(r.reason)+'</td><td>'+esc(r.p.phone)+'<br><small>'+esc(r.p.email)+'</small></td><td>'+(r.p.portal?'Yes':'No')+'</td><td>'+esc(prov(r.p.prov).short)+'</td><td><button class="btn" data-bk="'+r.p.id+'">Schedule</button></td></tr>').join('')+'</tbody></table></div></div>';
 document.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{const p=D.byId[b.dataset.bk];for(let d=n;d<n+30;d++){const fs=freeSlots(d,p.prov);if(fs.open&&fs.open.length){bookModal(d,p.prov,fs.open[0],p.id);return;}}alert('No open slots in next 30 days.');});
}
function viewOB(){const n=D.now.day;const ob=D.obCensus(n).sort((a,b)=>a.pg.edd-b.pg.edd);
 $('#main').innerHTML='<div class="page"><div class="phd">Active OB episodes <span class="right" style="font-size:13px">'+ob.length+' patients</span></div><div class="pbd"><table class="grid"><thead><tr><th>Patient</th><th>GA</th><th>EDD</th><th>Risk</th><th>Last seen</th><th>Next appt</th><th>Provider</th></tr></thead><tbody>'+
 ob.map(({p,pg})=>{const ls=D.lastSeen(p,n),nx=D.nextAppt(p,n);return '<tr><td>'+plink(p,pname(p,'lf'))+' <small>#'+p.id+'</small></td><td>'+C.ga(pg.lmp,n).str+'</td><td>'+C.mdySlash(pg.edd)+'</td><td>'+(pg.risk.join(', ')||'')+'</td><td>'+(ls?C.mdySlash(ls.day):'')+'</td><td>'+(nx?C.mdySlash(nx.day):'<span class="pill red">none</span>')+'</td><td>'+esc(prov(p.prov).short)+'</td></tr>';}).join('')+'</tbody></table></div></div>';}
function viewPatients(){const o=q();const r=o.q?searchPatients(o.q,200):[];
 $('#main').innerHTML='<div class="page"><div class="phd">Find a patient (fictitious panel of '+D.patients.length+')</div><div class="toolbar"><form id="pf"><input id="pfq" value="'+esc(o.q||'')+'" placeholder="Last, first or SIM ID or DOB" style="width:280px"> <button class="btn primary">Search</button></form></div><div class="pbd"><table class="grid"><thead><tr><th>Name</th><th>ID</th><th>DOB</th><th>Age</th><th>Phone</th><th>Insurance</th><th>Status</th></tr></thead><tbody>'+
 r.map(p=>{const pg=D.pregAt(p,D.now.day);return '<tr><td>'+plink(p,pname(p,'lf'))+'</td><td>'+p.id+'</td><td>'+C.mdy(p.dob)+'</td><td>'+C.ageAt(p.dob,D.now.day)+'</td><td>'+esc(p.phone)+'</td><td>'+esc(D.PAYERS[p.payer])+'</td><td>'+(pg?'<span class="pill blue">OB '+C.ga(pg.lmp,D.now.day).str+'</span>':'')+'</td></tr>';}).join('')+'</tbody></table>'+(o.q&&!r.length?'<div class="empty">No matches</div>':'')+(o.q?'':'<div class="empty">Search the fictitious panel. Try a common first name such as "Maya".</div>')+'</div></div>';
 $('#pf').onsubmit=e=>{e.preventDefault();go('#/patients?q='+encodeURIComponent($('#pfq').value));};}
function viewAbout(){
 $('#main').innerHTML='<div class="page"><div class="phd">About this simulation</div><div style="padding:14px 18px;max-width:900px;line-height:1.5">'+
 '<p><b>This is a SIMULATION.</b> Every patient, name, date of birth, ID, phone number, address, result, note and claim is fictitious and generated by code. Patient IDs start with <code>SIM</code>; phone numbers use the 555 range; emails use <code>example.test</code>. Nothing here is connected to any real EHR, practice or person, and nothing is ever sent.</p>'+
 '<p>It is a test environment styled after an OB/GYN ambulatory EHR workspace (dashboard, schedule, clinical inbox, chart, encounters, claims, reports). It is an independent re-creation and is not affiliated with, endorsed by, or using any code or assets of any EHR vendor.</p>'+
 '<p><b>Time.</b> Use the sim date control in the red banner to move the calendar between '+C.mdySlash(D.RANGE_START)+' and '+C.mdySlash(D.RANGE_END)+'. The time of day follows your real clock. Data is generated deterministically from seed <code>'+D.SEED+'</code>: the same date always yields the same schedule, results, inbox and claims. Past days show completed history; future days show booked appointments.</p>'+
 '<p><b>Your actions</b> (check-ins, sign-offs, closed or routed inbox items, bookings, claim fixes) are stored in this browser\'s localStorage only. <a href="#/reset">Reset simulation state</a>.</p>'+
 '<p><b>For automation:</b> <code>window.SIMDATA</code> exposes the generator (read-only use recommended). Pages are hash-routed: <code>#/dashboard</code>, <code>#/schedule?d=YYYY-MM-DD&amp;view=day|week</code>, <code>#/inbox/&lt;Folder&gt;</code>, <code>#/chart/&lt;SIM id&gt;/&lt;tab&gt;</code>, <code>#/encounter/&lt;appt id&gt;</code>, <code>#/claims?tab=DENIED</code>, <code>#/report</code>, <code>#/dashboard-practice</code>, <code>#/recall</code>. Add <code>?simdate=YYYY-MM-DD</code> to the page URL to start on a date.</p></div></div>';}

// ---------- router ----------
function render(){
 syncNow();updateBanner();
 const r=route();const k=r[0]||'dashboard';
 try{
 if(k==='dashboard')viewDashboard();else if(k==='schedule')viewSchedule();else if(k==='inbox')viewInbox(r[1]||'Lab / Imaging');
 else if(k==='chart')viewChart(r[1],r[2]);else if(k==='encounter')viewEncounter(r[1]);else if(k==='claims')viewClaims();
 else if(k==='report')viewReport();else if(k==='dashboard-practice')viewPracticeDash();else if(k==='recall')viewRecall();
 else if(k==='openslots')viewOpenSlots();else if(k==='cancellations')viewCancellations();else if(k==='obpatients')viewOB();
 else if(k==='patients')viewPatients();else if(k==='about')viewAbout();
 else if(k==='reset'){$('#simreset').click();go('#/dashboard');return;}
 else if(k==='quality'){$('#main').innerHTML='<div class="page"><div class="phd">Quality</div><div class="empty">Quality measures are not simulated yet.</div></div>';}
 else if(k==='loggedout'){$('#main').innerHTML='<div class="page"><div class="empty">You are "logged out" of the simulation. <a href="#/dashboard">Log back in</a></div></div>';}
 else viewDashboard();
 }catch(e){console.error(e);$('#main').innerHTML='<div class="page"><div class="empty">Sim error: '+esc(e.message)+'</div></div>';}
 updateStatus();
}
window.addEventListener('hashchange',()=>{closeModal();render();});
// start
setTimeout(()=>{
 const t0=performance.now();
 const sp=new URLSearchParams(location.search);if(sp.get('simdate'))localStorage.setItem('athenaSim.v1.pref.date',JSON.stringify(sp.get('simdate')));
 D.init();syncNow();
 window.SIM_GEN_MS=Math.round(performance.now()-t0);
 $('#loading').classList.add('hidden');
 if(!location.hash)location.hash='#/dashboard';render();
 let lastMin=curMin();setInterval(()=>{updateBanner();const m=curMin();if(m!==lastMin){lastMin=m;const k=route()[0]||'dashboard';if(['dashboard'].includes(k)&&$('#modal').classList.contains('hidden')){const sc=$('#dashsched');const st=sc?sc.scrollTop:0;render();const sc2=$('#dashsched');if(sc2)sc2.scrollTop=st;}}},15000);
},20);
})();
