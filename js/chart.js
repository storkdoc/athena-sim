/* athenaSim patient chart: banner, icon rail, slide-out panels, editable encounters, result documents.
   SIMULATION ONLY - all data fictitious. */
(function(){
const C=SIMCORE,D=SIMDATA,S=SIMSTATE,A=SIMAPP,esc=C.esc;
const $=s=>document.querySelector(s);
const DEPT='SIM_CNGRSL_MAIN';
const MAUVE='#b06f96';
const ic=(p)=>'<svg viewBox="0 0 24 24" fill="none" stroke="'+MAUVE+'" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
const ICONS={
 find:ic('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/>'),
 allergies:ic('<path d="M8 12V5.5a1.5 1.5 0 013 0V11M11 10V4a1.5 1.5 0 013 0v7M14 10.5V6a1.5 1.5 0 013 0v8c0 4-2.5 7-6 7-2.5 0-4-1.2-5.2-3L3.5 14a1.6 1.6 0 012.6-1.8L8 14"/>'),
 problems:ic('<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)"/><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/>'),
 meds:ic('<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.2 7.6l5.6 8.8"/>'),
 vaccines:ic('<path d="M17 3l4 4M19 5l-9.5 9.5M14 4l6 6M8 12l4 4M6.5 13.5l4 4L7 21l-4-4z"/>'),
 vitals:ic('<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/><path d="M6 12h3l1.5-2.5L13 15l1.5-3H18"/>'),
 results:ic('<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 006.2 21h11.6a2 2 0 001.7-2.5L14 9V3"/><path d="M7.5 15h9"/>'),
 visits:ic('<rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M9 7V4.5h6V7M12 10.5v6M9 13.5h6"/>'),
 history:ic('<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4V2.8h6V4M8.5 9.5h7M8.5 13h7M8.5 16.5h4"/>'),
 quality:ic('<circle cx="12" cy="9" r="5.5"/><path d="M8.7 13.5L7 21l5-2.5 5 2.5-1.7-7.5"/>'),
 care:ic('<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6M14 14.5c3.5-.5 6.5 1.5 7 5"/>'),
 apps:ic('<rect x="4" y="4" width="6.5" height="6.5"/><rect x="13.5" y="4" width="6.5" height="6.5"/><rect x="4" y="13.5" width="6.5" height="6.5"/><path d="M16.75 13.5v6.5M13.5 16.75H20"/>')};
const RAIL=[['find','Find'],['allergies','Allergies'],['problems','Problems'],['meds','Meds'],['vaccines','Vaccines'],['vitals','Vitals'],['results','Results'],['visits','Visits'],['history','History'],['quality','Quality'],['care','Care'],['apps','Apps']];
const VTITLE={NOB:'New OB Visit',ROB:'OB Visit',PP:'Postpartum Visit',INC:'Postop Visit',WWV:'Wellness Visit',PROB:'Office Visit',TELE:'Virtual Visit',COLPO:'Colposcopy',PROC:'Procedure Visit',US:'Ultrasound Visit'};
const now=()=>D.now;
function pv(id){return D.provById(id)||{full:id,bfull:id,cred:''};}
function provLine(id){const p=pv(id);return p.full+', '+p.cred+', OB/GYN';}
function upper(id){const p=pv(id);return (p.bfull+', '+p.cred).toUpperCase();}
function fmtDT(day,min){return C.mdy(day)+' '+C.fmtTime(min);}
function absToDT(a){return fmtDT(Math.floor(a/1440),a%1440);}
let cur={};          // current render context
let landTab='last';let visitShow='all';let visitAll=false;let resTab='lab';let collapsed=false;

// ---------- visit state ----------
function visitsOf(p){return p.visits.concat(D.addedAppts().filter(b=>b.pid===p.id));}
function vStatus(v){
 const st=D.apptStatus(v);const n=now().day;
 if(st==='Cancelled')return 'CANCELLED';if(st==='No Show')return 'NO SHOW';
 if(S.get('sign:'+v.id))return 'CLOSED';
 const started=v.day<n||(v.day===n&&!['Scheduled','Confirmed'].includes(st));
 if(!started)return 'UPCOMING';
 if(v.booked)return 'OPEN';
 if(v.day<n-10)return 'CLOSED';
 if(v.unsigned||v.day+v.signLag>=n)return 'OPEN';
 return D.COMPLETED(st)?'CLOSED':'OPEN';
}
function vTitle(v,withState){const t=VTITLE[v.type]||'Office Visit';const s=vStatus(v);
 if(!withState)return t;if(s==='UPCOMING')return t.toLowerCase()+' (upcoming)';if(s==='OPEN')return t+' (OPEN)';if(s==='CANCELLED')return t+' (CANCELLED)';if(s==='NO SHOW')return t+' (NO SHOW)';return t;}
function genEnc(v){
 const p=D.byId[v.pid];const x=D.vitals(v);const pg=v.preg&&v.day<v.preg.end?v.preg:null;const res=D.resultsForVisit(v);
 const age=C.ageAt(p.dob,v.day);
 const hpi=pg?p.first+' is a '+age+'yo '+D.gp(p,v.day)+' at '+x.ga+' presenting for '+VTITLE[v.type].toLowerCase()+'. Reports '+(x.fm?'+FM, ':'')+'no VB, no LOF, '+(x.ctx==='None'?'no ctx':'irregular ctx')+'. '+(pg.risk.length?'Pregnancy complicated by '+pg.risk.join(', ')+'.':'Uncomplicated pregnancy to date.')
  :p.first+' is a '+age+'yo '+D.gp(p,v.day)+' presenting for '+v.reason+'. Symptoms and history reviewed with patient.';
 const ros={};['Constitutional','Cardiovascular','Respiratory','Gastrointestinal','Genitourinary'].forEach(k=>ros[k]={st:'neg',note:''});
 const pe={General:{normal:true,note:'NAD, well appearing'},Abdomen:{normal:true,note:pg&&parseInt(x.ga)>=20?'soft, gravid, size = dates':'soft, non-tender'}};
 if(v.type==='WWV'){pe.Breasts={normal:true,note:'no masses bilaterally'};pe.Pelvic={normal:true,note:'normal external genitalia, cervix without lesions'};}
 const plan=(pg?['Routine prenatal care reviewed.']:['Counseling provided.']).concat(res.map(r=>'Ordered: '+r.name+'.'));
 return {reason:v.reason,hpi,ros,screening:{'Depression (PHQ-2)':'Negative','Intimate partner violence':'Negative','Tobacco use':'Never'},pe,
  ap:[{dx:pg?'Supervision of pregnancy, '+x.ga:v.reason,code:v.dx,plan:plan.join(' ')}],proc:v.type==='WWV'?{type:'Pap smear',note:'Specimen collected without difficulty.'}:{type:'',note:''},
  vitals:{bp:x.bp,pulse:String(x.pulse),wt:String(x.wt),temp:x.temp,fhr:x.fhr?String(x.fhr):'',fh:x.fh?String(x.fh):'',uprot:x.uprot||''},gen:true};
}
function encData(v){const s=S.get('enc:'+v.id);if(s)return s;const st=vStatus(v);if(st==='CLOSED'&&!v.booked)return genEnc(v);return {reason:'',hpi:'',ros:{},screening:{},pe:{},ap:[],proc:{type:'',note:''},vitals:{}};}
function saveEnc(v,patch){const e=Object.assign({},encData(v),patch);delete e.gen;S.set('enc:'+v.id,e);}

// ---------- results ----------
function labsOf(p){return D.patientResults(p).filter(r=>r.kind==='Lab').sort((a,b)=>D.abs(b.day,b.min)-D.abs(a.day,a.min));}
function imgsOf(p){return D.patientResults(p).filter(r=>r.kind==='Imaging').sort((a,b)=>D.abs(b.day,b.min)-D.abs(a.day,a.min));}
function findResult(p,id){return D.patientResults(p).find(r=>r.id===id);}
function resOpen(r){return D.itemOpen(r);}
function resState(r){return S.get('res:'+r.id)||{};}
function resStatus(r){return resOpen(r)?'REVIEW':'CLOSED';}
function resAssigned(r){const s=resState(r);if(resStatus(r)==='CLOSED')return 'nobody';return s.assigned||upper(r.prov);}
function resHistory(r){
 const rows=[[D.abs(r.day,r.min),'Lab Result Received','INTERFACE','REVIEW',r.abn?'High':'Normal',upper(r.prov),r.kind==='Lab'?'Lab Result From Interface':'Imaging Result From Interface']];
 const ib=S.get('inbox:'+r.id);const st=resState(r);
 if(!ib&&!resOpen(r)){const k=Math.min(D.AUTOCLOSE_DAYS,(r.abn?3:1));rows.push([D.abs(r.day+k,8*60+Math.floor(C.h01(r.id)*500)),'Close','SBEHRAM3','CLOSED','',  'nobody','Reviewed (sim history)']);}
 (st.history||[]).forEach(h=>rows.push([h.at,h.action,h.by||'SBEHRAM3',h.status,h.priority||'',h.assigned||'',h.note||'']));
 return rows.sort((a,b)=>a[0]-b[0]);
}
function addHistory(id,h){const s=S.get('res:'+id)||{};s.history=(s.history||[]).concat([Object.assign({at:D.nowAbs(),by:'SBEHRAM3'},h)]);S.set('res:'+id,s);}
function flagOf(r){if(r.abn)return 'abnormal';if(r.comps&&r.comps.some(c=>!isNaN(parseFloat(c[1]))))return 'normal';if(r.comps)return 'normal';return 'unknown';}
function sameCode(p,r){return D.patientResults(p).filter(x=>x.code===r.code&&D.abs(x.day,x.min)<=D.abs(r.day,r.min)).sort((a,b)=>a.day-b.day);}

// ---------- banner ----------
function banner(p){
 const n=now().day;const fut=visitsOf(p).filter(v=>vStatus(v)==='UPCOMING').sort((a,b)=>a.day-b.day||a.start-b.start);
 const nx=fut[0];const age=C.ageAt(p.dob,n);
 const photo=A.avatar(p).replace('class="av"','class="cb-photo"');
 const cell=(lbl,k,t,more,cls)=>'<div class="cb-cell '+(cls||'')+'"><span class="lbl">'+lbl+'</span><span class="val">'+(k?'<span class="k">'+k+'</span>':'')+'<span class="t">'+esc(t)+'</span>'+(more?'<span class="more">+'+more+'</span>':'')+'</span></div>';
 return '<div class="cb" role="banner" aria-label="Patient banner"><div class="cb-id">'+photo+'<div><div class="cb-nm">'+esc(p.first)+'<span class="lst">'+esc(p.last.toUpperCase())+'</span></div><div class="cb-legal">Legal: '+esc(p.first+' '+p.middle+' '+p.last.toUpperCase())+'</div>'+
 '<div class="cb-l2">'+age+'yo F | she/her | '+C.mdy(p.dob)+' | #'+p.id+' | '+p.eid+' <span class="cb-chip">'+esc(p.lang.slice(0,3).toUpperCase())+'</span><span class="cb-notes" title="Patient notes"></span></div></div><span class="cb-down" id="cbdown" title="More patient info">&#9660;</span></div>'+
 '<div class="cb-cells">'+cell('Contact','Mobile',p.phone,p.mobile2?1:0)+cell('Appointments','Next',nx?(nx.tele?'Virtual Visit ':VTITLE[nx.type]+' ')+C.mdy(nx.day)+' '+C.fmtTime(nx.start):'None',fut.length>1?fut.length-1:0)+
 cell('Provider','',pv(p.prov).bfull+', '+pv(p.prov).cred)+cell('Insurance','Primary',D.PAYERS[p.payer],p.secondary?1:0)+cell('Patient Dismissed','','N/A',0,'na opt')+cell('Accommodations Needed','','N/A',0,'na opt')+cell('Research','','N/A',0,'na opt')+'</div>'+
 '<div class="cb-opts"><span>Banner Options &#9881;</span><span class="ham"><i></i><i></i><i></i></span></div>'+
 '<div class="cb-expand" id="cbexpand"><b>'+esc(p.first+' '+p.middle+' '+p.last)+'</b> (fictitious)<br>'+esc(p.addr+', '+p.city+', '+p.st+' '+p.zip)+'<br>'+esc(p.email)+'<br>Pharmacy: '+esc(p.pharm)+'<br>Primary: '+esc(D.PAYERS[p.payer])+' &middot; '+p.memberId+(p.secondary?'<br>Secondary: '+esc(p.secondary):'')+'<br>Blood type: '+p.blood+' &middot; '+D.gp(p,n)+'</div></div>';
}
function rail(p,panel){const nAll=allergyList(p).length;
 return '<nav class="crail" aria-label="Chart navigation">'+RAIL.map(([k,l])=>'<a href="#/chart/'+p.id+(panel===k?'':'/'+k)+'" class="'+(panel===k?'on':'')+'" data-rail="'+k+'" title="'+l+'">'+ICONS[k]+'<span>'+l+'</span>'+(k==='allergies'&&nAll?'<span class="badge">'+nAll+'</span>':'')+'</a>').join('')+'</nav>';}

// ---------- clinical lists (generated + user additions) ----------
function extra(p,k){return S.get('chart:'+p.id+':'+k)||[];}
function addExtra(p,k,item){S.set('chart:'+p.id+':'+k,extra(p,k).concat([item]));}
function allergyList(p){return A.allergies(p).map(a=>({name:a[0],reaction:a[1],sev:a[2]})).concat(extra(p,'allergies'));}
function problemList(p){return A.problems(p,now().day).map(x=>({name:x[0],code:x[1]})).concat(extra(p,'problems'));}
function medList(p){const dc=new Set(extra(p,'medsdc'));return A.meds(p,now().day).map(m=>({name:m[0],sig:m[1],start:m[2]})).concat(extra(p,'meds')).filter(m=>!dc.has(m.name));}
function vaccineList(p){const n=now().day;const r=C.R('vax:'+p.id);const out=[];
 for(let y=2022;y<=2027;y++){const d=C.dn(y,10,1)+r.int(0,50);if(d<=n&&r.chance(0.6))out.push({name:'Influenza, seasonal (SIM)',date:d,by:'administered in office'});}
 for(const pg of p.preg){const d=pg.lmp+r.int(27,33)*7;if(d<=n&&d<pg.end)out.push({name:'Tdap',date:d,by:'administered in office (pregnancy)'});}
 if(r.chance(0.7)){const d=C.dn(2024,r.int(9,12),r.int(1,28));if(d<=n)out.push({name:'COVID-19 vaccine, 2024-2025 formula (SIM)',date:d,by:'reported by patient'});}
 if(C.ageAt(p.dob,C.dn(2025,1,1))<27&&r.chance(0.6))out.push({name:'HPV 9-valent (series complete)',date:p.dob+365*14,by:'historical'});
 return out.concat(extra(p,'vaccines')).sort((a,b)=>b.date-a.date);}

// ---------- landing ----------
function landing(p){
 const n=now().day;const al=allergyList(p),pr=problemList(p),md=medList(p);
 const vs=visitsOf(p).filter(v=>v.day<=n&&!['CANCELLED','NO SHOW','UPCOMING'].includes(vStatus(v))).sort((a,b)=>b.day-a.day||b.start-a.start);
 const last=vs[0];
 const pending=[];for(const v of visitsOf(p)){if(v.day>n||v.day<n-120||v.fate!=='ok')continue;if(!D.COMPLETED(D.apptStatus(v))&&v.day===n)continue;for(const r of D.resultsForVisit(v))if(D.abs(r.day,r.min)>D.nowAbs())pending.push({r,v});}
 const fut=visitsOf(p).filter(v=>vStatus(v)==='UPCOMING').sort((a,b)=>a.day-b.day||a.start-b.start).slice(0,3);
 let lastHtml='None recorded';
 if(last){const e=encData(last);lastHtml='<div><a class="bluelink" href="#/chart/'+p.id+'/visits/'+last.id+'">'+esc(vTitle(last,false))+', '+C.mdy(last.day)+(vStatus(last)==='OPEN'?' (OPEN)':'')+'</a></div><div class="vsub">'+esc(last.reason)+'</div><div class="vsub">Performed by '+esc(provLine(last.prov))+', (555) 555-0100</div><div class="vsub" style="margin-top:3px">'+(e.ap&&e.ap.length?e.ap.map(a=>esc(a.dx)+(a.code?' ('+esc(a.code)+')':'')).join('<br>'):'None recorded')+'</div>';}
 const recent=D.patientResults(p).map(r=>({t:D.abs(r.day,r.min),h:esc(r.name)+' <span class="gray">'+r.kind+' result</span>',href:'#/chart/'+p.id+'/results/'+r.id})).concat(D.patientDocs(p).map(d=>({t:D.abs(d.day,d.min),h:esc(d.name)+' <span class="gray">document</span>',href:'#/chart/'+p.id+'/history'}))).concat(D.patientCases(p.id).map(c=>({t:D.abs(c.day,c.min),h:esc(c.name)+' <span class="gray">'+esc(c.kind)+'</span>',href:'#/chart/'+p.id+'/visits'}))).sort((a,b)=>b.t-a.t).slice(0,8);
 const li=(arr,f)=>arr.length?'<ul>'+arr.map(f).join('')+'</ul>':'<div class="none">None recorded</div>';
 return '<div class="land"><div class="lcard"><div class="hb"><span class="plus" id="piplus" title="Expand personal info">+</span>PERSONAL INFO</div><div class="bb"><div id="pidetail" style="display:none;font-size:12px;color:#444;margin-bottom:8px">'+esc(p.addr+', '+p.city+', '+p.st+' '+p.zip)+' &middot; '+esc(p.phone)+' &middot; '+esc(p.email)+'<br>Language: '+esc(p.lang)+' &middot; Portal: '+(p.portal?'active':'not enrolled')+' &middot; Pharmacy: '+esc(p.pharm)+'</div><div class="pi"><div>'+
 '<h5>Allergies</h5>'+(al.length?'<ul>'+al.map(a=>'<li><a href="#/chart/'+p.id+'/allergies">'+esc(a.name)+'</a></li>').join('')+'</ul>':'<ul><li>NKDA</li></ul>')+
 '<h5>Problems</h5>'+li(pr,x=>'<li><a href="#/chart/'+p.id+'/problems">'+esc(x.name)+'</a></li>')+'</div><div>'+
 '<h5>Medications<span class="gear2" title="Medication settings"></span></h5>'+li(md,m=>'<li><a href="#/chart/'+p.id+'/meds">'+esc(m.name)+'</a></li>')+'</div></div></div></div>'+
 '<div><div class="lcard"><div class="rtabs"><a data-lt="last" class="'+(landTab==='last'?'on':'')+'">Last Visit with OB/GYN</a><a data-lt="recent" class="'+(landTab==='recent'?'on':'')+'">Recent Activity</a><span class="gear2" title="Settings"></span></div><div class="bb">'+
 (landTab==='last'?lastHtml:(recent.length?recent.map(x=>'<div class="ord"><a href="'+x.href+'">'+x.h+'</a><span class="dt">'+absToDT(x.t).slice(0,10)+'</span></div>').join(''):'None recorded'))+'</div></div>'+
 '<div class="lcard"><div class="ttl2">Outstanding Orders</div><div class="bb"><div class="sub2">OB/GYN</div>'+(pending.length?pending.map(({r,v})=>'<div class="ord"><span>'+esc(r.name)+'-'+String(r.num).slice(-6)+'-P (followup)</span><span class="dt">'+C.mdy(v.day)+'</span></div><div class="gray">'+esc(pv(v.prov).bfull+', '+pv(v.prov).cred)+', OB/GYN</div>').join(''):'<div class="gray">No outstanding orders</div>')+
 '<div class="sub2">Other Specialties</div><div class="gray">No outstanding orders</div></div></div>'+
 '<div class="lcard"><div class="ttl2">Follow Up</div><div class="bb">'+(fut.length?fut.map(v=>'<div style="font-size:12px;margin-top:3px">'+C.mdy(v.day)+' at '+C.fmtTime(v.start)+' for '+esc((v.tele?'virtual visit':VTITLE[v.type]).toLowerCase())+(v.day===n?' (today)':'')+'</div><div class="gray">'+esc(pv(v.prov).full+', '+pv(v.prov).cred)+' | '+DEPT+' | '+esc(v.reason)+'</div>').join(''):'<div class="gray">No follow up scheduled</div>')+'</div></div></div></div>';
}

// ---------- visits panel ----------
function visitEvents(p){
 const n=now().day;
 const vs=visitsOf(p).filter(v=>v.day<=n+180).map(v=>({kind:'visit',v,t:D.abs(v.day,v.start)}));
 const cs=D.patientCases(p.id).filter(c=>c.folder==='Patient Cases'||c.folder==='Orders / Rxs / Auths').map(c=>({kind:'case',c,t:D.abs(c.day,c.min)}));
 let ev=vs.concat(cs);if(visitShow==='visits')ev=vs;if(visitShow==='cases')ev=cs;
 const up=ev.filter(e=>e.kind==='visit'&&vStatus(e.v)==='UPCOMING').sort((a,b)=>a.t-b.t);
 const rest=ev.filter(e=>!(e.kind==='visit'&&vStatus(e.v)==='UPCOMING')).sort((a,b)=>b.t-a.t);
 return {list:up.concat(rest),total:vs.length+cs.length,nv:vs.length,nc:cs.length};
}
function visitsPanel(p,selId,docked){
 const ev=visitEvents(p);const lim=visitAll?ev.list.length:Math.min(ev.list.length,Math.max(4,ev.list.findIndex(e=>e.kind==='visit'&&e.v.id===selId)+1));
 const rows=ev.list.slice(0,lim).map(e=>{
  if(e.kind==='case'){const c=e.c;const open=D.itemOpen(c);return '<a class="vrow" href="#/chart/'+p.id+'/visits/case:'+c.id+'" data-case="'+c.id+'"><div class="t">'+esc(c.kind==='Patient case'?'Patient Case':c.kind)+(open?' (OPEN)':'')+'</div><div class="d">'+esc(c.name)+'</div><div class="g">'+fmtDT(c.day,c.min)+', '+esc(pv(c.prov).full+', '+pv(c.prov).cred)+'</div></a>';}
  const v=e.v;const sel=v.id===selId;const enc=encData(v);
  const dx=enc.ap&&enc.ap.length?enc.ap.map(a=>esc(a.dx)).join('<br>'):'';const ords=v.fate==='ok'&&vStatus(v)!=='UPCOMING'?D.resultsForVisit(v).map(r=>esc(r.name)).join('<br>'):'';
  return '<a class="vrow'+(sel?' sel':'')+'" href="#/chart/'+p.id+'/visits/'+v.id+'" data-visit="'+v.id+'"><div class="t">'+esc(vTitle(v,true))+'</div><div class="d">'+DEPT+'</div><div class="d">'+esc(v.reason)+'</div><div class="g">'+fmtDT(v.day,v.start)+', '+esc(provLine(v.prov))+'</div>'+(sel?'<div class="inner">'+(dx||ords?(dx?'<b>Dx:</b> '+dx:'')+(ords?'<br><b>Orders:</b> '+ords:''):'No diagnoses or orders')+'</div>':'')+'</a>';}).join('');
 return '<aside class="cslide'+(docked?' docked':'')+'" aria-label="Visits and Cases"><div class="sh">Visits and Cases'+(docked?'<button class="collapse" id="collapse" title="Collapse" style="margin-left:auto">&laquo;</button>':'<a class="x" href="#/chart/'+p.id+'" title="Close">&times;</a>')+'</div>'+
 '<div class="ss">Arrange by: <span class="dd">Specialty &#9662;</span><span class="r">SHOW: <select id="vshow"><option value="all"'+(visitShow==='all'?' selected':'')+'>All Events ('+ev.total+')</option><option value="visits"'+(visitShow==='visits'?' selected':'')+'>Visits ('+ev.nv+')</option><option value="cases"'+(visitShow==='cases'?' selected':'')+'>Cases ('+ev.nc+')</option></select></span></div>'+
 '<div class="sb"><div class="grp">OB/GYN</div>'+(rows||'<div class="gray" style="padding:10px">No events</div>')+(ev.list.length>lim?'<div class="viewall" id="viewall">View all ('+(ev.list.length-lim)+' more)</div>':'')+'</div></aside>';
}
// encounter summary pane
const ROS_SYS=['Constitutional','Eyes','Cardiovascular','Respiratory','Gastrointestinal','Genitourinary','Breast','Musculoskeletal','Skin','Neurological','Psychiatric','Endocrine'];
const PE_SYS=['General','Neck / Thyroid','Breasts','Heart','Lungs','Abdomen','Pelvic','Extremities','Skin','Psych'];
const SCREEN=[['Depression (PHQ-2)',['','Negative','Positive - PHQ-9 indicated']],['Intimate partner violence',['','Negative','Positive - resources given']],['Tobacco use',['','Never','Former','Current - counseled']],['Alcohol use (AUDIT-C)',['','Negative','Positive - counseled']],['Fall risk',['','Not at risk','At risk']]];
const PROCS=['','Pap smear','Endometrial biopsy','IUD insertion','IUD removal','Nexplanon insertion','Colposcopy with biopsy','Vulvar biopsy','Cerclage check','NST'];
const DXS=[['Encounter for gynecological examination','Z01.419'],['Supervision of normal pregnancy','Z34.80'],['Menopausal and perimenopausal disorder','N95.9'],['Abnormal uterine bleeding','N93.9'],['Bacterial vaginosis','N76.0'],['Pelvic pain','R10.2'],['Encounter for contraceptive management','Z30.9'],['Abnormal cervical cytology','R87.610'],['Postpartum care','Z39.2'],['Urinary tract infection','N39.0']];
const SECTIONS=[['reason','Reason for Visit'],['vitals','Vitals'],['ap','Assessment & Plan'],['hpi','History of Present Illness'],['ros','Review of Systems'],['screening','Screening'],['pe','Physical Exam'],['proc','Procedure Documentation']];
function secText(k,e,v){
 if(k==='reason')return e.reason||'';if(k==='hpi')return e.hpi||'';
 if(k==='vitals'){const x=e.vitals||{};const parts=[];if(x.bp)parts.push('BP '+x.bp);if(x.pulse)parts.push('P '+x.pulse);if(x.wt)parts.push('Wt '+x.wt+' lb');if(x.temp)parts.push('T '+x.temp);if(x.fhr)parts.push('FHR '+x.fhr);if(x.fh)parts.push('FH '+x.fh+' cm');if(x.uprot)parts.push('Urine prot '+x.uprot);return parts.join('   ');}
 if(k==='ap')return (e.ap||[]).filter(a=>a.dx||a.plan).map((a,i)=>(i+1)+'. '+a.dx+(a.code?' ('+a.code+')':'')+(a.plan?'\n   Plan: '+a.plan:'')).join('\n');
 if(k==='ros'){const r=e.ros||{};const neg=[],pos=[];for(const s in r){if(r[s].st==='neg')neg.push(s);if(r[s].st==='pos')pos.push(s+(r[s].note?': '+r[s].note:''));}return (pos.length?'Positive: '+pos.join('; ')+'\n':'')+(neg.length?'Negative: '+neg.join(', '):'');}
 if(k==='screening'){const r=e.screening||{};return Object.keys(r).filter(x=>r[x]).map(x=>x+': '+r[x]).join('\n');}
 if(k==='pe'){const r=e.pe||{};return Object.keys(r).filter(x=>r[x]&&(r[x].normal||r[x].note)).map(x=>x+': '+(r[x].normal?'normal':'abnormal')+(r[x].note?' - '+r[x].note:'')).join('\n');}
 if(k==='proc'){const r=e.proc||{};return r.type?r.type+(r.note?': '+r.note:''):'';}
 return '';
}
function secEditor(k,e,v){
 const btns='<div class="btns"><button class="gbtn p" data-save="'+k+'">Save</button><button class="gbtn" data-cancel="1">Cancel</button></div>';
 if(k==='reason')return '<input type="text" data-f="reason" style="width:100%" value="'+esc(e.reason||v.reason)+'">'+btns;
 if(k==='hpi')return '<textarea data-f="hpi" placeholder="History of present illness">'+esc(e.hpi||'')+'</textarea>'+btns;
 if(k==='vitals'){const x=e.vitals||{};const f=(n,l,w)=>'<label>'+l+' <input type="text" data-v="'+n+'" value="'+esc(x[n]||'')+'" style="width:'+(w||60)+'px"></label>';const pg=v.preg&&v.day<v.preg.end;
  return '<div class="row">'+f('bp','BP',70)+f('pulse','Pulse')+f('wt','Wt (lb)')+f('temp','Temp')+'</div>'+(pg?'<div class="row">'+f('fhr','FHR')+f('fh','Fundal ht')+'<label>Urine protein <select data-v="uprot">'+['','Negative','Trace','1+','2+'].map(o=>'<option'+(x.uprot===o?' selected':'')+'>'+o+'</option>').join('')+'</select></label></div>':'')+btns;}
 if(k==='ap'){const ap=(e.ap&&e.ap.length?e.ap:[{dx:'',code:'',plan:''}]);
  return '<div id="aplist">'+ap.map((a,i)=>apRow(a,i)).join('')+'</div><button class="gbtn" id="apadd">+ Add diagnosis</button>'+btns;}
 if(k==='ros'){const r=e.ros||{};return ROS_SYS.map(s=>{const st=(r[s]||{}).st||'';return '<div class="row"><label class="sys">'+s+'</label>'+[['','Not reviewed'],['neg','Negative'],['pos','Positive']].map(o=>'<label><input type="radio" name="ros-'+s+'" value="'+o[0]+'"'+(st===o[0]?' checked':'')+'> '+o[1]+'</label>').join(' ')+' <input type="text" data-rosnote="'+s+'" placeholder="details" value="'+esc((r[s]||{}).note||'')+'"></div>';}).join('')+'<div class="row"><button class="gbtn" id="rosneg">All negative</button></div>'+btns;}
 if(k==='screening'){const r=e.screening||{};return SCREEN.map(([s,opts])=>'<div class="row"><label class="sys">'+s+'</label><select data-scr="'+s+'">'+opts.map(o=>'<option'+(r[s]===o?' selected':'')+'>'+o+'</option>').join('')+'</select></div>').join('')+btns;}
 if(k==='pe'){const r=e.pe||{};return PE_SYS.map(s=>{const x=r[s]||{};return '<div class="row"><label class="sys">'+s+'</label><label><input type="checkbox" data-pen="'+s+'"'+(x.normal?' checked':'')+'> Normal</label><input type="text" data-pet="'+s+'" placeholder="findings" style="flex:1;min-width:140px" value="'+esc(x.note||'')+'"></div>';}).join('')+'<div class="row"><button class="gbtn" id="peall">All normal</button></div>'+btns;}
 if(k==='proc'){const r=e.proc||{};return '<div class="row"><label class="sys">Procedure</label><select data-f="proctype">'+PROCS.map(o=>'<option'+(r.type===o?' selected':'')+'>'+o+'</option>').join('')+'</select></div><textarea data-f="procnote" placeholder="Procedure note (indication, consent, technique, findings, complications)">'+esc(r.note||'')+'</textarea>'+btns;}
 return btns;
}
function apRow(a,i){return '<div class="ap"><div class="row"><select data-apdx="'+i+'"><option value="">Choose diagnosis&hellip;</option>'+DXS.map(d=>'<option value="'+d[1]+'"'+(a.code===d[1]?' selected':'')+'>'+d[0]+' ('+d[1]+')</option>').join('')+'</select> or <input type="text" data-apfree="'+i+'" placeholder="free-text diagnosis" value="'+esc(DXS.some(d=>d[1]===a.code)?'':a.dx||'')+'"></div><textarea data-applan="'+i+'" placeholder="Plan">'+esc(a.plan||'')+'</textarea></div>';}
function collectSec(k,box,e){
 const g=s=>box.querySelector(s);
 if(k==='reason')return {reason:g('[data-f=reason]').value};
 if(k==='hpi')return {hpi:g('[data-f=hpi]').value};
 if(k==='vitals'){const x={};box.querySelectorAll('[data-v]').forEach(i=>x[i.dataset.v]=i.value);return {vitals:x};}
 if(k==='ap'){const ap=[];box.querySelectorAll('.ap').forEach((d,i)=>{const sel=d.querySelector('[data-apdx]');const fr=d.querySelector('[data-apfree]').value.trim();const code=sel.value;const dx=fr||(code?DXS.find(x=>x[1]===code)[0]:'');const plan=d.querySelector('[data-applan]').value;if(dx||plan)ap.push({dx,code:fr?'':code,plan});});return {ap};}
 if(k==='ros'){const r={};ROS_SYS.forEach(s=>{const c=box.querySelector('input[name="ros-'+s+'"]:checked');const note=box.querySelector('[data-rosnote="'+s+'"]').value;if((c&&c.value)||note)r[s]={st:c?c.value:'',note};});return {ros:r};}
 if(k==='screening'){const r={};box.querySelectorAll('[data-scr]').forEach(s=>{if(s.value)r[s.dataset.scr]=s.value;});return {screening:r};}
 if(k==='pe'){const r={};PE_SYS.forEach(s=>{const n=box.querySelector('[data-pen="'+s+'"]').checked;const t=box.querySelector('[data-pet="'+s+'"]').value;if(n||t)r[s]={normal:n,note:t};});return {pe:r};}
 if(k==='proc')return {proc:{type:g('[data-f=proctype]').value,note:g('[data-f=procnote]').value}};
}
let editing=null;
function encounterPane(p,v){
 const e=encData(v);const st=vStatus(v);const closed=st==='CLOSED';
 return '<section class="cdetail" aria-label="Encounter summary"><div class="dh"><h2>Summary</h2><span class="qmark" title="Help">?</span><span class="rt"><a class="lnk" href="#/encounter/'+v.id+'">Full Encounter Summary</a>'+
 (closed?'<button class="gbtn" id="reopen">Reopen Encounter</button>':'<button class="gbtn" id="finish"'+(st==='UPCOMING'||st==='CANCELLED'||st==='NO SHOW'?' disabled title="Visit has not started"':'')+'>Finish Encounter</button>')+(collapsed?'<button class="collapse o" id="expand" title="Show list">&raquo;</button>':'')+'</span></div>'+
 '<div class="dbody"><div class="vtitle">'+esc(vTitle(v,true))+', '+C.mdy(v.day)+' '+C.fmtTime(v.start)+'</div><div class="vsub">'+esc(v.reason)+'</div><div class="vsub">Performed by '+esc(provLine(v.prov))+' &middot; '+DEPT+'</div>'+(closed?'<div class="vsub" style="color:#3c8d4f;margin-top:3px">Encounter closed'+(S.get('sign:'+v.id)?' and signed by SBEHRAM3 '+absToDT(S.get('sign:'+v.id).at):'')+'. Reopen to edit.</div>':'')+'<div style="height:8px"></div>'+
 SECTIONS.map(([k,l])=>{const t=secText(k,e,v);const ed=editing===v.id+':'+k;
  return '<div class="esec'+(ed?' editing':'')+'" data-sec="'+k+'"><h4>'+l+'</h4>'+(ed?'<div class="ed">'+secEditor(k,e,v)+'</div>':(t?'<div class="val">'+esc(t)+'</div>':'<div class="none">None recorded</div>'))+'</div>';}).join('')+'</div></section>';
}
function bindEncounter(p,v){
 const pane=$('.cdetail');if(!pane)return;
 pane.querySelectorAll('.esec').forEach(sec=>sec.addEventListener('click',ev=>{if(sec.classList.contains('editing'))return;if(vStatus(v)==='CLOSED'){A.notify('This encounter is closed. Click "Reopen Encounter" to edit it.');return;}editing=v.id+':'+sec.dataset.sec;rerender();}));
 const ed=pane.querySelector('.esec.editing');
 if(ed){const k=ed.dataset.sec;
  ed.querySelector('[data-save]').onclick=()=>{saveEnc(v,collectSec(k,ed,encData(v)));editing=null;A.notify('Saved '+SECTIONS.find(s=>s[0]===k)[1]+' for '+A.pname(p)+"'s "+C.mdy(v.day)+' visit.');rerender();};
  ed.querySelector('[data-cancel]').onclick=()=>{editing=null;rerender();};
  const add=ed.querySelector('#apadd');if(add)add.onclick=()=>{const l=ed.querySelector('#aplist');l.insertAdjacentHTML('beforeend',apRow({dx:'',code:'',plan:''},l.children.length));};
  const rn=ed.querySelector('#rosneg');if(rn)rn.onclick=()=>ROS_SYS.forEach(s=>{ed.querySelector('input[name="ros-'+s+'"][value=neg]').checked=true;});
  const pa=ed.querySelector('#peall');if(pa)pa.onclick=()=>ed.querySelectorAll('[data-pen]').forEach(c=>c.checked=true);
  const first=ed.querySelector('input[type=text],textarea,select');if(first)first.focus();
 }
 const fin=$('#finish');if(fin)fin.onclick=()=>{
  const e=encData(v);
  if(!e.ap||!e.ap.length){if(!confirm('No diagnosis has been entered in Assessment & Plan. Finish the encounter anyway?'))return;}
  S.set('sign:'+v.id,{at:D.nowAbs(),by:'SBEHRAM3'});saveEnc(v,{});
  const st=D.apptStatus(v);if(v.day===now().day&&st!=='Check-out')S.merge('appt:'+v.id,{status:'Check-out',at:D.nowAbs()});
  editing=null;A.notify('Completed signoff for '+A.pname(p)+"'s "+C.fmtTimeC(v.start)+' encounter.');rerender();};
 const ro=$('#reopen');if(ro)ro.onclick=()=>{const e=encData(v);S.del('sign:'+v.id);S.set('enc:'+v.id,Object.assign({},e,{gen:undefined}));S.merge('appt:'+v.id,{reopened:true});
  // keep OPEN: mark unsigned explicitly
  S.set('enc:'+v.id,Object.assign({},encData(v)));S.set('reopen:'+v.id,{at:D.nowAbs()});A.notify('Encounter reopened.');rerender();};
}
// cases detail
function casePane(p,c){const open=D.itemOpen(c);
 return '<section class="cdetail"><div class="dh"><h2>'+esc(c.kind==='Patient case'?'Patient Case':c.kind)+'</h2><span class="rt">'+(open?'<button class="gbtn p" id="caseclose">Close case</button>':'<span class="gray">CLOSED</span>')+(collapsed?'<button class="collapse o" id="expand">&raquo;</button>':'')+'</span></div><div class="dbody"><div class="vtitle">'+esc(c.name)+'</div><div class="vsub">'+fmtDT(c.day,c.min)+' &middot; via '+esc(c.vendor||'')+' &middot; assigned to '+esc(pv(c.prov).full+', '+pv(c.prov).cred)+'</div><div class="esec"><h4>Details</h4><div class="val">'+esc(c.text)+'</div></div></div></section>';}

// ---------- results panel & document ----------
function resultsPanel(p,selId,docked){
 const labs=labsOf(p),imgs=imgsOf(p);const list=resTab==='img'?imgs:labs;
 const rows=list.map(r=>{const f=flagOf(r);const hist=sameCode(p,r).length-1;
  return '<a class="rrow'+(r.id===selId?' sel':'')+'" href="#/chart/'+p.id+'/results/'+r.id+'" data-res="'+r.id+'"><div><div class="n">'+esc(r.name)+'</div><div class="g">'+fmtDT(r.day,r.min)+(hist>0?' &middot; '+hist+' Historical':'')+'</div></div><span class="f '+(f==='abnormal'?'abn':'')+'"><span class="trend"></span>'+f+'</span></a>';}).join('');
 return '<aside class="cslide wide'+(docked?' docked':'')+'" aria-label="Results"><div class="sh">Results'+(docked?'<button class="collapse" id="collapse" style="margin-left:auto" title="Collapse">&laquo;</button>':'<a class="x" href="#/chart/'+p.id+'" title="Close">&times;</a>')+'</div>'+
 '<div class="ctabs"><a data-rt="lab" class="'+(resTab==='lab'?'on':'')+'">Lab Results'+(labs.length?' ('+labs.length+')':'')+'</a><a data-rt="img" class="'+(resTab==='img'?'on':'')+'">Imaging Results ('+imgs.length+')</a></div>'+
 '<div class="sb">'+(rows||'<div class="gray" style="padding:10px">No results as of the sim date.</div>')+'</div></aside>';
}
function resultPane(p,r,view){
 const st=resStatus(r),asg=resAssigned(r),s=resState(r);
 const hdr=esc(r.name)+' in '+st+' to '+esc(asg);
 const created=fmtDT(r.day,r.min);
 let body='';
 if(view==='graph')body=graphView(p,r);
 else if(view==='table')body=tableView(p,r);
 else{
  body='<div class="rdoc"><div class="frow"><span class="l">Provider</span><span><select id="rprov">'+D.PROVIDERS.map(x=>'<option value="'+x.id+'"'+((s.provider||r.prov)===x.id?' selected':'')+'>'+esc((x.bfull+', '+x.cred).toUpperCase())+'</option>').join('')+'</select></span></div>'+
  '<div class="frow"><span class="l">Report Status</span><span><select id="rrep">'+['Final','Preliminary','Corrected','Partial'].map(o=>'<option'+((s.report||'Final')===o?' selected':'')+'>'+o+'</option>').join('')+'</select></span></div>'+
  '<div class="frow"><span class="l">Patient Access to Results</span><span>Published &nbsp;<a href="javascript:void 0" class="bluelink" style="font-weight:400">Visible to everyone</a></span></div>'+
  '<div class="frow"><span class="l">Performing lab</span><span>'+esc(r.vendor)+' (fictitious)</span></div>'+
  (r.comps?'<div class="rbox"><table><thead><tr><th>Analyte</th><th>Value</th><th>Ref. Range</th><th>Units</th><th>Abn. Flag</th><th>Status</th><th>Performed By</th><th>Date</th></tr></thead><tbody>'+
   r.comps.map(c=>'<tr><td><a href="#/chart/'+p.id+'/results/'+r.id+'?view=graph&an='+encodeURIComponent(c[0])+'">'+esc(c[0])+'</a></td><td'+(c[4]?' class="abn"':'')+'>'+esc(c[1])+'</td><td>'+esc(c[2])+'</td><td>'+esc(c[3])+'</td><td'+(c[4]?' class="abn"':'')+'>'+esc(c[4]||'')+'</td><td>final</td><td>01</td><td>'+C.mdy(r.day)+'</td></tr>').join('')+'</tbody></table>'+(r.comment?'<pre>'+esc(r.comment)+'</pre>':'')+'</div>'
   :'<div class="rbox"><table><thead><tr><th>Study</th><th>Status</th><th>Date</th></tr></thead><tbody><tr><td>'+esc(r.name)+'</td><td>final</td><td>'+C.mdy(r.day)+'</td></tr></tbody></table><pre>IMPRESSION:\n'+esc(r.text)+'\n\nInterpreting radiologist: Sim Radiology Group (fictitious)</pre></div>')+
  '<div class="frow"><span class="l">Result Note</span><span>'+(r.kind==='Lab'?'FASTING '+r.fasting:'None')+'</span></div>'+
  '<div class="frow"><span class="l">Internal Note</span><span>'+(s.notes&&s.notes.length?esc(s.notes.join(' | ')):'<span class="gray">None</span>')+'</span></div>'+
  '<div class="actbox" id="actbox"><div class="row"><b>Action</b><label><input type="radio" name="ract" value="keep" checked> Keep in current status</label><label><input type="radio" name="ract" value="review"> Review (send to REVIEW)</label><label><input type="radio" name="ract" value="close"> Close</label></div>'+
  '<div class="row"><b>Assign to</b><select id="rasg"><option value="">(no change)</option>'+D.PROVIDERS.map(x=>'<option>'+esc((x.bfull+', '+x.cred).toUpperCase())+'</option>').join('')+D.STAFF.map(x=>'<option>'+esc(x)+'</option>').join('')+'<option>nobody</option></select>'+
  '<b style="margin-left:10px">Priority</b><select id="rpri"><option>Normal</option><option>High</option><option>Urgent</option></select></div><div class="row" style="display:block"><b>Action note</b><textarea id="rnote" placeholder="Note (e.g. reviewed, normal, letter to patient)"></textarea></div></div>'+
  '<h4 style="margin:12px 0 2px;color:#4b4f6b">History</h4><table class="hist"><thead><tr><th>Date / Time</th><th>Action</th><th>Action By</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Action Note</th></tr></thead><tbody>'+
  resHistory(r).map(h=>'<tr><td>'+absToDT(h[0])+'</td><td>'+esc(h[1])+'</td><td>'+esc(h[2])+'</td><td>'+esc(h[3])+'</td><td>'+esc(h[4])+'</td><td>'+esc(h[5])+'</td><td>'+esc(h[6])+'</td></tr>').join('')+'</tbody></table></div>';
 }
 const views=['table','graph','document'].map(x=>'<a class="lnk" href="#/chart/'+p.id+'/results/'+r.id+(x==='document'?'':'?view='+x)+'" style="'+((view||'document')===x?'color:#333':'')+'">'+x+'</a>').join(' <span class="gray">|</span> ');
 return '<section class="cdetail" aria-label="Result document"><div class="dh"><h2 style="font-size:15px;font-weight:600">'+hdr+' <span class="gray" style="font-weight:400">(created '+created+' by INTERFACE) #'+r.num+'</span></h2><span class="rt">'+views+(collapsed?'<button class="collapse o" id="expand">&raquo;</button>':'<button class="collapse o" id="collapse2" title="Collapse list">&laquo;</button>')+'</span></div>'+
 '<div class="dbody">'+body+'</div>'+(view==='graph'||view==='table'?'':'<div class="sticky"><span>'+hdr+' #'+r.num+'</span><a class="lnk" id="viewact">View Actions</a><span class="rt"><button class="gbtn p" id="rsave">Save</button><button class="gbtn" id="rcancel">Cancel</button><a class="lnk" id="audit" style="text-transform:none;font-weight:400;letter-spacing:0">Audit History</a></span></div>')+'</section>';
}
function graphView(p,r){
 const hist=sameCode(p,r);const an=(A.q().an)||(r.comps&&r.comps.find(c=>!isNaN(parseFloat(c[1])))||[])[0];
 if(!r.comps||!an)return '<div class="gray" style="padding:10px">No numeric analytes to graph for this result.</div>';
 const pts=hist.map(h=>{const c=(h.comps||[]).find(c=>c[0]===an);return c?{d:h.day,v:parseFloat(String(c[1]).replace('<','')),raw:c[1],abn:c[4]}:null;}).filter(x=>x&&!isNaN(x.v));
 const opts=(r.comps||[]).filter(c=>!isNaN(parseFloat(String(c[1]).replace('<','')))).map(c=>'<option'+(c[0]===an?' selected':'')+'>'+esc(c[0])+'</option>').join('');
 if(!pts.length)return '<div class="gray" style="padding:10px">'+esc(an)+' is not numeric.</div>';
 const W=640,H=240,pad=40;const vs=pts.map(x=>x.v);let lo=Math.min(...vs),hi=Math.max(...vs);if(lo===hi){lo-=1;hi+=1;}const d0=pts[0].d,d1=pts[pts.length-1].d===d0?d0+1:pts[pts.length-1].d;
 const X=d=>pad+(W-2*pad)*(d-d0)/(d1-d0),Y=v=>H-pad-(H-2*pad)*(v-lo)/(hi-lo);
 const ref=(r.comps.find(c=>c[0]===an)||[])[2]||'';const m=String(ref).match(/([\d.]+)\s*-\s*([\d.]+)/);
 let band='';if(m){const a=+m[1],b=+m[2];const ya=Math.max(pad/2,Math.min(H-pad,Y(Math.min(Math.max(a,lo),hi)))),yb=Math.max(pad/2,Math.min(H-pad,Y(Math.min(Math.max(b,lo),hi))));band='<rect x="'+pad+'" y="'+Math.min(ya,yb)+'" width="'+(W-2*pad)+'" height="'+Math.abs(ya-yb)+'" fill="#e6f2e8"/>';}
 return '<div class="row" style="font-size:12px;margin:6px 0">Analyte: <select id="gan">'+opts+'</select> <span class="gray">'+pts.length+' value(s) through '+C.mdy(r.day)+'</span></div><div class="svgwrap"><svg viewBox="0 0 '+W+' '+H+'" width="100%" style="max-width:760px" role="img" aria-label="Trend graph">'+band+
 '<line x1="'+pad+'" y1="'+(H-pad)+'" x2="'+(W-pad)+'" y2="'+(H-pad)+'" stroke="#999"/><line x1="'+pad+'" y1="'+(pad/2)+'" x2="'+pad+'" y2="'+(H-pad)+'" stroke="#999"/>'+
 '<text x="4" y="'+(Y(hi)+4)+'" font-size="10" fill="#666">'+hi.toFixed(1)+'</text><text x="4" y="'+(Y(lo)+4)+'" font-size="10" fill="#666">'+lo.toFixed(1)+'</text>'+
 '<polyline fill="none" stroke="#2a6ebb" stroke-width="2" points="'+pts.map(x=>X(x.d)+','+Y(x.v)).join(' ')+'"/>'+pts.map(x=>'<circle cx="'+X(x.d)+'" cy="'+Y(x.v)+'" r="4" fill="'+(x.abn?'#d0342c':'#2a6ebb')+'"><title>'+C.mdy(x.d)+': '+esc(x.raw)+'</title></circle><text x="'+X(x.d)+'" y="'+(H-pad+14)+'" font-size="9" fill="#666" text-anchor="middle">'+C.mdy(x.d).slice(0,5)+'</text>').join('')+'</svg></div>';
}
function tableView(p,r){const hist=sameCode(p,r).reverse();if(!r.comps)return '<div class="rbox"><table><thead><tr><th>Date</th><th>Impression</th></tr></thead><tbody>'+hist.map(h=>'<tr><td>'+C.mdy(h.day)+'</td><td>'+esc(h.text)+'</td></tr>').join('')+'</tbody></table></div>';
 const ans=r.comps.map(c=>c[0]);return '<div class="rbox"><table><thead><tr><th>Date</th>'+ans.map(a=>'<th>'+esc(a)+'</th>').join('')+'</tr></thead><tbody>'+hist.map(h=>'<tr><td>'+C.mdy(h.day)+'</td>'+ans.map(a=>{const c=(h.comps||[]).find(c=>c[0]===a);return '<td'+(c&&c[4]?' class="abn"':'')+'>'+(c?esc(c[1])+(c[4]?' '+c[4]:''):'')+'</td>';}).join('')+'</tr>').join('')+'</tbody></table></div>';}
function bindResult(p,r){
 const va=$('#viewact');if(va)va.onclick=()=>$('#actbox').classList.toggle('show');
 const au=$('#audit');if(au)au.onclick=()=>A.modal('Audit History (SIM)','<table class="hist"><thead><tr><th>Date / Time</th><th>Event</th><th>User</th></tr></thead><tbody>'+resHistory(r).map(h=>'<tr><td>'+absToDT(h[0])+'</td><td>'+esc(h[1])+'</td><td>'+esc(h[2])+'</td></tr>').join('')+'<tr><td>'+absToDT(D.nowAbs())+'</td><td>Viewed result document</td><td>SBEHRAM3</td></tr></tbody></table>');
 const cn=$('#rcancel');if(cn)cn.onclick=()=>rerender();
 const sv=$('#rsave');if(sv)sv.onclick=()=>{
  const act=(document.querySelector('input[name=ract]:checked')||{}).value||'keep';const asg=$('#rasg')?$('#rasg').value:'';const note=$('#rnote')?$('#rnote').value.trim():'';const pri=$('#rpri')?$('#rpri').value:'Normal';
  const s=resState(r);const provSel=$('#rprov').value,rep=$('#rrep').value;const changes=[];
  if(provSel!==(s.provider||r.prov))changes.push('Provider changed to '+upper(provSel));if(rep!==(s.report||'Final'))changes.push('Report status '+rep);
  const s2=Object.assign({},s,{provider:provSel,report:rep});if(note)s2.notes=(s.notes||[]).concat([note]);if(asg)s2.assigned=asg==='nobody'?null:asg;S.set('res:'+r.id,s2);
  let status=resStatus(r);
  if(act==='close'){S.merge('inbox:'+r.id,{closed:true,reopened:false,at:D.nowAbs(),by:'sbehram3'});status='CLOSED';}
  if(act==='review'){S.merge('inbox:'+r.id,{closed:false,reopened:true,at:D.nowAbs()});status='REVIEW';}
  if(asg&&asg!=='nobody'&&status==='CLOSED'&&act!=='close'){S.merge('inbox:'+r.id,{closed:false,reopened:true});status='REVIEW';}
  if(act!=='keep'||asg||note||changes.length){addHistory(r.id,{action:act==='close'?'Close':act==='review'?'Review':asg?'Reassign':note?'Add note':'Edit',status,priority:pri,assigned:status==='CLOSED'?'nobody':(asg&&asg!=='nobody'?asg:upper(provSel)),note:[note].concat(changes).filter(Boolean).join('; ')});}
  A.notify('Saved '+r.name+' for '+A.pname(p)+' ('+status+').');rerender();};
 const g=$('#gan');if(g)g.onchange=()=>A.go('#/chart/'+p.id+'/results/'+r.id+'?view=graph&an='+encodeURIComponent(g.value));
}

// ---------- other panels ----------
function simplePanel(p,k){
 const n=now().day;const T={find:'Find',allergies:'Allergies',problems:'Problems',meds:'Medications',vaccines:'Vaccines',vitals:'Vitals',history:'History',quality:'Quality',care:'Care Team',apps:'Apps'};
 let body='',add='',wide=false;
 if(k==='find'){body='<div class="addf" style="border:0"><input id="cfind" placeholder="Search chart or patients (name, SIM ID, DOB)" autocomplete="off"></div><div id="cfindres"></div>';}
 if(k==='allergies'){const l=allergyList(p);body=l.length?l.map(a=>'<div class="lrow"><div><b>'+esc(a.name)+'</b><div class="g">'+esc(a.reaction||'')+' &middot; '+esc(a.sev||'')+(a.added?' &middot; added '+absToDT(a.added):'')+'</div></div></div>').join(''):'<div class="lrow">No known drug allergies (NKDA) <span class="g r">verified</span></div>';
  add='<div class="addf"><b>Add allergy</b><input data-a="name" placeholder="Allergen"><input data-a="reaction" placeholder="Reaction"><select data-a="sev"><option>Mild</option><option>Moderate</option><option>Severe</option></select><button class="gbtn p" data-add="allergies">Add</button></div>';}
 if(k==='problems'){const l=problemList(p);body=l.map(x=>'<div class="lrow"><div><b>'+esc(x.name)+'</b><div class="g">'+esc(x.code||'')+' &middot; Active'+(x.added?' &middot; added '+absToDT(x.added):'')+'</div></div></div>').join('')||'<div class="lrow">No active problems</div>';
  add='<div class="addf"><b>Add problem</b><input data-a="name" placeholder="Problem"><input data-a="code" placeholder="ICD-10 (optional)"><button class="gbtn p" data-add="problems">Add</button></div>';}
 if(k==='meds'){const l=medList(p);body=l.map(m=>'<div class="lrow"><div><b>'+esc(m.name)+'</b><div class="g">'+esc(m.sig||'')+' &middot; start '+esc(m.start||'')+'</div></div><button class="gbtn r" data-dc="'+esc(m.name)+'" title="Discontinue">D/C</button></div>').join('')||'<div class="lrow">No active medications</div>';
  add='<div class="addf"><b>Add medication</b><input data-a="name" placeholder="Medication and strength"><input data-a="sig" placeholder="Sig"><button class="gbtn p" data-add="meds">Add</button></div>';}
 if(k==='vaccines'){const l=vaccineList(p);body=l.map(x=>'<div class="lrow"><div><b>'+esc(x.name)+'</b><div class="g">'+C.mdy(x.date)+' &middot; '+esc(x.by)+'</div></div></div>').join('')||'<div class="lrow">No vaccines recorded</div>';
  add='<div class="addf"><b>Record vaccine</b><input data-a="name" placeholder="Vaccine"><button class="gbtn p" data-add="vaccines">Record (today)</button></div>';}
 if(k==='vitals'){wide=true;const pg=D.pregAt(p,n);
  const vs=visitsOf(p).filter(v=>v.day<=n&&v.fate==='ok'&&!v.booked&&D.COMPLETED(D.apptStatus(v))).slice(-12).reverse();
  const userV=extra(p,'vitals').slice().reverse();
  body=(pg?'<div class="grp">Prenatal flowsheet (current pregnancy, EDD '+C.mdy(pg.edd)+')</div><div style="overflow:auto"><table class="mini"><thead><tr><th>Date</th><th>GA</th><th>Wt</th><th>BP</th><th>Urine P/G</th><th>FH</th><th>FHR</th><th>Edema</th></tr></thead><tbody>'+
   vs.filter(v=>v.preg===pg).map(v=>{const x=D.vitals(v);return '<tr><td>'+C.mdy(v.day).slice(0,5)+'</td><td>'+x.ga+'</td><td>'+x.wt+'</td><td'+(x.sys>=140||x.dia>=90?' style="color:#d0342c;font-weight:700"':'')+'>'+x.bp+'</td><td>'+x.uprot.slice(0,3)+'/'+x.uglu.slice(0,3)+'</td><td>'+(x.fh||'')+'</td><td>'+(x.fhr||'')+'</td><td>'+x.edema+'</td></tr>';}).join('')+'</tbody></table></div>':'')+
   '<div class="grp">Vitals</div><div style="overflow:auto"><table class="mini"><thead><tr><th>Date</th><th>BP</th><th>P</th><th>Wt</th><th>BMI</th><th>T</th></tr></thead><tbody>'+userV.map(x=>'<tr><td>'+absToDT(x.added).slice(0,10)+' *</td><td>'+esc(x.bp)+'</td><td>'+esc(x.pulse)+'</td><td>'+esc(x.wt)+'</td><td></td><td>'+esc(x.temp)+'</td></tr>').join('')+vs.map(v=>{const x=D.vitals(v);return '<tr><td>'+C.mdy(v.day)+'</td><td>'+x.bp+'</td><td>'+x.pulse+'</td><td>'+x.wt+'</td><td>'+x.bmi+'</td><td>'+x.temp+'</td></tr>';}).join('')+'</tbody></table></div>';
  add='<div class="addf"><b>Record vitals</b> <span class="g">(* entered in sim)</span><input data-a="bp" placeholder="BP e.g. 118/76"><input data-a="pulse" placeholder="Pulse"><input data-a="wt" placeholder="Weight (lb)"><input data-a="temp" placeholder="Temp"><button class="gbtn p" data-add="vitals">Save vitals</button></div>';}
 if(k==='history'){wide=true;const obs=p.preg.filter(pg=>pg.end<=n);
  body='<div class="grp">Obstetric history ('+D.gp(p,n)+')</div>'+(p.gp.g?'<div class="lrow"><div>'+p.gp.g+' pregnancy(ies) before '+C.mdy(D.RANGE_START).slice(-4)+'<div class="g">details per outside records</div></div></div>':'')+obs.map(pg=>'<div class="lrow"><div><b>'+C.mdy(pg.end)+'</b> '+(pg.outcome==='delivered'?esc(pg.mode)+' at '+C.ga(pg.lmp,pg.end).str+', '+pg.baby+' '+pg.weight+' g':pg.outcome==='sab'?'Spontaneous abortion at '+C.ga(pg.lmp,pg.end).str:'Transferred care')+'<div class="g">'+esc(pg.hosp)+'</div></div></div>').join('')+
  '<div class="grp">Gynecologic history</div><div class="lrow">Menarche age '+(11+C.h01(p.id+'m')*4|0)+' &middot; '+(C.ageAt(p.dob,n)>=52?'Postmenopausal':'Cycles regular')+'</div>'+
  '<div class="grp">Surgical history</div>'+(obs.some(pg=>pg.mode&&pg.mode.includes('C-section'))?'<div class="lrow">Cesarean delivery</div>':'')+(C.h01(p.id+'s')<0.2?'<div class="lrow">Laparoscopic cholecystectomy</div>':'')+(C.h01(p.id+'w')<0.15?'<div class="lrow">Wisdom teeth extraction</div>':'')+'<div class="lrow g">Reviewed</div>'+
  '<div class="grp">Social history</div><div class="lrow">Tobacco: '+(C.h01(p.id+'t')<0.08?'former':'never')+' &middot; Alcohol: '+(C.h01(p.id+'a')<0.5?'occasional':'none')+'</div>'+
  '<div class="grp">Family history</div><div class="lrow">'+['Mother: hypertension','Father: type 2 diabetes','Maternal aunt: breast cancer age 58','No significant family history'][C.h01(p.id+'f')*4|0]+'</div>'+
  '<div class="grp">Documents</div>'+D.patientDocs(p).slice().reverse().map(d=>'<div class="lrow"><div><b>'+esc(d.name)+'</b><div class="g">'+C.mdy(d.day)+' &middot; '+esc(d.vendor)+'</div><div style="margin-top:3px">'+esc(d.text)+'</div></div></div>').join('');}
 if(k==='quality'){const n2=n;const lastPap=[...labsOf(p)].find(r=>r.code==='PAP');const lastM=[...imgsOf(p)].find(r=>r.code==='MAMMO');const age=C.ageAt(p.dob,n2);
  body='<div class="lrow"><div><b>Cervical cancer screening</b><div class="g">'+(age>65?'Not applicable (age)':lastPap?'Last '+C.mdy(lastPap.day)+(n2-lastPap.day<1095?' - satisfied':' - due'):'No result on file - due')+'</div></div></div><div class="lrow"><div><b>Breast cancer screening</b><div class="g">'+(age<40?'Not applicable (age)':lastM?'Last '+C.mdy(lastM.day)+(n2-lastM.day<730?' - satisfied':' - due'):'No mammogram on file - due')+'</div></div></div>'+(D.pregAt(p,n2)?'<div class="lrow"><div><b>Prenatal depression screening</b><div class="g">'+(C.h01(p.id+'q')<0.8?'Satisfied':'Due')+'</div></div></div>':'');}
 if(k==='care'){body='<div class="lrow"><div><b>'+esc(pv(p.prov).full+', '+pv(p.prov).cred)+'</b><div class="g">Primary OB/GYN provider</div></div></div><div class="lrow"><div><b>'+esc(p.pharm)+'</b><div class="g">Preferred pharmacy (fictitious)</div></div></div><div class="lrow"><div><b>Sim Family Medicine (fictitious)</b><div class="g">PCP</div></div></div>';}
 if(k==='apps'){body='<div class="lrow">No apps are installed in the simulation.</div>';}
 return '<aside class="cslide'+(wide?' wide':'')+'" aria-label="'+T[k]+'"><div class="sh">'+T[k]+'<a class="x" href="#/chart/'+p.id+'" title="Close">&times;</a></div><div class="sb">'+body+'</div>'+add+'</aside>';
}
function bindSimple(p,k){
 document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const box=b.closest('.addf');const it={added:D.nowAbs()};box.querySelectorAll('[data-a]').forEach(i=>it[i.dataset.a]=i.value.trim());
  if(!it.name&&k!=='vitals'){alert('Enter a name first.');return;}if(k==='vaccines'){it.date=now().day;it.by='administered in office (sim)';}if(k==='meds')it.start=C.mdy(now().day);
  addExtra(p,k,it);A.notify('Added to '+k+' for '+A.pname(p)+'.');rerender();});
 document.querySelectorAll('[data-dc]').forEach(b=>b.onclick=()=>{if(confirm('Discontinue '+b.dataset.dc+'?')){addExtra(p,'medsdc',b.dataset.dc);A.notify('Discontinued '+b.dataset.dc+'.');rerender();}});
 const f=$('#cfind');if(f){f.focus();f.oninput=()=>{const r=A.searchPatients(f.value,15);$('#cfindres').innerHTML=r.map(x=>'<a class="vrow" href="#/chart/'+x.id+'"><div class="t">'+esc(x.last.toUpperCase()+', '+x.first)+'</div><div class="g">#'+x.id+' &middot; '+C.mdy(x.dob)+'</div></a>').join('');};}
}

