// Sono/MFM report test + counts
const {chromium}=require('playwright');const BASE=process.env.BASE||'http://localhost:8765/';
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:1000}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await pg.goto(BASE+'?simdate=2026-11-25#/dashboard');await pg.waitForSelector('#loading.hidden',{state:'attached'});
 const st=await pg.evaluate(()=>{const D=SIMDATA,S=SIMSONO,C=SIMCORE;D.setNow(C.fromIso('2026-11-25'),720);const cnt={};const ind={};let pregs=0,withUS=0,bad=[];let t=performance.now();
  for(const p of D.patients){const ss=S.studies(p);const pgs=new Set(ss.map(s=>s.preg));for(const s of ss){const k=s.sono.kind+':'+s.sono.exam;cnt[k]=(cnt[k]||0)+1;for(const i of s.sono.ind)ind[i]=(ind[i]||0)+1;}
   for(const q of p.preg.concat(SIMHIST.get(p).pregs))if(q.lmp+70<D.now.day&&q.lmp>SIMHIST.LEG_START){pregs++;if(pgs.has(q))withUS++;else if(bad.length<5)bad.push(p.id);}}
  // consistency: serial EFW percentiles for IUGR fall <10; LGA >90
  let iugr=0,iugrOk=0,lga=0,lgaOk=0,twins=0;
  for(const p of D.patients)for(const q of p.preg){const pr=S.profile(p,q);const g=S.studies(p).filter(s=>s.preg===q&&s.sono.exam==='growth');if(!g.length)continue;const last=S.model(g[g.length-1]);const f=last.fetus[0];if(!f.bio)continue;
   if(pr.iugr&&last.g>pr.onset+2){iugr++;if(f.bio.efw.pct<10||f.bio.ac.pct<10)iugrOk++;}if(pr.lga&&last.g>=35){lga++;if(f.bio.efw.pct>85)lgaOk++;}if(pr.twins&&last.fetus.length===2)twins++;}
  const inbox=D.inboxItems('P1');const usIn=inbox.filter(i=>i.sono||i.sono===undefined&&String(i.id).startsWith('S'));
  return {cnt,ind,pregs,withUS,bad,iugr,iugrOk,lga,lgaOk,twins,inboxUS:inbox.filter(i=>i.vendor==='Congressional OBGYN (SIM)').length,inboxMFM:inbox.filter(i=>i.kind==='Outside ultrasound report').length,ms:Math.round(performance.now()-t)};});
 console.log(JSON.stringify(st,null,1));
 // render each type
 const sample=await pg.evaluate(()=>{const D=SIMDATA,S=SIMSONO;const want={};for(const p of D.patients){for(const s of D.patientResults(p).filter(r=>r.sono||r.code==='PELV')){const k=(s.sono?s.sono.kind+':'+s.sono.exam+(s.sono.failed?':failed':'')+(S.profile(p,s.preg).twins?':twins':''):'gyn:pelvic');if(!want[k])want[k]='#/chart/'+p.id+'/results/'+s.id;}if(Object.keys(want).length>=16)break;}return want;});
 let fail=0;for(const k in sample){await pg.evaluate(h=>location.hash=h,sample[k]);await pg.waitForSelector('.rpage');const n=await pg.$$eval('.rpage',a=>a.length);const foot=await pg.$$eval('.rpage .pfoot',a=>a.every(x=>/SIMULATION - fictitious/.test(x.textContent)));const pr=await pg.$('.rpttool button');
  const svg=k.startsWith('mfm')?await pg.$$eval('figure.gc',a=>a.length):0;console.log(k.padEnd(28),'pages',n,'footer',foot,'charts',svg);if(!foot||!pr||n<2||(k.startsWith('mfm')&&svg!==6))fail++;
  if(process.env.SHOTS)await pg.screenshot({path:'/tmp/s_'+k.replace(/:/g,'_')+'.png',fullPage:false});}
 // MFM doc in history + inbox link
 const doc=await pg.evaluate(()=>{for(const p of SIMDATA.patients){const d=SIMDATA.patientDocs(p).find(x=>x.sono);if(d)return '#/chart/'+p.id+'/history/'+d.id;}});await pg.evaluate(h=>location.hash=h,doc);await pg.waitForSelector('.rpage.mfm');console.log('MFM doc in History OK');
 await pg.evaluate(()=>location.hash='#/inbox/Clinical%20Documents');await pg.waitForTimeout(300);
 if(errs.length){fail++;console.log('ERR',errs.slice(0,4));}console.log(fail?'FAILED':'ALL PASSED');await b.close();process.exit(fail?1:0);})();
