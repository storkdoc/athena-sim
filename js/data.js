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
 {id:'P1',full:'Steven S Behram',bfull:'Steven Behram',last:'BEHRAM',first:'STEVE',cred:'MD',short:'Behram, S',user:'sbehram3',days:[1,2,3,4,5],ampm:{2:'pm'}},
 {id:'P2',full:'Lena A Okafor',bfull:'Lena Okafor',last:'OKAFOR',first:'LENA',cred:'MD',short:'Okafor, L',user:'lokafor1',days:[1,2,3,4,5],ampm:{4:'am'}},
 {id:'P3',full:'June M Marlowe',bfull:'June Marlowe',last:'MARLOWE',first:'JUNE',cred:'CNM',short:'Marlowe, J',user:'jmarlowe',days:[1,2,3,4,5],ampm:{}},
 {id:'P4',full:'Priya K Tran',bfull:'Priya Tran',last:'TRAN',first:'PRIYA',cred:'NP',short:'Tran, P',user:'ptran2',days:[1,2,3,4],ampm:{}}];
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
 US:{name:'ULTRASOUND',slots:1,cpt:['76815'],color:'#5f7f9f'},
 NPV:{name:'NEW PATIENT',slots:2,cpt:['99204'],color:'#3c9a5f'}};
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
   portal:r.chance(0.78),middle:r.pick(['Anne','Marie','Louise','Grace','Rose','Jean','Elise','Joy','Lynn','Kate','Noelle','Faith']),eid:'E'+r.int(1000000,9999999),secondary:r.chance(0.3)?r.pick(['Medicare Secondary (SIM)','Tricare For Life (SIM)','AARP Supplemental (SIM)','Spouse plan - Aetna (SIM)']):null,mobile2:r.chance(0.6)};
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
// problem list string (from app chronic(); fixed per patient) used to keep orders and values clinically coherent
function probStr(p){if(p._ps!=null)return p._ps;if(!G.SIMAPP||!G.SIMAPP.chronic)return '';p._ps=G.SIMAPP.chronic(p).map(c=>c[0]).join('|');return p._ps;}
function hasP(p,re){return re.test(probStr(p));}
// per-patient lab baselines so repeated panels trend instead of jumping randomly
function base(p){if(p._lb)return p._lb;const r=R(SEED+':lb:'+p.id);const b={};
 b.hgb=hasP(p,/anemia|Menorrhagia/)?r.norm(10.5,0.4):r.norm(12.9,0.6);b.ferr=hasP(p,/anemia|Menorrhagia/)?r.range(5,13):r.range(25,110);
 b.tsh=hasP(p,/Hypothyroid/)?r.range(2.2,4.0):r.range(0.9,2.9);b.ldl=hasP(p,/Hyperlipid/)?r.norm(152,14):r.norm(98,18);b.hdl=r.norm(58,10);b.tg=hasP(p,/Hyperlipid|diabetes|Obesity/)?r.norm(175,25):r.norm(105,25);
 b.a1c=hasP(p,/Type 2 diabetes/)?r.range(6.7,7.6):hasP(p,/Prediabetes/)?r.range(5.8,6.2):hasP(p,/Polycystic|Obesity/)?r.range(5.4,5.7):r.range(4.9,5.4);
 b.vitd=hasP(p,/Vitamin D|Osteopenia/)?r.range(13,22):r.range(26,48);b.cr=r.range(0.6,0.95);b.alt=r.range(12,30);b.glu=b.a1c*17-5;b.plt=r.int(190,330);b.wbc=r.range(5,8.5);
 p._lb=b;return b;}
