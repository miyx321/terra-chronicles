import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const base=new URL('https://static-test.example/terra-chronicles/');
const checkRef=ref=>{if(!ref||/^(?:#|https?:|data:|mailto:)/i.test(ref))return;const url=new URL(ref,base);assert.ok(url.pathname.startsWith(base.pathname),'Root-relative asset: '+ref);const relative=decodeURIComponent(url.pathname.slice(base.pathname.length));const file=path.resolve(dist,relative);assert.ok(file.startsWith(dist+path.sep),'Asset escapes root: '+ref);assert.ok(fs.statSync(file).isFile(),'Missing asset '+ref);};
for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g))checkRef(m[1]);
for(const name of fs.readdirSync(dist).filter(x=>x.endsWith('.css')))for(const m of fs.readFileSync(path.join(dist,name),'utf8').matchAll(/url\(\s*['"]?([^'"\)\s]+)['"]?\s*\)/g))checkRef(m[1]);
let bytes=0,files=0,maxFile=0;function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);assert.ok(!entry.isSymbolicLink(),'Symlink in static output');if(entry.isDirectory())visit(file);else{const size=fs.statSync(file).size;bytes+=size;files++;maxFile=Math.max(maxFile,size);}}}visit(dist);
assert.ok(bytes<1024**3,'GitHub Pages site exceeds 1 GiB');assert.ok(maxFile<100*1024**2,'GitHub file exceeds 100 MiB');
const c={window:{}};vm.createContext(c);for(const name of ['content','documentary','regions','regional-origins','operators','npcs','biographies','illustrations','story-art','operator-profiles','map-reference','races','journey-reference'])vm.runInContext(fs.readFileSync(path.join(dist,name+'.js'),'utf8'),c);
assert.equal(c.window.REGIONAL_ORIGINS.meta.regions,22);assert.equal(c.window.OPERATOR_PROFILES.meta.records,438);assert.equal(c.window.STORY_ART.meta.cg,320);
for(const rows of Object.values(c.window.CHARACTER_ART.records))for(const a of rows){checkRef(a.src);checkRef(a.thumb);}
for(const a of Object.values(c.window.STORY_ART.assets)){checkRef(a.src);checkRef(a.thumb);}
assert.equal(c.window.TERRA_RACES.entries.length,32);assert.equal(c.window.JOURNEY_REFERENCE.meta.regions,22);assert.equal(c.window.JOURNEY_REFERENCE.meta.personNotes,20);
assert.equal(c.window.TERRA_MAPS.default,'clear');
for(const map of Object.values(c.window.TERRA_MAPS.maps)){checkRef(map.src);for(const [id,point]of Object.entries(map.positions)){assert.ok(c.window.TERRA.regions.some(r=>r.id===id));if(point)assert.ok(point.length===2&&point.every(n=>Number.isFinite(n)&&n>=0&&n<=1));}}
const clear=c.window.TERRA_MAPS.maps.clear,png=fs.readFileSync(path.join(dist,clear.src));assert.equal(png.readUInt32BE(16),clear.width);assert.equal(png.readUInt32BE(20),clear.height);
assert.ok(!fs.existsSync(path.join(dist,'TERRA+A+JOURNEY.txt')),'Raw source book in public directory');
for(const name of fs.readdirSync(dist).filter(x=>/\.(?:html|js|css)$/.test(x))){const text=fs.readFileSync(path.join(dist,name),'utf8');assert.ok(!/chatgpt\.site|chatgpt\.com|appgprj_|OAI-Sites-Authorization/.test(text),'Hosting dependency in '+name);}
console.log(JSON.stringify({status:'passed',files,bytes,maxFile,projectSubdirectory:'/terra-chronicles/',operatorEntries:438,CGs:320}));
