/* athenaSim backfilled clinical record. Every fictitious patient gets a deterministic multi-year
   history dated BEFORE the scheduled range (01/2025+), so it is in the past on every sim date:
   prior visits with full notes, repeated labs, imaging reports, outside documents, OB/GYN/social/family
   history, immunizations, medication history, insurance and portal/phone cases.
   Generated lazily per patient and cached. SIMULATION ONLY - all data fictitious. */
(function(G){
const C=G.SIMCORE,D=G.SIMDATA,A=G.SIMAPP;const {R,h01,dn}=C;
const SEED=D.SEED;const LEG_START=dn(2021,3,1),LEG_END=D.RANGE_START-12;
const cache={};
const probs=p=>A.chronic(p).map(c=>c[0]);
const hasP=(p,re)=>D.hasP(p,re);
const clin=n=>{n=Math.round(n);while(!D.isClinicDay(n))n++;return n;};
const OUTSIDE_DR=['Hannah R Castellano, MD','Victor O Adebayo, MD','Elise M Fairweather, MD','Samuel K Iwasaki, MD','Ruth A Penhallow, DO','Omar F Eskandari, MD','Claire J Rasmussen, NP','Daniel P Montclair, MD','Grace L Nwachukwu, MD','Ivan T Kowalczyk, MD'];
const SPEC={
 endo:{name:'Endocrinology consult',vendor:'Sim Endocrine Partners (fictitious)',title:'Endocrinology',re:/Hypothyroid|diabetes|Prediabetes|Polycystic/},
 cards:{name:'Cardiology consult',vendor:'Sim Heart & Vascular (fictitious)',title:'Cardiology',re:/hypertension|Hyperlipid|Raynaud|Varicose/},
 breast:{name:'Breast surgery consult',vendor:'Sim Breast Surgical Group (fictitious)',title:'Breast Surgery',re:/breast/},
 gi:{name:'Gastroenterology consult',vendor:'Sim GI Associates (fictitious)',title:'Gastroenterology',re:/reflux|bowel/},
 bh:{name:'Behavioral health evaluation',vendor:'Sim Behavioral Health (fictitious)',title:'Psychiatry',re:/anxiety|depress|Premenstrual|Insomnia/},
 pulm:{name:'Pulmonary / sleep medicine consult',vendor:'Sim Pulmonary & Sleep (fictitious)',title:'Pulmonary & Sleep Medicine',re:/asthma|sleep apnea/},
 uro:{name:'Urogynecology consult',vendor:'Sim Pelvic Health Center (fictitious)',title:'Urogynecology',re:/incontinence|Overactive|Recurrent UTI/},
 neuro:{name:'Neurology consult',vendor:'Sim Neurology Associates (fictitious)',title:'Neurology',re:/Migraine|back pain/},
 rheum:{name:'Rheumatology consult',vendor:'Sim Arthritis & Bone (fictitious)',title:'Rheumatology',re:/Hypermobility|Osteopenia/},
 mfm:{name:'Maternal-Fetal Medicine consult',vendor:'Sim MFM Associates (fictitious)',title:'Maternal-Fetal Medicine'},
 pcp:{name:'Primary care annual summary',vendor:'Sim Family Medicine (fictitious)',title:'Family Medicine'},
 ed:{name:'Emergency department visit summary',vendor:'Sim Suburban Hospital ED (fictitious)',title:'Emergency Medicine'},
 dc:{name:'Delivery discharge summary',vendor:'Sim Suburban Hospital (fictitious)',title:'Obstetrics'},
 prior:{name:'Outside records - prior OB/GYN practice',vendor:"Sim Prior Women's Health (fictitious)",title:'Obstetrics & Gynecology'},
 peds:{name:'Outside records - adolescent medicine',vendor:'Sim Pediatric & Adolescent Care (fictitious)',title:'Adolescent Medicine'}};
const MODES_PRIOR=[[70,'SVD'],[20,'Primary C-section'],[10,'Vacuum-assisted vaginal']];
const HOSP=['Sim Suburban Hospital (fictitious)','Sim Shady Grove Medical Center (fictitious)','Sim Holy Cross Test Hospital (fictitious)'];

// ---------- OB history (prior pregnancies implied by p.gp, plus in-range ones) ----------
const ppCache={};
function priorPregs(p){if(ppCache[p.id])return ppCache[p.id];const r=R(SEED+':obhx:'+p.id);const out=[];const g=p.gp.g,np=p.gp.p;if(!g)return ppCache[p.id]=out;
 const firstRange=p.preg.length?p.preg[0].lmp:D.RANGE_END;const minEnd=p.dob+Math.round(15.5*365.25);
 const kinds=[];for(let i=0;i<np;i++)kinds.push('delivered');for(let i=np;i<g;i++)kinds.push(r.chance(0.8)?'sab':'tab');kinds.sort(()=>r.f()-0.5);
 const ga=kinds.map(o=>o==='delivered'?(r.chance(0.08)?r.int(33*7,36*7+6):r.int(37*7,41*7+1)):o==='sab'?r.int(6*7,12*7):r.int(6*7,10*7));
 // place latest first, walking backwards; compress into the fertile window if needed
 let t=Math.min(firstRange-r.int(300,700),LEG_END-r.int(60,500));const ends=[];
 for(let i=g-1;i>=0;i--){ends[i]=t;t=t-ga[i]-r.int(400,1400);}
 const maxEnd=p.dob+Math.round(44*365.25);if(ends[g-1]>maxEnd){const sh=ends[g-1]-maxEnd+r.int(100,2000);for(let i=0;i<g;i++)ends[i]-=sh;}
 if(ends[0]<minEnd){const lo=minEnd,hi=Math.max(minEnd+60*g,ends[g-1]);for(let i=0;i<g;i++)ends[i]=Math.round(lo+(hi-lo)*(g===1?1:i/(g-1)));}
 let prevCS=false;
 for(let i=0;i<g;i++){const outcome=kinds[i],endGA=ga[i],end=Math.min(ends[i],LEG_END-20);
  const mode=outcome!=='delivered'?null:prevCS?r.wpick([[75,'Repeat C-section'],[25,'VBAC']]):r.wpick(MODES_PRIOR);if(mode&&/C-section/.test(mode))prevCS=true;
  out.push({prior:true,lmp:end-endGA,end,endGA,edd:end-endGA+280,outcome,mode,weight:outcome==='delivered'?Math.round(3350+(endGA-280)*24+r.norm(0,380)):null,baby:r.chance(0.5)?'Female':'Male',
   risk:outcome==='delivered'?r.wpick([[70,[]],[10,['GDM A1']],[8,['Gestational HTN']],[6,['AMA']],[6,['Preeclampsia without severe features']]]):[],hosp:r.pick(HOSP),anes:mode&&/C-section/.test(mode)?'spinal':r.wpick([[75,'epidural'],[25,'none']]),ebl:mode&&/C-section/.test(mode)?r.int(600,1000):r.int(150,450),lac:mode&&!/C-section/.test(mode)?r.wpick([[40,'1st degree'],[35,'2nd degree'],[20,'none'],[5,'3rd degree']]):null,apgar:r.int(7,9)+'/'+r.int(8,9),feed:r.wpick([[60,'breastfeeding'],[25,'combination'],[15,'formula']])});}
 return ppCache[p.id]=out;}

// ---------- visit helpers ----------
let seq=0;
function mkVisit(p,day,type,reason,dx,extra,k){const r=R(SEED+':hv:'+p.id+':'+k);day=clin(day);
 return Object.assign({id:'H'+(p.idx*100+k),pid:p.id,day,start:r.pick([480,500,520,560,600,620,660,700,800,820,860,900,940,960]),dur:type==='WWV'||type==='NOB'||type==='NPV'?20:10,type,reason,dx,prov:r.chance(0.8)?p.prov:D.PROVIDERS[r.int(0,D.PROVIDERS.length-1)].id,
  fate:'ok',confirmed:true,legacy:true,unsigned:false,signLag:0,chargeLag:0,cancelDay:day-30,tele:type==='TELE',initials:r.pick(['ajj','mq','rv','cb','ep'])},extra||{});}
const PV=[[/Menorrhagia|leiomyoma/,'heavy menstrual bleeding','N92.0','PROB'],[/leiomyoma/,'fibroids f/u','D25.9','US'],[/Ovarian cyst/,'f/u ovarian cyst','N83.201','US'],[/Chronic pelvic pain|Endometriosis/,'pelvic pain','R10.2','PROB'],[/Dysmenorrhea/,'dysmenorrhea','N94.6','PROB'],[/Polycystic/,'PCOS f/u','E28.2','PROB'],[/Menopausal|atrophy/,'f/u menopause','N95.1','PROB'],[/Recurrent UTI/,'UTI symptoms','N39.0','PROB'],[/abnormal cervical/,'colpo','R87.610','COLPO'],[/Fibrocystic|Family history of breast/,'breast lump','N63.0','PROB'],[/contraceptive/,'contraception counseling','Z30.09','PROB'],[/Osteopenia/,'bone density review','M85.80','TELE'],[/incontinence|Overactive/,'urinary incontinence','N39.3','PROB'],[/anemia/,'anemia f/u, heavy menses','D50.9','TELE'],[/Hypothyroid/,'results review - thyroid','E03.9','TELE']];
const GENERIC=[['Bacterial vaginosis','N76.0','PROB'],['vulvar irritation','N90.89','PROB'],['pelvic pain','R10.2','PROB'],['abnormal bleeding','N93.9','PROB'],['UTI symptoms','N39.0','PROB'],['results review','Z09','TELE']];

function build(p){
 const r=R(SEED+':hist:'+p.id);const H={visits:[],docs:[],cases:[],pregs:[],meta:{}};let k=0;
 const pr=probs(p);const ageR=C.ageAt(p.dob,D.RANGE_START);
 const start=Math.max(LEG_START,p.dob+Math.round(15.5*365.25));
 const young=start>LEG_END-400;
 const cat=young?'adolescent':r.chance(0.3)?'transfer':'established';H.meta.cat=cat;
 const firstOurs=cat==='established'?start+r.int(0,240):Math.max(start,r.int(dn(2023,3,1),LEG_END-90));H.meta.firstOurs=clin(firstOurs);
 const prior=priorPregs(p);H.prior=prior;
 const windows=p.preg.map(pg=>[pg.lmp-20,pg.end+60]).concat(prior.map(pg=>[pg.lmp-20,pg.end+60]));
 const inPreg=n=>windows.some(w=>n>=w[0]&&n<=w[1]);
 const add=(day,type,reason,dx,extra)=>{if(day<H.meta.firstOurs||day>LEG_END)return null;const v=mkVisit(p,day,type,reason,dx,extra,k++);if(v.day>LEG_END)return null;H.visits.push(v);return v;};
 // legacy pregnancy care (prior pregnancy inside our window, or the pre-2025 part of an in-range pregnancy)
 const prenatal=(pg,lo,hi)=>{const hasNob=p.visits.some(v=>v.preg===pg&&v.type==='NOB');
  if(!hasNob&&pg.lmp+56>=lo&&pg.lmp+56<=hi)add(pg.lmp+56+r.int(0,10),'NOB','new ob','Z34.80',{preg:pg});
  let g=70+r.int(14,24);while(g<pg.endGA&&pg.lmp+g<=hi){const wk=g/7|0;let reason='rob';if(wk>=11&&wk<=13)reason='rob + NT/NIPT';else if(wk>=18&&wk<=21)reason='rob + anatomy us';else if(wk>=24&&wk<=28)reason='rob+ glucola';else if(wk>=35&&wk<=37)reason='rob + GBS';
   if(pg.lmp+g>=lo)add(pg.lmp+g,'ROB',reason,'Z34.80',{preg:pg});g+=wk<28?28:wk<36?14:7;}
  if(pg.outcome==='delivered'&&pg.end+42<=hi){if(pg.mode&&/C-section/.test(pg.mode))add(pg.end+12,'INC','incision check','Z48.817',{preg:pg});add(pg.end+42+r.int(0,6),'PP','postpartum visit','Z39.2',{preg:pg});}};
 for(const pg of prior)if(pg.outcome==='delivered'&&pg.end>H.meta.firstOurs+150&&pg.end<LEG_END){pg.inWindow=true;prenatal(pg,H.meta.firstOurs,LEG_END);H.pregs.push(pg);}
 for(const pg of p.preg)if(pg.lmp+40<LEG_END)prenatal(pg,H.meta.firstOurs,Math.min(LEG_END,D.RANGE_START-4));
 // new-patient visit for transfers/adolescents
 if(cat!=='established'&&!inPreg(H.meta.firstOurs))add(H.meta.firstOurs,'NPV',cat==='transfer'?'new patient - establish care, records from prior OB/GYN':'new patient - first gyn visit','Z00.00');
 // annual exams
 let t=H.meta.firstOurs+(cat==='established'?0:r.int(330,380));while(t<=LEG_END){if(!inPreg(t)&&r.chance(0.86))add(t+r.int(-15,15),'WWV',C.ageAt(p.dob,t)>=40?'wwv + mammo order':'wwv','Z01.419');t+=r.int(345,390);}
 // problem visits coherent with the problem list
 const matched=PV.filter(x=>pr.some(q=>x[0].test(q)));const nprob=r.int(1,3);const used=new Set();
 for(let i=0;i<nprob;i++){let pv=matched.length?r.pick(matched).slice(1):r.pick(GENERIC);if(used.has(pv[0])){pv=r.pick(GENERIC);}used.add(pv[0]);
  const age=C.ageAt(p.dob,LEG_END);if(age<45&&/menopause|bone density/.test(pv[0]))continue;
  for(let g=0;g<6;g++){const d=r.int(H.meta.firstOurs,LEG_END);if(!inPreg(d)){add(d,pv[2],pv[0],pv[1]);break;}}}
 H.visits.sort((a,b)=>a.day-b.day||a.start-b.start);
 // guarantee: >=1 lab and >=1 imaging study on file
 const orders=()=>H.visits.flatMap(v=>D.ordersFor(v));
 if(!H.visits.length){add(LEG_END-r.int(20,200),'WWV','wwv','Z01.419');}
 if(!orders().some(o=>o[0]==='L')){add(LEG_END-r.int(5,60),'WWV','wwv','Z01.419');}
 if(!H.visits.filter(v=>v.day<LEG_END-35).flatMap(v=>D.ordersFor(v)).some(o=>o[0]==='I')){const lo=H.meta.firstOurs+7,hi=LEG_END-40;let d=Math.max(lo,LEG_END-r.int(40,150));for(let g=0;g<12&&inPreg(d);g++)d=r.int(lo,hi);const age=C.ageAt(p.dob,d);if(age>=40)add(d,'WWV','wwv + mammo order','Z01.419');else add(d,'US','pelvic ultrasound - baseline (pelvic pain)','R10.2');}
 if(!H.visits.length)H.visits.push(mkVisit(p,LEG_END-30,'WWV','wwv','Z01.419',{},k++));
 H.visits.sort((a,b)=>a.day-b.day||a.start-b.start);
 // ---------- outside documents ----------
 const doc=(spec,day,extra)=>{day=Math.min(LEG_END,Math.max(LEG_START-400,Math.round(day)));const s=SPEC[spec];const d=Object.assign({id:'HD'+p.idx+'-'+H.docs.length,kind:spec==='dc'?'Hospital discharge summary':/^prior|peds$/.test(spec)?'Outside records':'Consult letter',spec,name:s.name,vendor:s.vendor,pid:p.id,day,min:r.int(9*60,17*60),prov:p.prov,folder:'Clinical Documents',abn:false,legacy:true,author:r.pick(OUTSIDE_DR)},extra||{});
  d.text=summaryLine(p,d);H.docs.push(d);return d;};
 if(cat==='transfer')doc('prior',H.meta.firstOurs-r.int(7,40),{from:H.meta.firstOurs-r.int(900,1600)});
 if(cat==='adolescent')doc('peds',H.meta.firstOurs-r.int(7,40),{from:H.meta.firstOurs-r.int(900,2000)});
 for(const pg of prior.filter(x=>x.outcome==='delivered'&&x.end>LEG_START-400))doc('dc',pg.end+r.int(2,4),{preg:pg});
 for(const pg of H.pregs)if(pg.risk.length||C.ageAt(p.dob,pg.edd)>=35)doc('mfm',pg.lmp+r.int(19,24)*7,{preg:pg});
 const specs=Object.keys(SPEC).filter(s=>SPEC[s].re&&pr.some(q=>SPEC[s].re.test(q))).sort(()=>r.f()-0.5).slice(0,r.int(1,2));
 for(const s of specs)doc(s,r.int(LEG_START,LEG_END));
 if(r.chance(0.55)||!H.docs.length)doc('pcp',r.int(Math.max(LEG_START,LEG_END-700),LEG_END));
 if(r.chance(0.2))doc('ed',r.int(LEG_START,LEG_END),{cc:r.pick(['lower abdominal pain','migraine headache','dysuria and flank pain','ankle sprain','palpitations'])});
 H.docs.sort((a,b)=>a.day-b.day);
 // ---------- portal messages / phone cases ----------
 const meds=A.meds(p,LEG_END);const nc=r.int(2,4);
 for(let i=0;i<nc;i++){const v=r.pick(H.visits);const day=clin(Math.min(LEG_END,v.day+r.int(2,30)));const portal=p.portal&&r.chance(0.6);const m=meds.length?r.pick(meds)[0]:'prenatal vitamin';
  const res=D.resultsForVisit(v);const tpl=r.pick([
   ['Portal message: question about '+(res[0]?res[0].name:'recent visit'),'Patient: "Hi, I saw '+(res[0]?'my '+res[0].name:'my visit summary')+' was posted. Is everything okay?"\n\nStaff ('+v.initials+' MA): Reviewed with provider. '+(res[0]&&res[0].abn?'Provider would like to discuss; appointment offered.':'Results are within normal limits for you; no action needed.')+'\n\nPatient: "Thank you!"\n\nCase closed.'],
   ['Refill request: '+m,'Patient requests refill of '+m+' to '+p.pharm+'.\n\nProvider reviewed chart: last visit '+C.mdySlash(v.day)+'. Refill sent x 6 months.\n\nPatient notified via '+(portal?'portal':'phone')+'.\n\nCase closed.'],
   ['Phone call: side effects question','Patient called reporting mild nausea after starting '+m+'. Denies vomiting, rash or swelling.\n\nNurse triage: advised to take with food and at bedtime; call back if not improved in 1 week or if new symptoms.\n\nPatient verbalized understanding. Case closed.'],
   ['Scheduling: follow-up appointment','Patient requested follow-up appointment for '+v.reason+'.\n\nFront desk scheduled visit; reminder sent.\n\nCase closed.'],
   ['Forms request: work note','Patient requested a work excuse note for visit on '+C.mdySlash(v.day)+'.\n\nLetter generated and uploaded to portal.\n\nCase closed.']]);
  H.cases.push({id:'HK'+p.idx+'-'+i,kind:'Patient case',folder:'Patient Cases',name:tpl[0],text:tpl[1],pid:p.id,day,min:r.int(8*60,18*60),prov:v.prov,vendor:portal?'Patient portal':'Phone',abn:false,legacy:true});}
 H.cases.sort((a,b)=>a.day-b.day);
 return H;}
function get(p){if(typeof p==='string')p=D.byId[p];return cache[p.id]||(cache[p.id]=build(p));}

// ---------- document full text ----------
function nm(p){return p.first+' '+p.mi+' '+p.last.toUpperCase();}
function summaryLine(p,d){const s=d.spec;if(s==='dc'&&d.preg)return 'Delivered '+C.mdySlash(d.preg.end)+' at '+C.ga(d.preg.lmp,d.preg.end).str+' by '+d.preg.mode+'. '+d.preg.baby+' infant, '+d.preg.weight+' g.';
 if(s==='prior'||s==='peds')return 'Records '+C.mdySlash(d.from)+' to '+C.mdySlash(d.day)+' received by fax.';return SPEC[s].title+' evaluation; recommendations enclosed.';}
function labsBefore(p,day,codes){const out=[];for(const v of get(p).visits.concat(p.visits)){if(v.day>day||v.fate!=='ok')continue;for(const r of D.resultsForVisit(v))if(r.kind==='Lab'&&codes.includes(r.code)&&r.day<=day)out.push(r);}return out.sort((a,b)=>a.day-b.day);}
function labLine(r){return C.mdySlash(r.day)+' '+r.name+': '+r.comps.slice(0,5).map(c=>c[0]+' '+c[1]+(c[3]?' '+c[3]:'')+(c[4]?' ('+c[4]+')':'')).join(', ');}
function docText(d){const p=D.byId[d.pid];const r=R(SEED+':dt:'+d.id);const age=C.ageAt(p.dob,d.day);const s=d.spec||guessSpec(d);const S=SPEC[s]||SPEC.pcp;const author=d.author||r.pick(OUTSIDE_DR);
 const meds=A.meds(p,d.day).map(m=>m[0]+' - '+m[1]);const al=A.allergies(p).map(a=>a[0]+' ('+a[1]+')');const pr=probs(p);const gp=D.gp(p,d.day);
 const hdr=S.vendor.toUpperCase()+'\n'+r.int(100,9800)+' Example Parkway, Suite '+r.int(100,500)+', '+p.city+', MD '+p.zip+'  |  Tel (555) 555-01'+C.p2(r.int(10,99))+'  |  Fax (555) 555-02'+C.p2(r.int(10,99))+'\n\n'+
  'DATE OF SERVICE: '+C.mdySlash(d.day)+'\nPATIENT: '+nm(p)+'   DOB: '+C.mdySlash(p.dob)+'   MRN: '+p.id+'\nREFERRING / PCP: '+D.provById(p.prov).full+', '+D.provById(p.prov).cred+', OB/GYN\n'+(s==='dc'?'ATTENDING: ':'CONSULTANT: ')+author+', '+S.title+'\n\n';
 const sig='\n\nElectronically signed by '+author+' on '+C.mdySlash(d.day)+' '+C.fmtTime(d.min)+'.\ncc: '+D.provById(p.prov).full+', '+D.provById(p.prov).cred+'\n\n*** SIMULATION - fictitious patient and document. Not real medical information. ***';
 const vit=()=>'BP '+r.int(104,(hasP(p,/hypertension/)?146:128))+'/'+r.int(64,(hasP(p,/hypertension/)?92:82))+', HR '+r.int(62,92)+', SpO2 '+r.int(96,100)+'%, BMI '+(hasP(p,/Obesity/)?r.range(30,34.8):r.range(20.5,29.5)).toFixed(1);
 const L=(t,arr)=>t+'\n'+(arr.length?arr.map((x,i)=>(i+1)+'. '+x).join('\n'):'None.')+'\n\n';
 const sec=(t,x)=>t+'\n'+x+'\n\n';
 if(s==='dc'){const pg=d.preg||p.preg.concat(get(p).prior).find(x=>Math.abs(x.end-d.day)<8)||{end:d.day-2,lmp:d.day-282,endGA:280,mode:'SVD',baby:'Female',weight:3300,risk:[],hosp:S.vendor};
  const cs=/C-section/.test(pg.mode||'');const ga=C.ga(pg.lmp,pg.end).str;
  return hdr+sec('ADMISSION DATE: '+C.mdySlash(pg.end-(r.chance(0.6)?0:1))+'     DISCHARGE DATE: '+C.mdySlash(d.day),'')+
  sec('ADMITTING DIAGNOSIS','Intrauterine pregnancy at '+ga+', '+(cs&&/Repeat/.test(pg.mode)?'scheduled repeat cesarean':r.pick(['spontaneous labor','induction of labor for postdates','spontaneous rupture of membranes','induction for '+(pg.risk[0]||'elective 39 weeks')])) +'.')+
  sec('DISCHARGE DIAGNOSES','1. Status post '+(cs?pg.mode.toLowerCase():'vaginal delivery'+(/Vacuum/.test(pg.mode)?' (vacuum-assisted)':''))+' at '+ga+'.\n'+(pg.risk.length?'2. '+pg.risk.join(', ')+'.\n':'')+(pg.lac?(pg.risk.length?'3':'2')+'. '+pg.lac+' perineal laceration, repaired.':''))+
  sec('DELIVERY SUMMARY','Date/time: '+C.mdySlash(pg.end)+' '+C.fmtTime(r.int(0,1439))+'\nMode: '+pg.mode+'\nAnesthesia: '+(pg.anes||(cs?'spinal':'epidural'))+'\nEBL: '+(pg.ebl||(cs?r.int(600,950):r.int(150,400)))+' mL\nInfant: '+pg.baby+', '+pg.weight+' g, Apgars '+(pg.apgar||'8/9')+', to well-baby nursery\nPlacenta: delivered intact'+(cs?', 3-vessel cord':', spontaneous'))+
  sec('HOSPITAL COURSE','Postpartum course was '+r.pick(['uncomplicated','notable for mild anemia treated with oral iron','notable for elevated blood pressures managed with nifedipine'])+'. Pain controlled with ibuprofen and acetaminophen. Voiding and ambulating. Tolerating regular diet. Infant '+(pg.feed||'breastfeeding')+'. Rh: '+p.blood+(p.blood.includes('Neg')?'; RhIG given':'')+'. Rubella immune. Discharged home on postpartum day '+(cs?3:2)+' in stable condition.')+
  sec('DISCHARGE HEMOGLOBIN',(r.range(9.2,11.6)).toFixed(1)+' g/dL')+
  L('DISCHARGE MEDICATIONS',['Ibuprofen 600 mg PO q6h prn pain','Acetaminophen 1,000 mg PO q8h prn pain','Docusate 100 mg PO BID','Prenatal vitamin daily'].concat(cs?['Oxycodone 5 mg PO q6h prn severe pain, #10']:[]))+
  sec('FOLLOW-UP',(cs?'Incision check with OB in 1-2 weeks. ':'BP check in 1 week. ')+'Postpartum visit with '+D.provById(p.prov).full+' in 6 weeks. Return precautions reviewed: fever, heavy bleeding, severe headache, chest pain, mood changes.')+sig;}
 if(s==='prior'||s==='peds'){const pap=r.wpick([[80,'NILM, HPV negative'],[12,'ASC-US, HPV negative'],[8,'LSIL - colposcopy CIN 1, observed']]);
  return hdr+sec('RECORDS SUMMARY','Outside records received by fax for dates of service '+C.mdySlash(d.from)+' through '+C.mdySlash(d.day)+' ('+r.int(14,62)+' pages). Abstracted below by '+r.pick(['ajj (MA)','mq (MA)','Referral Coordinator'])+'.')+
  L('PROBLEM LIST (OUTSIDE)',pr.slice(0,8))+L('MEDICATIONS (OUTSIDE)',meds.slice(0,8))+sec('ALLERGIES',al.length?al.join('; '):'NKDA')+
  sec('OB HISTORY',gp+(get(p).prior.length?'\n'+get(p).prior.map(x=>C.mdySlash(x.end).slice(-4)+': '+(x.outcome==='delivered'?x.mode+' at '+C.ga(x.lmp,x.end).str+', '+x.weight+' g':x.outcome==='sab'?'spontaneous abortion':'elective termination')).join('\n'):''))+
  sec('GYN HISTORY',(s==='peds'?'Menarche age '+(11+h01(p.id+'m')*4|0)+'. HPV vaccine series complete. Confidential adolescent visits for contraception counseling.':'Last Pap at outside practice '+C.mdySlash(d.day-r.int(200,900))+': '+pap+'. Last mammogram: '+(age>=40?C.mdySlash(d.day-r.int(120,400))+' BI-RADS 1':'n/a')+'.'))+
  sec('OUTSIDE LABS',['CBC '+C.mdySlash(d.day-r.int(100,500))+': Hgb '+(base(p).hgb).toFixed(1)+' g/dL, Plt '+base(p).plt,'TSH '+C.mdySlash(d.day-r.int(100,500))+': '+base(p).tsh.toFixed(2)+' uIU/mL','HbA1c '+C.mdySlash(d.day-r.int(100,500))+': '+base(p).a1c.toFixed(1)+' %'].join('\n'))+
  sec('IMMUNIZATIONS (OUTSIDE)','Tdap '+(C.ymd(d.day).y-r.int(1,8))+'; influenza yearly; COVID-19 primary series 2021'+(age<27?'; HPV x3 complete':''))+sig;}
 if(s==='mfm'){const pg=d.preg||p.preg.find(x=>d.day>=x.lmp&&d.day<=x.end)||{lmp:d.day-140,risk:[]};const ga=C.ga(pg.lmp,d.day).str;const ind=(pg.risk.length?pg.risk:['advanced maternal age']).join(', ');
  return hdr+'Dear '+drName(p)+',\n\nThank you for referring '+p.first+' '+p.last+', a '+age+'-year-old '+gp+' at '+ga+' (EDD '+C.mdySlash(pg.lmp+280)+'), for Maternal-Fetal Medicine consultation regarding '+ind+'.\n\n'+
  sec('HISTORY','Pregnancy dated by first-trimester ultrasound. Prenatal labs reviewed. Genetic screening low risk. '+(pg.risk.includes('GDM A1')?'1-hour GTT elevated, 3-hour GTT with 2 abnormal values; diet controlled with fasting values 78-92 and 1-hour postprandial 110-136.':pg.risk.some(x=>/HTN|Preeclampsia/.test(x))?'Blood pressures in clinic 132-144/82-92. Denies headache, visual changes or RUQ pain. Baseline preeclampsia labs normal, UPC 0.12.':'No other complications to date.'))+
  sec('EXAM',vit()+'. Fundal height appropriate. FHT '+r.int(135,155)+' bpm.')+
  sec('ULTRASOUND TODAY','Single live IUP, EFW '+r.int(25,72)+'th percentile, normal fluid, placenta '+r.pick(['anterior','posterior','fundal'])+' without previa.')+
  L('RECOMMENDATIONS',['Low-dose aspirin 81 mg nightly until 36 weeks.','Serial growth ultrasounds every 4 weeks from 28 weeks.','Weekly antenatal testing (NST/BPP) starting at 32 weeks.',pg.risk.includes('GDM A1')?'Continue glucose log four times daily; start medication if >20% values above target.':'Home BP monitoring; preeclampsia labs if BP >= 140/90.','Delivery timing at '+(pg.risk.length?'39 weeks':'39-40 weeks')+' absent other indications.'])+'We will continue to co-manage and will send reports after each visit.'+sig;}
 if(s==='ed'){const cc=d.cc||'lower abdominal pain';
  return hdr+sec('CHIEF COMPLAINT',cc)+sec('HPI',age+'-year-old '+gp+' presenting with '+cc+' for '+r.int(2,30)+' hours. '+(/abdominal/.test(cc)?'Pain is right lower quadrant, crampy, 6/10. Urine pregnancy test negative.':/migraine/.test(cc)?'Typical migraine, photophobia, no focal deficits, no fever.':/dysuria/.test(cc)?'Dysuria, frequency and mild left flank pain. Temp max 100.2 F.':/palpitations/.test(cc)?'Intermittent palpitations at rest, no syncope or chest pain.':'Inversion injury of left ankle; able to bear weight.'))+
  sec('ED COURSE','Vitals: '+vit()+'. '+(/abdominal/.test(cc)?'CBC normal; pelvic US: hemorrhagic right ovarian cyst 3.4 cm with normal flow, no torsion.':/migraine/.test(cc)?'Treated with metoclopramide, diphenhydramine and IV fluids with resolution.':/dysuria/.test(cc)?'UA: positive leukocyte esterase and nitrite. Culture sent. Ceftriaxone 1 g IV given.':/palpitations/.test(cc)?'ECG: normal sinus rhythm, normal intervals. TSH and CBC normal.':'Ankle X-ray: no fracture.'))+
  sec('DIAGNOSIS',/abdominal/.test(cc)?'Hemorrhagic ovarian cyst':/migraine/.test(cc)?'Migraine without aura':/dysuria/.test(cc)?'Acute pyelonephritis, uncomplicated':/palpitations/.test(cc)?'Palpitations, benign':'Left ankle sprain')+
  sec('DISPOSITION','Discharged home in stable condition. Follow up with OB/GYN / PCP in 1-2 weeks. Return precautions given.')+sig;}
 // specialty consult letters
 const T={
  endo:()=>({re:'management of '+(pr.find(x=>SPEC.endo.re.test(x))||'thyroid function').toLowerCase(),data:labsBefore(p,d.day,['TSH','A1C']).slice(-3).map(labLine),a:pr.filter(x=>SPEC.endo.re.test(x)),rec:[hasP(p,/Hypothyroid/)?'Continue levothyroxine; take on an empty stomach, separate from calcium/iron by 4 hours. Repeat TSH in 6-8 weeks after any dose change, and every 4 weeks in pregnancy.':'Lifestyle: 150 minutes/week moderate exercise, Mediterranean-style diet.',hasP(p,/diabetes/)?'Continue metformin ER; A1c goal < 7.0%. Annual eye exam and urine microalbumin.':hasP(p,/Prediabetes|Polycystic/)?'Repeat A1c in 6-12 months; consider metformin if A1c rises.':'No endocrine medication changes.','Return to endocrinology in 6 months or sooner as needed.']}),
  cards:()=>({re:pr.find(x=>/hypertension/.test(x))?'blood pressure management':pr.find(x=>/Hyperlipid/.test(x))?'cardiovascular risk and hyperlipidemia':'palpitations and vascular symptoms',data:labsBefore(p,d.day,['LIPID','CMP']).slice(-2).map(labLine).concat(['ECG: normal sinus rhythm, rate '+r.int(62,88)+', normal intervals.','Echocardiogram: normal LV size and function, EF '+r.int(58,66)+'%, no significant valve disease.']),a:pr.filter(x=>SPEC.cards.re.test(x)),rec:[hasP(p,/hypertension/)?'Continue amlodipine 5 mg daily; home BP goal < 130/80. If planning pregnancy, transition to labetalol or nifedipine.':'No antihypertensive therapy indicated.',hasP(p,/Hyperlipid/)?'Continue atorvastatin 20 mg nightly; stop if pregnancy is planned. Repeat lipid panel in 12 months.':'Lipids at goal for risk category.','Follow up in cardiology clinic in 12 months.']}),
  breast:()=>({re:hasP(p,/Family history of breast/)?'high-risk breast cancer screening given family history':'breast lump / fibrocystic changes',data:['Mammogram and targeted ultrasound reviewed: benign-appearing findings, BI-RADS '+r.pick(['2','2','3'])+'.','Tyrer-Cuzick lifetime risk '+(hasP(p,/Family history of breast/)?r.range(18,26):r.range(9,14)).toFixed(1)+'%.'],a:pr.filter(x=>/breast/.test(x)).concat(['Breast mass, benign by imaging']),rec:[hasP(p,/Family history of breast/)?'Annual screening mammogram plus annual breast MRI (alternating every 6 months); genetic counseling referral placed.':'Clinical breast exam annually; return for any new mass.','Short-interval ultrasound in 6 months for the probably benign finding.','No surgical intervention needed at this time.']}),
  gi:()=>({re:hasP(p,/reflux/)?'reflux symptoms':'chronic abdominal pain and altered bowel habits',data:labsBefore(p,d.day,['CBC','CMP']).slice(-2).map(labLine).concat(['Celiac serologies negative.']),a:pr.filter(x=>SPEC.gi.re.test(x)),rec:[hasP(p,/reflux/)?'Continue omeprazole 20 mg daily before breakfast for 8 weeks, then step down to as needed.':'Low-FODMAP diet trial with dietitian; dicyclomine as needed.','No alarm features; endoscopy not indicated at this time.','Follow up in GI clinic in 3 months.']}),
  bh:()=>({re:'mood and anxiety symptoms',data:['PHQ-9: '+r.int(6,14)+' (mild-moderate). GAD-7: '+r.int(6,13)+'. Columbia screen negative.'],a:pr.filter(x=>SPEC.bh.re.test(x)),rec:['Continue current SSRI; reviewed safety in pregnancy and lactation.','Weekly cognitive behavioral therapy for 12 sessions.','Sleep hygiene counseling. Crisis line information provided.','Follow up in 6 weeks.']}),
  pulm:()=>({re:hasP(p,/apnea/)?'snoring, daytime somnolence and suspected sleep apnea':'asthma control',data:[hasP(p,/apnea/)?'Home sleep study: AHI '+r.int(9,24)+' events/hour, nadir SpO2 '+r.int(82,88)+'%.':'Spirometry: FEV1 '+r.int(84,98)+'% predicted, FEV1/FVC '+r.int(76,84)+'%, '+r.int(8,14)+'% post-bronchodilator response.'],a:pr.filter(x=>SPEC.pulm.re.test(x)),rec:[hasP(p,/apnea/)?'Start auto-PAP 5-15 cm H2O; download in 4-6 weeks.':'Continue albuterol as needed; asthma action plan reviewed. Add ICS if rescue use > 2 days/week.','Annual influenza vaccine.','Follow up in 3 months.']}),
  uro:()=>({re:hasP(p,/UTI/)?'recurrent urinary tract infections':'urinary leakage and urgency',data:['Post-void residual '+r.int(10,60)+' mL. Urinalysis negative today.'].concat(labsBefore(p,d.day,['UCX']).slice(-2).map(x=>C.mdySlash(x.day)+' Urine culture: '+x.comps[0][1])),a:pr.filter(x=>SPEC.uro.re.test(x)),rec:[hasP(p,/UTI/)?'Post-coital nitrofurantoin prophylaxis; consider vaginal estrogen if postmenopausal.':'Pelvic floor physical therapy, 8-12 sessions.',hasP(p,/Overactive/)?'Continue oxybutynin ER; bladder diary and fluid management.':'Pessary fitting offered as an alternative.','Follow up in 3 months.']}),
  neuro:()=>({re:hasP(p,/Migraine/)?'migraine headaches':'low back pain',data:['Neurologic examination non-focal.'+(hasP(p,/Migraine/)?' MRI brain (outside) unremarkable.':' Lumbar spine X-ray: mild degenerative changes.')],a:pr.filter(x=>SPEC.neuro.re.test(x)),rec:[hasP(p,/Migraine/)?'Sumatriptan as needed, max 2 doses/24 h, limit to 10 days/month. Estrogen-containing contraception not recommended if aura develops.':'Physical therapy and core strengthening; NSAIDs as needed.','Headache/pain diary.','Follow up in 4 months.']}),
  rheum:()=>({re:hasP(p,/Osteopenia/)?'low bone density':'joint hypermobility and arthralgias',data:labsBefore(p,d.day,['VITD','CMP']).slice(-2).map(labLine),a:pr.filter(x=>SPEC.rheum.re.test(x)),rec:[hasP(p,/Osteopenia/)?'Calcium 1,200 mg/day total, vitamin D3 2,000 units daily, weight-bearing exercise. Repeat DXA in 2 years.':'Physical therapy for joint stabilization.','No disease-modifying therapy indicated.','Follow up in 12 months.']}),
  pcp:()=>({re:'annual physical examination',data:labsBefore(p,d.day,['CBC','CMP','LIPID','A1C','TSH']).slice(-3).map(labLine),a:pr.slice(0,5).map(x=>x+' - stable'),rec:['Continue current medications as listed.','Age-appropriate screening per OB/GYN (Pap, mammogram).','Influenza and COVID-19 vaccines this season.','Return for annual physical in 12 months.']})};
 const t=(T[s]||T.pcp)();
 return hdr+'Dear '+drName(p)+',\n\nThank you for '+(s==='pcp'?'co-managing':'referring')+' '+p.first+' '+p.last+', a '+age+'-year-old '+gp+', '+(s==='pcp'?'seen for her ':'for evaluation of ')+t.re+'.\n\n'+
  sec('HISTORY OF PRESENT ILLNESS',p.first+' reports symptoms related to '+t.re+' over the past '+r.int(2,18)+' months. '+r.pick(['Symptoms are intermittent and have not limited daily activities.','She has tried lifestyle measures with partial improvement.','Symptoms worsened over the last few months, prompting referral.'])+' Denies fever, weight loss or night sweats.')+
  L('PAST MEDICAL HISTORY',pr.slice(0,10))+L('MEDICATIONS',meds.slice(0,10))+sec('ALLERGIES',al.length?al.join('; '):'NKDA')+
  sec('EXAMINATION',vit()+'. General: well appearing. Cardiopulmonary: regular rhythm, lungs clear. Abdomen: soft, non-tender. Extremities: no edema.')+
  sec('DATA REVIEWED',t.data.length?t.data.join('\n'):'Outside records reviewed.')+L('ASSESSMENT',t.a.length?t.a:['See below'])+L('RECOMMENDATIONS',t.rec)+'Thank you for allowing us to participate in her care.'+sig;}
function drName(p){const v=D.provById(p.prov);const l=String(v.last||v.full.split(' ').pop());return (/CNM|NP/.test(v.cred)?'':'Dr. ')+(/CNM|NP/.test(v.cred)?v.full.split(' ')[0]+' ':'')+l.charAt(0)+l.slice(1).toLowerCase();}
function guessSpec(d){const n=d.name||'';return /discharge/i.test(n)?'dc':/Maternal/.test(n)?'mfm':/Endocrin/.test(n)?'endo':/Cardio/.test(n)?'cards':/Breast/.test(n)?'breast':/Gastro/.test(n)?'gi':'pcp';}
function base(p){D.LABDEF.CBC.comps(R('x'),p,{day:D.RANGE_START});return p._lb;}

// ---------- encounter note ----------
const ROSS=['Constitutional','Eyes','Cardiovascular','Respiratory','Gastrointestinal','Genitourinary','Breast','Musculoskeletal','Skin','Neurological','Psychiatric','Endocrine'];
function note(v){const p=D.byId[v.pid];const r=R(SEED+':note:'+v.id);const x=D.vitals(v);const pg=v.preg&&v.day<v.preg.end?v.preg:null;const res=D.resultsForVisit(v);
 const age=C.ageAt(p.dob,v.day);const gp=D.gp(p,v.day);const pr=probs(p);const meds=A.meds(p,v.day);const rs=v.reason||'';const post=age>=52;
 const lastPg=D.lastPregBefore(p,v.day)||get(p).prior.filter(q=>q.end<=v.day).slice(-1)[0];
 const lmp=pg?C.mdySlash(pg.lmp):post?'postmenopausal since age '+(49+h01(p.id+'mp')*5|0):C.mdySlash(v.day-r.int(3,26));
 const contra=post?'n/a (postmenopausal)':hasP(p,/contraceptive/)?'combined oral contraceptive':r.pick(['condoms','levonorgestrel IUD','none, not sexually active','vasectomy (partner)','Nexplanon','none, desires pregnancy']);
 const chronicTxt=pr.slice(0,4).join(', ').toLowerCase();
 let hpi,pos={},pe={},ap=[],proc={type:'',note:''};
 const T=n=>C.ga(n.lmp,v.day);
 if(pg){const g=T(pg);const w=g.w;
  if(v.type==='NOB'){hpi=p.first+' is a '+age+'yo '+gp+' at '+g.str+' by LMP ('+C.mdySlash(pg.lmp)+'), EDD '+C.mdySlash(pg.lmp+280)+', presenting to establish prenatal care. Pregnancy '+r.pick(['planned','unplanned but desired'])+'. Reports '+r.pick(['mild nausea without vomiting','nausea with occasional emesis, tolerating PO','breast tenderness and fatigue'])+'. Denies vaginal bleeding, cramping or dysuria. Taking prenatal vitamin. '+(lastPg&&lastPg.outcome==='delivered'?'Prior delivery '+C.mdySlash(lastPg.end).slice(-4)+' by '+lastPg.mode+'.':'')+' PMH notable for '+(chronicTxt||'none')+'.';pos.Gastrointestinal='nausea';}
  else{hpi=p.first+' is a '+age+'yo '+gp+' at '+g.str+' presenting for routine prenatal visit'+(/anatomy/.test(rs)?' and anatomy ultrasound review':/glucola/.test(rs)?' and 1-hour glucose screen':/GBS/.test(rs)?' and GBS culture':/NIPT/.test(rs)?' and NT/NIPT':'')+'. '+(w>=20?'+FM. ':'')+'Denies VB, LOF'+(w>=24?', ctx':'')+', headache or visual changes. '+(pg.risk.length?'Pregnancy complicated by '+pg.risk.join(', ')+'.':'Uncomplicated pregnancy to date.')+(x.sys>=140?' BP elevated today; repeat '+(x.sys-r.int(4,10))+'/'+(x.dia-r.int(2,6))+'.':'');}
  pe.Abdomen={normal:true,note:w>=20?'soft, gravid, non-tender; fundal height '+x.fh+' cm, size = dates':'soft, non-tender'};pe.Extremities={normal:x.edema==='None',note:'edema '+x.edema};
  ap.push({dx:'Supervision of '+(pg.risk.length?'high-risk':'normal')+' pregnancy, '+g.str,code:pg.risk.length?'O09.90':'Z34.'+(gp==='G1P0'?'0':'8')+'2',plan:(v.type==='NOB'?'Prenatal labs, urine culture, GC/CT and dating ultrasound ordered. Genetic screening options (NIPT, carrier screening) discussed. Nutrition, weight gain goal, toxoplasmosis/listeria precautions reviewed. ':'Fetal heart tones '+(x.fhr||'present')+' bpm. ')+(w>=27&&w<=36?'Tdap offered at 27-36 weeks. ':'')+(w>=32&&w<=36?'RSV vaccine counseling (32-36 wk). ':'')+'Kick counts and labor precautions reviewed as appropriate. RTC '+(w<28?'4':w<36?'2':'1')+' weeks.'});
  for(const rk of pg.risk)ap.push({dx:rk,code:'',plan:/GDM/.test(rk)?'Reviewed glucose log; fasting 80s-90s, postprandial < 140. Continue diet, nutrition referral.':/HTN|Preecl/.test(rk)?'BP log reviewed; preeclampsia labs; baseline UPC. Low-dose aspirin.':/Twin/.test(rk)?'Serial growth every 4 weeks with MFM.':/AMA/.test(rk)?'Aspirin 81 mg; antenatal testing from 36 weeks.':'Co-management per MFM.'});
 } else if(v.type==='PP'||v.type==='INC'){const q=v.preg||lastPg||{end:v.day-42,mode:'SVD',baby:'Female',weight:3300,lmp:v.day-322};const epds=r.wpick([[80,r.int(1,7)],[20,r.int(9,13)]]);
  hpi=p.first+' is a '+age+'yo '+gp+' now '+Math.round((v.day-q.end)/7)+' weeks postpartum, s/p '+q.mode+' on '+C.mdySlash(q.end)+' at '+C.ga(q.lmp,q.end).str+'. '+q.baby+' infant, '+q.weight+' g, doing well. '+r.pick(['Breastfeeding without difficulty.','Combination feeding.','Formula feeding.'])+' Lochia '+(v.type==='INC'?'moderate':'minimal')+'. '+(v.type==='INC'?'Incision with mild tenderness, no drainage or fever.':'Resumed normal activity. Bowel and bladder function normal.')+' EPDS '+epds+'.';
  if(epds>=10)pos.Psychiatric='low mood, EPDS '+epds;pe.Abdomen={normal:true,note:v.type==='INC'?'Pfannenstiel incision clean, dry, intact, well approximated':'soft, uterus involuted'};if(v.type==='PP')pe.Pelvic={normal:true,note:'perineum healed, cervix closed, uterus normal size'};
  ap.push({dx:v.type==='INC'?'Encounter for surgical wound check after cesarean':'Routine postpartum follow-up',code:v.dx,plan:(v.type==='INC'?'Incision healing well; steri-strips removed. Lifting precautions 6 weeks. ':'Contraception: '+r.pick(['levonorgestrel IUD placement scheduled','progestin-only pill started','Nexplanon requested','condoms, partner vasectomy planned'])+'. ')+(epds>=10?'EPDS elevated; referral to perinatal mental health, safety screen negative.':'Mood screen negative.')+' Resume routine GYN care.'});
 } else {
  const R2=(re,h,ros,exam,dx,plan)=>re.test(rs)?{h,ros,exam,dx,plan}:null;
  const t=[R2(/wwv|establish|first gyn/,'presents for '+(v.type==='NPV'?'new patient visit to establish GYN care':'annual well-woman exam')+'. LMP '+lmp+'. Contraception: '+contra+'. '+(age>=21?'Last Pap '+(v.type==='NPV'?'per outside records':'on file')+'. ':'')+(age>=40?'Due for screening mammogram. ':'')+'No current concerns. Chronic conditions: '+(chronicTxt||'none')+'.',null,{Breasts:{normal:true,note:'symmetric, no masses, skin changes or nipple discharge'},Pelvic:{normal:true,note:'normal external genitalia, vagina and cervix without lesions, uterus normal size, adnexa non-tender'}},v.type==='NPV'?['Encounter for general adult medical examination','Z00.00']:['Encounter for gynecological examination','Z01.419'],'Preventive counseling: diet, exercise, seat belts, bone health. '+(age>=40?'Mammogram ordered. ':'')+'Labs per orders.'),
   R2(/bleeding|Menometr|heavy/,'reports '+(post?'postmenopausal spotting for '+r.int(1,6)+' weeks':'heavy menses lasting '+r.int(7,10)+' days, changing pad every 1-2 hours on heaviest days, passing clots')+'. '+(hasP(p,/leiomyoma/)?'Known fibroids. ':'')+'Fatigue present. No dizziness.',{Genitourinary:'heavy bleeding',Constitutional:'fatigue'},{Pelvic:{normal:false,note:hasP(p,/leiomyoma/)?'uterus enlarged ~'+r.int(10,14)+' week size, irregular contour':'small amount of blood in vault, cervix normal'}},post?['Postmenopausal bleeding','N95.0']:['Menorrhagia with regular cycle','N92.0'],(post?'Endometrial biopsy offered; ':'')+'Pelvic US and CBC ordered. Options discussed: tranexamic acid, levonorgestrel IUD, OCP'+(hasP(p,/leiomyoma/)?', myomectomy/UAE referral':'')+'.'),
   R2(/pelvic pain|dysmen/,'reports '+(/dysmen/.test(rs)?'painful menses rated 7/10 for 1-2 days, partially relieved by NSAIDs':'intermittent lower pelvic pain for '+r.int(2,10)+' weeks, '+r.pick(['right','left','bilateral'])+'-sided, 4-6/10, worse with menses and intercourse')+'. No fever, dysuria or abnormal discharge.',{Genitourinary:'pelvic pain'},{Pelvic:{normal:false,note:'mild '+r.pick(['right','left'])+' adnexal tenderness, no mass; cervix without motion tenderness'}},/dysmen/.test(rs)?['Primary dysmenorrhea','N94.6']:['Pelvic pain','R10.2'],'Pelvic US ordered. NSAIDs scheduled with menses; hormonal suppression discussed. Return if fever or acute worsening.'),
   R2(/menopause|HRT/,'reports hot flashes '+r.int(4,12)+'/day and night sweats disrupting sleep, vaginal dryness. LMP '+lmp+'. No breast or endometrial cancer history. '+(hasP(p,/Menopausal/)?'On estradiol patch with good relief.':''),{Endocrine:'hot flashes',Genitourinary:'vaginal dryness'},{Pelvic:{normal:true,note:'mild atrophic changes'}},['Menopausal and female climacteric states','N95.1'],'Risks/benefits of HRT reviewed (lowest effective dose). Labs per orders. Vaginal estrogen for GSM. Mammogram current.'),
   R2(/vaginosis|irritation/,'reports '+r.int(3,14)+' days of '+(/irritation/.test(rs)?'vulvar itching and irritation':'thin gray discharge with odor')+'. No new partners. No fever or pelvic pain.',{Genitourinary:/irritation/.test(rs)?'vulvar itching':'vaginal discharge'},{Pelvic:{normal:false,note:/irritation/.test(rs)?'vulvar erythema without lesions':'thin homogeneous discharge, pH 5.0, + whiff'}},/irritation/.test(rs)?['Vulvitis, unspecified','N76.2']:['Bacterial vaginosis','N76.0'],'Vaginal pathogen panel sent. '+(/irritation/.test(rs)?'Gentle skin care, avoid irritants; topical steroid if no infection.':'Metronidazole 500 mg PO BID x7 days. No alcohol during treatment.')),
   R2(/UTI|incontinence/,'reports '+(/UTI/.test(rs)?'dysuria, urgency and frequency for '+r.int(1,4)+' days. No fever or flank pain.':'urinary leakage with cough/sneeze and urgency, '+r.int(2,8)+' pads/week.'),{Genitourinary:/UTI/.test(rs)?'dysuria':'urinary leakage'},{Abdomen:{normal:true,note:'suprapubic tenderness, no CVA tenderness'}},/UTI/.test(rs)?['Urinary tract infection, site not specified','N39.0']:['Stress incontinence','N39.3'],/UTI/.test(rs)?'UA/culture sent. Nitrofurantoin 100 mg BID x5 days; adjust per culture.':'Pelvic floor PT referral; bladder diary; urogynecology referral if no improvement.'),
   R2(/breast/,'reports a '+r.pick(['right','left'])+' breast lump noticed '+r.int(1,6)+' weeks ago, '+r.pick(['tender','non-tender'])+', unchanged through cycle. No nipple discharge or skin change.'+(hasP(p,/Family history of breast/)?' Mother with breast cancer.':''),{Breast:'palpable lump'},{Breasts:{normal:false,note:r.int(1,2)+' cm mobile, smooth, rubbery mass at '+r.int(1,12)+" o'clock, no axillary adenopathy"}},['Unspecified lump in breast','N63.0'],'Targeted breast ultrasound'+(age>=30?' and diagnostic mammogram':'')+' ordered. Breast surgery referral if BI-RADS 4 or higher.'),
   R2(/contracep|IUD|Nexplanon/,'presents for '+rs+'. Reviewed options and medical eligibility (US MEC). '+(hasP(p,/Migraine/)?'Migraine without aura. ':'')+'Urine hCG negative today.',null,{Pelvic:{normal:true,note:'uterus normal size, anteverted, cervix normal'}},['Encounter for contraceptive management','Z30.09'],'Shared decision making completed. '+(/IUD insertion/.test(rs)?'Levonorgestrel 52 mg IUD placed; strings trimmed to 3 cm.':/Nexplanon/.test(rs)?'Etonogestrel implant placed left arm without complication.':'Method selected; backup method 7 days.')),
   R2(/colpo|abnormal pap/,'referred for '+rs+' after '+r.pick(['ASC-US HPV positive','LSIL','HPV 16 positive NILM'])+' cytology. Asymptomatic.',null,{Pelvic:{normal:true,note:'cervix without gross lesions'}},['Abnormal cytological findings, cervix','R87.610'],/colpo/.test(rs)?'Colposcopy performed: acetowhite epithelium at '+r.int(1,12)+" o'clock, biopsies taken; ECC done. Will call with pathology.":'Colposcopy recommended per ASCCP risk-based guidelines.'),
   R2(/PCOS|infertility/,'presents for '+rs+'. Cycles every '+r.int(35,70)+' days. '+(hasP(p,/Acne/)?'Acne on spironolactone. ':'')+(/infertility/.test(rs)?'Trying to conceive for '+r.int(12,24)+' months.':'Working on weight loss.'),{Endocrine:'irregular menses'},{Skin:{normal:false,note:'mild acne along jawline, mild hirsutism'}},['Polycystic ovarian syndrome','E28.2'],'A1c/TSH per orders. Metformin continued; lifestyle counseling; letrozole discussed for ovulation induction if desired.'),
   R2(/cyst|fibroid/,'returns for follow-up ultrasound of '+(/cyst/.test(rs)?'ovarian cyst':'uterine fibroids')+'. '+r.pick(['Asymptomatic.','Mild intermittent pressure.','Occasional pelvic pain with exercise.']),null,{},/cyst/.test(rs)?['Cyst of right ovary','N83.201']:['Leiomyoma of uterus','D25.9'],'Ultrasound reviewed with patient. '+(/cyst/.test(rs)?'Repeat ultrasound in 6-8 weeks if persistent.':'Expectant management; annual ultrasound.')),
   R2(/bone density/,'telehealth visit to review DXA results. No fractures. Taking calcium and vitamin D.',null,{},['Osteopenia','M85.80'],'DXA and vitamin D reviewed. Weight-bearing exercise; calcium 1,200 mg/day; repeat DXA 2 years.'),
   R2(/anemia|thyroid|results/,'telehealth visit to review recent results'+(/thyroid/.test(rs)?' (thyroid)':/anemia/.test(rs)?' (iron studies)':'')+'. Feels '+r.pick(['well','mildly fatigued'])+'.',null,{},/thyroid/.test(rs)?['Hypothyroidism, unspecified','E03.9']:/anemia/.test(rs)?['Iron deficiency anemia','D50.9']:['Encounter for follow-up exam','Z09'],'Results reviewed in detail; questions answered. '+(/thyroid/.test(rs)?'Levothyroxine dose adjusted per TSH; recheck 6-8 weeks.':/anemia/.test(rs)?'Continue ferrous sulfate every other day; IV iron if no response.':'Continue current plan.'))].find(Boolean)||{h:'presents for '+rs+'. Symptoms and history reviewed.',ros:null,exam:{},dx:[rs,v.dx],plan:'Plan discussed with patient.'};
  hpi=p.first+' is a '+age+'yo '+gp+' who '+t.h;pos=t.ros||{};Object.assign(pe,t.exam);ap.push({dx:t.dx[0],code:t.dx[1],plan:t.plan});}
 // chronic problems carried in A&P
 const mc=A.chronic(p).filter(c=>c[2]).slice(0,r.int(1,3));for(const c of mc)ap.push({dx:c[0],code:c[1],plan:'Stable; continue '+c[2][0]+' ('+c[2][1]+'). Refills as needed.'});
 if(res.length)ap[0].plan+=' Ordered: '+res.map(o=>o.name).join(', ')+'.';
 const ros={};ROSS.forEach(s=>ros[s]=pos[s]?{st:'pos',note:pos[s]}:{st:'neg',note:''});
 if(hasP(p,/anxiety|depress/)&&!pos.Psychiatric)ros.Psychiatric={st:'pos',note:'anxiety/mood stable on treatment'};
 const PE0={General:'NAD, well appearing','Neck / Thyroid':'supple, no thyromegaly',Heart:'RRR, no murmur',Lungs:'clear to auscultation bilaterally',Abdomen:'soft, non-tender, no masses',Extremities:'no edema',Skin:'warm, dry, no rashes',Psych:'normal mood and affect'};
 const pex={};for(const k in PE0)pex[k]={normal:true,note:PE0[k]};Object.assign(pex,pe);
 if(v.type==='WWV'&&res.some(o=>o.code==='PAP'))proc={type:'Pap smear',note:'ThinPrep Pap with HPV co-test collected from ectocervix and endocervix without difficulty.'};
 if(v.type==='COLPO')proc={type:'Colposcopy with biopsy',note:'Consent obtained. Acetic acid applied; satisfactory colposcopy, SCJ visualized. Biopsies x'+r.int(1,3)+' and ECC obtained. Hemostasis with Monsel. Tolerated well.'};
 if(/IUD insertion/.test(rs))proc={type:'IUD insertion',note:'Consent obtained, hCG negative. Uterus sounded to '+r.int(6,8)+' cm. Levonorgestrel 52 mg IUD placed without difficulty; strings trimmed to 3 cm.'};
 if(/Nexplanon/.test(rs))proc={type:'Nexplanon insertion',note:'Left upper arm, 8 cm above medial epicondyle; lidocaine 1%; implant palpated by patient and provider.'};
 if(v.type==='ROB'&&/nst/.test(rs))proc={type:'NST',note:'Reactive NST: baseline '+(x.fhr||140)+', moderate variability, accelerations present, no decelerations.'};
 const scr={'Depression (PHQ-2)':hasP(p,/depress/)&&r.chance(0.3)?'Positive - PHQ-9 indicated':'Negative','Intimate partner violence':'Negative','Tobacco use':hasP(p,/Tobacco/)?'Former':'Never','Alcohol use (AUDIT-C)':'Negative'};
 return {reason:rs,hpi,ros,screening:scr,pe:pex,ap,proc,vitals:{bp:x.bp,pulse:String(x.pulse),wt:String(x.wt),ht:x.ht,bmi:String(x.bmi),temp:x.temp,rr:String(x.rr),spo2:String(x.spo2),fhr:x.fhr?String(x.fhr):'',fh:x.fh?String(x.fh):'',uprot:x.uprot||''},gen:true};}

// ---------- structured history sections ----------
function obHistory(p,n){const out=get(p).prior.map(x=>Object.assign({src:'outside records'},x));for(const pg of p.preg)if(pg.end<=n)out.push(Object.assign({src:'this practice'},pg));
 const cur=D.pregAt(p,n);const t=out.filter(x=>x.outcome==='delivered'&&x.endGA>=259).length,pt=out.filter(x=>x.outcome==='delivered'&&x.endGA<259).length,ab=out.filter(x=>x.outcome!=='delivered'&&x.outcome!=='transfer').length;
 return {list:out.sort((a,b)=>a.end-b.end),tpal:'T'+t+' P'+pt+' A'+ab+' L'+(t+pt),current:cur};}
function surgical(p,n){const r=R(SEED+':surg:'+p.id);const out=[];const ob=obHistory(p,n).list;
 ob.filter(x=>x.mode&&/C-section/.test(x.mode)).forEach(x=>out.push([C.ymd(x.end).y,'Cesarean delivery ('+x.mode.toLowerCase()+')',x.hosp]));
 ob.filter(x=>x.outcome==='sab'&&r.chance(0.5)).forEach(x=>out.push([C.ymd(x.end).y,'Dilation and curettage (missed abortion)',x.hosp||HOSP[0]]));
 if(hasP(p,/abnormal cervical/)&&r.chance(0.5))out.push([C.ymd(n).y-r.int(3,12),'LEEP, cervix','Sim Surgery Center (fictitious)']);
 if(hasP(p,/Endometriosis/))out.push([C.ymd(n).y-r.int(2,10),'Diagnostic laparoscopy with excision of endometriosis',HOSP[1]]);
 if(hasP(p,/leiomyoma/)&&r.chance(0.3))out.push([C.ymd(n).y-r.int(2,8),'Hysteroscopic myomectomy',HOSP[0]]);
 const age=C.ageAt(p.dob,n);if(r.chance(0.18))out.push([C.ymd(p.dob).y+r.int(18,Math.max(19,age-1)),'Laparoscopic cholecystectomy',HOSP[2]]);
 if(r.chance(0.12))out.push([C.ymd(p.dob).y+r.int(8,16),'Appendectomy',HOSP[0]]);if(r.chance(0.35))out.push([C.ymd(p.dob).y+r.int(17,22),'Wisdom teeth extraction','oral surgeon']);
 if(age>=40&&ob.filter(x=>x.outcome==='delivered').length>=2&&r.chance(0.25))out.push([C.ymd(n).y-r.int(1,10),'Bilateral salpingectomy (sterilization)',HOSP[1]]);
 if(r.chance(0.1))out.push([C.ymd(p.dob).y+r.int(14,30),'ACL reconstruction, right knee','Sim Orthopedics (fictitious)']);
 return out.filter(x=>x[0]<=C.ymd(n).y).sort((a,b)=>a[0]-b[0]);}
function gyn(p,n){const r=R(SEED+':gyn:'+p.id);const age=C.ageAt(p.dob,n);const men=11+h01(p.id+'m')*4|0;const mp=49+h01(p.id+'mp')*5|0;const post=age>=mp;
 const labs=D.patientResults(p).filter(x=>x.code==='PAP').sort((a,b)=>b.day-a.day);const mam=D.patientResults(p).filter(x=>x.code==='MAMMO').sort((a,b)=>b.day-a.day);
 return [['Menarche','age '+men],['Menstrual cycles',post?'Menopause at age '+mp+(hasP(p,/Menopausal/)?', on HRT':''):hasP(p,/Polycystic/)?'irregular, every 35-70 days':hasP(p,/Menorrhagia/)?'regular q28d, heavy x 7-8 days':'regular q'+r.int(26,32)+'d x '+r.int(4,6)+' days'],
  ['Contraception history',post?'none (postmenopausal)':r.pick(['OCPs age 17-25, condoms','levonorgestrel IUD 2019-2024','Depo-Provera as teen, then OCPs','condoms only','Nexplanon x 3 years'])],
  ['Sexual history',r.pick(['sexually active with male partner, monogamous','sexually active, 1 partner in past year','not currently sexually active'])+'; STI history: '+r.wpick([[80,'none'],[15,'chlamydia, treated'],[5,'HSV-2']])],
  ['Pap history',labs.length?'last '+C.mdySlash(labs[0].day)+': '+labs[0].comps.map(c=>c[0]+' '+c[1]).join(', ')+(hasP(p,/abnormal cervical/)?'; history of abnormal cytology':''):age<21?'not yet indicated':'outside records: normal'],
  ['Mammogram history',age<40?'not yet indicated':mam.length?'last '+C.mdySlash(mam[0].day)+': '+mam[0].text.split(':')[0]:'outside: BI-RADS 1'],
  ['HPV vaccine',age<=45&&r.chance(0.6)?'series complete':'not received / unknown'],['Bone density',age>=65||hasP(p,/Osteopenia/)?'DXA on file':'not indicated']];}
function social(p){const r=R(SEED+':soc:'+p.id);const pt=G.SIMPHOTO&&G.SIMPHOTO.partnerFor(p);
 return [['Marital status',pt?(pt.rel==='Husband'?'Married':pt.rel==='Partner'?'Partnered':pt.rel==='Fiancé'?'Engaged':'Married'):r.pick(['Single','Divorced','Widowed','Single'])],['Occupation',r.pick(['teacher','registered nurse','software engineer','accountant','graduate student','retail manager','attorney','federal contractor','dental hygienist','stay-at-home parent','pharmacist','retired'])],
  ['Tobacco',hasP(p,/Tobacco/)?'former smoker, '+r.int(3,15)+' pack-years, quit '+r.int(2005,2022):'never smoker'],['Alcohol',r.wpick([[45,'1-3 drinks/week'],[35,'rare/social'],[20,'none']])],['Drug use',r.wpick([[90,'denies'],[10,'occasional cannabis (counseled)']])],
  ['Exercise',r.pick(['walks 30 min most days','yoga 2x/week','gym 3x/week','minimal'])],['Diet',r.pick(['regular','vegetarian','Mediterranean-style','gluten-free'])],['Safety','wears seat belt; feels safe at home; no firearms in home'+(r.chance(0.2)?' (firearm stored locked)':'')],['Caffeine',r.int(0,3)+' cups/day']];}
function family(p){const r=R(SEED+':fam:'+p.id);const out=[];
 if(hasP(p,/Family history of breast/))out.push([r.pick(['Mother','Sister','Maternal aunt']),'Breast cancer, diagnosed age '+r.int(41,62)]);
 if(hasP(p,/hypertension/)||r.chance(0.45))out.push([r.pick(['Mother','Father']),'Hypertension']);
 if(hasP(p,/diabetes|Prediabetes|Polycystic/)||r.chance(0.3))out.push([r.pick(['Father','Mother','Maternal grandmother']),'Type 2 diabetes']);
 if(hasP(p,/Hypothyroid/)||r.chance(0.15))out.push(['Mother','Hypothyroidism']);if(hasP(p,/Hyperlipid/)||r.chance(0.3))out.push(['Father','Hyperlipidemia; MI age '+r.int(55,72)]);
 if(r.chance(0.15))out.push(['Paternal grandmother','Ovarian cancer, age '+r.int(58,75)]);if(r.chance(0.15))out.push([r.pick(['Father','Paternal uncle']),'Colon cancer, age '+r.int(55,74)]);
 if(hasP(p,/anxiety|depress/)&&r.chance(0.5))out.push([r.pick(['Mother','Sister','Brother']),'Depression']);if(r.chance(0.1))out.push(['Mother','Venous thromboembolism']);
 if(!out.length)out.push(['Family','No significant family history']);return out;}
function medHistory(p,n){const r=R(SEED+':mh:'+p.id);const out=[];const ob=obHistory(p,n).list;
 for(const pg of ob.filter(x=>x.outcome==='delivered'&&x.end>LEG_START-400)){out.push(['Prenatal vitamin with DHA (PNV-DHA) capsule',pg.lmp+45,pg.end+90,'pregnancy completed']);if(r.chance(0.5))out.push(['Ondansetron 4 mg ODT',pg.lmp+50,pg.lmp+100,'nausea resolved']);if(pg.mode&&/C-section/.test(pg.mode))out.push(['Oxycodone 5 mg tablet',pg.end,pg.end+7,'short postoperative course']);if(pg.risk.some(x=>/HTN|Preecl/.test(x)))out.push(['Labetalol 200 mg tablet',pg.lmp+150,pg.end+42,'BP normalized postpartum']);if(pg.risk.length||C.ageAt(p.dob,pg.end)>=35)out.push(['Aspirin 81 mg chewable tablet',pg.lmp+84,pg.lmp+252,'stopped at 36 weeks']);}
 for(const v of get(p).visits.concat(p.visits.filter(v=>v.day<=n&&v.fate==='ok'))){if(v.day>n)continue;if(/vaginosis/.test(v.reason))out.push(['Metronidazole 500 mg tablet',v.day,v.day+7,'course completed']);if(/UTI/.test(v.reason))out.push(['Nitrofurantoin 100 mg capsule',v.day,v.day+5,'course completed']);}
 for(const c of A.chronic(p)){if(!c[2])continue;if(/Levothyroxine 75/.test(c[2][0]))out.push(['Levothyroxine 50 mcg tablet',LEG_START-r.int(100,900),LEG_START+r.int(30,500),'dose increased to 75 mcg (TSH)']);if(/Sertraline|Escitalopram/.test(c[2][0])&&r.chance(0.5))out.push(['Fluoxetine 20 mg capsule',LEG_START-r.int(200,900),LEG_START+r.int(10,300),'changed for side effects']);if(/Metformin ER/.test(c[2][0]))out.push(['Metformin 500 mg tablet',LEG_START-r.int(200,800),LEG_START+r.int(10,400),'switched to ER for GI tolerance']);}
 if(C.ageAt(p.dob,n)<45&&r.chance(0.5))out.push(['Norgestimate-ethinyl estradiol 0.25-35 tablet',LEG_START-r.int(400,1500),LEG_START-r.int(30,350),r.pick(['desired pregnancy','switched to IUD','side effects (breakthrough bleeding)'])]);
 return out.filter(x=>x[1]<=n).map(x=>({name:x[0],start:x[1],stop:x[2]<=n?x[2]:null,why:x[3]})).sort((a,b)=>b.start-a.start);}
function insurance(p){const r=R(SEED+':ins:'+p.id);const pay=D.PAYERS[p.payer];const pt=G.SIMPHOTO&&G.SIMPHOTO.partnerFor(p);const sub=pt&&r.chance(0.4)?pt.first+' '+pt.last+' ('+pt.rel.toLowerCase()+')':'Self';
 const out=[{rank:'Primary',payer:pay,member:p.memberId,group:pay==='Self Pay'?'-':'GRP-'+r.int(10000,99999),subscriber:sub,eff:C.mdySlash(get(p).meta.firstOurs-r.int(0,400)),copay:pay==='Self Pay'?'n/a':'$'+r.pick([0,20,25,30,40]),status:'Eligible (verified '+C.mdySlash(D.now.day-r.int(1,40))+')'}];
 if(p.secondary)out.push({rank:'Secondary',payer:p.secondary,member:'ZZT'+r.int(10000000,99999999),group:'GRP-'+r.int(10000,99999),subscriber:'Self',eff:C.mdySlash(D.RANGE_START-r.int(30,900)),copay:'$0',status:'Eligible'});
 if(get(p).meta.cat==='transfer')out.push({rank:'Prior (inactive)',payer:r.pick(['Aetna (SIM)','Cigna (SIM)','UnitedHealthcare (SIM)']),member:'ZZP'+r.int(10000000,99999999),group:'GRP-'+r.int(10000,99999),subscriber:'Self',eff:C.mdySlash(LEG_START-r.int(100,700))+' - '+C.mdySlash(get(p).meta.firstOurs-r.int(1,60)),copay:'-',status:'Terminated'});
 return out;}
function immunizations(p,n){const r=R(SEED+':imm:'+p.id);const out=[];const age=C.ageAt(p.dob,n);const by=C.ymd(p.dob).y;
 out.push({name:'MMR (series complete)',date:p.dob+365*5,by:'historical'},{name:'Hepatitis B (3-dose series)',date:p.dob+365,by:'historical'},{name:'Varicella (2-dose series)',date:p.dob+365*5,by:'historical'});
 if(by>=1980&&r.chance(0.7)){const d0=Math.max(p.dob+365*12,dn(2007,1,1)+r.int(0,4000));if(d0<n){out.push({name:'HPV 9-valent, dose 1',date:d0,by:'historical'},{name:'HPV 9-valent, dose 2',date:d0+60,by:'historical'},{name:'HPV 9-valent, dose 3',date:d0+180,by:'historical'});}}
 for(let y=2019;y<=2027;y++){const d=dn(y,9,15)+r.int(0,60);if(d<=n&&r.chance(0.7))out.push({name:'Influenza, seasonal, quadrivalent (SIM)',date:d,by:y<2025?'administered in office':'administered in office'});}
 if(r.chance(0.85)){const d=dn(2021,r.int(2,6),r.int(1,28));out.push({name:'COVID-19 mRNA, dose 1',date:d,by:'reported by patient'},{name:'COVID-19 mRNA, dose 2',date:d+28,by:'reported by patient'});if(r.chance(0.6))out.push({name:'COVID-19 vaccine, 2023-2024 formula',date:dn(2023,10,1)+r.int(0,60),by:'pharmacy (state registry)'});if(r.chance(0.5))out.push({name:'COVID-19 vaccine, 2024-2025 formula',date:dn(2024,9,20)+r.int(0,60),by:'pharmacy (state registry)'});}
 const pregs=obHistory(p,n).list.concat(D.pregAt(p,n)?[D.pregAt(p,n)]:[]);
 for(const pg of pregs){if(pg.end<LEG_START-400)continue;const d=pg.lmp+r.int(27,33)*7;if(d<=n&&d<pg.end)out.push({name:'Tdap (pregnancy, 27-36 wk)',date:d,by:'administered in office'});const rv=pg.lmp+r.int(32,35)*7;const m=C.ymd(rv).m;if(rv<=n&&rv<pg.end&&rv>dn(2023,9,22)&&(m>=9||m<=1)&&r.chance(0.6))out.push({name:'RSV vaccine (Abrysvo), maternal',date:rv,by:'administered in office'});if(p.blood.includes('Neg')){const rh=pg.lmp+28*7;if(rh<=n&&rh<pg.end)out.push({name:'Rho(D) immune globulin 300 mcg',date:rh,by:'administered in office'});}}
 if(!pregs.length&&r.chance(0.6))out.push({name:'Tdap',date:dn(2018,1,1)+r.int(0,2200),by:'historical'});
 if(age>=50&&r.chance(0.6)){const d=dn(2022,1,1)+r.int(0,900);out.push({name:'Zoster recombinant (Shingrix), dose 1',date:d,by:'pharmacy (state registry)'},{name:'Zoster recombinant (Shingrix), dose 2',date:d+r.int(60,180),by:'pharmacy (state registry)'});}
 if(age>=65&&r.chance(0.7))out.push({name:'Pneumococcal conjugate (PCV20)',date:dn(2023,1,1)+r.int(0,700),by:'PCP'});
 return out.filter(x=>x.date<=n).sort((a,b)=>b.date-a.date);}

// ---------- hook into the data engine (results/docs/cases include backfilled history) ----------
D.gp=function(p,n){let g=0,pp=0;for(const x of priorPregs(p).concat(p.preg)){if(x.lmp<=n){g++;if(x.end<=n&&x.outcome==='delivered')pp++;}}return 'G'+g+'P'+pp;};
const _res=D.patientResults,_docs=D.patientDocs,_cases=D.patientCases;
D.patientResults=function(p,upTo){const out=[];for(const v of get(p).visits)for(const r of D.resultsForVisit(v))if(D.abs(r.day,r.min)<=D.nowAbs())out.push(r);return out.concat(_res(p,upTo));};
D.patientDocs=function(p){return get(p).docs.filter(d=>D.abs(d.day,d.min)<=D.nowAbs()).concat(_docs(p));};
D.patientCases=function(pid){return get(pid).cases.concat(_cases(pid));};
G.SIMHIST={get,priorPregs,note,docText,obHistory,surgical,gyn,social,family,medHistory,insurance,immunizations,LEG_START,LEG_END,SPEC};
})(window);
