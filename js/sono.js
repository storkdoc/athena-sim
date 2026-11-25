/* athenaSim ultrasound reports: in-office OB/GYN ultrasound reports (Viewpoint-style, "Congressional OBGYN (SIM)")
   and outside MFM consult ultrasound reports ("Chesapeake Perinatal Associates (SIM)"), generated where clinically
   indicated for every pregnancy, with serial biometry that follows each fetus' own growth curve.
   SIMULATION ONLY - all names, numbers and findings are fictitious. */
(function(G){
const C=G.SIMCORE,D=G.SIMDATA,A=G.SIMAPP,H=G.SIMHIST;const {R,h01}=C;const SEED=D.SEED;const esc=C.esc;
const PRACTICE='Congressional OBGYN (SIM)';
const MFM={name:'Chesapeake Perinatal Associates (SIM)',addr:'4400 Fictional Medical Way, Suite 210 · Rockville, MD 20850',tel:'Tel (555) 555-0190 · Fax (555) 555-0191',
 docs:['Eleanor V Ashworth, MD','Raymond K Odum, MD','Sabine L Moreau, MD','Tobias J Wren, MD','Nadia F Haddad, MD','Curtis A Pembrook, MD','Imogen R Salazar, MD','Wesley M Tanaka, MD'],site:'Chesapeake Perinatal - Rockville (SIM)'};
const SONOG=['Kara L Whitfield, RDMS','Monique T Alvarado, RDMS, RVT','Jenna P Ostrowski, RDMS','Dev R Malhotra, ARDMS','Lucia M Ferrante, RDMS'];
const PERF='STEVE BEHRAM, MD';
// ---------- math ----------
function Phi(z){const t=1/(1+0.2316419*Math.abs(z));const d=0.3989423*Math.exp(-z*z/2);const p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p;}
const pct=z=>Math.max(1,Math.min(99,Math.round(Phi(z)*100)));
const MEAN={bpd:g=>(-3.08+0.41*g-0.000061*g*g*g)*10,hc:g=>(-11.48+1.56*g-0.0002548*g*g*g)*10,ac:g=>(-13.3+1.61*g-0.00998*g*g)*10,fl:g=>(-3.91+0.427*g-0.0034*g*g)*10,hl:g=>(-3.6+0.4*g-0.0033*g*g)*10,ofd:g=>2*MEAN.hc(g)/Math.PI-MEAN.bpd(g)};
const CV={bpd:.045,hc:.035,ac:.055,fl:.045,hl:.05,ofd:.05};
const hadlock=(b,h,a,f)=>{b/=10;h/=10;a/=10;f/=10;return Math.pow(10,1.3596-0.00386*a*f+0.0064*h+0.00061*b*a+0.0424*a+0.174*f);};
const efw50=g=>hadlock(MEAN.bpd(g),MEAN.hc(g),MEAN.ac(g),MEAN.fl(g));
function gaFrom(m,v){let lo=10,hi=43;for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(MEAN[m](mid)<v)lo=mid;else hi=mid;}return lo;}
const wd=g=>{const d=Math.round(g*7);return Math.floor(d/7)+'w'+(d%7)+'d';};
const crlFromDays=d=>Math.max(2,Math.pow((d-23.73)/8.052,2));
const lboz=g=>{const oz=g/28.3495;return Math.floor(oz/16)+' lb '+Math.round(oz%16)+' oz';};
// ---------- pregnancy profile (indications) ----------
const profCache={};
function profile(p,pg){const key=p.id+':'+pg.lmp;if(profCache[key])return profCache[key];const r=R(SEED+':sprof:'+key);
 const risk=pg.risk||[];const age=C.ageAt(p.dob,pg.lmp+280);
 const pr={twins:risk.includes('Twin gestation'),ama:age>=35||risk.includes('AMA'),age,dm:risk.some(x=>/GDM/.test(x))&&D.hasP(p,/Type 2 diabetes/),
  chtn:risk.includes('Chronic HTN'),ghtn:risk.some(x=>/Gestational HTN|Preeclampsia/.test(x)),hypothy:risk.includes('Hypothyroidism')};pr.gdm=risk.some(x=>/GDM/.test(x))&&!pr.dm;
 const prev=H.priorPregs(p).concat(p.preg).filter(x=>x.end<pg.lmp&&x.outcome==='delivered');pr.priorPTB=prev.some(x=>x.endGA<259);pr.priorCS=prev.some(x=>x.mode&&/C-section/.test(x.mode))||pg.priorCS;
 pr.iugr=r.chance(pr.chtn||pr.ghtn?0.2:pr.twins?0.12:0.05);pr.onset=r.int(25,31);pr.lga=!pr.iugr&&r.chance(pr.gdm||pr.dm?0.25:0.04);
 pr.previa=r.chance(pr.priorCS?0.09:0.04);pr.previaResolves=r.chance(0.85);pr.poly=r.chance(pr.gdm||pr.dm?0.14:pr.lga?0.2:0.015);pr.shortCx=pr.priorPTB&&r.chance(0.15);
 pr.z0=[pr.iugr?r.range(-0.6,0.2):pr.lga?r.range(0.3,0.9):r.norm(0,0.7)];if(pr.twins)pr.z0.push(pr.z0[0]-r.range(0,0.6));
 pr.plac=r.pick(['anterior','posterior','fundal','right lateral','left lateral']);pr.cord=r.chance(0.97)?3:2;pr.sex=pg.baby||'Female';
 pr.highRisk=pr.twins||pr.ama||pr.dm||pr.chtn||pr.priorPTB||pr.hypothy&&r.chance(0.3);
 pr.mfmDoc=MFM.docs[r.int(0,7)];pr.sono=SONOG[r.int(0,SONOG.length-1)];
 return profCache[key]=pr;}
// ---------- schedule ----------
function studiesOf(p,pg,legacyOk){const pr=profile(p,pg);const r=R(SEED+':sched:'+p.id+':'+pg.lmp);const out=[];const vis=H?[]:[];
 const at=(gaDays,exam,kind,ind,extra)=>{let d=pg.lmp+gaDays;while(!D.isClinicDay(d))d++;if(d>=pg.end)return;if(out.some(s=>s.day===d&&s.kind===kind))d++;while(!D.isClinicDay(d))d++;if(d>=pg.end)return;
  out.push(Object.assign({day:d,exam,kind,ind:ind.slice(),k:out.length},extra||{}));};
 const sab=pg.outcome==='sab';
 if(sab){const d=Math.min(pg.end-2,pg.lmp+r.int(52,63));if(d>pg.lmp+40)at(d-pg.lmp,'dating','office',['Viability','Dating'],{failed:true});return finish(p,pg,out);}
 const nob=p.visits.concat(H.get?[]:[]).find(v=>v.preg===pg&&v.type==='NOB');
 at(nob?nob.day-pg.lmp:r.int(52,70),'dating','office',['Viability','Dating'].concat(pr.twins?['Twin gestation']:[]));
 if(pr.twins)at(r.int(110,118),'fhr','office',['FHR','Twin gestation']);
 if(pr.ama||pr.twins||r.chance(0.35))at(r.int(84,92),'nt','mfm',['Nuchal translucency / first trimester screen'].concat(pr.ama?['Advanced maternal age']:[]));
 if(pr.priorPTB)for(const w of [16,18,22,24])at(w*7+r.int(0,3),'cl','office',['History of preterm birth','Cervical length']);
 const ind=[];if(pr.ama)ind.push('Advanced maternal age');if(pr.twins)ind.push('Twin gestation, dichorionic diamniotic');if(pr.dm)ind.push('Pregestational diabetes');if(pr.chtn)ind.push('Chronic hypertension');if(pr.priorPTB)ind.push('History of preterm birth');if(pr.hypothy)ind.push('Hypothyroidism');
 at(r.int(134,146),'anatomy',pr.highRisk?'mfm':'office',['Fetal anatomic survey'].concat(ind));
 if(pr.previa)for(const w of [28,32])at(w*7+r.int(0,4),'previa','office',['Low-lying placenta','Placental location follow-up']);
 const growth=new Set(),bpp=new Set();const gi=[];
 if(pr.twins){[24,28,32,36].forEach(w=>growth.add(w));for(let w=34;w<=38;w++)bpp.add(w);gi.push('Twin gestation, dichorionic diamniotic');}
 if(pr.dm){[28,32,36].forEach(w=>growth.add(w));for(let w=32;w<=39;w++)bpp.add(w);gi.push('Pregestational diabetes');}
 if(pr.chtn){[28,32,36].forEach(w=>growth.add(w));for(let w=32;w<=39;w++)bpp.add(w);gi.push('Chronic hypertension');}
 if(pr.ghtn){[31,35].forEach(w=>growth.add(w));for(let w=33;w<=39;w++)bpp.add(w);gi.push('Gestational hypertension / preeclampsia');}
 if(pr.gdm){[32,36].forEach(w=>growth.add(w));gi.push('Gestational diabetes');}
 if(pr.ama){growth.add(32);if(pr.age>=40)for(let w=36;w<=39;w++)bpp.add(w);gi.push('Advanced maternal age');}
 if(pr.lga){growth.add(36);gi.push('Size greater than dates (suspected LGA)');}
 if(pr.iugr){growth.add(pr.onset);for(let w=pr.onset+2;w<=38;w+=2)growth.add(w);for(let w=pr.onset+1;w<=38;w++)bpp.add(w);}
 const mfmG=pr.twins||pr.dm||pr.chtn||pr.ghtn||pr.iugr;
 for(const w of [...growth].sort((a,b)=>a-b)){const gw=w*7+r.int(0,3);const i2=gi.slice();if(pr.iugr&&w>=pr.onset)i2.unshift(w===pr.onset?'Size less than dates (fundal height lag)':'Fetal growth restriction');at(gw,'growth',mfmG||(pr.iugr&&w>=pr.onset)?'mfm':'office',['Fetal growth'].concat(i2));bpp.delete(w);}
 for(const w of [...bpp].sort((a,b)=>a-b)){const i2=gi.slice();if(pr.iugr&&w>pr.onset)i2.unshift('Fetal growth restriction');at(w*7+r.int(2,4),'bpp',mfmG?'mfm':'office',['Antenatal testing (BPP)'].concat(i2));}
 return finish(p,pg,out);}
function finish(p,pg,out){out.sort((a,b)=>a.day-b.day);const r=R(SEED+':sfin:'+p.id+':'+pg.lmp);
 return out.map((s,i)=>{const id='S'+p.idx+'-'+(pg.lmp%100000)+'-'+i;const name=TITLE[s.kind][s.exam];const res={id,num:1300000000+Math.floor(h01('sn'+id)*99999999),kind:'Imaging',code:'US-'+s.exam.toUpperCase(),sono:s,preg:pg,name,pid:p.id,prov:p.prov,collected:s.day,day:s.day,min:r.int(8*60,16*60+30),
   vendor:s.kind==='mfm'?MFM.name:PRACTICE,folder:'Lab / Imaging',legacy:s.day<D.RANGE_START,mirror:s.kind==='mfm',abn:false,priority:'Normal'};
  const m=model(res);res.text=m.impression.join(' ');res.abn=m.abn;res.priority=m.abn?'High':'Normal';return res;});}
const TITLE={office:{dating:'OB US < 14 wks, dating / viability (76801)',fhr:'OB US limited, FHR (76815)',cl:'OB US transvaginal, cervical length (76817)',anatomy:'OB US anatomy survey (76805)',previa:'OB US limited, placental location (76815)',growth:'OB US follow-up / growth (76816)',bpp:'OB US biophysical profile (76819)'},
 mfm:{nt:'MFM Nuchal Translucency Ultrasound (76813)',anatomy:'MFM Detailed Anatomy Ultrasound (76811)',growth:'MFM Growth Ultrasound + UA Doppler (76816/76820)',bpp:'MFM Biophysical Profile + Doppler (76819/76820)'}};
const MFMTITLE={nt:'Nuchal Translucency Ultrasound',anatomy:'Detailed Anatomy Ultrasound',growth:'Growth Ultrasound',bpp:'Biophysical Profile'};
// ---------- per-study model (deterministic, cached) ----------
const mCache={};
function fetZ(pr,f,g){let z=pr.z0[f]||0;if(pr.iugr&&g>pr.onset-1)z-=Math.min(2.3,(g-pr.onset+1)*0.38);if(pr.lga&&g>26)z+=Math.min(1.8,(g-26)*0.2);return z;}
function bio(p,pg,pr,f,day,sid){const g=(day-pg.lmp)/7;const r=R(SEED+':bio:'+sid+':'+f);const z=fetZ(pr,f,g);const o={};
 for(const k of ['bpd','hc','ac','fl','hl','ofd']){let zz=z+r.norm(0,0.3);if(k==='ac'&&pr.iugr&&g>pr.onset)zz-=0.4;if(k==='ac'&&(pr.lga||pr.dm&&g>30))zz+=0.35;if(k==='hl')zz=z+r.norm(0,0.4);const v=MEAN[k](g)*(1+CV[k]*zz);o[k]={mm:+v.toFixed(1),pct:pct((v/MEAN[k](g)-1)/CV[k]),ga:gaFrom(k,v)};}
 const e=hadlock(o.bpd.mm,o.hc.mm,o.ac.mm,o.fl.mm);o.efw={g:Math.round(e),pct:pct(Math.log(e/efw50(g))/0.12)};
 o.aua=(o.bpd.ga+o.hc.ga+o.ac.ga+o.fl.ga)/4;o.flhc=(o.fl.mm/o.hc.mm*100).toFixed(1);o.ga=g;return o;}
function fluid(pr,f,g,r){let afi=14+r.norm(0,2.6);if(g>37)afi-=2;if(pr.poly)afi+=g>24?r.range(10,14):r.range(2,5);if(pr.iugr&&g>pr.onset+1)afi-=r.range(5,8);afi=Math.max(3.2,afi);const q=[.3,.27,.23,.2].map(x=>x*afi*(0.85+r.f()*0.3));const s=q.reduce((a,b)=>a+b,0);const qq=q.map(x=>+(x*afi/s).toFixed(1));
 return {afi:+afi.toFixed(1),q:qq,mvp:+(Math.max(...qq)*1.0).toFixed(1)};}
function uaDop(pr,f,g,r){const mean=4.6-0.058*g;let sd=mean*Math.exp(r.norm(0,0.07));if(pr.iugr&&g>pr.onset)sd+=r.range(0.6,1.3);const ps=r.range(38,62);const ed=ps/sd;const md=ed*0.95;const tam=(ps+2*ed)/3;
 const ri=(ps-ed)/ps,pi=(ps-md)/tam;const zp=(sd-mean)/(0.13*mean);return {ps:+ps.toFixed(1),ed:+ed.toFixed(1),tam:+tam.toFixed(1),md:+md.toFixed(1),ri:+ri.toFixed(2),pi:+pi.toFixed(2),sd:+sd.toFixed(2),pct:pct(zp),high:zp>1.645,aedf:false};}
function utDop(pr,r){const hi=(pr.chtn||pr.ghtn)&&r.chance(0.6);const side=()=>{const pi=hi?r.range(1.45,1.95):r.range(0.75,1.3);const ps=r.range(70,110);return {ps:+ps.toFixed(1),ed:+(ps*(1-pi*0.42)).toFixed(1),pi:+pi.toFixed(2),ri:+(pi*0.42).toFixed(2),notch:hi&&r.chance(0.6)};};const R1=side(),L1=side();return {R:R1,L:L1,mean:+((R1.pi+L1.pi)/2).toFixed(2),high:(R1.pi+L1.pi)/2>1.44};}
function model(res){if(mCache[res.id])return mCache[res.id];const p=D.byId[res.pid],pg=res.preg,s=res.sono,pr=profile(p,pg);const r=R(SEED+':sm:'+res.id);
 const g=(s.day-pg.lmp)/7;const nf=pr.twins?2:1;const F=nf===2?['A','B']:['A'];const m={exam:s.exam,kind:s.kind,g,ga:wd(g),nf,F,fetus:[],ind:s.ind,impression:[],abn:false,plan:[]};
 const tv=s.exam==='dating'&&g<11||s.exam==='cl'||s.exam==='previa'||s.exam==='nt'&&r.chance(0.2);m.route=tv?'OB TV':'OB TA';
 m.cpt=(TITLE[s.kind][s.exam].match(/\(([\d/]+)\)/)||[])[1]||'';
 for(let f=0;f<nf;f++){const x={id:F[f]};const rf=R(SEED+':sf:'+res.id+':'+f);
  x.fhr=s.failed?0:g<14?rf.int(148,172):rf.int(126,156);
  if(g<14){const days=Math.round(g*7)+(f?rf.int(-2,1):0);const crlDays=s.failed?Math.round(g*7)-rf.int(10,20):days+rf.int(-2,2);x.crl={mm:+crlFromDays(crlDays).toFixed(1),ga:crlDays/7};if(s.exam==='nt'){x.nt=+(rf.range(1.1,2.3)).toFixed(1);x.nb='present';}}
  else{x.bio=bio(p,pg,pr,f,s.day,res.id);}
  if(g>=16)x.fl=fluid(pr,f,g,rf);
  if(s.exam==='growth'&&s.kind==='mfm'||s.exam==='bpp')x.ua=uaDop(pr,f,g,rf);
  if(s.exam==='bpp'){const mvp=x.fl.mvp;x.bpp={afv:mvp>=2?2:0,br:rf.chance(0.95)?2:0,mv:2,tone:2};x.bpp.score=x.bpp.afv+x.bpp.br+x.bpp.mv+x.bpp.tone;}
  x.pres=g<24?r.pick(['variable','cephalic','breech']):g<34?r.wpick([[65,'cephalic'],[30,'breech'],[5,'transverse']]):r.wpick([[92,'cephalic'],[7,'breech'],[1,'transverse']]);
  m.fetus.push(x);}
 m.plac=pr.plac;m.previaTxt='';if(pr.previa){if(s.exam==='anatomy')m.previaTxt='Low-lying placenta, inferior edge '+(r.range(0.8,1.8)).toFixed(1)+' cm from the internal os.';else if(s.exam==='previa'){const res2=pr.previaResolves&&(g>=31||r.chance(0.5));m.previaTxt=res2?'Placental edge '+(r.range(2.6,4.2)).toFixed(1)+' cm from the internal os; low-lying placenta resolved.':'Persistent low-lying placenta, edge '+(r.range(0.6,1.7)).toFixed(1)+' cm from the internal os.';m.previaRes=res2;}}
 if(s.exam==='cl'||(s.exam==='anatomy'&&pr.priorPTB)||s.exam==='anatomy'&&s.kind==='mfm'){m.cl=+(pr.shortCx&&g>=18?r.range(1.6,2.4):r.range(2.9,4.4)).toFixed(1);m.funnel=m.cl<2.5&&r.chance(0.4);}
 if(s.kind==='mfm'&&(s.exam==='anatomy'||s.exam==='growth'&&g<30))m.ut=utDop(pr,r);
 m.anat=s.exam==='anatomy'?anatomy(r,nf):null;
 // impression
 const im=m.impression;const fa=m.fetus;
 if(s.failed){im.push('Single intrauterine gestation without cardiac activity. CRL '+fa[0].crl.mm+' mm ('+wd(fa[0].crl.ga)+'), lagging dates by more than 10 days: findings consistent with early pregnancy loss (missed abortion).');m.abn=true;m.plan.push('Options counseling: expectant, misoprostol or D&C.');}
 else if(g<14){im.push((nf===2?'Live dichorionic diamniotic twin':'Single live intrauterine')+' pregnancy. '+fa.map(x=>(nf===2?'Fetus '+x.id+': ':'')+'CRL '+x.crl.mm+' mm = '+wd(x.crl.ga)+', FHR '+x.fhr+' bpm').join('; ')+'.');
  const diff=Math.abs(fa[0].crl.ga-g)*7;im.push(diff<=5?'Size consistent with dates; EDD by LMP '+C.mdySlash(pg.lmp+280)+' confirmed.':'CRL differs from LMP by '+Math.round(diff)+' days; dating per ACOG reassigned by ultrasound.');
  if(s.exam==='nt'){im.push('Nuchal translucency '+fa.map(x=>x.nt+' mm').join(' / ')+' (normal, < 3.0 mm); nasal bone present. Cell-free DNA '+(r.chance(0.8)?'low risk on file':'drawn today')+'.');}}
 else{for(const x of fa){const b=x.bio;const lbl=nf===2?'Fetus '+x.id+': ':'';
   if(s.exam==='fhr'||s.exam==='cl'||s.exam==='previa'){im.push(lbl+'Live fetus, FHR '+x.fhr+' bpm.');continue;}
   im.push(lbl+'EFW '+b.efw.g+' g ('+lboz(b.efw.g)+'), '+ord(b.efw.pct)+' percentile (Hadlock). AC '+ord(b.ac.pct)+' percentile. '+(x.fl?'AFI '+x.fl.afi+' cm, MVP '+x.fl.mvp+' cm.':''));
   if(b.efw.pct<10||b.ac.pct<10){im.push(lbl+'Fetal growth restriction (EFW or AC < 10th percentile).');m.abn=true;}
   if(b.efw.pct>90){im.push(lbl+'Large for gestational age (EFW > 90th percentile).');m.abn=true;}
   if(x.fl&&x.fl.afi>24){im.push(lbl+'Polyhydramnios (AFI '+x.fl.afi+' cm).');m.abn=true;}
   if(x.fl&&x.fl.afi<5){im.push(lbl+'Oligohydramnios (AFI '+x.fl.afi+' cm).');m.abn=true;}
   if(x.ua){im.push(lbl+'Umbilical artery S/D '+x.ua.sd+' ('+ord(x.ua.pct)+' percentile)'+(x.ua.high?', elevated; end-diastolic flow present.':', normal.'));if(x.ua.high)m.abn=true;}
   if(x.bpp)im.push(lbl+'BPP '+x.bpp.score+'/8'+(x.bpp.score<8?' (breathing not observed in 30 min; NST reactive)':'')+'.');}
  if(nf===2&&fa[0].bio&&fa[1].bio&&s.exam!=='fhr'){const dis=Math.round(Math.abs(fa[0].bio.efw.g-fa[1].bio.efw.g)/Math.max(fa[0].bio.efw.g,fa[1].bio.efw.g)*100);im.push('Twin EFW discordance '+dis+'%'+(dis>=20?' (significant).':'.'));if(dis>=20)m.abn=true;}
  if(m.anat)im.push(m.anat.incomplete?'Anatomy survey incomplete ('+m.anat.notSeen.join(', ')+' suboptimally visualized); otherwise normal fetal anatomy.':'Normal detailed fetal anatomic survey.');
  if(m.previaTxt){im.push(m.previaTxt);if(!m.previaRes)m.abn=true;}
  if(m.cl!=null){im.push('Transvaginal cervical length '+m.cl+' cm'+(m.cl<2.5?' - short cervix'+(m.funnel?' with funneling':''):', normal')+'.');if(m.cl<2.5)m.abn=true;}
  if(m.ut)im.push('Mean uterine artery PI '+m.ut.mean+(m.ut.high?' (> 95th percentile)'+(m.ut.R.notch||m.ut.L.notch?' with diastolic notching':'')+'.':' (normal).'));}
 // plan / follow-up
 if(!s.failed){const fu=[];if(m.anat&&m.anat.incomplete)fu.push('Follow-up anatomy in 3-4 weeks');if(m.cl!=null&&m.cl<2.5)fu.push('Vaginal progesterone 200 mg nightly; repeat cervical length in 1 week');
  if(m.fetus.some(x=>x.bio&&(x.bio.efw.pct<10||x.bio.ac.pct<10)))fu.push('Growth in 2 weeks, weekly BPP with umbilical artery Doppler; delivery timing per UA Doppler (37 wk if normal Doppler)');
  else if(s.exam==='growth'||s.exam==='bpp')fu.push(pr.twins?'4 weeks growth; weekly testing from 34 weeks':(pr.dm||pr.chtn||pr.ghtn)?'4 weeks growth and weekly testing from 32 weeks':'Growth as clinically indicated');
  if(m.previaTxt&&!m.previaRes)fu.push(s.exam==='previa'&&g>=31?'Pelvic rest; plan delivery at 36 0/7-37 6/7 weeks':'Repeat placental location at 32 weeks; pelvic rest');
  if(s.exam==='nt')fu.push('Detailed anatomy ultrasound at 18-22 weeks');if(s.exam==='anatomy'&&!fu.length)fu.push(pr.highRisk?'Growth ultrasound at 28-32 weeks':'Routine prenatal care');
  m.plan=fu.length?fu:['Routine prenatal care'];}
 return mCache[res.id]=m;}
function anatomy(r,nf){const all=[['Head','Calvarium intact; lateral ventricles, choroid plexus, cavum septi pellucidi, cerebellum and cisterna magna normal'],['Face','Profile, orbits, nose and upper lip intact'],['Neck','No nuchal mass; nuchal fold normal'],['Chest','Lungs homogeneous; no effusion or mass'],['Heart','Four-chamber view, situs, LVOT, RVOT, 3-vessel and 3-vessel-trachea views normal; rate and rhythm normal'],['Stomach','Present in left upper quadrant, normal size'],['GI tract','Bowel echogenicity normal; abdominal wall and cord insertion intact'],['Kidneys','Bilateral, normal size and echotexture; no pyelectasis'],['Bladder','Present and normal'],['Spine','Cervical, thoracic, lumbar and sacral spine intact in sagittal and transverse planes; overlying skin intact'],['Extremities','Four limbs; long bones normal; hands and feet normal'],['Genitalia','Visualized']];
 const inc=r.chance(0.1);const notSeen=inc?[r.pick(['Heart (outflow tracts)','Spine (sacrum)','Face (profile)'])]:[];const seen=all.filter(a=>!notSeen.some(n=>n.startsWith(a[0])));
 return {seen,notSeen,notExamined:nf===2?['Fetus B genitalia (per parent request)']:[r.pick(['Fetal sex (not requested)','None'])],incomplete:inc};}
// ---------- serial data for growth charts ----------
const listCache={};
function pregnancies(p){const out=p.preg.slice();if(H)for(const pg of H.get(p).pregs)out.push(pg);return out;}
function studies(p){if(listCache[p.id])return listCache[p.id];const out=[];for(const pg of pregnancies(p))if(pg.lmp+40<D.RANGE_END&&(pg.lmp>H.LEG_START-200))out.push(...studiesOf(p,pg));return listCache[p.id]=out;}
function serial(res){const p=D.byId[res.pid];return studies(p).filter(x=>x.preg===res.preg&&x.day<=res.day).map(x=>({day:x.day,m:model(x)})).filter(x=>x.m.fetus[0].bio);}
// ---------- docs (MFM outside documents) ----------
function docFor(res){return {id:'MD'+res.id.slice(1),kind:'Outside ultrasound report',spec:'mfmus',name:'MFM '+MFMTITLE[res.sono.exam]+' report',vendor:MFM.name,pid:res.pid,day:res.day,min:Math.min(1430,res.min+70),prov:res.prov,folder:'Clinical Documents',abn:res.abn,priority:res.abn?'High':'Normal',text:res.text,legacy:res.legacy,res,sono:true,href:'#/chart/'+res.pid+'/results/'+res.id};}
// ---------- inbox index (in-range pregnancies only; cheap) ----------
let dayIdx=null;
function buildIdx(){dayIdx={};for(const p of D.patients)for(const pg of p.preg){if(pg.end<D.RANGE_START)continue;for(const s of studiesOf(p,pg)){if(s.day<D.RANGE_START)continue;const it=s.sono.kind==='mfm'?docFor(s):Object.assign(s,{href:'#/chart/'+p.id+'/results/'+s.id});(dayIdx[s.day]=dayIdx[s.day]||[]).push(it);}}}
function recent(now,back){if(!dayIdx)buildIdx();const out=[];for(let n=now-back;n<=now;n++)for(const it of (dayIdx[n]||[]))out.push(it);return out;}
// ---------- rendering ----------
const ord=n=>{n=Math.round(n);const t=n%100;return n+((t>=11&&t<=13)?'th':({1:'st',2:'nd',3:'rd'})[n%10]||'th');};
const n1=x=>x==null?'':String(x);
function hdrName(p){return (p.last+', '+p.first).toUpperCase();}
function obCounts(p,day){const gp=D.gp(p,day);const g=+gp.slice(1,gp.indexOf('P')),pp=+gp.slice(gp.indexOf('P')+1);const ab=H.obHistory(p,day).list.filter(x=>x.end<=day&&(x.outcome==='sab'||x.outcome==='tab')).length;return {g,p:pp,ab};}
function logo(kind){return kind==='ge'?'<svg class="sl ge" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="#3a6fb0" stroke-width="2.5"/><path d="M11 23c3-9 9-12 18-9M12 27c6 2 12 0 17-6" fill="none" stroke="#3a6fb0" stroke-width="2.4" stroke-linecap="round"/></svg>':
 '<svg class="sl mfm" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4c8 6 14 12 14 20a14 14 0 01-28 0c0-8 6-14 14-20z" fill="#2f7d72"/><circle cx="20" cy="25" r="6" fill="#fff"/><circle cx="20" cy="25" r="3" fill="#e2a33b"/></svg>';}
function mtab(title,rows){return '<div class="rbar">'+title+'</div><table class="mt"><thead><tr><th></th><th></th><th>Value</th><th>m1</th><th>m2</th><th>m3</th><th>m4</th><th>m5</th><th>m6</th><th>Meth.</th></tr></thead><tbody>'+(rows.length?rows.join(''):'<tr><td colspan="10" class="gr">Not performed</td></tr>')+'</tbody></table>';}
function mrow(f,lbl,val,unit,ms,meth){ms=ms||[val];return '<tr><td class="fx">'+f+'</td><td>'+lbl+'</td><td class="v">'+val+' '+unit+'</td>'+[0,1,2,3,4,5].map(i=>'<td>'+(ms[i]!=null?ms[i]:'')+'</td>').join('')+'<td>'+(meth||'avg.')+'</td></tr>';}
function officeHTML(res){const p=D.byId[res.pid],pg=res.preg,m=model(res),s=res.sono;const r=R(SEED+':ro:'+res.id);const oc=obCounts(p,s.day);const age=C.ageAt(p.dob,s.day);
 const ts=C.mdySlash(s.day)+' '+C.fmtTime(res.min+r.int(20,50));const refP=D.provById(pg.prov||p.prov)||D.provById(p.prov);
 const kv=(l,v)=>'<div class="kv"><span class="l">'+l+'</span><span class="v">'+v+'</span></div>';
 const mm=[],dop=[],bioR=[];
 for(const x of m.fetus){const rr=R(SEED+':mm:'+res.id+x.id);if(x.fhr)mm.push(mrow(x.id,'Fetal Heart Rate / Ventricular FHR',x.fhr,'bpm',[x.fhr,x.fhr+rr.int(-3,3),x.fhr+rr.int(-3,3)]));
  if(x.ua)dop.push(mrow(x.id,'Umbilical A S/D',x.ua.sd,'',[x.ua.sd,(x.ua.sd+rr.range(-.12,.12)).toFixed(2),(x.ua.sd+rr.range(-.12,.12)).toFixed(2)]),mrow(x.id,'Umbilical A PI',x.ua.pi,'',[x.ua.pi]),mrow(x.id,'Umbilical A RI',x.ua.ri,'',[x.ua.ri]));
  if(x.crl)bioR.push('<tr><td class="fx">'+x.id+'</td><td>CRL</td><td class="v">'+x.crl.mm+' mm</td><td>'+x.crl.mm+'</td><td>'+(x.crl.mm+rr.range(-.4,.4)).toFixed(1)+'</td><td>Robinson</td><td>'+wd(x.crl.ga)+'</td><td></td></tr>'+(x.nt?'<tr><td class="fx">'+x.id+'</td><td>NT</td><td class="v">'+x.nt+' mm</td><td>'+x.nt+'</td><td></td><td></td><td></td><td></td></tr>':''));
  if(x.bio&&!['fhr','cl','previa'].includes(s.exam)){const b=x.bio;const rw=(l,k,meth)=>'<tr><td class="fx">'+x.id+'</td><td>'+l+'</td><td class="v">'+(b[k].mm/10).toFixed(2)+' cm</td><td>'+(b[k].mm/10).toFixed(2)+'</td><td>'+((b[k].mm+rr.norm(0,0.6))/10).toFixed(2)+'</td><td>'+meth+'</td><td>'+wd(b[k].ga)+'</td><td>'+b[k].pct+'%</td></tr>';
   bioR.push(rw('BPD','bpd','Hadlock')+rw('HC','hc','Hadlock')+rw('AC','ac','Hadlock')+rw('FL','fl','Hadlock')+rw('HL','hl','Jeanty')+'<tr><td class="fx">'+x.id+'</td><td>EFW (Hadlock)</td><td class="v">'+b.efw.g+' g</td><td colspan="2">'+lboz(b.efw.g)+'</td><td>BPD-HC-AC-FL</td><td></td><td>'+b.efw.pct+'%</td></tr><tr><td class="fx">'+x.id+'</td><td>FL/HC</td><td class="v">'+b.flhc+' %</td><td colspan="5"></td></tr>');}}
 const aua=m.fetus.map(x=>{const gA=x.crl?x.crl.ga:x.bio?x.bio.aua:null;return gA==null?'':kv(x.id+' GA(AUA)',wd(gA))+kv(x.id+' EDD(AUA)',C.mdySlash(Math.round(s.day+(40-gA)*7)));}).join('');
 const gen=[];for(const x of m.fetus){if(x.fl&&!['cl'].includes(s.exam))gen.push(mrow(x.id,'AFI (Q1/Q2/Q3/Q4)',x.fl.afi,'cm',x.fl.q,'sum'),mrow(x.id,'MVP',x.fl.mvp,'cm',[x.fl.mvp],'max'));if(x.bpp)gen.push(mrow(x.id,'BPP (AFV/Br/Mv/Tone)',x.bpp.score+'/8','',[x.bpp.afv,x.bpp.br,x.bpp.mv,x.bpp.tone],'score'));}
 if(m.cl!=null)gen.push(mrow('','Cervix length (TV)',m.cl,'cm',[m.cl,(m.cl+r.range(-.15,.15)).toFixed(1),(m.cl+r.range(-.15,.15)).toFixed(1)],'shortest'));
 const cm=['FETUS: '+m.F.join(', ')+' / '+(m.route==='OB TV'?'TV':'TA')+' EXAM.'].concat(m.fetus.map(x=>'FETUS '+x.id+(x.fhr?' HEART RATE '+x.fhr+' BPM':' NO CARDIAC ACTIVITY')+(g2(x)?', '+g2(x):'')),m.g>=14&&s.exam!=='cl'?['PLACENTA '+m.plac.toUpperCase()+(m.previaTxt?'. '+m.previaTxt.toUpperCase():', NO PREVIA')+'.']:[],m.fetus.map(x=>x.pres&&m.g>=18?'FETUS '+x.id+' '+x.pres.toUpperCase()+'.':'').filter(Boolean),m.impression.map(t=>t.toUpperCase()));
 const indic=s.ind.map(x=>x.toUpperCase()).join(', ');
 const name=hdrName(p);
 const p1='<div class="rpage ge"><div class="gehd">'+logo('ge')+'<span class="geti">Obstetrics Report</span><span class="gepr">'+PRACTICE+'</span></div>'+
  '<div class="gebl"><i><b>Obstetrics Report</b></i><span><i><b>Page 1/2</b></i></span><span><i><b>'+PRACTICE+'</b></i></span></div>'+
  '<div class="rbar">Patient / Exam Information<span class="r">Date of Exam: '+C.mdySlash(s.day)+'</span></div>'+
  '<div class="g2"><div>'+kv('Patient ID',p.id)+kv('Name',esc(name))+kv('DOB,Age',C.mdySlash(p.dob)+', '+age+'y')+kv('Sex','F')+'</div><div>'+kv('Gravida',oc.g)+kv('Para',oc.p)+kv('AB',oc.ab)+kv('Ectopic','0')+kv('Fetus',m.nf)+'</div></div>'+
  '<div class="g4">'+kv('LMP',C.mdySlash(pg.lmp))+kv('DOC',C.mdySlash(s.day))+kv('EDD(LMP)',C.mdySlash(pg.lmp+280))+kv('GA(LMP)',m.ga)+'</div>'+
  (aua?'<div class="g4">'+aua+'</div>':'')+
  '<div class="g3">'+kv('Perf. Phys.',PERF)+kv('Ref. Phys.',esc((refP.full+', '+refP.cred).toUpperCase()))+kv('Sonographer',esc(profile(p,pg).sono.toUpperCase()))+'</div>'+
  '<div class="g2">'+kv('Exam Type',m.route)+kv('Custom',s.exam==='cl'?'CERVIX':s.exam==='previa'?'PLACENTA':'')+kv('Indication',esc(indic))+kv('Comment','CPT '+m.cpt)+'</div>'+
  mtab('M-Mode Measurements',mm)+mtab('Doppler Measurements',dop)+
  (bioR.length?'<div class="rbar">Biometry</div><table class="mt"><thead><tr><th></th><th></th><th>Value</th><th>m1</th><th>m2</th><th>Meth.</th><th>GA</th><th>%ile</th></tr></thead><tbody>'+bioR.join('')+'</tbody></table>':'')+
  (gen.length?mtab('2D Measurements / Fluid',gen):'')+
  '<div class="rbar">Comment</div><div class="gecm">'+cm.map(x=>esc(x)).join('<br>')+'</div>'+
  '<div class="pfoot"><span>SIMULATION - fictitious</span><span>1/2</span><span>'+ts+'</span></div></div>';
 const p2='<div class="rpage ge"><div class="gehd">'+logo('ge')+'<span class="geti">Obstetrics Report</span><span class="gepr">'+PRACTICE+'</span></div><div class="gebl"><i><b>Obstetrics Report</b></i><span><i><b>Page 2/2</b></i></span><span><i><b>'+PRACTICE+'</b></i></span></div>'+
  '<div class="g2">'+kv('Name',esc(name))+kv('Patient ID',p.id)+'</div><div class="rbar">Impression</div><ul class="imp">'+m.impression.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><div class="rbar">Plan</div><ul class="imp">'+m.plan.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
  '<div class="sigrow"><div><div class="l">Date</div><div class="v">'+C.mdySlash(s.day)+'</div></div><div><div class="l">Perf. Physician</div><div class="v sig">'+PERF+'</div><div class="sline"></div></div><div><div class="l">Sonographer</div><div class="v">'+esc(profile(p,pg).sono.toUpperCase())+'</div></div></div>'+
  '<div class="pfoot"><span>SIMULATION - fictitious</span><span>2/2</span><span>'+ts+'</span></div></div>';
 return wrap(p1+p2,res);}
function g2(x){if(x.crl)return 'CRL '+x.crl.mm+' MM C/W '+wd(x.crl.ga).toUpperCase();if(x.bio)return 'EFW '+x.bio.efw.g+' G ('+x.bio.efw.pct+'%)';return '';}
function gynHTML(res,p){const rep=res.report||{};const d=rep.dims||{};const r=R(SEED+':gy:'+res.id);const age=C.ageAt(p.dob,res.collected||res.day);const ts=C.mdySlash(res.day)+' '+C.fmtTime(res.min);const kv=(l,v)=>'<div class="kv"><span class="l">'+l+'</span><span class="v">'+v+'</span></div>';const refP=D.provById(res.prov)||D.provById(p.prov);
 const row=(l,v,u,meth)=>'<tr><td class="fx"></td><td>'+l+'</td><td class="v">'+v+' '+u+'</td><td>'+v+'</td><td></td><td></td><td></td><td></td><td></td><td>'+(meth||'')+'</td></tr>';
 const rows=[];if(d.ul)rows.push(row('Uterus L / AP / W',d.ul+' / '+d.uap+' / '+d.uw,'cm'),row('Endometrium',d.es,'mm'),row('Right ovary L / AP / W',d.ro.join(' / '),'cm'),row('Left ovary L / AP / W',d.lo.join(' / '),'cm'));if(d.fs)rows.push(row('Fibroid (largest)',d.fs,'cm'));if(d.cs)rows.push(row('Right ovarian cyst',d.cs,'cm'));
 const name=hdrName(p);const hd='<div class="gehd">'+logo('ge')+'<span class="geti">Gynecology Report</span><span class="gepr">'+PRACTICE+'</span></div>';
 const p1='<div class="rpage ge">'+hd+'<div class="gebl"><i><b>Gynecology Report</b></i><span><i><b>Page 1/2</b></i></span><span><i><b>'+PRACTICE+'</b></i></span></div><div class="rbar">Patient / Exam Information<span class="r">Date of Exam: '+C.mdySlash(res.collected||res.day)+'</span></div>'+
  '<div class="g2"><div>'+kv('Patient ID',p.id)+kv('Name',esc(name))+kv('DOB,Age',C.mdySlash(p.dob)+', '+age+'y')+kv('Sex','F')+'</div><div>'+kv('Gravida',obCounts(p,res.day).g)+kv('Para',obCounts(p,res.day).p)+kv('LMP',age>=52?'postmenopausal':C.mdySlash(res.day-r.int(4,24)))+'</div></div>'+
  '<div class="g3">'+kv('Perf. Phys.',PERF)+kv('Ref. Phys.',esc((refP.full+', '+refP.cred).toUpperCase()))+kv('Sonographer',esc(SONOG[r.int(0,SONOG.length-1)].toUpperCase()))+'</div>'+
  '<div class="g2">'+kv('Exam Type','GYN TV + TA')+kv('Indication',esc((rep.ind||'').replace(/^Indication: /,'').toUpperCase()))+kv('Comment','CPT 76830 / 76856')+'</div>'+mtab('Gynecology Measurements',rows)+
  '<div class="rbar">Comment</div><div class="gecm">'+(rep.find||[]).map(x=>esc(x.toUpperCase())).join('<br>')+'</div><div class="pfoot"><span>SIMULATION - fictitious</span><span>1/2</span><span>'+ts+'</span></div></div>';
 const p2='<div class="rpage ge">'+hd+'<div class="gebl"><i><b>Gynecology Report</b></i><span><i><b>Page 2/2</b></i></span><span><i><b>'+PRACTICE+'</b></i></span></div><div class="g2">'+kv('Name',esc(name))+kv('Patient ID',p.id)+'</div><div class="rbar">Impression</div><ul class="imp"><li>'+esc(rep.imp||res.text)+'</li></ul>'+
  '<div class="sigrow"><div><div class="l">Date</div><div class="v">'+C.mdySlash(res.day)+'</div></div><div><div class="l">Perf. Physician</div><div class="v sig">'+PERF+'</div><div class="sline"></div></div><div><div class="l">Sonographer</div><div class="v">'+esc(SONOG[r.int(0,SONOG.length-1)].toUpperCase())+'</div></div></div><div class="pfoot"><span>SIMULATION - fictitious</span><span>2/2</span><span>'+ts+'</span></div></div>';
 return wrap(p1+p2,res);}
// MFM consult report
function chart(title,unit,fn,pts,lo,hi,yl,yh){const W=260,Hh=170,pl=34,pb=24,pt=12,pr=8;const X=g=>pl+(W-pl-pr)*(g-lo)/(hi-lo),Y=v=>Hh-pb-(Hh-pb-pt)*(v-yl)/(yh-yl);
 const curve=k=>{let d='';for(let g=lo;g<=hi;g+=0.5){const v=fn(g,k);if(v==null)continue;d+=(d?'L':'M')+X(g).toFixed(1)+','+Y(Math.max(yl,Math.min(yh,v))).toFixed(1);}return d;};
 let grid='';for(let g=lo;g<=hi;g+=4)grid+='<line x1="'+X(g)+'" y1="'+pt+'" x2="'+X(g)+'" y2="'+(Hh-pb)+'" stroke="#eee"/><text x="'+X(g)+'" y="'+(Hh-8)+'" font-size="8" text-anchor="middle" fill="#666">'+g+'</text>';
 const ys=5;for(let i=0;i<=ys;i++){const v=yl+(yh-yl)*i/ys;grid+='<line x1="'+pl+'" y1="'+Y(v)+'" x2="'+(W-pr)+'" y2="'+Y(v)+'" stroke="#f2f2f2"/><text x="'+(pl-3)+'" y="'+(Y(v)+3)+'" font-size="8" text-anchor="end" fill="#666">'+(yh>500?Math.round(v):(+v.toFixed(0)))+'</text>';}
 const mk=pts.map(q=>{const x=X(q.g),y=Y(q.v);return q.f==='B'?'<path d="M'+(x-3)+','+(y-3)+'L'+(x+3)+','+(y+3)+'M'+(x+3)+','+(y-3)+'L'+(x-3)+','+(y+3)+'" stroke="#1d4f91" stroke-width="1.4"/>':'<path d="M'+(x-4)+','+y+'H'+(x+4)+'M'+x+','+(y-4)+'V'+(y+4)+'" stroke="#c0392b" stroke-width="1.6"/>';}).join('');
 return '<figure class="gc"><figcaption>'+title+' <span>('+unit+')</span></figcaption><svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="'+title+' growth chart">'+grid+'<rect x="'+pl+'" y="'+pt+'" width="'+(W-pl-pr)+'" height="'+(Hh-pb-pt)+'" fill="none" stroke="#999"/><path d="'+curve(-1.645)+'" fill="none" stroke="#8aa" stroke-dasharray="3 2"/><path d="'+curve(0)+'" fill="none" stroke="#2f7d72" stroke-width="1.3"/><path d="'+curve(1.645)+'" fill="none" stroke="#8aa" stroke-dasharray="3 2"/>'+mk+'<text x="'+(W-pr-2)+'" y="'+(pt+9)+'" font-size="7.5" text-anchor="end" fill="#777">5th / 50th / 95th</text></svg></figure>';}
function mfmHTML(res){const p=D.byId[res.pid],pg=res.preg,m=model(res),s=res.sono,pr=profile(p,pg);const r=R(SEED+':rm:'+res.id);const age=C.ageAt(p.dob,s.day);const name=p.first+' '+p.last;const vit=D.vitals({id:res.id,pid:p.id,day:s.day,preg:pg});
 const sec=(l,body)=>'<div class="ms"><div class="msl">'+l+'</div><div class="msb">'+body+'</div></div>';const dt=(cols,rows)=>'<table class="dt"><thead><tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>'+rows.map(rw=>'<tr'+(rw.b?' class="b"':'')+'>'+rw.c.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 const f0=m.fetus[0];const usGA=f0.crl?f0.crl.ga:f0.bio?f0.bio.aua:m.g;
 const head='<div class="mfmhd">'+logo('mfm')+'<div class="mfmc"><div class="mfmn">'+MFM.name+'</div><div class="mfma">'+MFM.addr+'<br>'+MFM.tel+'</div><div class="mfmd">'+MFM.docs.slice(0,4).join(' · ')+'<br>'+MFM.docs.slice(4).join(' · ')+'</div></div>'+logo('mfm')+'</div>';
 const info='<div class="mfmi"><div><b>Requested By:</b> DR. STEVE BEHRAM<br>Fax: (555) 555-0102<br>'+PRACTICE+'</div><div class="kvs"><span>Name:</span><b>'+esc(name)+'</b><span>DOB:</span><b>'+C.mdySlash(p.dob)+' ('+age+' yrs)</b><span>MRN:</span><b>'+p.id+'</b><span>Exam Date:</span><b>'+C.mdySlash(s.day)+'</b><span>Exam State:</span><b>Report Finalized</b><span>Site Name:</span><b>'+MFM.site+'</b></div></div>';
 const title='<h3 class="mfmt">'+MFMTITLE[s.exam]+(m.nf===2?' - Twin Gestation':'')+'</h3>';
 const dating=sec('Dating',dt(['Date','Details','Gest. age','EDD'],[{c:['Stated Dating','LMP '+C.mdySlash(pg.lmp),m.ga,C.mdySlash(pg.lmp+280)]},{c:['U/S '+C.mdySlash(s.day),f0.crl?'based upon CRL':'based upon AC, BPD, Femur, HC',wd(usGA),C.mdySlash(Math.round(s.day+(40-usGA)*7))]},{b:1,c:['Assigned dating','based on LMP, confirmed by first-trimester ultrasound',m.ga,C.mdySlash(pg.lmp+280)]}]));
 const indic=sec('Indication','<ul class="dl">'+s.ind.concat(m.fetus.some(x=>x.fl&&x.fl.afi>24)?['Polyhydramnios']:[]).concat(m.previaTxt&&!m.previaRes?['Low-lying placenta']:[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>');
 const hx=sec('History',esc(age+' y/o '+D.gp(p,s.day)+'. '+(pg.risk&&pg.risk.length?'Pregnancy complicated by '+pg.risk.join(', ')+'. ':'')+(pr.priorPTB?'Prior spontaneous preterm birth. ':'')+(pr.priorCS?'Prior cesarean delivery. ':'')+(pr.dm?'Type 2 diabetes on metformin/insulin. ':'')+(pr.chtn?'Chronic hypertension. ':'')+'Medications: '+A.meds(p,s.day).slice(0,4).map(x=>x[0].split(' ')[0]).join(', ')+'.'));
 const meth=sec('Method',(m.route==='OB TV'?'Transvaginal':'Transabdominal'+(m.cl!=null?' and transvaginal':''))+' ultrasound examination.'+(m.fetus.some(x=>x.ua)?' Umbilical artery Doppler.':'')+(m.ut?' Uterine artery Doppler.':'')+' View: Adequate view.');
 const preg=sec('Pregnancy',m.nf===2?'Twin pregnancy, dichorionic diamniotic. Number of fetuses: 2':'Singleton pregnancy. Number of fetuses: 1');
 const htIn=60+parseInt(vit.ht.split(' ')[1]);const mat=sec('Maternal Assessment','Height '+vit.ht+' ('+Math.round(htIn*2.54)+' cm) · Weight '+vit.wt+' lb · BMI '+vit.bmi+' · BP '+vit.bp);
 const genEval=sec('General Evaluation',m.fetus.map(x=>'<div><b>'+(m.nf===2?'Fetus '+x.id+': ':'')+'</b>Cardiac activity '+(x.fhr?'present, FHR '+x.fhr+' bpm':'absent')+'. Fetal movements '+(x.fhr?'visualized':'absent')+'. Presentation: '+x.pres+'. Placenta: '+m.plac+(m.nf===2?' (separate)':'')+', thickness '+(r.range(2.2,3.9)).toFixed(1)+' cm'+(m.previaTxt?'; '+esc(m.previaTxt):', no previa')+'. Umbilical cord: '+pr.cord+' vessels.'+(x.fl?' Amniotic fluid: MVP '+x.fl.mvp+' cm, AFI '+x.fl.afi+' cm (Q1 '+x.fl.q.join(' / Q')+').':'')+'</div>').join('').replace('(Q1 '+'','(Q1 '));
 let bioS='',fluidS='',anatS='',bppS='',dopS='',matS='',mdopS='';
 for(const x of m.fetus){const L=m.nf===2?'Fetus '+x.id+' - ':'';
  if(x.crl)bioS+=sec(L+'Fetal Biometry',dt(['','mm','Percentile','GA'],[{c:['CRL',x.crl.mm,'',wd(x.crl.ga)]}].concat(x.nt?[{c:['Nuchal translucency',x.nt,'< 95th','']}]:[]))+(x.nt?'<p>Nasal bone: present. Ductus venosus a-wave: positive. Tricuspid flow: normal.</p>':''));
  if(x.bio){const b=x.bio;bioS+=sec(L+'Fetal Biometry',dt(['','mm','Percentile','GA'],[['BPD','bpd'],['OFD','ofd'],['HC','hc'],['AC','ac'],['Femur','fl'],['Humerus','hl']].map(q=>({c:[q[0],b[q[1]].mm,b[q[1]].pct+'%',wd(b[q[1]].ga)]})))+
   '<p><b>Fetal Weight Calculation:</b> EFW '+b.efw.g+' g ('+lboz(b.efw.g)+'), '+ord(b.efw.pct)+' percentile. Calculated by Hadlock (BPD-HC-AC-FL).</p><p><b>Proportionality Ratios:</b> FL/HC '+b.flhc+'% (normal 18.4-21.2%); HC/AC '+(b.hc.mm/b.ac.mm).toFixed(2)+'.</p>');}
  if(x.fl)fluidS+=sec(L+'Amniotic Fluid / FHR',dt(['AFI','Q1','Q2','Q3','Q4','MVP','FHR'],[{c:[x.fl.afi+' cm'].concat(x.fl.q.map(v=>v+' cm'),[x.fl.mvp+' cm',x.fhr+' bpm'])}]));
  if(x.bpp)bppS+=sec(L+'Biophysical Profile',dt(['AFV','Breathing','Movements','Tone','Score'],[{b:1,c:[x.bpp.afv,x.bpp.br,x.bpp.mv,x.bpp.tone,x.bpp.score+'/8']}]));
  if(x.ua){const u=x.ua;const pc=v=>Math.max(3,Math.min(97,u.pct+r.int(-4,4)))+'%';dopS+=sec(L+'Fetal Doppler','<p><b>Umbilical artery</b></p>'+dt(['PS','ED','TAmax','MD','RI','PI','S/D'],[{c:[u.ps+' cm/s',u.ed+' cm/s',u.tam+' cm/s',u.md+' cm/s',u.ri,u.pi,u.sd]},{c:['','','','',pc(),pc(),u.pct+'%']}])+'<p><b>Impression:</b> '+(u.high?'Elevated umbilical artery S/D ratio (> 95th percentile) with forward end-diastolic flow.':'Normal umbilical artery Doppler; forward end-diastolic flow.')+'</p>');}}
 if(m.anat){const a=m.anat;anatS=sec('Fetal Anatomy','<p>The following structures were visualized with normal appearance:</p><ul class="anat">'+a.seen.map(q=>'<li><b>'+q[0]+':</b> '+q[1]+'</li>').join('')+'</ul><p>The following structures could not be adequately visualized: '+(a.notSeen.length?a.notSeen.join(', '):'none')+'.</p><p>The following structures could not be examined: '+a.notExamined.join(', ')+'.</p>');}
 matS=sec('Maternal Structures','Uterus: '+(D.hasP(p,/leiomyoma/)?'fibroid uterus, largest '+(r.range(2,5)).toFixed(1)+' cm intramural, away from the lower segment':'normal')+'. Adnexa: normal. Cervix: '+(m.cl!=null?'transvaginal cervical length '+m.cl+' cm'+(m.funnel?', funneling present':', no funneling'):'appears closed and long transabdominally')+'.');
 if(m.ut){const u=m.ut;const t=x=>dt(['PS','ED','PI','RI','Notch'],[{c:[x.ps+' cm/s',x.ed+' cm/s',x.pi,x.ri,x.notch?'yes':'no']}]);mdopS=sec('Maternal Doppler','<p><b>Right uterine artery</b></p>'+t(u.R)+'<p><b>Left uterine artery</b></p>'+t(u.L)+'<p><b>Impression:</b> Mean uterine artery PI '+u.mean+(u.high?', above the 95th percentile, suggesting increased placental resistance.':', within normal limits.')+'</p>');}
 const cons=sec('Consultation','<p>'+esc(p.first)+' was seen today for '+s.ind.join(', ').toLowerCase()+'. The ultrasound findings were reviewed with her in detail.</p><p>'+esc(counsel(m,pr))+'</p><p>All questions were answered. A copy of this report has been sent to Dr. Behram.</p>');
 const imp=sec('Impression','<ul class="dl">'+m.impression.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>');const fu=sec('Follow-up',esc(m.plan.join('; '))+'.');
 const sig='<div class="msig"><div><b>'+esc(pr.mfmDoc.toUpperCase())+'</b><br>Consulting and Reading Physician<br>Electronically signed by '+esc(pr.mfmDoc)+' at '+C.fmtTime(res.min+r.int(30,90))+' on '+C.mdySlash(s.day)+'</div><div><b>Sonographer:</b> '+esc(SONOG[r.int(0,SONOG.length-1)])+'</div></div>';
 // charts
 const ser=serial(res);const pts=k=>{const o=[];for(const q of ser)for(const x of q.m.fetus)if(x.bio)o.push({g:q.m.g,v:k==='efw'?x.bio.efw.g:x.bio[k].mm,f:x.id});return o;};
 const afiPts=[];for(const q of studies(p).filter(x=>x.preg===pg&&x.day<=s.day)){const mm=model(q);for(const x of mm.fetus)if(x.fl)afiPts.push({g:mm.g,v:x.fl.afi,f:x.id});}
 const ch=f=>(g,z)=>MEAN[f](g)*(1+CV[f]*z);
 const charts='<div class="gcg">'+chart('EFW','g',(g,z)=>g<16?null:efw50(g)*Math.exp(0.12*z),pts('efw'),14,42,0,4800)+chart('BPD','mm',ch('bpd'),pts('bpd'),14,42,20,105)+chart('HC','mm',ch('hc'),pts('hc'),14,42,80,380)+chart('AC','mm',ch('ac'),pts('ac'),14,42,60,400)+chart('FL','mm',ch('fl'),pts('fl'),14,42,10,85)+chart('AFI','cm',(g,z)=>g<16?null:(14+(g>37?-2:0))+z*4.3,afiPts,14,42,0,32)+'</div>';
 const pages=[[head,info,title,dating,indic,hx,meth,preg,mat,genEval],[bioS,fluidS,anatS,bppS,dopS],[matS,mdopS,cons,imp,fu,sig],['<h4 class="gch">Growth charts - serial measurements ('+(m.nf===2?'+ Fetus A, × Fetus B':'+ this patient')+')</h4>',charts]].filter(pgx=>pgx.join('').trim());
 const N=pages.length;return wrap(pages.map((pgx,i)=>'<div class="rpage mfm">'+(i?'<div class="mfmmini">'+MFM.name+' · '+esc(name)+' · '+C.mdySlash(s.day)+'</div>':'')+pgx.join('')+'<div class="pfoot"><span>Page '+(i+1)+' of '+N+' for report of patient '+esc(name)+', DOB '+C.mdySlash(p.dob)+'</span><span>SIMULATION - fictitious</span></div></div>').join(''),res);}
function counsel(m,pr){const t=[];if(m.exam==='nt')t.push('First-trimester screening options were reviewed, including cell-free DNA and diagnostic testing (CVS/amniocentesis), which she may decline.');
 if(m.anat)t.push(m.anat.incomplete?'The anatomy survey was incomplete due to fetal position; a follow-up study was scheduled.':'No structural anomalies were identified; ultrasound cannot detect all anomalies.');
 if(pr.twins)t.push('Dichorionic twin pregnancies carry increased risks of preterm birth, growth restriction and preeclampsia; serial growth every 4 weeks and low-dose aspirin are recommended.');
 if(pr.dm)t.push('Glycemic targets (fasting < 95, 1-h postprandial < 140) were reviewed; fetal echocardiogram is recommended at 22-24 weeks.');
 if(pr.chtn||pr.ghtn)t.push('Blood pressure goals, preeclampsia warning signs and aspirin 81 mg nightly were reviewed.');
 if(m.fetus.some(x=>x.bio&&(x.bio.efw.pct<10||x.bio.ac.pct<10)))t.push('Fetal growth restriction was discussed, including the role of umbilical artery Doppler surveillance and delivery timing.');
 if(m.fetus.some(x=>x.bio&&x.bio.efw.pct>90))t.push('Suspected LGA fetus was discussed; ultrasound EFW has a margin of error of about 15% near term.');
 if(m.cl!=null&&m.cl<2.5)t.push('A short cervix with prior preterm birth was discussed; vaginal progesterone is recommended and cerclage was discussed.');
 if(!t.length)t.push('Findings are reassuring.');return t.join(' ');}
function wrap(pages,res){return '<div class="rptwrap"><div class="rpttool"><span>'+esc(res.name)+'</span><button type="button" class="gbtn" onclick="window.print()">Print / View PDF</button></div>'+pages+'</div>';}
function html(res){const p=D.byId[res.pid];if(res.sono)return res.sono.kind==='mfm'?mfmHTML(res):officeHTML(res);if(res.code==='PELV')return gynHTML(res,p);return '';}
const has=res=>!!(res&&(res.sono||res.code==='PELV'));
// ---------- hooks ----------
const _res=D.patientResults,_docs=D.patientDocs;
D.patientResults=function(p,upTo){return _res(p,upTo).concat(studies(p).filter(s=>D.abs(s.day,s.min)<=D.nowAbs()));};
D.patientDocs=function(p){return _docs(p).concat(studies(p).filter(s=>s.sono.kind==='mfm').map(docFor).filter(d=>D.abs(d.day,d.min)<=D.nowAbs()));};
G.SIMSONO={studies,model,html,has,recent,profile,docFor,MFM,PRACTICE};
})(window);