// ---------- main render ----------
let last={};
function rerender(){render(last.pid,last.panel,last.item);}
function render(pid,panel,item){
 last={pid,panel,item};const p=D.byId[pid];
 if(!p){$('#main').innerHTML='<div class="page"><div class="empty">No fictitious patient '+esc(pid||'')+'.</div></div>';return;}
 if(cur.pid!==pid){editing=null;visitAll=false;collapsed=false;}cur.pid=pid;
 const box=$('#psearchbox');if(box)box.placeholder=p.id;
 const o=A.q();const view=o.view||'document';
 let stage='',side='',detail='';
 if(panel==='visits'&&item){
  if(item.startsWith('case:')){const c=D.patientCases(p.id).find(x=>x.id===item.slice(5));detail=c?casePane(p,c):'';}
  else{const v=visitsOf(p).find(x=>x.id===item);if(v)detail=encounterPane(p,v);}
  side=collapsed?'':visitsPanel(p,item,true);
 } else if(panel==='results'&&item){const r=findResult(p,item);if(r){resTab=r.kind==='Imaging'?'img':'lab';detail=resultPane(p,r,view);}side=collapsed?'':resultsPanel(p,item,true);}
 const docked=!!detail;
 let html=banner(p)+'<div class="cwrap">'+rail(p,panel||'');
 if(docked)html+=side+detail;
 else{let slide='';if(panel==='visits')slide=visitsPanel(p,null,false);else if(panel==='results')slide=resultsPanel(p,null,false);else if(panel&&ICONS[panel])slide=simplePanel(p,panel);
  html+='<div style="position:relative;flex:1;display:flex;min-width:0">'+slide+'<div class="cstage">'+landing(p)+'</div>'+(slide?'<div class="cdim" id="cdim"></div>':'')+'</div>';
 }
 html+='</div>';
 $('#main').innerHTML=html;
 // bindings
 const dn=$('#cbdown');if(dn)dn.onclick=()=>$('#cbexpand').classList.toggle('show');
 const pl=$('#piplus');if(pl)pl.onclick=()=>{const d=$('#pidetail');const s=d.style.display==='none';d.style.display=s?'block':'none';pl.textContent=s?'\u2212':'+';};
 document.querySelectorAll('[data-lt]').forEach(a=>a.onclick=()=>{landTab=a.dataset.lt;rerender();});
 const dim=$('#cdim');if(dim)dim.onclick=()=>A.go('#/chart/'+p.id);
 const vsh=$('#vshow');if(vsh)vsh.onchange=()=>{visitShow=vsh.value;rerender();};
 const va=$('#viewall');if(va)va.onclick=()=>{visitAll=true;rerender();};
 document.querySelectorAll('[data-rt]').forEach(a=>a.onclick=()=>{resTab=a.dataset.rt;if(panel==='results'&&item)A.go('#/chart/'+p.id+'/results');else rerender();});
 const cl=$('#collapse')||$('#collapse2');if(cl)cl.onclick=()=>{collapsed=true;rerender();};
 const ex=$('#expand');if(ex)ex.onclick=()=>{collapsed=false;rerender();};
 if(panel==='visits'&&item&&!item.startsWith('case:')){const v=visitsOf(p).find(x=>x.id===item);if(v)bindEncounter(p,v);}
 if(panel==='visits'&&item&&item.startsWith('case:')){const c=D.patientCases(p.id).find(x=>x.id===item.slice(5));const b=$('#caseclose');if(b&&c)b.onclick=()=>{S.merge('inbox:'+c.id,{closed:true,at:D.nowAbs(),by:'sbehram3'});A.notify('Closed case.');rerender();};}
 if(panel==='results'&&item){const r=findResult(p,item);if(r)bindResult(p,r);}
 if(panel&&!item&&!['visits','results'].includes(panel))bindSimple(p,panel);
 const sel=document.querySelector('.vrow.sel,.rrow.sel');if(sel)sel.scrollIntoView({block:'nearest'});
}
// reopen support: vStatus must respect reopen
const _vs=vStatus;
vStatus=function(v){const s=_vs(v);if(s==='CLOSED'&&S.get('reopen:'+v.id)&&!S.get('sign:'+v.id))return 'OPEN';return s;};
window.SIMCHART={render,addHistory,vStatus:v=>vStatus(v),encData,resStatus};
})();
