const AP=(()=>{try{return new URL(document.currentScript.src).searchParams.get('app')}catch(e){return null}})();
(async()=>{try{
const D=document,L=location;
if(!/\/(Home\/Result|accueil\/resultat)/i.test(L.pathname)){alert('Open LAC results first');return}
const P=new URL(L.href).searchParams,N=parseInt(P.get('num'))||50,B=parseInt(P.get('start'))||0;
const pg=Math.min(10,parseInt(prompt('Pages to scan ('+N+' photos each, about 5 sec per photo)?','1'))||0);
if(!pg)return;
const ky=(prompt('Download only if Copyright starts with (comma separated)','expired')||'').toLowerCase().split(',').map(z=>z.trim()).filter(Boolean);
const bar=D.createElement('div');
bar.style.cssText='position:fixed;left:0;bottom:0;width:100vw;z-index:2147483647;background:white;color:black;padding:9px;font:13px sans-serif;white-space:pre-wrap;max-height:50vh;overflow:auto';
bar.id='lacbar';const o0=D.getElementById('lacbar');if(o0)o0.remove();D.body.appendChild(bar);
const fr=D.createElement('iframe');
fr.style.cssText='position:fixed;left:0;top:0;width:300px;height:300px;opacity:0.01;pointer-events:none';
D.body.appendChild(fr);
const say=t=>{bar.textContent=t},sl=ms=>new Promise(r=>setTimeout(r,ms)),nm=s=>String(s||'').replace(/\s+/g,' ').trim();
const g=(t,a,s)=>{const i=t.indexOf(a);if(i<0)return '';t=t.slice(i+a.length);let e=t.length;for(const x of s){const j=t.indexOf(x);if(j>=0&&j<e)e=j}return nm(t.slice(0,e)).slice(0,300)};
let bk=0,U=0;const blk=()=>{try{const d=fr.contentDocument;return /Forbidden|403|Security Check|Verification|robot/i.test(d.title+' '+d.body.textContent.slice(0,600))}catch(e){return false}};const op=async(u,ok)=>{await sl(1500);await Promise.race([new Promise(r=>{fr.onload=r;fr.src=u}),sl(15000)]);for(let k=0;k<30;k++){try{const d=fr.contentDocument;if(d&&d.body&&ok(d))return d}catch(e){}await sl(500)}return null};
const items=[],seen=new Set();
for(let p=0;p<pg;p++){
let s=D;
if(p){const u=new URL(L.href);u.searchParams.set('start',B+p*N);u.searchParams.set('num',N);say('Page '+(p+1)+'...');s=await op(u.href,d=>d.querySelector('li.CFCS-records-li'));if(!s){if(blk())bk=1;break}}
const l=[...s.querySelectorAll('li.CFCS-records-li')];
if(!l.length)break;
for(const li of l){const a=li.querySelector('a[href*=Record]');if(!a)continue;const u=new URL(a.getAttribute('href'),L.href),e=u.searchParams.get('ecopy');if(!e||seen.has(e))continue;seen.add(e);const q=li.querySelector('p');items.push([e,u.searchParams.get('IdNumber'),nm(q&&(q.getAttribute('title')||q.textContent)),u.href])}
if(l.length<N)break}
const V={},R={},rows=[['ecopy','item_id','title','status','credit','restrictions','copyright','record_url']],K=[0,0,0],got=[];
for(let i=0;i<items.length;i++){
const it=items[i];say('Record '+(i+1)+' of '+items.length+'\ncollected '+K[0]+' skipped '+K[1]+' failed '+K[2]);
let c='',x='',cr='',st='';
try{const d=await op(it[3],d=>/Copyright:|Item ID number/.test(d.body.textContent));if(!d&&blk()){bk=1;break}if(d){const b=d.body.cloneNode(true);b.querySelectorAll('script,style').forEach(n=>n.remove());const t=nm(b.textContent);cr=g(t,'Credit:',['Restrictions on use:','Copyright:','Show more']);x=g(t,'Restrictions on use:',['Copyright:','Show more']);c=g(t,'Copyright:',['Show more','To access this record']);if(!c)st='unreadable',K[1]++;else if(!ky.some(k=>c.toLowerCase().startsWith(k)))st='skipped',K[1]++;else{const r=await fetch('https://central.bac-lac.gc.ca/.item?op=img&id='+encodeURIComponent(it[0])+'&app=fondsandcol&lang=eng');if(!r.ok)throw 0;got.push({ecopy:it[0],idn:it[1],title:it[2],credit:cr,copyright:c,restrictions:x,recordUrl:it[3],blob:await r.blob()});st='saved';K[0]++}}else{st='unreadable';K[1]++}}catch(e){st='failed';K[2]++}
V[c||'(unreadable)']=(V[c||'(unreadable)']||0)+1;R[x||'(none)']=(R[x||'(none)']||0)+1;
rows.push([it[0],it[1],it[2],st,cr,x,c,it[3]]);
U=st=='unreadable'?U+1:0;if(U>=4){bk=2;break}await sl(2000+Math.random()*1000)}
fr.remove();
const f=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,10).map(e=>e[0].slice(0,50)+' ('+e[1]+')').join('; ');
const csv='﻿'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
const a=D.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='lac_photos.csv';D.body.appendChild(a);a.click();a.remove();
say('Done. collected '+K[0]+', skipped '+K[1]+', failed '+K[2]+'\nCopyright: '+f(V)+'\nRestrictions: '+f(R)+'\nCSV saved.'+(bk?'\nSTOPPED EARLY: LAC may be blocking requests. Wait a few hours before trying again.':''));
const mk=(t,fn)=>{const b=D.createElement('button');b.textContent=t;b.style.cssText='font-size:16px;padding:10px 14px;margin:8px 8px 0 0';b.onclick=fn;bar.appendChild(b)};
if(got.length){
if(AP)mk('Send '+got.length+' photos to the app',()=>{const O=new URL(AP).origin;const h=e=>{if(e.origin===O&&e.data&&e.data.type==='lac-ready'){removeEventListener('message',h);e.source.postMessage({type:'lac-items',items:got},O)}};addEventListener('message',h);if(!window.open(AP,'lacapp'))alert('Popup blocked. Allow popups for this site and tap again.')});
mk('Save as files',async()=>{for(const g of got){const a=D.createElement('a');a.href=URL.createObjectURL(g.blob);a.download=g.ecopy+'_'+g.title.replace(/[^a-z0-9]+/gi,'-').slice(0,50)+'.jpg';D.body.appendChild(a);a.click();a.remove();await sl(500)}})
}
}catch(e){alert('LAC error: '+(e&&e.message||e))}})();
