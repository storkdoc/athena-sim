const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:950}});
 const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 const base=process.env.BASE||'http://localhost:8765/';
 await pg.goto(base+'?simdate=2026-11-25');await pg.waitForSelector('#loading.hidden',{state:'attached',timeout:30000});
 console.log('gen ms',await pg.evaluate(()=>window.SIM_GEN_MS));
 const txt=async s=>(await pg.textContent(s)).replace(/\s+/g,' ').slice(0,400);
 console.log('INBOX:',await txt('.inbox-list'));
 console.log('SCHED rows',await pg.locator('#dashsched .appt').count(),'open',await pg.locator('#dashsched .appt.open').count());
 for(const h of ['#/schedule','#/schedule?view=week','#/inbox/Lab%20%2F%20Imaging','#/claims','#/claims?tab=DENIED','#/claims?tab=MISSING%20SLIP','#/report','#/dashboard-practice','#/recall','#/openslots','#/cancellations','#/obpatients','#/patients?q=maya','#/about']){
   const t=Date.now();await pg.evaluate(h=>location.hash=h,h);await pg.waitForTimeout(150);
   const e=await pg.locator('.empty:has-text("Sim error")').count();
   console.log(h,'ms',Date.now()-t,'err',e,'rows',await pg.locator('table.grid tbody tr').count());
 }
 // chart of an OB patient
 const pid=await pg.evaluate(()=>SIMDATA.obCensus(SIMDATA.now.day)[0].p.id);
 for(const tab of ['summary','problems','medications','allergies','vitals','ob','labs','imaging','documents','encounters','appointments','billing']){await pg.evaluate(h=>location.hash=h,'#/chart/'+pid+'/'+tab);await pg.waitForTimeout(80);if(await pg.locator('text=Sim error').count())console.log('chart err',tab);}
 console.log('report:',await txt('#main .kpis').catch(()=>''));
 await pg.evaluate(h=>location.hash=h,'#/report');await pg.waitForTimeout(200);console.log('report:',await txt('#main .kpis'));
 await pg.evaluate(h=>location.hash=h,'#/dashboard-practice');await pg.waitForTimeout(500);console.log('dash:',await txt('#main .kpis'));
 // flows: inbox close
 await pg.evaluate(h=>location.hash=h,'#/inbox/Lab%20%2F%20Imaging');await pg.waitForTimeout(200);
 const before=await pg.locator('table.grid tbody tr').count();
 await pg.locator('table.grid tbody tr').first().click();await pg.waitForTimeout(150);
 await pg.click('button[data-act=close]');await pg.waitForTimeout(200);
 console.log('inbox close',before,'->',await pg.locator('table.grid tbody tr').count(),'|',await txt('#notify'));
 // check-in flow
 await pg.evaluate(()=>location.hash='#/dashboard');await pg.waitForTimeout(200);
 // go to a future day tab
 await pg.locator('.weektabs .tab').nth(5).click();await pg.waitForTimeout(150);
 const a=pg.locator('#dashsched .appt[data-appt]').first();await a.click();await pg.waitForSelector('#modal:not(.hidden)');
 await pg.click('#modal button[data-to="Checked In"]');await pg.waitForTimeout(150);console.log('checkin:',await txt('#notify'));
 // book open slot
 const o=pg.locator('#dashsched .appt.open').first();if(await o.count()){await o.click();await pg.fill('#bkq','maya');await pg.waitForTimeout(100);await pg.locator('#bkres a').first().click();await pg.click('#bkgo');await pg.waitForTimeout(150);console.log('book:',await txt('#notify'));}
 // date move consistency
 const sig=async()=>await pg.evaluate(()=>JSON.stringify(SIMDATA.inboxCounts('P1')));
 const s1=await sig();await pg.click('#simnext');await pg.waitForTimeout(200);const s2=await sig();await pg.click('#simprev');await pg.waitForTimeout(200);const s3=await sig();
 console.log('date move',s1===s3?'consistent':'MISMATCH',s1,s2);
 // mobile
 const m=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});m.on('pageerror',e=>errs.push('M '+e.message));
 await m.goto(base);await m.waitForSelector('#loading.hidden',{state:'attached',timeout:30000});
 console.log('mobile scrollW',await m.evaluate(()=>document.documentElement.scrollWidth));
 console.log('ERRORS',errs.length,errs.slice(0,5));await b.close();
})();
