/* SIMULATION data engine. Every patient, name, ID and value here is FICTITIOUS and generated
   deterministically from SEED + calendar date. Same seed + date => same data. */
(function(G){
const C=G.SIMCORE,{R,h01,dn,ymd,isWeekend,dow}=C;
const SEED='congressional-sim-v1';
const RANGE_START=dn(2025,1,1),RANGE_END=dn(2027,12,31);
const N_PATIENTS=5200;
const FIRST=['Avery','Brielle','Camila','Daniela','Elena','Fatima','Gianna','Hana','Imani','Jasmine','Kiara','Leila','Maya','Nadia','Olivia','Priya','Quinn','Rosa','Sofia','Tamara','Uma','Valeria','Wren','Ximena','Yara','Zoe','Adaeze','Bianca','Chloe','Delfina','Esme','Farah','Grace','Helena','Ines','Juliet','Keisha','Lucia','Mariam','Noor','Opal','Paloma','Renata','Selin','Talia','Ursula','Vivian','Wanda','Yesenia','Zainab','Amara','Bea','Celeste','Dahlia','Eden','Freya','Greta','Hazel','Iris','June','Kaya','Lena','Mila','Nora','Odette','Pia','Rhea','Sage','Thea','Vera','Willa','Yuna','Anika','Beatriz','Carmen','Dara','Ebony','Flor','Gloria','Hollis','Ivy','Jada','Kamila','Laila','Mercy','Nia','Oksana','Perla','Rana','Simone','Tiana','Vanessa','Yolanda','Zara'];
const LAST=['Abernathy','Balderrama','Castellano','Dunleavy','Eskandari','Fairweather','Galloway','Haverford','Ibarrola','Jessup','Kowalczyk','Larkspur','Montclair','Nakashima','Oyelaran','Pemberton','Quintero','Rasmussen','Saltonstall','Thornbury','Underhill','Valcourt','Whitcombe','Yarborough','Zelinsky','Adebayo','Brightwater','Cardenas-Ruiz','Delacroix','Ellsworth','Fenwick','Grantham','Holloway','Iwasaki','Jankowski','Kingsley','Lindqvist','Marchetti','Nwachukwu','Ostrander','Pellegrino','Quarles','Ravensworth','Sorensen','Tolliver','Ulloa','Vanterpool','Wexford','Yamamura','Zubiri','Ashcombe','Blackwood','Coldwell','Draycott','Everly','Fontaine','Goldfinch','Hartigan','Isherwood','Juarez-Lind','Kettering','Lockridge','Merriweather','Northam','Okonkwo','Penhallow','Rutherford','Sandoval-Reyes','Tregarthen','Vasquez-Moll','Winslow','Yeager','Abiodun','Bramwell','Calloway','Desrosiers','Emberly','Fitzroy','Greenhalgh','Hawthorne','Inglewood','Jaramillo','Kilbride','Lovelace','Mbatha','Nightingale','Oduya','Pruett','Rockwell','Stanhope','Treadwell','Valdivia','Westbrook'];
const PROVIDERS=[
 {id:'P1',last:'BEHRAM',first:'STEVE',cred:'MD',short:'Behram, S',user:'sbehram3',days:[1,2,3,4,5],ampm:{2:'pm'}},
 {id:'P2',last:'OKAFOR',first:'LENA',cred:'MD',short:'Okafor, L',user:'lokafor1',days:[1,2,3,4,5],ampm:{4:'am'}},
 {id:'P3',last:'MARLOWE',first:'JUNE',cred:'CNM',short:'Marlowe, J',user:'jmarlowe',days:[1,2,3,4,5],ampm:{}},
 {id:'P4',last:'TRAN',first:'PRIYA',cred:'NP',short:'Tran, P',user:'ptran2',days:[1,2,3,4],ampm:{}}];
const STAFF=['ajj (MA)','mq (MA)','rv (MA)','cb (MA)','ep (MA)','Front Desk','Billing Team','Nurse Triage','Referral Coordinator'];
const PAYERS=['CareFirst BCBS (SIM)','Aetna (SIM)','UnitedHealthcare (SIM)','Cigna (SIM)','Maryland Medicaid - Priority Partners (SIM)','Kaiser Permanente MAS (SIM)','Johns Hopkins EHP (SIM)','Self Pay'];
const PHARM=['SimCare Pharmacy #0412 - Bethesda','Rx Fictional Drug #77 - Rockville','Testwell Pharmacy - Gaithersburg','Mock Mail-Order Pharmacy'];
const STREETS=['Maple Sim Ct','Oakfield Test Rd','Example Ave','Placeholder Ln','Sample St','Demo Dr','Mockingbird Sim Way'];
const CITIES=[['Bethesda','MD','20814'],['Rockville','MD','20852'],['Potomac','MD','20854'],['Gaithersburg','MD','20878'],['Silver Spring','MD','20910'],['Chevy Chase','MD','20815']];
const holidays=new Set();
[[2025,1,1],[2025,5,26],[2025,7,4],[2025,9,1],[2025,11,27],[2025,12,25],[2026,1,1],[2026,5,25],[2026,7,3],[2026,9,7],[2026,11,26],[2026,12,25],[2027,1,1],[2027,5,31],[2027,7,5],[2027,9,6],[2027,11,25],[2027,12,24]].forEach(a=>holidays.add(dn(a[0],a[1],a[2])));
function isClinicDay(n){return !isWeekend(n)&&!holidays.has(n);}
function nextClinicDay(n){while(!isClinicDay(n))n++;return n;}

// ---------- appointment types ----------
const ATYPE={
 NOB:{name:'NEW OB',slots:2,cpt:['99204'],color:'#d9534f'},
 ROB:{name:'RETURN OB',slots:1,cpt:['0502F'],color:'#7b5ea7'},
 PP:{name:'POSTPARTUM',slots:1,cpt:['0503F'],color:'#4a8cc4'},
 INC:{name:'INCISION CHECK',slots:1,cpt:['99024'],color:'#4a8cc4'},
 WWV:{name:'WELL WOMAN',slots:2,cpt:['99395'],color:'#3c9a5f'},
 PROB:{name:'PROBLEM',slots:1,cpt:['99213'],color:'#c98a1b'},
 TELE:{name:'TELEHEALTH',slots:1,cpt:['99213'],color:'#2b7bb9',tele:true},
 COLPO:{name:'COLPOSCOPY',slots:2,cpt:['57454'],color:'#a0522d'},
 PROC:{name:'PROCEDURE',slots:2,cpt:['58300'],color:'#a0522d'},
 US:{name:'ULTRASOUND',slots:1,cpt:['76815'],color:'#5f7f9f'}};
const PROBLEM_REASONS=[
 ['abnormal bleeding','N93.9','PROB'],['f/u menopause','N95.1','PROB'],['Bacterial vaginosis','N76.0','PROB'],['pelvic pain','R10.2','PROB'],
 ['f/u Menometrorrhagia','N92.1','PROB'],['IUD insertion','Z30.430','PROC'],['IUD removal','Z30.432','PROC'],['Nexplanon insertion','Z30.017','PROC'],
 ['discuss abnormal pap','R87.610','PROB'],['colpo','R87.610','COLPO'],['contraception counseling','Z30.09','PROB'],['breast lump','N63.0','PROB'],
 ['UTI symptoms','N39.0','PROB'],['f/u ovarian cyst','N83.201','US'],['PCOS f/u','E28.2','PROB'],['vulvar irritation','N90.89','PROB'],
 ['HRT f/u','Z79.890','TELE'],['results review','Z09','TELE'],['dysmenorrhea','N94.6','PROB'],['infertility consult','N97.9','PROB'],
 ['insurance verification','Z02.9','PROB'],['post-op check','Z09','PROB'],['fibroids f/u','D25.9','US'],['postmenopausal bleeding','N95.0','PROB']];

// ---------- panel ----------
const patients=[];const byId={};
function genPatients(){
 for(let i=0;i<N_PATIENTS;i++){
  const r=R(SEED+':pt:'+i);
  const age=r.wpick([[9,r.int(18,24)],[33,r.int(25,34)],[26,r.int(35,44)],[16,r.int(45,54)],[16,r.int(55,79)]]);
  const dob=dn(2026,1,1)-Math.round(age*365.25)-r.int(0,364);
  const id='SIM'+(410000+i*7+r.int(0,6));
  const city=r.pick(CITIES);
  const p={idx:i,id,first:r.pick(FIRST),mi:String.fromCharCode(65+r.int(0,25)),last:r.pick(LAST),sex:'F',dob,
   prov:PROVIDERS[r.wpick([[40,0],[30,1],[20,2],[10,3]])].id,
   payer:r.wpick([[30,0],[18,1],[16,2],[8,3],[12,4],[8,5],[6,6],[2,7]]),
   memberId:'ZZS'+r.int(100000000,999999999),
   phone:'(555) '+r.int(201,989)+'-01'+C.p2(r.int(0,99)),
   addr:r.int(10,9999)+' '+r.pick(STREETS),city:city[0],st:city[1],zip:city[2],
   pharm:r.pick(PHARM),lang:r.wpick([[85,'English'],[9,'Spanish'],[3,'Amharic'],[3,'Korean']]),
   blood:r.wpick([[37,'O Pos'],[34,'A Pos'],[9,'B Pos'],[4,'AB Pos'],[7,'O Neg'],[6,'A Neg'],[2,'B Neg'],[1,'AB Neg']]),
   gp:{g:0,p:0},preg:[],visits:[],photo:r.int(0,11),
   portal:r.chance(0.78)};
  p.email=(p.first+'.'+p.last).toLowerCase().replace(/[^a-z.]/g,'')+'@example.test';
  // pregnancies
  const ageAt=n=>C.ageAt(dob,n);
  if(r.chance(0.42)){
   let t=RANGE_START-280+r.int(0,900);
   while(t<RANGE_END){
    if(ageAt(t)>=18&&ageAt(t)<=44){
     const pr=R(SEED+':preg:'+id+':'+t);
     const outcome=pr.wpick([[86,'delivered'],[9,'sab'],[5,'transfer']]);
     const preterm=pr.chance(0.09);
     const delGA=outcome==='delivered'?(preterm?pr.int(32*7,36*7+6):pr.int(37*7,41*7+2)):outcome==='sab'?pr.int(7*7,12*7):pr.int(14*7,30*7);
     const priorCS=pr.chance(0.15);
     const mode=outcome!=='delivered'?null:priorCS?pr.wpick([[80,'Repeat C-section'],[20,'VBAC']]):pr.wpick([[74,'SVD'],[19,'Primary C-section'],[7,'Vacuum-assisted vaginal']]);
     const ga40=t+280;
     p.preg.push({lmp:t,edd:ga40,endGA:delGA,end:t+delGA,outcome,mode,priorCS,
       weight:outcome==='delivered'?Math.round(3400+(delGA-280)*24+pr.norm(0,380)):null,
       baby:pr.chance(0.5)?'Female':'Male',risk:pr.wpick([[60,[]],[12,['AMA']],[8,['GDM A1']],[6,['Chronic HTN']],[6,['Gestational HTN']],[4,['Hypothyroidism']],[4,['Twin gestation']]]),
       gap:pr.chance(0.18)?pr.int(12,30)*7:null,hosp:'Sim Suburban Hospital (fictitious)'});
     t+=delGA+pr.int(240,1100);
    } else t+=365;
   }
  }
  const priorG=r.int(0,3);p.gp={g:priorG,p:Math.max(0,priorG-r.int(0,1))};
  patients.push(p);byId[id]=p;
 }
}

// ---------- visits / schedule index ----------
const schedule={}; // key dn -> {P1:[appt...]}
const apptById={};
let apptSeq=0;
function addVisit(p,n,type,reason,dx,extra){
 if(n<RANGE_START||n>RANGE_END)return;
 n=nextClinicDay(n);
 const v=Object.assign({pid:p.id,day:n,type,reason,dx,prov:null},extra||{});
 p._pending=p._pending||[];p._pending.push(v);
}
function genVisits(){
 for(const p of patients){
  const r=R(SEED+':vis:'+p.id);
  for(const pg of p.preg){
   const ends=pg.end;
   const pushGA=(g,type,reason)=>{const n=pg.lmp+g+r.int(-2,2);if(n>=ends&&!(type==='PP'||type==='INC'))return;
     if(pg.gap&&g>pg.gap&&g<pg.gap+r.int(35,49))return; addVisit(p,n,type,reason,'Z34.80',{preg:pg});};
   let g=r.int(7*7,10*7);pushGA(g,'NOB','new ob');
   while(true){
     const w=g/7;g+=w<28?28:w<36?14:7;g+=r.int(-2,2);
     if(g>=pg.endGA)break;
     const wk=Math.floor(g/7);
     let reason='rob';
     if(wk>=11&&wk<=13&&r.chance(0.5))reason='rob + NT/NIPT';
     else if(wk>=18&&wk<=21)reason='rob + anatomy us';
     else if(wk>=24&&wk<=28)reason='rob+ glucola';
     else if(wk>=35&&wk<=37)reason='rob + GBS';
     else if(wk>=32&&pg.risk.length)reason='nst+rob';
     pushGA(g,'ROB',reason);
   }
   if(pg.outcome==='delivered'){
     if(pg.mode&&pg.mode.includes('C-section'))addVisit(p,pg.end+r.int(10,15),'INC','incision check','Z48.817',{preg:pg});
     addVisit(p,pg.end+r.int(38,48),'PP','postpartum visit','Z39.2',{preg:pg});
   } else if(pg.outcome==='sab'){
     addVisit(p,pg.end+r.int(10,16),'PROB','f/u SAB','O03.9',{preg:pg});
   }
  }
  // annuals
  const doy=r.int(0,364);
  for(let y=2024;y<=2027;y++){
   const n=dn(y,1,1)+doy+r.int(-20,20);
   if(!r.chance(0.8))continue;
   if(p.preg.some(pg=>n>=pg.lmp-20&&n<=pg.end+60))continue;
   addVisit(p,n,'WWV',C.ageAt(p.dob,n)>=40?'wwv + mammo order':'wwv','Z01.419');
  }
  // problem visits
  let t=RANGE_START+r.int(0,400);
  while(t<=RANGE_END){
   if(!p.preg.some(pg=>t>=pg.lmp&&t<=pg.end)){
     const pr=r.pick(PROBLEM_REASONS);const age=C.ageAt(p.dob,t);
     if(!(age<45&&/menopaus|HRT|postmeno/.test(pr[0]))&&!(age>52&&/IUD|Nexplanon|contracep|infertility|PCOS/.test(pr[0])))
       addVisit(p,t,pr[2],pr[0],pr[1]);
   }
   t+=r.int(120,620);
  }
 }
 // gather by day
 const byDay={};
 for(const p of patients){for(const v of (p._pending||[])){(byDay[v.day]=byDay[v.day]||[]).push(v);} delete p._pending;}
 // assign providers & slots chronologically; overflow pushes to next clinic day
 const SLOTS_AM=[],SLOTS_PM=[];
 for(let m=8*60;m<12*60;m+=10)SLOTS_AM.push(m);
 for(let m=13*60;m<16*60+50;m+=10)SLOTS_PM.push(m);
 for(let n=RANGE_START;n<=RANGE_END;n++){
  if(!isClinicDay(n)){if(byDay[n]){const nx=nextClinicDay(n);(byDay[nx]=byDay[nx]||[]).push(...byDay[n]);}continue;}
  const list=(byDay[n]||[]).sort((a,b)=>h01(a.pid+n)-h01(b.pid+n));
  const day={};const free={};
  for(const pv of PROVIDERS){
   if(!pv.days.includes(dow(n))){continue;}
   const half=pv.ampm[dow(n)];
   const slots=(half==='pm'?SLOTS_PM:half==='am'?SLOTS_AM:SLOTS_AM.concat(SLOTS_PM)).slice();
   // provider blocks (admin/lunch) deterministic
   const blocks=new Set();const br=R(SEED+':blk:'+pv.id+':'+n);
   const nb=br.int(1,3);for(let k=0;k<nb;k++)blocks.add(br.pick(slots));
   free[pv.id]=slots.filter(s=>!blocks.has(s));day[pv.id]=[];
  }
  const overflow=[];
  for(const v of list){
   const order=[v.pid&&byId[v.pid].prov].concat(PROVIDERS.map(x=>x.id));
   const pick=h01(v.pid+':pv:'+n)<0.72?order:order.slice(1).sort((a,b)=>h01(v.pid+a+n)-h01(v.pid+b+n));
   let placed=false;
   for(const pid of pick){
    if(!free[pid])continue;const need=ATYPE[v.type].slots;
    const fr=free[pid];
    for(let k=0;k<fr.length;k++){
      const s=fr[(k+Math.floor(h01(v.pid+'sl'+n)*fr.length))%fr.length];
      if(need===2&&!fr.includes(s+10))continue;
      v.prov=pid;v.start=s;v.dur=need*10;
      fr.splice(fr.indexOf(s),1);if(need===2)fr.splice(fr.indexOf(s+10),1);
      placed=true;break;
    }
    if(placed)break;
   }
   if(placed)day[v.prov].push(v);else overflow.push(v);
  }
  // filler problem/GYN visits so schedules look like a real, busy practice (deterministic)
  for(const pid in free){
   const fr=free[pid];const total=fr.length+day[pid].reduce((a,v)=>a+v.dur/10,0);
   const fr2=R(SEED+':fill:'+pid+':'+n);const target=Math.round(total*fr2.range(0.7,0.93));
   let booked=total-fr.length,guard=0;
   while(booked<target&&fr.length&&guard++<80){
    const p=patients[fr2.int(0,patients.length-1)];
    if(p.preg.some(pg=>n>=pg.lmp&&n<=pg.end+50))continue;
    const pr=fr2.pick(PROBLEM_REASONS);const age=C.ageAt(p.dob,n);
    if(age<45&&/menopaus|HRT|postmeno/.test(pr[0]))continue;if(age>52&&/IUD|Nexplanon|contracep|infertility|PCOS/.test(pr[0]))continue;
    const need=ATYPE[pr[2]].slots;const s=fr[fr2.int(0,fr.length-1)];if(need===2&&!fr.includes(s+10))continue;
    const v={pid:p.id,day:n,type:pr[2],reason:pr[0],dx:pr[1],prov:pid,start:s,dur:need*10};
    fr.splice(fr.indexOf(s),1);if(need===2)fr.splice(fr.indexOf(s+10),1);day[pid].push(v);booked+=need;
   }
  }
  if(overflow.length){const nx=nextClinicDay(n+1);(byDay[nx]=byDay[nx]||[]).push(...overflow);}
  // finalize
  for(const pid in day){
   day[pid].sort((a,b)=>a.start-b.start);
   for(const v of day[pid]){
    v.id='A'+(9000000+(apptSeq++));v.day=n;apptById[v.id]=v;
    const rr=R(SEED+':st:'+v.id);
    v.fate=rr.wpick([[90,'ok'],[4.5,'noshow'],[5.5,'cancel']]);
    v.cancelDay=n-rr.int(1,6);
    v.tele=ATYPE[v.type].tele||(v.type==='PROB'&&rr.chance(0.07));
    v.confirmed=rr.chance(0.7);v.selfCheck=rr.chance(0.25);
    v.unsigned=rr.chance(0.02);v.signLag=rr.wpick([[70,0],[25,1],[5,2]]);
    v.chargeLag=rr.chance(0.04)?rr.int(4,15):0;
    v.initials=(rr.pick(['ajj','mq','rv','cb','ep']));
    byId[v.pid].visits.push(v);
   }
  }
  schedule[n]={day,free};
 }
 for(const p of patients)p.visits.sort((a,b)=>a.day-b.day||a.start-b.start);
}

// ---------- clock ----------
let SIM_NOW={day:C.dnFromDate(new Date()),min:0};
function setNow(day,min){SIM_NOW={day,min};}
function nowAbs(){return SIM_NOW.day*1440+SIM_NOW.min;}
function abs(day,min){return day*1440+(min||0);}

// ---------- appointment status (relative to sim now) + user overrides ----------
const STATE=G.SIMSTATE;
function apptStatus(v){
 const ov=STATE.get('appt:'+v.id);
 const nowA=nowAbs(),st=abs(v.day,v.start);
 if(ov&&ov.status)return ov.status;
 if(v.fate==='cancel'&&SIM_NOW.day>=v.cancelDay)return 'Cancelled';
 if(st+v.dur<=nowA-30){return v.fate==='noshow'?'No Show':'Check-out';}
 if(v.day===SIM_NOW.day&&st<=nowA+5){
   if(v.fate==='noshow')return st<nowA-15?'No Show':'Scheduled';
   const into=nowA-st;
   return into<0?'Checked In':into<10?'Intake':into<25?'Exam':'Sign-off';
 }
 return v.confirmed?'Confirmed':'Scheduled';
}
const COMPLETED=s=>s==='Check-out'||s==='Sign-off';
function isDone(v){return apptStatus(v)==='Check-out';}

// ---------- clinical derivations ----------
function activePreg(p,n){return p.preg.find(pg=>n>=pg.lmp+35&&n<pg.end&&pg.outcome!=='transfer'||(pg.outcome==='transfer'&&n>=pg.lmp+35&&n<pg.end));}
function pregAt(p,n){return p.preg.find(pg=>n>=pg.lmp&&n<pg.end);}
function lastPregBefore(p,n){let x=null;for(const pg of p.preg)if(pg.end<=n)x=pg;return x;}
function postpartum(p,n){const pg=lastPregBefore(p,n);return pg&&pg.outcome==='delivered'&&n-pg.end<=84?pg:null;}
function gp(p,n){let g=p.gp.g,pp=p.gp.p;for(const pg of p.preg){if(pg.lmp<=n){g++;if(pg.end<=n&&pg.outcome==='delivered')pp++;}}return 'G'+g+'P'+pp;}
function dayAppts(n){const s=schedule[n];if(!s)return [];const out=[];for(const k in s.day)out.push(...s.day[k]);return out;}
function addedAppts(){return STATE.list('book:').map(x=>x.v);}

// vitals for a completed visit
function vitals(v){
 const p=byId[v.pid];const r=R(SEED+':vit:'+v.id);
 const pg=v.preg&&v.day<v.preg.end?v.preg:null;
 const base=R(SEED+':bw:'+p.id);const bw=base.int(118,215);
 let wt=bw+(base.f()-0.5)*6*(v.day-RANGE_START)/365;
 let g=null;
 if(pg){g=C.ga(pg.lmp,v.day);wt=bw+Math.max(0,(g.w-12))*0.85+r.range(-1,1);}
 const htn=pg&&pg.risk.some(x=>/HTN/.test(x));
 const sys=Math.round(r.norm(htn?136:114,9)),dia=Math.round(r.norm(htn?88:72,6));
 const o={bp:sys+'/'+dia,sys,dia,pulse:r.int(62,96),wt:Math.round(wt*10)/10,ht:"5' "+base.int(1,9)+'"',temp:(97.6+r.f()*1.2).toFixed(1),rr:r.int(14,18),spo2:r.int(96,100),bmi:null};
 const inches=60+parseInt(o.ht.split(' ')[1]);o.bmi=(o.wt*703/(inches*inches)).toFixed(1);
 if(g){o.ga=g.str;o.fhr=g.w>=10?r.int(128,158):null;o.fh=g.w>=20?Math.max(16,g.w+r.int(-2,2)):null;
  o.uprot=r.wpick([[85,'Negative'],[10,'Trace'],[5,'1+']]);o.uglu=r.wpick([[92,'Negative'],[6,'Trace'],[2,'1+']]);
  o.edema=r.wpick([[80,'None'],[15,'Trace'],[5,'1+']]);o.fm=g.w>=20?'Present':'';o.pres=g.w>=34?r.wpick([[94,'Vertex'],[5,'Breech'],[1,'Transverse']]):'';
  o.ctx=g.w>=36?r.wpick([[80,'None'],[20,'Irregular']]):'None';o.lof='None';o.vb='None';}
 return o;
}

// ---------- results / documents ----------
function rng3(r,lo,hi,dec){return (lo+r.f()*(hi-lo)).toFixed(dec||0);}
const LABDEF={
 CBC:{name:'CBC w/o differential',vendor:'SimQuest Diagnostics',lag:[1,1],comps:r=>{const hgb=+r.norm(12.2,1.1).toFixed(1);return [['WBC',rng3(r,4.2,11.8,1),'4.0-11.0','x10E3/uL'],['Hemoglobin',hgb,'11.1-15.9','g/dL',hgb<11.1?'L':''],['Hematocrit',(hgb*3).toFixed(1),'34.0-46.6','%',hgb*3<34?'L':''],['Platelets',r.int(150,380),'150-450','x10E3/uL']];}},
 PRENATAL:{name:'Prenatal Panel',vendor:'SimQuest Diagnostics',lag:[1,3],comps:(r,p)=>[['ABO/Rh',p.blood,'',''],['Antibody Screen','Negative','Negative',''],['Rubella IgG',r.chance(0.08)?'Non-immune':'Immune','Immune','',r.chance(0)?'A':''],['HBsAg','Non-reactive','Non-reactive',''],['HIV 1/2 Ag/Ab','Non-reactive','Non-reactive',''],['RPR','Non-reactive','Non-reactive',''],['Hep C Ab','Non-reactive','Non-reactive','']]},
 UCX:{name:'Urine Culture',vendor:'SimQuest Diagnostics',lag:[2,3],comps:r=>r.chance(0.07)?[['Result','>100,000 CFU/mL E. coli','<10,000','','A']]:[['Result','No growth','No growth','']]},
 NIPT:{name:'Cell-free DNA (NIPT)',vendor:'SimGenomics Lab',lag:[6,9],comps:r=>[['Trisomy 21','Low risk','Low risk',''],['Trisomy 18','Low risk','Low risk',''],['Trisomy 13','Low risk','Low risk',''],['Fetal fraction',rng3(r,6,18,1),'>4','%']]},
 GLU1:{name:'Glucose tolerance, 1 hr (50 g)',vendor:'SimQuest Diagnostics',lag:[1,1],comps:r=>{const g=Math.round(r.norm(118,22));return [['Glucose, 1 hr',g,'<140','mg/dL',g>=140?'H':'']];}},
 GBS:{name:'Group B Strep culture',vendor:'SimQuest Diagnostics',lag:[2,3],comps:r=>r.chance(0.24)?[['GBS','POSITIVE','Negative','','A']]:[['GBS','Negative','Negative','']]},
 PAP:{name:'ThinPrep Pap + HPV (co-test)',vendor:'SimPath Cytology',lag:[5,9],comps:r=>{const res=r.wpick([[86,['NILM','Negative']],[6,['ASC-US','Positive']],[4,['NILM','Positive (HPV 16/18 neg)']],[3,['LSIL','Positive']],[1,['HSIL','Positive']]]);return [['Interpretation',res[0],'NILM','',res[0]!=='NILM'?'A':''],['HR HPV',res[1],'Negative','',res[1]!=='Negative'?'A':'']];}},
 GCCT:{name:'Chlamydia/Gonorrhea NAA',vendor:'SimQuest Diagnostics',lag:[2,3],comps:r=>r.chance(0.03)?[['Chlamydia','Detected','Not detected','','A'],['Gonorrhea','Not detected','Not detected','']]:[['Chlamydia','Not detected','Not detected',''],['Gonorrhea','Not detected','Not detected','']]},
 TSH:{name:'TSH',vendor:'SimQuest Diagnostics',lag:[1,2],comps:r=>{const t=+(r.f()<0.1?r.range(4.6,9):r.range(0.6,4.2)).toFixed(2);return [['TSH',t,'0.45-4.50','uIU/mL',t>4.5?'H':'']];}},
 LIPID:{name:'Lipid Panel',vendor:'SimQuest Diagnostics',lag:[1,2],comps:r=>{const ldl=r.int(70,175);return [['Total Cholesterol',ldl+r.int(60,90),'100-199','mg/dL'],['LDL',ldl,'0-99','mg/dL',ldl>99?'H':''],['HDL',r.int(38,85),'>39','mg/dL'],['Triglycerides',r.int(60,210),'0-149','mg/dL']];}},
 WETMT:{name:'Vaginal pathogens panel (BV/Candida/Trich)',vendor:'SimQuest Diagnostics',lag:[1,2],comps:r=>[['Gardnerella (BV)',r.chance(0.45)?'Positive':'Negative','Negative','',''],['Candida',r.chance(0.25)?'Positive':'Negative','Negative',''],['Trichomonas','Negative','Negative','']]},
 UA:{name:'Urinalysis w/ reflex',vendor:'SimQuest Diagnostics',lag:[1,1],comps:r=>[['Leukocyte esterase',r.chance(0.4)?'2+':'Negative','Negative',''],['Nitrite',r.chance(0.3)?'Positive':'Negative','Negative','']]},
 BIOPSY:{name:'Surgical pathology - cervical biopsy',vendor:'SimPath Cytology',lag:[6,10],comps:r=>[['Diagnosis',r.wpick([[55,'LSIL (CIN 1)'],[25,'Benign cervical tissue'],[20,'HSIL (CIN 2)']]),'','','A']]},
};
const IMGDEF={
 DATUS:{name:'US OB < 14 wks (dating)',site:'Sim Imaging Center',text:(r,p,v)=>'Single live intrauterine pregnancy. CRL consistent with '+C.ga(v.preg.lmp,v.day).str+'. FHR '+r.int(140,175)+' bpm. EDD by LMP confirmed.'},
 ANAT:{name:'US OB detailed anatomy (76811)',site:'Sim Maternal-Fetal Imaging',text:(r)=>r.chance(0.08)?'Anatomy survey incomplete (spine/heart views suboptimal); recommend follow-up in 3-4 weeks. Placenta posterior, no previa.':'Normal fetal anatomy survey. Placenta anterior, no previa. AFI normal. EFW '+r.int(45,62)+'th percentile.',abn:t=>/incomplete/.test(t)},
 GROWTH:{name:'US OB follow-up / growth',site:'Sim Maternal-Fetal Imaging',text:(r)=>{const pc=r.int(4,92);return 'EFW '+pc+'th percentile. AFI '+r.int(8,20)+' cm. Cephalic presentation.'+(pc<10?' FGR suspected; recommend MFM review and weekly testing.':'');},abn:t=>/FGR/.test(t)},
 PELV:{name:'US Pelvis transvaginal',site:'Sim Imaging Center',text:(r)=>r.wpick([[50,'Normal uterus and ovaries. Endometrial stripe '+r.int(3,9)+' mm.'],[25,'Right ovarian simple cyst '+r.int(2,6)+'.'+r.int(0,9)+' cm. Recommend follow-up in 6-8 weeks.'],[25,'Fibroid uterus; largest intramural fibroid '+r.int(2,7)+'.'+r.int(0,9)+' cm.']]),abn:t=>/cyst|Fibroid/.test(t)},
 MAMMO:{name:'Mammogram screening bilateral w/ tomo',site:'Sim Breast Imaging (fictitious)',text:(r)=>r.chance(0.09)?'BI-RADS 0: Incomplete. Focal asymmetry left breast; diagnostic mammogram and ultrasound recommended.':'BI-RADS 1: Negative. Routine annual screening.',abn:t=>/BI-RADS 0/.test(t)},
};
const CONSULTS=[
 ['Maternal-Fetal Medicine consult','Sim MFM Associates','Thank you for referring this patient. We reviewed her history and ultrasound. Recommend serial growth scans every 4 weeks, low-dose aspirin 81 mg nightly, and antenatal testing from 32 weeks. We will continue to co-manage.'],
 ['Endocrinology consult','Sim Endocrine Partners','Seen for thyroid management. TSH reviewed. Plan: adjust levothyroxine and repeat TSH in 4-6 weeks. Copy to referring provider.'],
 ['Cardiology consult','Sim Heart & Vascular','Palpitations evaluated. ECG normal sinus rhythm; Holter unremarkable. No restrictions on activity. Follow up as needed.'],
 ['Breast surgery consult','Sim Breast Surgical Group','Patient seen for imaging finding. Plan: ultrasound-guided core biopsy scheduled. Will forward pathology.'],
 ['Gastroenterology consult','Sim GI Associates','Seen for reflux and abdominal pain. Recommend PPI trial and diet modification. Follow-up in 8 weeks.']];

function ordersFor(v){
 const p=byId[v.pid],o=[];
 const wk=v.preg&&v.day<v.preg.end?C.ga(v.preg.lmp,v.day).w:null;
 if(v.type==='NOB'){o.push(['L','PRENATAL'],['L','CBC'],['L','UCX'],['L','GCCT']);o.push(['I','DATUS']);}
 if(v.type==='ROB'){
  if(/NIPT/.test(v.reason))o.push(['L','NIPT']);
  if(/anatomy/.test(v.reason))o.push(['I','ANAT']);
  if(/glucola/.test(v.reason))o.push(['L','GLU1'],['L','CBC']);
  if(/GBS/.test(v.reason))o.push(['L','GBS']);
  if(wk>=30&&v.preg.risk.length&&h01(v.id+'g')<0.5)o.push(['I','GROWTH']);
 }
 if(v.type==='WWV'){o.push(['L','PAP']);if(C.ageAt(p.dob,v.day)<26)o.push(['L','GCCT']);if(C.ageAt(p.dob,v.day)>=40)o.push(['I','MAMMO']);if(C.ageAt(p.dob,v.day)>=45&&h01(v.id+'l')<0.5)o.push(['L','LIPID'],['L','TSH']);}
 if(v.type==='PROB'||v.type==='TELE'){
  if(/vaginosis|irritation/.test(v.reason))o.push(['L','WETMT']);
  if(/UTI/.test(v.reason))o.push(['L','UA'],['L','UCX']);
  if(/bleeding|pelvic pain|Menometr|dysmen/.test(v.reason))o.push(['I','PELV'],['L','CBC']);
  if(/menopause|PCOS/.test(v.reason))o.push(['L','TSH']);
 }
 if(v.type==='US')o.push(['I','PELV']);
 if(v.type==='COLPO')o.push(['L','BIOPSY']);
 if(v.type==='PP'&&h01(v.id+'pp')<0.4)o.push(['L','CBC']);
 return o;
}
// result object for an order on a completed visit
function makeResult(v,k,idx){
 const kind=k[0],code=k[1],p=byId[v.pid];
 const r=R(SEED+':res:'+v.id+':'+code);
 if(kind==='L'){
  const d=LABDEF[code];const lag=r.int(d.lag[0],d.lag[1]);
  const comps=d.comps(r,p,v);const abn=comps.some(c=>c[4]);
  return {id:'R'+v.id.slice(1)+'-'+idx,kind:'Lab',code,name:d.name,vendor:d.vendor,pid:v.pid,visit:v.id,prov:v.prov,collected:v.day,
   day:v.day+lag,min:r.int(5*60,23*60),comps,abn,folder:'Lab / Imaging',priority:abn&&comps.some(c=>/HSIL|POSITIVE|Detected|BI-RADS 0|>100,000/.test(c[1]))?'High':'Normal'};
 }
 const d=IMGDEF[code];const text=d.text(r,p,v);const abn=d.abn?d.abn(text):false;
 return {id:'R'+v.id.slice(1)+'-'+idx,kind:'Imaging',code,name:d.name,vendor:d.site,pid:v.pid,visit:v.id,prov:v.prov,collected:v.day+(code==='MAMMO'?r.int(3,20):0),
   day:v.day+(code==='MAMMO'?r.int(4,22):r.int(0,1)),min:r.int(8*60,19*60),text,abn,folder:'Lab / Imaging',priority:abn?'High':'Normal'};
}
const resCache={};
function resultsForVisit(v){
 if(resCache[v.id])return resCache[v.id];
 const out=ordersFor(v).map((k,i)=>makeResult(v,k,i));resCache[v.id]=out;return out;
}
function patientResults(p,upTo){
 const out=[];for(const v of p.visits){if(abs(v.day,v.start)>nowAbs())break;if(v.fate!=='ok')continue;if(!COMPLETED(apptStatus(v))&&v.day>=SIM_NOW.day)continue;
  for(const r of resultsForVisit(v))if(abs(r.day,r.min)<=nowAbs())out.push(r);}
 return out;
}
// documents: consults, hospital discharge after delivery
function patientDocs(p){
 const out=[];const r=R(SEED+':doc:'+p.id);
 for(const pg of p.preg){
  if(pg.outcome==='delivered'){const d=pg.end+2+r.int(0,3);out.push({id:'D'+p.idx+'-'+pg.lmp,kind:'Hospital discharge summary',name:'Delivery discharge summary',vendor:pg.hosp,pid:p.id,day:d,min:r.int(9*60,17*60),prov:p.prov,
    text:'Delivered '+C.mdySlash(pg.end)+' at '+C.ga(pg.lmp,pg.end).str+' by '+pg.mode+'. '+pg.baby+' infant, '+pg.weight+' g. Postpartum course uncomplicated. Discharged PPD'+(pg.mode.includes('C-section')?3:2)+'. Follow up with OB in 1-2 weeks for '+(pg.mode.includes('C-section')?'incision check':'BP check')+' and 6 weeks for postpartum visit.',folder:'Clinical Documents',abn:false});}
  if(pg.risk.length&&pg.endGA>20*7){const d=pg.lmp+r.int(18,24)*7;const c=CONSULTS[0];out.push({id:'D'+p.idx+'-m'+pg.lmp,kind:'Consult letter',name:c[0],vendor:c[1],pid:p.id,day:d,min:r.int(9*60,17*60),prov:p.prov,text:c[2]+' Indication: '+pg.risk.join(', ')+'.',folder:'Clinical Documents',abn:false});}
 }
 let t=RANGE_START+r.int(30,500);
 while(t<RANGE_END){const c=CONSULTS[1+r.int(0,3)];out.push({id:'D'+p.idx+'-c'+t,kind:'Consult letter',name:c[0],vendor:c[1],pid:p.id,day:t,min:r.int(9*60,17*60),prov:p.prov,text:c[2],folder:'Clinical Documents',abn:false});t+=r.int(500,1400);}
 return out.filter(d=>abs(d.day,d.min)<=nowAbs());
}
// daily generated inbox items (refills, cases, appt requests)
const RX=[['Prenatal vitamin w/ DHA','1 tab PO daily'],['Norgestimate-ethinyl estradiol 0.25-35','1 tab PO daily'],['Estradiol 1 mg','1 tab PO daily'],['Progesterone 100 mg','1 cap PO qhs'],['Metformin 500 mg','1 tab PO BID'],['Levothyroxine 50 mcg','1 tab PO daily'],['Ondansetron 4 mg ODT','1 tab q8h prn nausea'],['Metronidazole 500 mg','1 tab PO BID x7d'],['Norethindrone 0.35 mg','1 tab PO daily'],['Labetalol 200 mg','1 tab PO BID'],['Ibuprofen 600 mg','1 tab PO q6h prn']];
const CASES=['Patient called asking for lab results','Portal message: question about medication side effects','Patient reports spotting, requests call back','Requests FMLA paperwork','Portal message: nausea and vomiting, unable to keep fluids','Patient asks to reschedule appointment','Pharmacy calling re: prior authorization','Patient requests records be sent to another provider','Reports decreased fetal movement since this morning','Question about travel during pregnancy'];
function dailyItems(n){
 if(dailyItems.c[n])return dailyItems.c[n];
 const r=R(SEED+':daily:'+n);const out=[];if(!isClinicDay(n)&&r.chance(0.6)){dailyItems.c[n]=out;return out;}
 const pick=()=>patients[r.int(0,patients.length-1)];
 const nr=r.int(3,8);for(let i=0;i<nr;i++){const p=pick();const rx=r.pick(RX);out.push({id:'X'+n+'-'+i,kind:'Rx renewal',folder:'Orders / Rxs / Auths',name:'Rx renewal request: '+rx[0],text:rx[0]+' - '+rx[1]+'. Requested by '+p.pharm+'. Last filled 30 days ago, 0 refills remaining.',pid:p.id,day:n,min:r.int(7*60,20*60),prov:p.prov,vendor:p.pharm,abn:false});}
 if(r.chance(0.5)){const p=pick();out.push({id:'X'+n+'-pa',kind:'Prior authorization',folder:'Orders / Rxs / Auths',name:'Prior auth needed: US Pelvis transvaginal (76830)',text:'Payer requires prior authorization. Clinical notes requested.',pid:p.id,day:n,min:r.int(8*60,17*60),prov:p.prov,vendor:PAYERS[p.payer],abn:false});}
 const nc=r.int(2,7);for(let i=0;i<nc;i++){const p=pick();const c=r.pick(CASES);out.push({id:'K'+n+'-'+i,kind:'Patient case',folder:'Patient Cases',name:c,text:c+'. Best callback '+p.phone+'.',pid:p.id,day:n,min:r.int(7*60,19*60),prov:p.prov,vendor:r.pick(['Phone','Patient portal']),abn:/decreased fetal|unable to keep/.test(c),priority:/decreased fetal|unable to keep/.test(c)?'High':'Normal'});}
 const na=r.int(0,3);for(let i=0;i<na;i++){const p=pick();out.push({id:'Q'+n+'-'+i,kind:'Appointment request',folder:'Appointment Requests',name:'Portal appointment request: '+r.pick(['annual exam','problem visit','birth control consult','ultrasound follow-up']),text:'Preferred: '+r.pick(['mornings','afternoons','any time','Fridays only'])+'.',pid:p.id,day:n,min:r.int(6*60,23*60),prov:p.prov,vendor:'Patient portal',abn:false});}
 if(r.chance(0.15)){const p=pick();out.push({id:'U'+n,kind:'Unknown document',folder:'Unknown Documents',name:'Fax received - unassigned',text:'Incoming fax could not be matched to a patient.',pid:p.id,day:n,min:r.int(8*60,17*60),prov:p.prov,vendor:'Fax',abn:false});}
 dailyItems.c[n]=out;return out;
}
dailyItems.c={};

// ---------- inbox ----------
const FOLDERS=['Patient in Office','Encounters','Appointment Requests','Patient Cases','Orders / Rxs / Auths','Lab / Imaging','Clinical Documents','Admin / Phone Messages','Unknown Documents','Need Followup'];
const AUTOCLOSE_DAYS=14;
function itemState(it){return STATE.get('inbox:'+it.id)||{};}
function itemOpen(it){const s=itemState(it);if(s.closed)return false;if(s.reopened)return true;
 // historical items older than AUTOCLOSE_DAYS were handled already in the sim history
 const age=nowAbs()-abs(it.day,it.min);const keep=(it.abn||it.priority==='High')?AUTOCLOSE_DAYS:(it.folder==='Clinical Documents'?6:it.folder==='Lab / Imaging'?4:3);
 return age<=keep*1440;}
function inboxItems(provId){
 const out=[];const now=SIM_NOW.day;
 // results from visits in last ~45 days
 for(let n=now-45;n<=now;n++){
  for(const v of dayAppts(n)){
   if(v.fate!=='ok')continue;const st=apptStatus(v);if(!COMPLETED(st))continue;
   if(provId&&v.prov!==provId)continue;
   for(const r of resultsForVisit(v))if(abs(r.day,r.min)<=nowAbs()&&itemOpen(r))out.push(r);
   // unsigned encounters
   const signedOverride=STATE.get('sign:'+v.id);
   if(!signedOverride&&(v.unsigned||(n+v.signLag>=now))&&n>=now-10&&(n<now||v.start+v.dur<=SIM_NOW.min)){
     out.push({id:'E'+v.id,kind:'Encounter',folder:'Encounters',name:'Encounter '+C.mdySlash(n)+' - '+ATYPE[v.type].name,text:'Encounter awaiting provider sign-off.',pid:v.pid,day:n,min:v.start,prov:v.prov,vendor:'',visit:v.id,abn:false});
   }
  }
 }
 for(let n=now-AUTOCLOSE_DAYS;n<=now;n++){
  for(const it of dailyItems(n))if((!provId||it.prov===provId)&&abs(it.day,it.min)<=nowAbs()&&itemOpen(it))out.push(it);
 }
 // documents (consults/discharges) recently arrived: scan patients with deliveries/consults near now (index built lazily)
 for(const d of recentDocs()){if((!provId||d.prov===provId)&&itemOpen(d))out.push(d);}
 // patient in office
 for(const v of dayAppts(now)){const st=apptStatus(v);if(['Checked In','Intake','Exam'].includes(st)&&(!provId||v.prov===provId))out.push({id:'O'+v.id,kind:'Patient in office',folder:'Patient in Office',name:st+' - '+ATYPE[v.type].name,text:'',pid:v.pid,day:now,min:v.start,prov:v.prov,visit:v.id,abn:false});}
 // user-routed / followup
 for(const x of STATE.list('inbox:'))if(x.v.followup&&!x.v.closed){/* represented in its folder already */}
 return out.sort((a,b)=>abs(b.day,b.min)-abs(a.day,a.min));
}
let docIndex=null;
function buildDocIndex(){docIndex={};for(const p of patients){const r=R(SEED+':doc:'+p.id);
 // replicate patientDocs without time filter
 const saved=SIM_NOW;SIM_NOW={day:RANGE_END+10,min:0};for(const d of patientDocs(p))(docIndex[d.day]=docIndex[d.day]||[]).push(d);SIM_NOW=saved;}}
function recentDocs(){if(!docIndex)buildDocIndex();const out=[];for(let n=SIM_NOW.day-AUTOCLOSE_DAYS;n<=SIM_NOW.day;n++)for(const d of (docIndex[n]||[]))if(abs(d.day,d.min)<=nowAbs())out.push(d);return out;}
function inboxCounts(provId){const c={};FOLDERS.forEach(f=>c[f]=0);for(const it of inboxItems(provId))c[it.folder]=(c[it.folder]||0)+1;
 for(const x of STATE.list('inbox:'))if(x.v.followup&&!x.v.closed)c['Need Followup']++;
 c.Total=FOLDERS.reduce((s,f)=>s+c[f],0);return c;}

// ---------- claims ----------
const DENIALS=[
 ['CO-197','Precertification/authorization absent','Obtain retro-authorization from payer, attach auth # to claim, resubmit.'],
 ['CO-16','Claim lacks information needed for adjudication','Add missing referring provider NPI / LMP date; correct and resubmit.'],
 ['CO-50','Non-covered service: not deemed medically necessary','Add supporting diagnosis (ICD-10) and visit note; submit appeal with records.'],
 ['CO-4','Procedure code inconsistent with modifier','Append modifier 25 to E&M / correct modifier; resubmit corrected claim (freq 7).'],
 ['CO-29','Time limit for filing has expired','Locate proof of timely filing (clearinghouse report) and appeal.'],
 ['CO-22','Coordination of benefits: other payer primary','Update insurance order in registration; bill primary payer first.'],
 ['CO-97','Service included in global payment (bundled)','Verify global OB package; remove separately billed component or add modifier.'],
 ['PR-1','Deductible amount','Patient responsibility: transfer balance to patient statement.'],
 ['CO-11','Diagnosis inconsistent with procedure','Correct ICD-10 linkage on charge line; resubmit.']];
const FEES={'99204':285,'99214':195,'99213':135,'0502F':0,'0503F':0,'99024':0,'99395':260,'99396':275,'57454':420,'58300':310,'76815':180,'76830':240,'59400':4200,'59510':4800,'59610':4400,'59618':5100,'88175':85,'Q0091':55,'81025':18};
function claimFor(v){
 const p=byId[v.pid];const r=R(SEED+':clm:'+v.id);
 let cpts=ATYPE[v.type].cpt.slice();
 if(v.type==='WWV'){if(C.ageAt(p.dob,v.day)>=40)cpts=['99396'];cpts.push('Q0091','88175');}
 if(v.type==='PROB'&&r.chance(0.35))cpts=['99214'];
 if(v.type==='NOB')cpts.push('81025');
 if(/us/.test(v.reason)||v.type==='US')cpts.push('76830');
 const charges=cpts.reduce((s,c)=>s+(FEES[c]||100),0);
 const denied=charges>0&&r.chance(0.055);const den=denied?r.pick(DENIALS):null;
 const submit=v.day+v.chargeLag+1;
 return {id:'SC'+v.id.slice(1),visit:v.id,pid:v.pid,dos:v.day,prov:v.prov,payer:PAYERS[p.payer],cpts,dx:v.dx,charges,
  chargeEntered:v.day+v.chargeLag,submit,denyDay:denied?submit+r.int(12,30):null,den,payDay:denied?null:submit+r.int(14,35),paid:Math.round(charges*r.range(0.45,0.8)*100)/100};
}
function deliveryClaim(p,pg){const r=R(SEED+':dclm:'+p.id+pg.lmp);const cpt=pg.mode==='SVD'||pg.mode==='Vacuum-assisted vaginal'?'59400':pg.mode==='VBAC'?'59610':pg.mode==='Primary C-section'?'59510':'59618';
 const charges=FEES[cpt];const denied=r.chance(0.07);const den=denied?r.pick([DENIALS[0],DENIALS[1],DENIALS[6]]):null;const submit=pg.end+r.int(45,60);
 return {id:'SG'+p.idx+'-'+pg.lmp,visit:null,pid:p.id,dos:pg.end,prov:p.prov,payer:PAYERS[p.payer],cpts:[cpt],dx:'Z37.0',charges,chargeEntered:submit-1,submit,denyDay:denied?submit+r.int(14,30):null,den,payDay:denied?null:submit+r.int(15,40),paid:Math.round(charges*r.range(0.5,0.75)*100)/100,global:true};}
function claimStatus(c){
 const n=SIM_NOW.day;const ov=STATE.get('claim:'+c.id);if(ov&&ov.status)return ov.status;
 if(n<c.chargeEntered&&c.chargeEntered>c.dos)return 'MISSING SLIP';
 if(n<c.submit)return 'HOLD';
 if(c.denyDay&&n>=c.denyDay)return 'DENIED';
 if(c.payDay&&n>=c.payDay)return 'CLOSED';
 return 'BILLED';
}
function claimsWindow(from,to){
 const out=[];
 for(let n=Math.max(RANGE_START,from);n<=Math.min(to,SIM_NOW.day);n++){
  for(const v of dayAppts(n)){if(v.fate!=='ok')continue;if(!COMPLETED(apptStatus(v)))continue;const c=claimFor(v);if(c.charges===0&&claimStatus(c)!=='MISSING SLIP')continue;out.push(c);}
 }
 for(const p of patients)for(const pg of p.preg)if(pg.outcome==='delivered'&&pg.end>=from&&pg.end<=to&&pg.end<=SIM_NOW.day)out.push(deliveryClaim(p,pg));
 return out;
}

// ---------- reports ----------
function obCensus(n){const out=[];for(const p of patients){const pg=p.preg.find(pg=>n>=pg.lmp+42&&n<pg.end);if(!pg)continue;
 // only "established" if NOB happened
 const nob=p.visits.find(v=>v.preg===pg&&v.type==='NOB');if(!nob||nob.day>n)continue;out.push({p,pg});}return out;}
function lastSeen(p,n){let last=null;for(const v of p.visits){if(v.day>n)break;if(v.fate==='ok'&&(v.day<n||COMPLETED(apptStatus(v))))last=v;}return last;}
function nextAppt(p,n){for(const v of p.visits){if(v.day>=n&&v.fate!=='noshow'&&!(v.fate==='cancel'&&n>=v.cancelDay)&&!/Cancelled|No Show|Check-out/.test(apptStatus(v)))return v;}
 for(const b of addedAppts())if(b.pid===p.id&&b.day>=n)return b;return null;}

G.SIMDATA={SEED,RANGE_START,RANGE_END,PROVIDERS,STAFF,PAYERS,ATYPE,FOLDERS,patients,byId,schedule,apptById,
 init(){genPatients();genVisits();},setNow,get now(){return SIM_NOW;},nowAbs,abs,apptStatus,isDone,COMPLETED,isClinicDay,
 activePreg,pregAt,postpartum,lastPregBefore,gp,dayAppts,addedAppts,vitals,resultsForVisit,patientResults,patientDocs,
 inboxItems,inboxCounts,itemOpen,claimFor,claimStatus,claimsWindow,deliveryClaim,obCensus,lastSeen,nextAppt,RX,
 provById:id=>PROVIDERS.find(p=>p.id===id)};
})(window);
