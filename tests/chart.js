// Playwright click-through tests for the patient chart (SIMULATION data only).
const {chromium}=require('playwright');
const base=process.env.BASE||'http://localhost:8765/';
(async()=>{
 const b=await chromium.launch();const errs=[];let fails=0;
 const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
 for(const W of [1280,1024]){
  const ctx=await b.newContext({viewport:{width:W,height:860}});const pg=await ctx.newPage();
  pg.on('pageerror',e=>errs.push(W+' '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(W+' '+m.text());});
  await pg.goto(base+'?simdate=2026-11-25#/dashboard');await pg.waitForSelector('#loading.hidden',{state:'attached',timeout:30000});
  // name -> chart from dashboard schedule
  await pg.locator('#dashsched a.ptname').first().click();await pg.waitForSelector('.cb');
  ok(await pg.locator('.crail a').count()===12,W+' rail has 12 icons');
  ok(await pg.locator('.lcard .hb:has-text("PERSONAL INFO")').count()===1,W+' landing personal info');
  ok(await pg.locator('.ttl2:has-text("Outstanding Orders")').count()===1&&await pg.locator('.ttl2:has-text("Follow Up")').count()===1,W+' right cards');
  const bw=await pg.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);ok(bw[0]<=bw[1]+1,W+' no horizontal overflow '+bw);
  // pick a patient with an OPEN visit today (find via generator) for the fill/finish flow
  const pid=await pg.evaluate(()=>{const n=SIMDATA.now.day;for(const v of SIMDATA.dayAppts(n)){if(SIMDATA.apptStatus(v)!=='Cancelled'&&v.fate==='ok'&&SIMCHART.vStatus(v)==='OPEN')return v.pid+'|'+v.id;}for(const v of SIMDATA.dayAppts(n-1)){if(SIMCHART.vStatus(v)==='OPEN')return v.pid+'|'+v.id;}return null;});
  ok(!!pid,W+' found an OPEN visit');const [P,V]=pid.split('|');
  await pg.evaluate(h=>location.hash=h,'#/chart/'+P);await pg.waitForSelector('.cb');
  await pg.click('.crail a[data-rail=visits]');await pg.waitForSelector('.cslide:has-text("Visits and Cases")');
  ok(await pg.locator('#cdim').count()===1,W+' visits slide-out dims chart');
  const vl=pg.locator('.vrow[data-visit="'+V+'"]');if(!await vl.count())await pg.click('#viewall');
  await pg.locator('.vrow[data-visit="'+V+'"]').click();await pg.waitForSelector('.cdetail h2:has-text("Summary")');
  ok(await pg.locator('.vrow.sel').count()===1,W+' selected visit highlighted');
  ok(await pg.locator('.esec').count()===8,W+' 8 encounter sections');
  // fill HPI
  await pg.click('.esec[data-sec=hpi]');await pg.fill('.esec.editing textarea','SIM test HPI: hot flashes improving.');await pg.click('.esec.editing [data-save]');
  ok((await pg.textContent('.esec[data-sec=hpi]')).includes('hot flashes'),W+' HPI saved');
  await pg.click('.esec[data-sec=ros]');await pg.click('#rosneg');await pg.click('.esec.editing [data-save]');ok((await pg.textContent('.esec[data-sec=ros]')).includes('Negative'),W+' ROS saved');
  await pg.click('.esec[data-sec=pe]');await pg.click('#peall');await pg.click('.esec.editing [data-save]');ok((await pg.textContent('.esec[data-sec=pe]')).includes('General: normal'),W+' PE saved');
  await pg.click('.esec[data-sec=ap]');await pg.selectOption('.esec.editing [data-apdx="0"]','N95.9');await pg.fill('.esec.editing [data-applan="0"]','Discussed options; f/u 3 months.');await pg.click('.esec.editing [data-save]');
  ok((await pg.textContent('.esec[data-sec=ap]')).includes('N95.9'),W+' A&P saved');
  await pg.click('.esec[data-sec=vitals]');await pg.fill('.esec.editing [data-v=bp]','122/78');await pg.click('.esec.editing [data-save]');ok((await pg.textContent('.esec[data-sec=vitals]')).includes('122/78'),W+' vitals saved');
  await pg.click('#finish');await pg.waitForTimeout(150);
  ok(await pg.locator('#reopen').count()===1,W+' finish -> closed');
  ok(!(await pg.textContent('.vrow.sel .t')).includes('OPEN'),W+' visit list no longer OPEN');
  ok((await pg.textContent('#notify')).includes('Completed signoff'),W+' signoff notice');
  // persisted
  await pg.reload();await pg.waitForSelector('#loading.hidden',{state:'attached'});await pg.waitForSelector('.cdetail');ok((await pg.textContent('.esec[data-sec=hpi]')).includes('hot flashes'),W+' encounter persisted after reload');
  // results: find a patient with an open lab result in inbox
  const rid=await pg.evaluate(()=>{const it=SIMDATA.inboxItems('P1').find(i=>i.kind==='Lab');return it.pid+'|'+it.id;});const [RP,RI]=rid.split('|');
  await pg.evaluate(h=>location.hash=h,'#/chart/'+RP);await pg.waitForSelector('.cb');
  await pg.click('.crail a[data-rail=results]');await pg.waitForSelector('.ctabs');
  ok(await pg.locator('.ctabs a:has-text("Imaging Results")').count()===1,W+' results tabs');
  await pg.locator('.rrow[data-res="'+RI+'"]').click();await pg.waitForSelector('.cdetail .rbox');
  ok((await pg.textContent('.cdetail .dh h2')).includes('in REVIEW'),W+' result in REVIEW');
  ok(await pg.locator('.rbox th:has-text("Abn. Flag")').count()===1,W+' analyte table');
  const h0=await pg.locator('.hist tbody tr').count();
  await pg.click('#viewact');await pg.check('input[name=ract][value=close]');await pg.fill('#rnote','Normal, letter sent (sim).');await pg.click('#rsave');await pg.waitForTimeout(150);
  ok((await pg.textContent('.cdetail .dh h2')).includes('in CLOSED to nobody'),W+' result closed');
  ok(await pg.locator('.hist tbody tr').count()===h0+1,W+' history row added');
  const inInbox=await pg.evaluate(id=>SIMDATA.inboxItems('P1').some(i=>i.id===id),RI);ok(!inInbox,W+' removed from Clinical Inbox');
  await pg.click('a.lnk:has-text("graph")');await pg.waitForTimeout(100);ok(await pg.locator('.svgwrap svg, .cdetail .gray').count()>0,W+' graph view');
  await pg.click('a.lnk:has-text("table")');await pg.waitForTimeout(100);ok(await pg.locator('.rbox table').count()===1,W+' table view');
  // other panels
  for(const k of ['find','allergies','problems','meds','vaccines','vitals','history','quality','care','apps']){await pg.evaluate(h=>location.hash=h,'#/chart/'+RP+'/'+k);await pg.waitForTimeout(60);ok(await pg.locator('.cslide').count()===1,W+' panel '+k);}
  await pg.evaluate(h=>location.hash=h,'#/chart/'+RP+'/allergies');await pg.fill('.addf [data-a=name]','Latex (SIM)');await pg.click('[data-add=allergies]');ok((await pg.textContent('.cslide')).includes('Latex (SIM)'),W+' allergy added');
  // inbox name -> chart, search -> chart
  await pg.evaluate(()=>location.hash='#/inbox/Lab%20%2F%20Imaging');await pg.waitForTimeout(150);await pg.locator('table.grid a.ptname').first().click();await pg.waitForSelector('.cb');ok(true,W+' inbox name opens chart');
  await pg.fill('#psearchbox','maya');await pg.waitForTimeout(100);await pg.locator('#psearchres a').first().click();await pg.waitForSelector('.cb');ok(true,W+' search opens chart');
  await pg.evaluate(()=>{localStorage.clear();});await ctx.close();
 }
 ok(errs.length===0,'no console errors '+JSON.stringify(errs.slice(0,5)));
 await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');process.exit(fails?1:0);
})();