function yrs(v){return (v.day-dn(2021,1,1))/365.25;}
function fl(x,lo,hi){return x<lo?'L':x>hi?'H':'';}
const LABDEF={
 CBC:{name:'CBC w/o differential',vendor:'SimQuest Diagnostics',lag:[1,1],comps:(r,p,v)=>{const b=base(p);const pg=v&&v.preg&&v.day<v.preg.end;let hgb=b.hgb+r.norm(0,0.35)-(pg?0.9:0)+(hasP(p,/anemia/)?Math.min(1.2,yrs(v)*0.25):0);hgb=+hgb.toFixed(1);const wbc=+(b.wbc+r.norm(0,0.8)+(pg?1.5:0)).toFixed(1);const plt=Math.round(b.plt+r.norm(0,18));const hct=+(hgb*3.02).toFixed(1);const mcv=Math.round(hasP(p,/anemia/)?r.norm(77,2):r.norm(89,3));return [['WBC',wbc,'3.4-10.8','x10E3/uL',fl(wbc,3.4,10.8)],['RBC',(hgb/2.95).toFixed(2),'3.77-5.28','x10E6/uL'],['Hemoglobin',hgb,'11.1-15.9','g/dL',fl(hgb,11.1,15.9)],['Hematocrit',hct,'34.0-46.6','%',fl(hct,34,46.6)],['MCV',mcv,'79-97','fL',fl(mcv,79,97)],['RDW',(hasP(p,/anemia/)?r.range(15.2,17.5):r.range(12,14.4)).toFixed(1),'11.7-15.4','%',hasP(p,/anemia/)?'H':''],['Platelets',plt,'150-450','x10E3/uL',fl(plt,150,450)]];}},
 PRENATAL:{name:'Prenatal Panel',vendor:'SimQuest Diagnostics',lag:[1,3],comps:(r,p)=>[['ABO/Rh',p.blood,'',''],['Antibody Screen','Negative','Negative',''],['Rubella IgG',r.chance(0.08)?'Non-immune':'Immune','Immune','',r.chance(0)?'A':''],['HBsAg','Non-reactive','Non-reactive',''],['HIV 1/2 Ag/Ab','Non-reactive','Non-reactive',''],['RPR','Non-reactive','Non-reactive',''],['Hep C Ab','Non-reactive','Non-reactive','']]},
 UCX:{name:'Urine Culture',vendor:'SimQuest Diagnostics',lag:[2,3],comps:r=>r.chance(0.07)?[['Result','>100,000 CFU/mL E. coli','<10,000','','A']]:[['Result','No growth','No growth','']]},
 NIPT:{name:'Cell-free DNA (NIPT)',vendor:'SimGenomics Lab',lag:[6,9],comps:r=>[['Trisomy 21','Low risk','Low risk',''],['Trisomy 18','Low risk','Low risk',''],['Trisomy 13','Low risk','Low risk',''],['Fetal fraction',rng3(r,6,18,1),'>4','%']]},
 GLU1:{name:'Glucose tolerance, 1 hr (50 g)',vendor:'SimQuest Diagnostics',lag:[1,1],comps:r=>{const g=Math.round(r.norm(118,22));return [['Glucose, 1 hr',g,'<140','mg/dL',g>=140?'H':'']];}},
 GBS:{name:'Group B Strep culture',vendor:'SimQuest Diagnostics',lag:[2,3],comps:r=>r.chance(0.24)?[['GBS','POSITIVE','Negative','','A']]:[['GBS','Negative','Negative','']]},
 PAP:{name:'ThinPrep Pap + HPV (co-test)',vendor:'SimPath Cytology',lag:[5,9],comps:r=>{const res=r.wpick([[86,['NILM','Negative']],[6,['ASC-US','Positive']],[4,['NILM','Positive (HPV 16/18 neg)']],[3,['LSIL','Positive']],[1,['HSIL','Positive']]]);return [['Interpretation',res[0],'NILM','',res[0]!=='NILM'?'A':''],['HR HPV',res[1],'Negative','',res[1]!=='Negative'?'A':'']];}},
 GCCT:{name:'Chlamydia/Gonorrhea NAA',vendor:'SimQuest Diagnostics',lag:[2,3],comps:r=>r.chance(0.03)?[['Chlamydia','Detected','Not detected','','A'],['Gonorrhea','Not detected','Not detected','']]:[['Chlamydia','Not detected','Not detected',''],['Gonorrhea','Not detected','Not detected','']]},
 TSH:{name:'TSH rfx on abnormal to free T4',comment:'Reflex to free T4 performed when TSH is outside 0.450-4.500 uIU/mL (SIM).',vendor:'SimQuest Diagnostics',lag:[1,2],comps:(r,p,v)=>{const b=base(p);let t=b.tsh*Math.exp(r.norm(0,0.22));if(hasP(p,/Hypothyroid/)&&r.chance(0.18))t=r.range(4.7,8.5);t=+t.toFixed(2);const o=[['TSH',t,'0.45-4.50','uIU/mL',fl(t,0.45,4.5)]];if(t>4.5||t<0.45)o.push(['Free T4 (reflex)',(t>4.5?r.range(0.72,0.95):r.range(1.5,1.9)).toFixed(2),'0.82-1.77','ng/dL',t>4.5?'L':'H']);return o;}},
 LIPID:{name:'lipid panel',comment:'Fasting status reported by patient. Desirable total cholesterol <200 mg/dL.',vendor:'SimQuest Diagnostics',lag:[1,2],comps:(r,p,v)=>{const b=base(p);const statin=hasP(p,/Hyperlipid/)?Math.min(45,Math.max(0,yrs(v)-0.5)*18):0;const ldl=Math.round(b.ldl-statin+r.norm(0,8));const hdl=Math.round(b.hdl+r.norm(0,4));const tg=Math.round(b.tg+r.norm(0,18));const tc=ldl+hdl+Math.round(tg/5);return [['Total Cholesterol',tc,'100-199','mg/dL',fl(tc,100,199)],['Triglycerides',tg,'0-149','mg/dL',tg>149?'H':''],['HDL',hdl,'>39','mg/dL',hdl<40?'L':''],['VLDL Cholesterol Cal',Math.round(tg/5),'5-40','mg/dL',tg/5>40?'H':''],['LDL Chol Calc (NIH)',ldl,'0-99','mg/dL',ldl>99?'H':'']];}},
 WETMT:{name:'Vaginal pathogens panel (BV/Candida/Trich)',vendor:'SimQuest Diagnostics',lag:[1,2],comps:r=>[['Gardnerella (BV)',r.chance(0.45)?'Positive':'Negative','Negative','',''],['Candida',r.chance(0.25)?'Positive':'Negative','Negative',''],['Trichomonas','Negative','Negative','']]},
 UA:{name:'urinalysis, dipstick',vendor:'SimQuest Diagnostics',lag:[1,1],comps:r=>[['Leukocyte esterase',r.chance(0.4)?'2+':'Negative','Negative',''],['Nitrite',r.chance(0.3)?'Positive':'Negative','Negative','']]},
 ESTRADIOL:{name:'estradiol',vendor:'SimQuest Diagnostics',lag:[1,3],comps:(r,p,v)=>{const post=C.ageAt(p.dob,v.day)>=50;const e=post&&r.chance(0.5)?'<5.0':String(post?r.int(5,40):r.int(30,250));return [['Estradiol',e,'See comment','pg/mL','']];},comment:'ESTRADIOL REFERENCE RANGES (pg/mL)\n  Follicular phase ........ 19 - 144\n  Mid-cycle peak .......... 64 - 357\n  Luteal phase ............ 56 - 214\n  Postmenopausal .......... <5.0 - 32\n\nMethod: electrochemiluminescence immunoassay (SIM method note).'},
 FSHLH:{name:'FSH and LH',vendor:'SimQuest Diagnostics',lag:[1,2],comps:(r,p,v)=>{const post=C.ageAt(p.dob,v.day)>=50;const f=post?r.int(30,110):+(r.range(3,12).toFixed(1));const l=post?r.int(15,60):+(r.range(2,14).toFixed(1));return [['FSH',f,'See comment','mIU/mL',''],['LH',l,'See comment','mIU/mL','']];},comment:'FSH (mIU/mL): follicular 3.5-12.5 | mid-cycle 4.7-21.5 | luteal 1.7-7.7 | postmenopausal 25.8-134.8\nLH  (mIU/mL): follicular 2.4-12.6 | mid-cycle 14.0-95.6 | luteal 1.0-11.4 | postmenopausal 7.7-58.5'},
 A1C:{name:'hemoglobin A1C',vendor:'SimQuest Diagnostics',lag:[1,2],comps:(r,p,v)=>{const b=base(p);const drift=hasP(p,/Type 2 diabetes/)?-Math.min(0.6,yrs(v)*0.12):hasP(p,/Prediabetes/)?Math.min(0.25,yrs(v)*0.05):0;const a=+(b.a1c+drift+r.norm(0,0.12)).toFixed(1);return [['Hemoglobin A1c',a,'4.8-5.6','%',a>5.6?'H':''],['Estimated average glucose',Math.round(28.7*a-46.7),'','mg/dL']];},comment:'Prediabetes: 5.7 - 6.4 %\nDiabetes: >6.4 %\nGlycemic control for adults with diabetes: <7.0 %'},
 CMP:{name:'Comprehensive metabolic panel (14)',vendor:'SimQuest Diagnostics',lag:[1,1],comps:(r,p)=>{const b=base(p);const g=Math.round(b.glu+r.norm(0,7));const cr=+(b.cr+r.norm(0,0.05)).toFixed(2);const alt=Math.round(b.alt+r.norm(0,4));return [['Glucose',g,'70-99','mg/dL',fl(g,70,99)],['BUN',r.int(8,19),'6-24','mg/dL'],['Creatinine',cr,'0.57-1.00','mg/dL',fl(cr,0.57,1.0)],['eGFR',Math.round(Math.min(125,92/cr)),'>59','mL/min/1.73'],['Sodium',r.int(136,143),'134-144','mmol/L'],['Potassium',(r.range(3.7,4.9)).toFixed(1),'3.5-5.2','mmol/L'],['Chloride',r.int(98,106),'96-106','mmol/L'],['Carbon Dioxide, Total',r.int(20,28),'20-29','mmol/L'],['Calcium',(r.range(8.9,10.1)).toFixed(1),'8.7-10.2','mg/dL'],['Protein, Total',(r.range(6.3,7.6)).toFixed(1),'6.0-8.5','g/dL'],['Albumin',(r.range(4.0,4.8)).toFixed(1),'3.9-4.9','g/dL'],['Bilirubin, Total',(r.range(0.2,0.9)).toFixed(1),'0.0-1.2','mg/dL'],['Alkaline Phosphatase',r.int(48,110),'44-121','IU/L'],['AST (SGOT)',Math.round(alt*0.9+r.int(2,6)),'0-40','IU/L'],['ALT (SGPT)',alt,'0-32','IU/L',alt>32?'H':'']];}},
 VITD:{name:'Vitamin D, 25-Hydroxy',vendor:'SimQuest Diagnostics',lag:[1,3],comps:(r,p,v)=>{const b=base(p);const rep=hasP(p,/Vitamin D/)?Math.min(14,yrs(v)*4):0;const x=+(b.vitd+rep+r.norm(0,3)).toFixed(1);return [['Vitamin D, 25-Hydroxy',x,'30.0-100.0','ng/mL',x<30?'L':'']];},comment:'Vitamin D deficiency has been defined by the Institute of Medicine and an Endocrine Society practice guideline as a level of serum 25-OH vitamin D less than 20 ng/mL; insufficiency 21-29 ng/mL (SIM reference text).'},
 FERRITIN:{name:'Iron and TIBC + Ferritin',vendor:'SimQuest Diagnostics',lag:[1,2],comps:(r,p,v)=>{const b=base(p);const f=Math.round(b.ferr+(hasP(p,/anemia/)?Math.min(25,yrs(v)*6):0)+r.norm(0,3));const fe=Math.round(f<15?r.range(18,45):r.range(55,140));const tibc=Math.round(f<15?r.range(410,480):r.range(260,380));return [['Iron',fe,'27-159','ug/dL',fl(fe,27,159)],['TIBC',tibc,'250-450','ug/dL',fl(tibc,250,450)],['Iron Saturation',Math.round(fe/tibc*100),'15-55','%',fl(fe/tibc*100,15,55)],['Ferritin',f,'15-150','ng/mL',fl(f,15,150)]];}},
 BIOPSY:{name:'Surgical pathology - cervical biopsy',vendor:'SimPath Cytology',lag:[6,10],comps:r=>[['Diagnosis',r.wpick([[55,'LSIL (CIN 1)'],[25,'Benign cervical tissue'],[20,'HSIL (CIN 2)']]),'','','A']]},
};
const READERS=['Dana M Okafor-Reyes, MD','Philip J Sandoval, MD','Mei-Lin Hartigan, MD','Robert A Kingsley, DO','Anjali S Wexford, MD','Thomas E Lindqvist, MD'];
const EFW50={20:331,22:478,24:670,26:913,28:1210,30:1559,32:1953,34:2377,36:2813,38:3233,40:3619};
function efw(w,pc){const a=Math.max(20,Math.min(40,w));const lo=a-(a%2),hi=Math.min(40,lo+2);const g=EFW50[lo]+(EFW50[hi]-EFW50[lo])*((a-lo)/2);return Math.round(g*(0.78+0.44*pc/100));}
function bio(w,r,pc){const k=(pc-50)/50*0.06;const f=x=>Math.round(x*(1+k+r.norm(0,0.015)));return {bpd:f(2.6*w-4),hc:f(9.6*w-17),ac:f(9.5*w-26),fl:f(2.3*w-13)};}
const sz=(r,a,b)=>(r.range(a,b)).toFixed(1);
const IMGDEF={
 DATUS:{name:'US OB < 14 wks (dating)',site:'Sim Imaging Center',rep:(r,p,v)=>{const g=C.ga(v.preg.lmp,v.day);const d=g.days;const crl=(1.0*(d-42)+0.01*(d-42)*(d-42)).toFixed(1);const fhr=r.int(140,172);const twin=v.preg.risk&&v.preg.risk.includes('Twin gestation');
  return {ind:'Dating, confirm intrauterine pregnancy. LMP '+C.mdySlash(v.preg.lmp)+'.',tech:'Transabdominal and transvaginal grayscale and M-mode imaging of the gravid uterus and adnexa.',comp:'None.',
   find:[(twin?'Dichorionic diamniotic twin':'Single')+' intrauterine gestational sac'+(twin?'s':'')+' with yolk sac and embryo.','Cardiac activity present, M-mode FHR '+fhr+' bpm.','Crown-rump length '+crl+' mm, corresponding to '+g.str+'.','No subchorionic hemorrhage.','Right ovary normal'+(r.chance(0.3)?' with corpus luteum cyst '+sz(r,1.4,2.6)+' cm':'')+'. Left ovary normal.','No free fluid in the cul-de-sac.'],
   meas:[['CRL',crl+' mm'],['GA by CRL',g.str],['GA by LMP',g.str],['FHR',fhr+' bpm'],['EDD (confirmed)',C.mdySlash(v.preg.lmp+280)]],
   imp:(twin?'Live dichorionic diamniotic twin':'Single live intrauterine')+' pregnancy at '+g.str+' by CRL, concordant with LMP. EDD '+C.mdySlash(v.preg.lmp+280)+' confirmed.'};}},
 ANAT:{name:'US OB detailed anatomy (76811)',site:'Sim Maternal-Fetal Imaging',rep:(r,p,v)=>{const g=C.ga(v.preg.lmp,v.day);const pc=r.int(18,82);const b=bio(g.w,r,pc);const inc=r.chance(0.08);const plac=r.pick(['anterior','posterior','fundal','right lateral']);const cl=sz(r,3.1,4.6);const mvp=sz(r,3.2,6.8);
  return {ind:'Fetal anatomic survey, '+g.str+'.'+(v.preg.risk&&v.preg.risk.length?' Risk factors: '+v.preg.risk.join(', ')+'.':''),tech:'Detailed transabdominal fetal anatomic survey with color Doppler; transvaginal cervical length.',comp:'Dating ultrasound.',
   find:['Single live intrauterine pregnancy, '+(r.chance(0.7)?'cephalic':'breech')+' at time of exam. FHR '+r.int(138,158)+' bpm.','Placenta '+plac+', no previa; cord insertion central. Three-vessel cord.','Amniotic fluid normal, maximum vertical pocket '+mvp+' cm.','Head: cavum septi pellucidi, lateral ventricles (atrium '+sz(r,5,8.5)+' mm), cerebellum and cisterna magna normal.','Face: profile and upper lip intact.','Heart: four-chamber, LVOT, RVOT and 3-vessel-trachea views '+(inc?'suboptimal due to fetal position':'normal')+'.','Spine: '+(inc?'suboptimally seen':'intact in sagittal and transverse planes')+'.','Abdomen: stomach, kidneys and bladder normal; abdominal cord insertion normal.','Extremities: four limbs with normal long bones.','Cervix: closed, transvaginal length '+cl+' cm.'],
   meas:[['BPD',b.bpd+' mm'],['HC',b.hc+' mm'],['AC',b.ac+' mm'],['FL',b.fl+' mm'],['EFW (Hadlock)',efw(g.w,pc)+' g ('+pc+'th %ile)'],['MVP',mvp+' cm'],['Cervical length',cl+' cm']],
   imp:inc?'Anatomy survey incomplete: cardiac outflow tracts and spine suboptimally visualized. Biometry appropriate (EFW '+pc+'th %ile). Recommend follow-up anatomy ultrasound in 3-4 weeks.':'Normal detailed fetal anatomic survey at '+g.str+'. EFW '+pc+'th percentile. Placenta '+plac+', no previa. Normal cervical length.'};},abn:t=>/incomplete/.test(t)},
 GROWTH:{name:'US OB follow-up / growth',site:'Sim Maternal-Fetal Imaging',rep:(r,p,v)=>{const g=C.ga(v.preg.lmp,v.day);const pc=r.chance(0.08)?r.int(3,9):r.int(12,88);const b=bio(g.w,r,pc);const afi=sz(r,8,20);const sd=(pc<10?r.range(3.1,3.8):r.range(2.0,2.9)).toFixed(2);const pres=g.w>=34?r.wpick([[94,'cephalic'],[6,'breech']]):r.pick(['cephalic','breech','variable']);
  return {ind:'Fetal growth assessment, '+g.str+'.'+(v.preg.risk&&v.preg.risk.length?' '+v.preg.risk.join(', ')+'.':''),tech:'Transabdominal biometry, amniotic fluid assessment and umbilical artery Doppler.',comp:'Prior anatomy ultrasound.',
   find:['Single live intrauterine pregnancy, '+pres+' presentation. FHR '+r.int(130,155)+' bpm.','Fetal biometry as below.','Amniotic fluid index '+afi+' cm.','Umbilical artery S/D ratio '+sd+(pc<10?' (elevated for GA)':' (normal for GA)')+'.','Placenta without abnormality.'],
   meas:[['BPD',b.bpd+' mm'],['HC',b.hc+' mm'],['AC',b.ac+' mm'],['FL',b.fl+' mm'],['EFW (Hadlock)',efw(g.w,pc)+' g ('+pc+'th %ile)'],['AFI',afi+' cm'],['UA S/D',sd]],
   imp:'EFW '+efw(g.w,pc)+' g, '+pc+'th percentile at '+g.str+'. AFI '+afi+' cm. '+(pc<10?'Fetal growth restriction suspected; recommend MFM review, weekly testing and repeat growth in 2 weeks.':'Appropriate interval growth. '+pres.charAt(0).toUpperCase()+pres.slice(1)+' presentation.')};},abn:t=>/restriction/.test(t)},
 PELV:{name:'US Pelvis transvaginal',site:'Sim Imaging Center',rep:(r,p,v)=>{const age=C.ageAt(p.dob,v.day);const post=age>=52;const ul=sz(r,post?5.5:7.2,post?7.2:9.4),uw=sz(r,3.2,5.2),uap=sz(r,2.8,4.6);const es=post?sz(r,1.8,hasP(p,/postmeno/)?6.5:4):sz(r,4,12);
  const fib=hasP(p,/leiomyoma|Menorrhagia/)&&r.chance(0.85)||r.chance(0.1);const cyst=hasP(p,/Ovarian cyst/)&&r.chance(0.8)||(!post&&r.chance(0.08));const pco=hasP(p,/Polycystic/)&&r.chance(0.8);const endo=hasP(p,/Endometriosis/)&&r.chance(0.35);
  const fs=fib?sz(r,1.6,5.8):null;const cs=cyst?sz(r,2.1,5.2):null;const find=['Uterus '+(r.chance(0.8)?'anteverted':'retroverted')+', measuring '+ul+' x '+uap+' x '+uw+' cm.'+(fib?' '+(r.chance(0.5)?'Intramural':'Subserosal')+' fibroid in the '+r.pick(['anterior','posterior','fundal'])+' myometrium measuring '+fs+' cm'+(r.chance(0.4)?'; second '+sz(r,0.8,2.2)+' cm fibroid':'')+'.':' Myometrium homogeneous.'),
   'Endometrial stripe '+es+' mm, '+(post?'thin and homogeneous':'trilaminar, appropriate for cycle')+'.',
   'Right ovary '+sz(r,2.2,3.6)+' x '+sz(r,1.6,2.4)+' x '+sz(r,1.5,2.2)+' cm.'+(cyst?' Simple-appearing anechoic cyst '+cs+' cm without internal flow or septation.':'')+(pco?' More than 20 peripheral follicles; ovarian volume increased.':''),
   'Left ovary '+sz(r,2.1,3.4)+' x '+sz(r,1.5,2.3)+' x '+sz(r,1.4,2.1)+' cm.'+(endo?' Homogeneous low-level echo cyst '+sz(r,1.8,3.5)+' cm, likely endometrioma.':'')+(pco?' Similar polycystic morphology.':''),'No adnexal mass. '+(r.chance(0.3)?'Trace physiologic free fluid.':'No free fluid.')];
  const imp=[];if(fib)imp.push('Fibroid uterus; dominant fibroid '+fs+' cm.');if(cyst)imp.push('Right ovarian simple cyst '+cs+' cm (O-RADS 2). Recommend follow-up ultrasound in 6-8 weeks.');if(endo)imp.push('Left adnexal cyst likely endometrioma (O-RADS 3).');if(pco)imp.push('Polycystic ovarian morphology.');if(!imp.length)imp.push('Normal pelvic ultrasound.'+(post?' Endometrial stripe '+es+' mm.':''));
  return {ind:v.reason?('Indication: '+v.reason+'.'):'Pelvic evaluation.',tech:'Transabdominal and transvaginal grayscale and color Doppler sonography of the pelvis.',comp:'None available.',find,meas:[['Uterus',ul+' x '+uap+' x '+uw+' cm'],['Endometrium',es+' mm']].concat(fib?[['Largest fibroid',fs+' cm']]:[]).concat(cyst?[['R ovarian cyst',cs+' cm']]:[]),imp:imp.join(' ')};},abn:t=>/cyst|Fibroid|endometrioma/i.test(t)},
 MAMMO:{name:'Mammogram screening bilateral w/ tomo',site:'Sim Breast Imaging (fictitious)',rep:(r,p,v)=>{const dens=r.wpick([[10,['A','almost entirely fatty']],[42,['B','scattered areas of fibroglandular density']],[38,['C','heterogeneously dense, which may obscure small masses']],[10,['D','extremely dense, which lowers sensitivity']]]);const zero=r.chance(0.07);const two=!zero&&r.chance(0.3);
  return {ind:'Screening.'+(hasP(p,/Family history of breast/)?' Family history of breast cancer.':''),tech:'Bilateral CC and MLO digital mammography with digital breast tomosynthesis. CAD reviewed.',comp:'Prior studies '+(r.chance(0.7)?'available and compared':'not available')+'.',
   find:['The breasts are '+dens[1]+' (ACR density '+dens[0]+').',zero?'Focal asymmetry in the '+r.pick(['left','right'])+' breast '+r.pick(['upper outer','lower inner','upper inner'])+' quadrant, posterior depth, seen on the CC view only.':two?'Scattered benign-appearing calcifications and stable benign-appearing intramammary lymph node.':'No suspicious masses, calcifications or architectural distortion.','Skin and nipples unremarkable.'],
   meas:[['Breast density','ACR '+dens[0]],['BI-RADS',zero?'0':two?'2':'1']],
   imp:zero?'BI-RADS 0: Incomplete. Focal asymmetry; diagnostic mammogram and ultrasound recommended.':two?'BI-RADS 2: Benign. Routine annual screening.':'BI-RADS 1: Negative. Routine annual screening.'+(dens[0]==='C'||dens[0]==='D'?' Dense breast notification sent per state law.':'')};},abn:t=>/BI-RADS 0/.test(t)},
 BRUS:{name:'US Breast, unilateral, limited',site:'Sim Breast Imaging (fictitious)',rep:(r,p,v)=>{const side=r.pick(['right','left']);const kind=r.wpick([[45,'cyst'],[35,'fa'],[20,'none']]);const d=sz(r,0.6,1.9);const clock=r.int(1,12);
  return {ind:'Palpable '+side+' breast lump, '+clock+" o'clock.",tech:'Targeted grayscale and color Doppler ultrasound of the '+side+' breast at the site of clinical concern.',comp:'None.',
   find:[kind==='cyst'?'At '+clock+" o'clock, "+r.int(2,7)+' cm from the nipple: anechoic, circumscribed, oval mass with posterior acoustic enhancement measuring '+d+' cm, consistent with a simple cyst.':kind==='fa'?'At '+clock+" o'clock, "+r.int(2,7)+' cm from the nipple: oval, circumscribed, parallel hypoechoic mass measuring '+d+' x '+sz(r,0.4,1.2)+' cm without internal vascularity.':'At the site of palpable concern, normal fibroglandular tissue without sonographic abnormality.','Axilla: normal lymph nodes.'],
   meas:[['Lesion',kind==='none'?'none':d+' cm'],['BI-RADS',kind==='cyst'?'2':kind==='fa'?'3':'1']],
   imp:kind==='cyst'?'BI-RADS 2: Benign. Simple cyst corresponding to palpable finding.':kind==='fa'?'BI-RADS 3: Probably benign; likely fibroadenoma. Recommend short-interval follow-up ultrasound in 6 months.':'BI-RADS 1: Negative. No sonographic correlate for palpable concern; clinical follow-up.'};},abn:t=>/BI-RADS 3/.test(t)},
 DXA:{name:'DXA bone density, axial skeleton',site:'Sim Imaging Center',rep:(r,p,v)=>{const op=hasP(p,/Osteopenia/);const sp=+(op?r.range(-2.3,-1.1):r.range(-0.9,0.8)).toFixed(1),fn=+(op?r.range(-2.2,-1.0):r.range(-0.8,0.6)).toFixed(1),th=+(op?r.range(-1.9,-0.8):r.range(-0.6,0.9)).toFixed(1);const lo=Math.min(sp,fn,th);
  return {ind:'Postmenopausal bone density screening.'+(op?' Known osteopenia.':''),tech:'Dual-energy x-ray absorptiometry of the lumbar spine (L1-L4) and left proximal femur. Hologic (SIM).',comp:'None.',
   find:['L1-L4 BMD '+(1.0+sp*0.11).toFixed(3)+' g/cm2, T-score '+sp+', Z-score '+(sp+0.6).toFixed(1)+'.','Left femoral neck BMD '+(0.85+fn*0.11).toFixed(3)+' g/cm2, T-score '+fn+'.','Left total hip BMD '+(0.95+th*0.12).toFixed(3)+' g/cm2, T-score '+th+'.','FRAX 10-year probability: major osteoporotic fracture '+(op?r.range(8,16):r.range(3,8)).toFixed(1)+'%, hip fracture '+(op?r.range(1,2.8):r.range(0.2,0.9)).toFixed(1)+'%.'],
   meas:[['L1-L4 T-score',String(sp)],['Femoral neck T-score',String(fn)],['Total hip T-score',String(th)]],
   imp:lo<=-1?'Osteopenia (lowest T-score '+lo+'). FRAX below treatment threshold; calcium, vitamin D, weight-bearing exercise. Repeat DXA in 2 years.':'Normal bone density. Repeat per guidelines.'};},abn:t=>/Osteopenia/.test(t)},
};
for(const k in IMGDEF){const d=IMGDEF[k];d.text=(r,p,v)=>d.rep(r,p,v).imp;}
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
 if(v.type==='WWV'||v.type==='NPV'){const age=C.ageAt(p.dob,v.day);if(age>=21&&age<=65&&(v.type==='NPV'||h01(v.id+'pap')<0.6))o.push(['L','PAP']);if(age<26)o.push(['L','GCCT']);if(age>=40)o.push(['I','MAMMO']);
  if(v.legacy||v.type==='NPV'||h01(v.id+'cbc')<0.45)o.push(['L','CBC']);
  if(hasP(p,/Hypothyroid/)||(age>=45&&h01(v.id+'l')<0.5))o.push(['L','TSH']);
  if(hasP(p,/diabetes|Prediabetes|Polycystic|Obesity/)||(age>=45&&h01(v.id+'l')<0.5))o.push(['L','A1C']);
  if(hasP(p,/Hyperlipid|hypertension/)||(age>=45&&h01(v.id+'l')<0.5))o.push(['L','LIPID']);
  if(hasP(p,/hypertension|Type 2 diabetes/)||(age>=50&&h01(v.id+'cmp')<0.5))o.push(['L','CMP']);
  if(hasP(p,/Vitamin D|Osteopenia/))o.push(['L','VITD']);if(hasP(p,/anemia|Menorrhagia/))o.push(['L','FERRITIN']);
  if(age>=50&&hasP(p,/Osteopenia/)&&h01(v.id+'dxa')<0.5||age>=65&&h01(v.id+'dxa')<0.35)o.push(['I','DXA']);}
 if(v.type==='PROB'||v.type==='TELE'){
  if(/vaginosis|irritation/.test(v.reason))o.push(['L','WETMT']);
  if(/UTI/.test(v.reason))o.push(['L','UA'],['L','UCX']);
  if(/bleeding|pelvic pain|Menometr|dysmen|baseline/.test(v.reason))o.push(['I','PELV'],['L','CBC']);
  if(/breast lump/.test(v.reason))o.push(['I','BRUS']);
  if(/bone density/.test(v.reason))o.push(['I','DXA'],['L','VITD']);
  if(/incontinence/.test(v.reason))o.push(['L','UA']);
  if(/anemia|heavy/.test(v.reason))o.push(['L','FERRITIN']);
  if(hasP(p,/Hypothyroid/)&&/thyroid|fatigue|results/.test(v.reason))o.push(['L','TSH']);
  if(/menopause|PCOS|HRT/.test(v.reason))o.push(['L','TSH'],['L','ESTRADIOL'],['L','FSHLH']);
  if(/UTI/.test(v.reason)===false&&/postmeno/.test(v.reason))o.push(['I','PELV']);
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
  return {legacy:!!v.legacy,id:'R'+v.id.slice(1)+'-'+idx,num:1200000000+Math.floor(h01('rn'+v.id+code)*99999999),comment:d.comment||'',fasting:r.chance(0.3)?'YES':'NO',kind:'Lab',code,name:d.name,vendor:d.vendor,pid:v.pid,visit:v.id,prov:v.prov,collected:v.day,
   day:v.day+lag,min:r.int(5*60,23*60),comps,abn,folder:'Lab / Imaging',priority:abn&&comps.some(c=>/HSIL|POSITIVE|Detected|BI-RADS 0|>100,000/.test(c[1]))?'High':'Normal'};
 }
 const d=IMGDEF[code];const rep=d.rep(r,p,v);rep.reader=READERS[Math.floor(h01('rd'+v.id+code)*READERS.length)];const text=rep.imp;const abn=d.abn?d.abn(text):false;
 return {legacy:!!v.legacy,report:rep,id:'R'+v.id.slice(1)+'-'+idx,num:1200000000+Math.floor(h01('rn'+v.id+code)*99999999),kind:'Imaging',code,name:d.name,vendor:d.site,pid:v.pid,visit:v.id,prov:v.prov,collected:v.day+(code==='MAMMO'?r.int(3,20):0),
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

let caseIdx=null;
function patientCases(pid){if(!caseIdx){caseIdx={};for(let n=RANGE_START;n<=RANGE_END;n++)for(const it of dailyItems(n)){(caseIdx[it.pid]=caseIdx[it.pid]||[]).push(it);}}
 return (caseIdx[pid]||[]).filter(it=>abs(it.day,it.min)<=nowAbs());}
// ---------- inbox ----------
const FOLDERS=['Patient in Office','Encounters','Appointment Requests','Patient Cases','Orders / Rxs / Auths','Lab / Imaging','Clinical Documents','Admin / Phone Messages','Unknown Documents','Need Followup'];
const AUTOCLOSE_DAYS=14;
function itemState(it){return STATE.get('inbox:'+it.id)||{};}
function itemOpen(it){const s=itemState(it);if(s.closed)return false;if(s.reopened)return true;if(it.legacy)return false;
 // historical items older than AUTOCLOSE_DAYS were handled already in the sim history
 const age=nowAbs()-abs(it.day,it.min);const imp=it.kind==='Lab'?(it.priority==='High'||(it.comps&&it.comps.some(c=>c[4]==='A'))||(it.abn&&h01('sig'+it.id)<0.3)):(it.abn||it.priority==='High');const keep=imp?AUTOCLOSE_DAYS:(it.folder==='Clinical Documents'?6:it.folder==='Lab / Imaging'?4:3);
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
function lastSeen(p,n){let last=null;for(const v of p.visits){if(v.day>n)break;if(v.fate==='ok'&&(v.day<n||COMPLETED(apptStatus(v))))last=v;}if(!last&&G.SIMHIST){const hv=G.SIMHIST.get(p).visits;last=hv[hv.length-1]||null;}return last;}
function nextAppt(p,n){for(const v of p.visits){if(v.day>=n&&v.fate!=='noshow'&&!(v.fate==='cancel'&&n>=v.cancelDay)&&!/Cancelled|No Show|Check-out/.test(apptStatus(v)))return v;}
 for(const b of addedAppts())if(b.pid===p.id&&b.day>=n)return b;return null;}

G.SIMDATA={SEED,RANGE_START,RANGE_END,PROVIDERS,STAFF,PAYERS,ATYPE,FOLDERS,patients,byId,schedule,apptById,
 init(){genPatients();genVisits();},setNow,get now(){return SIM_NOW;},nowAbs,abs,apptStatus,isDone,COMPLETED,isClinicDay,
 activePreg,pregAt,postpartum,lastPregBefore,gp,dayAppts,addedAppts,vitals,resultsForVisit,patientResults,patientDocs,
 inboxItems,inboxCounts,itemOpen,patientCases,LABDEF,IMGDEF,ordersFor,hasP,probStr,isClinicDay,nextClinicDay,AUTOCLOSE_DAYS,claimFor,claimStatus,claimsWindow,deliveryClaim,obCensus,lastSeen,nextAppt,RX,
 provById:id=>PROVIDERS.find(p=>p.id===id)};
})(window);
