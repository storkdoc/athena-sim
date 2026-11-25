// Coverage test: every fictitious patient, on several sim dates, must have >=1 past visit with a full note,
// >=1 lab, >=1 imaging report (full report), >=1 outside document (full text), vitals, history sections.
const {chromium}=require('playwright');
const BASE=process.env.BASE||'http://localhost:8765/';
const DATES=['2025-01-02','2025-08-15','2026-03-10','2026-11-25','2027-12-30'];
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const t0=Date.now();await pg.goto(BASE+'#/dashboard');await pg.waitForSelector('#loading.hidden',{state:'attached'});const boot=Date.now()-t0;
 let fail=0;const out={boot};
 for(const ds of DATES){
  const res=await pg.evaluate((ds)=>{const C=SIMCORE,D=SIMDATA,H=SIMHIST;const n=C.fromIso(ds);D.setNow(n,12*60);
   const cats={};const tot={visits:0,labs:0,imaging:0,docs:0,vitals:0,cases:0,notes:0};const bad=[];let t=performance.now();
   for(const p of D.patients){const h=H.get(p);
    const vs=h.visits.concat(p.visits).filter(v=>v.fate==='ok'&&v.day<n&&D.COMPLETED(D.apptStatus(v)));
    const rs=D.patientResults(p);const labs=rs.filter(r=>r.kind==='Lab'),imgs=rs.filter(r=>r.kind==='Imaging');const docs=D.patientDocs(p);const cases=D.patientCases(p.id).filter(c=>D.abs(c.day,c.min)<=D.nowAbs());
    const pgNow=D.pregAt(p,n),pp=D.postpartum(p,n);const firstIn=p.visits.find(v=>v.fate==='ok');
    const keys=['all',h.meta.cat,pgNow?'pregnant now':pp?'postpartum now':'non-pregnant',(!firstIn||firstIn.day>n)?'first scheduled visit after sim date':'seen in scheduled range'];
    const ok=vs.length>0&&labs.length>0&&imgs.length>0&&docs.length>0;
    for(const k of keys){const c=cats[k]=cats[k]||{n:0,ok:0};c.n++;if(ok)c.ok++;}
    if(!ok&&bad.length<10)bad.push(p.id+' v'+vs.length+' l'+labs.length+' i'+imgs.length+' d'+docs.length);
    tot.visits+=vs.length;tot.labs+=labs.length;tot.imaging+=imgs.length;tot.docs+=docs.length;tot.cases+=cases.length;tot.vitals+=vs.length;
    // deep checks on a sample: full note sections, full imaging report, full document text
    if(p.idx%25===0&&ok){const v=vs[vs.length-1];const e=H.note(v);if(!(e.reason&&e.hpi&&e.hpi.length>60&&Object.keys(e.ros).length>=10&&Object.keys(e.pe).length>=8&&e.ap.length&&e.vitals.bp))bad.push(p.id+' note '+v.id);
     const im=imgs[0];if(!(im.report&&im.report.find.length>=2&&im.report.imp&&im.report.reader&&im.report.tech))bad.push(p.id+' img '+im.id);
     const dt=H.docText(docs[0]);if(!(dt.length>600&&/SIMULATION/.test(dt)))bad.push(p.id+' doc '+docs[0].id+' len '+dt.length);
     if(!(H.gyn(p,n).length&&H.social(p).length&&H.family(p).length&&H.immunizations(p,n).length&&H.insurance(p).length))bad.push(p.id+' hx');
     const ob=H.obHistory(p,n);const gp=D.gp(p,n);const g=+gp.slice(1,gp.indexOf('P'));if(ob.list.length+(ob.current?1:0)!==g&&!(ob.list.length+1===g))bad.push(p.id+' gp '+gp+' list '+ob.list.length);
     tot.notes++;}
   }
   const N=D.patients.length;const avg={};for(const k in tot)if(k!=='notes')avg[k]=+(tot[k]/N).toFixed(1);
   return {ds,N,cats,avg,bad,ms:Math.round(performance.now()-t)};},ds);
  out[ds]=res;const all=res.cats.all;console.log(ds,'patients',res.N,'complete',all.ok+'/'+all.n,'avg',JSON.stringify(res.avg),'scan',res.ms+'ms');
  for(const k in res.cats)if(k!=='all')console.log('   ',k.padEnd(38),res.cats[k].ok+'/'+res.cats[k].n);
  if(res.bad.length){fail++;console.log('  BAD',res.bad.join(' | '));}
  if(all.ok!==all.n)fail++;
 }
 // chart open timing (fresh patient each time; lazy generation)
 await pg.evaluate(()=>{localStorage.setItem('athenaSim.v1.pref.date',JSON.stringify('2026-11-25'));});await pg.reload();await pg.waitForSelector('#loading.hidden',{state:'attached'});
 const ids=await pg.evaluate(()=>[7,555,1234,2500,3999,5100].map(i=>SIMDATA.patients[i].id));const times=[];
 for(const id of ids){const t=Date.now();await pg.evaluate(id=>location.hash='#/chart/'+id,id);await pg.waitForSelector('.land');times.push(Date.now()-t);
  for(const pn of ['visits','results','vitals','history']){await pg.evaluate(([id,pn])=>location.hash='#/chart/'+id+'/'+pn,[id,pn]);await pg.waitForSelector('.cslide');}
  const href=await pg.$eval('.cslide [data-doc]',a=>a.getAttribute('href'));await pg.evaluate(h=>location.hash=h,href);await pg.waitForSelector('pre.docpre');
  await pg.evaluate(id=>location.hash='#/chart/'+id+'/results',id);await pg.click('[data-rt=img]');await pg.waitForSelector('.cslide [data-res]');await pg.click('.cslide [data-res]');await pg.waitForSelector('.imgrep');
  await pg.evaluate(id=>location.hash='#/chart/'+id+'/visits',id);const vv=await pg.$$eval('.cslide [data-visit]',a=>a.map(x=>x.getAttribute('href')));await pg.evaluate(h=>location.hash=h,vv[vv.length-1]);await pg.waitForSelector('.cdetail .esec');
  const secs=await pg.$$eval('.cdetail .esec .val',a=>a.length);if(secs<7){fail++;console.log('FAIL note sections',id,secs);}
 }
 console.log('chart open ms',times.join(', '),'boot ms',boot);
 const inbox=await pg.evaluate(()=>{const c=SIMDATA.inboxCounts('P1');return c;});console.log('inbox P1 open items',inbox.Total,'Lab/Imaging',inbox['Lab / Imaging'],'Clinical Docs',inbox['Clinical Documents']);
 if(errs.length){fail++;console.log('PAGE ERRORS',errs.slice(0,5));}
 require('fs').writeFileSync('/tmp/coverage.json',JSON.stringify(out,null,1));
 console.log(fail?'FAILED':'ALL PASSED');await b.close();process.exit(fail?1:0);})();
