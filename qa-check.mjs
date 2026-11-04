import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const html=await fs.readFile('dist/index.html','utf8');
const dom=new JSDOM(html,{url:'https://static-test.example/terra-chronicles/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document,errors=[];
w.addEventListener('error',e=>errors.push(e.error?.stack||e.message));
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
for(const name of [...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]))w.eval(await fs.readFile('dist/'+name,'utf8'));
function go(hash){w.location.hash=hash;w.dispatchEvent(new w.HashChangeEvent('hashchange'));}
function click(selector){const e=doc.querySelector(selector);assert.ok(e,'Missing control: '+selector);e.click();}
function input(selector,value){const e=doc.querySelector(selector);assert.ok(e);e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}));}
const checked=[];const pass=t=>checked.push(t);
assert.match(doc.querySelector('h1').textContent,/泰拉地区纪事/);assert.equal(w.OPERATORS.length,438);assert.equal(w.SUPPORT_UNITS.length,29);assert.ok(w.OPERATORS.every(p=>p.summary&&p.title&&p.focus),'Unfinished character stories');pass('homepage and complete authored roster');
const expected=JSON.parse(await fs.readFile('checks/expected-roster.json','utf8'));assert.deepEqual(Array.from(w.OPERATORS,p=>p.id).sort(),expected);pass('operator roster matches all obtainable-marked character records');
const columbia=w.TERRA.stories.find(s=>s.id==='columbia-stars');
go('/atlas');assert.equal(doc.querySelectorAll('.catalogue-row').length,23);input('#filter-query',columbia.title);assert.equal(doc.querySelectorAll('.catalogue-row').length,1);assert.match(doc.querySelector('.catalogue-row').textContent,/哥伦比亚/);input('#filter-query','没有这一篇故事');click('[data-action="reset-filters"]');assert.equal(doc.querySelectorAll('.catalogue-row').length,23);pass('story search, empty state and filter reset');
go('/atlas/kjerag');assert.equal(doc.querySelectorAll('.catalogue-row').length,1);assert.match(doc.querySelector('#region-overview').textContent,/谢拉格/);pass('region deep link');
go('/story/columbia-stars');assert.ok(doc.querySelector('.spoiler-gate'));assert.equal(doc.querySelectorAll('.chapter-section').length,0);click('[data-action="enable-full"]');assert.equal(doc.querySelectorAll('.region-period').length,columbia.chronicle.periods.length);assert.match(doc.querySelector('.book').textContent,/克丽斯腾/);click('[data-action="favorite"]');assert.match(doc.querySelector('[data-action="favorite"]').textContent,/已收藏/);click('[data-action="mark-done"]');pass('spoiler gate, full chapter, favorite and read marker');
go('/shelf');assert.ok(doc.querySelectorAll('.catalogue-row').length>=2);assert.ok(doc.querySelector('main').textContent.includes(columbia.title));pass('shelf persists story state');
go('/people');assert.equal(doc.querySelectorAll('.person-card').length,60);assert.match(doc.querySelector('#result-count').textContent,/438/);input('#filter-query','塔露拉');assert.ok(doc.querySelectorAll('.person-card').length>=1);assert.match(doc.querySelector('#people-results').textContent,/塔露拉/);input('#filter-query','');click('[data-roster-page="2"]');assert.match(doc.querySelector('#result-count').textContent,/第 2/);click('[data-roster-kind="npc"]');assert.equal(doc.querySelectorAll('.person-card').length,60);assert.match(doc.querySelector('#result-count').textContent,/65/);pass('full roster pagination, search and NPC category');
click('[data-action="search"]');assert.ok(doc.querySelector('#search-dialog').open);input('#global-search','塔露拉');assert.ok(doc.querySelector('#search-results a[href*="character/"]'));click('[data-action="close-search"]');pass('global search finds character stories');
go('/character/char_502_nblade');assert.match(doc.querySelector('h1').textContent,/夜刀/);assert.ok(doc.querySelector('a[href*="char_1029_yato2"]'));assert.ok(doc.querySelector('.chapter-section p').textContent.length>85);click('[data-action="larger"]');assert.equal(doc.documentElement.style.getPropertyValue('--reading-size'),'19px');pass('individual story, alternate form links and font controls');
for(const p of w.ROSTER_RENDER.all){go('/character/'+p.id);assert.equal(doc.querySelector('h1')?.textContent,p.name);assert.ok(doc.querySelector('.source-details a'),'Missing source: '+p.id);assert.ok(doc.querySelector('.chapter-section p')?.textContent.length>30,'Missing narrative: '+p.id);}
pass('all '+w.ROSTER_RENDER.all.length+' individual character and support pages render');

const bios=w.PERSON_BIOGRAPHIES;assert.equal(bios.meta.operatorPeople,400);assert.equal(bios.meta.npcPeople,65);
for(const p of [...w.OPERATORS,...w.NPC_INDEX]){
 const b=w.BIOGRAPHY_UI.get(p.id);assert.ok(b,'Missing biography '+p.name);assert.ok(b.periods.length>=2);assert.ok(b.lead&&b.chronologyNote&&b.sources.length);
 go('/character/'+p.id);assert.equal(doc.querySelectorAll('.life-period').length,b.periods.length);assert.ok(doc.querySelector('#life-relations'));assert.ok(doc.querySelector('#life-evidence a'));assert.equal(doc.querySelectorAll('.biography-toc [data-anchor]').length,b.periods.length+2+(w.PROFILE_UI.get(p.id)?1:0));
 for(const a of doc.querySelectorAll('.biography-toc [data-anchor],.biography-mobile-toc [data-anchor]'))assert.ok(doc.getElementById(a.dataset.anchor),'Broken contents '+p.name);
 for(const f of p.forms||[])if(!f.patch&&w.BIOGRAPHY_UI.get(f.id))assert.equal(w.BIOGRAPHY_UI.get(f.id).personId,b.personId,'Alternate identity '+p.name);
}
pass('400 canonical operator biographies and 65 NPC biographies have stages, relations, sources and working contents');
go('/character/char_002_amiya');assert.ok(doc.querySelectorAll('.life-period').length>=8);assert.match(doc.querySelector('.life-timeline').textContent,/切尔诺伯格/);assert.match(doc.querySelector('.life-timeline').textContent,/相变临界/);assert.match(doc.querySelector('#life-0 .biography-evidence a').href,/act33side.*st03/);click('[data-action="toggle-full"]');assert.equal(doc.querySelectorAll('.life-period,.biography-toc,.biography-mobile-toc').length,0);assert.ok(!doc.querySelector('.record-layout.with-biography'));click('[data-roster-enable]');assert.ok(doc.querySelector('.life-period'));pass('long chronology, exact cited scene links and spoiler mode');
go('/people');click('[data-roster-kind="operator"]');input('#filter-query','纳斯尔纱');assert.match(doc.querySelector('#people-results').textContent,/死芒/);pass('character search includes events inside expanded biographies');
go('/sources');assert.match(doc.querySelector('main').textContent,/未获得设定集全文/);assert.match(doc.querySelector('main').textContent,/438/);assert.ok(doc.querySelector('a[href="roster-meta.json"]'));pass('source transparency and snapshot provenance');
go('/routes');assert.equal(doc.querySelectorAll('.route-card').length,5);for(const a of doc.querySelectorAll('a[href^="#/story/"]'))assert.ok(w.TERRA.stories.some(s=>a.hash.endsWith(s.id)));pass('reading routes resolve');
assert.equal(w.REGIONAL_CHRONICLES.meta.stories,23);assert.equal(w.REGIONAL_CHRONICLES.meta.regions,22);assert.ok(w.REGIONAL_CHRONICLES.meta.periods>=170);assert.ok(w.REGIONAL_CHRONICLES.meta.characters>45000);
for(const s of w.TERRA.stories){
 assert.ok(s.chronicle,'Missing regional narrative '+s.id);go('/story/'+s.id);assert.equal(doc.querySelectorAll('.region-period').length,s.chronicle.periods.length);
 assert.ok(doc.querySelectorAll('.inline-person').length>0,'Missing inline character links '+s.id);
 assert.ok(doc.querySelectorAll('.regional-cast-card[href]').length>=4,'Missing linked cast '+s.id);
 for(const a of doc.querySelectorAll('.event-person[href],.regional-cast-card[href],.inline-person'))assert.ok(w.ROSTER_RENDER.index.has(a.hash.split('/')[2]),'Broken character link '+a.href);
 for(const a of doc.querySelectorAll('.region-mobile-toc [data-anchor],.reader-left [data-anchor]'))assert.ok(doc.getElementById(a.dataset.anchor),'Broken regional contents '+s.id);
 for(const p of s.chronicle.periods)assert.ok(p.refs.length&&p.refs.every(r=>r.label&&/^https:/.test(r.url)),'Missing phase evidence '+s.id);
 for(const n of s.people){const p=w.ROSTER_RENDER.byName(n[0]);if(!p)continue;go('/character/'+p.id);assert.ok(doc.querySelector(`.regional-backlinks a[href="#/story/${s.id}"]`),'Missing reciprocal link '+s.id+' '+n[0]);}
}
go('/story/the-ship');click('[data-action="toggle-full"]');assert.equal(doc.querySelectorAll('.region-period,.region-mobile-toc,.reader-left a[href^="#part-"]').length,0);click('[data-action="enable-full"]');pass('23 detailed regional chronologies, stage citations, inline people and reciprocal event links');

assert.equal(w.CHARACTER_ART.meta.operatorRecordsWithArt,438);assert.equal(w.CHARACTER_ART.meta.npcRecordsWithArt,63);assert.equal(w.CHARACTER_ART.meta.supportRecordsWithArt,29);
for(const p of w.OPERATORS)assert.ok(w.ART_UI.get(p).length,'Missing operator art '+p.name);
for(const arts of Object.values(w.CHARACTER_ART.records))for(const a of arts){assert.ok((await fs.stat('dist/'+a.src)).size>200);assert.ok((await fs.stat('dist/'+a.thumb)).size>100);}
go('/character/char_002_amiya');const firstArt=doc.querySelector('.art-zoom img').getAttribute('src');click('.art-variants button:nth-child(2)');assert.notEqual(doc.querySelector('.art-zoom img').getAttribute('src'),firstArt);click('[data-open-art]');assert.ok(doc.querySelector('#art-dialog').open);click('.art-dialog-close');assert.ok(!doc.querySelector('#art-dialog').open);
go('/character/npc-twins');assert.match(doc.querySelector('.art-variants').textContent,/伊维格娜德.*赫琳玛特/);go('/character/npc-friston');assert.ok(doc.querySelector('.art-missing'));pass('all operator and verified NPC illustrations, local assets, art variants and large view');

go('/map/yan');assert.equal(doc.querySelectorAll('[data-map-region]').length,22);assert.equal(doc.querySelectorAll('[data-map-story]').length,2);click('[data-map-story="the-grain"]');const grain=w.TERRA.stories.find(s=>s.id==='the-grain');assert.equal(doc.querySelectorAll('[data-map-phase]').length,grain.chronicle.periods.length);click('[data-map-phase="2"]');assert.equal(doc.querySelector('.map-read-event').hash,'#/story/the-grain/part-2');click('[data-map-zoom="in"]');assert.equal(doc.querySelector('#map-scale').textContent,'125%');click('[data-map-zoom="reset"]');assert.equal(doc.querySelector('#map-scale').textContent,'100%');
click('[data-map-region="rhodes"]');assert.match(doc.querySelector('.map-panel-head h2').textContent,/罗德岛/);assert.equal(doc.querySelector('#map-region-select').value,'rhodes');
click('.map-topbar [data-action="toggle-full"]');assert.equal(doc.querySelectorAll('[data-map-phase]').length,0);assert.ok(doc.querySelector('.map-spoiler-note'));click('[data-action="enable-full"]');assert.ok(doc.querySelectorAll('[data-map-phase]').length>=8);pass('interactive map selection, multi-story regions, timeline navigation, zoom and spoiler gate');

assert.ok(w.STORY_ART.meta.cg>=300);assert.equal(w.STORY_ART.meta.storiesWithCG,23);assert.ok(w.STORY_ART.meta.nativeResolutionPreserved);
let figureCount=0;
for(const story of w.TERRA.stories){
 go('/story/'+story.id);const list=w.STORY_ART.byStory[story.id];assert.ok(list.length>0);assert.ok(doc.querySelector('#story-cg-gallery'));assert.equal(doc.querySelectorAll('.cg-gallery-card').length,Math.min(12,list.length));
 assert.equal(doc.querySelectorAll('.event-figure').length,story.chronicle.periods.reduce((n,p)=>n+(p.illustrations||[]).length,0));
 for(const [phase,p]of story.chronicle.periods.entries())for(const u of p.illustrations||[]){const a=w.STORY_ART.assets[u.key.toLowerCase()];assert.ok(a&&w.STORY_ART.scenes[u.sceneId]);assert.ok(p.refs.some(r=>r.url===w.STORY_ART.scenes[u.sceneId].url));figureCount++;}
 for(const u of list){assert.ok(w.STORY_ART.assets[u.key.toLowerCase()]);assert.ok(story.chronicle.periods[u.phase]);}
}
assert.equal(figureCount,w.STORY_ART.meta.bodyFigures);assert.ok(figureCount>=30);assert.ok(w.REGIONAL_CHRONICLES.meta.expandedPeriods>=26);
for(const a of Object.values(w.STORY_ART.assets)){assert.ok((await fs.stat('dist/'+a.src)).size>200);assert.ok((await fs.stat('dist/'+a.thumb)).size>100);assert.match(a.sourceImage,/raw.githubusercontent.com.*\.png$/);assert.ok(a.width>=1000);}
go('/story/the-ship');click('#story-cg-gallery summary');assert.ok(doc.querySelector('#story-cg-gallery').open);click('[data-cg-more]');assert.equal(doc.querySelectorAll('.cg-gallery-card').length,24);assert.ok(doc.querySelector('#story-cg-gallery').open);
click('.cg-gallery-card button');assert.ok(doc.querySelector('#story-cg-dialog').open);const firstCG=doc.querySelector('.cg-dialog-stage img').src;click('[data-cg-direction="1"]');assert.notEqual(doc.querySelector('.cg-dialog-stage img').src,firstCG);doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert.equal(doc.querySelector('.cg-dialog-stage img').src,firstCG);assert.match(doc.querySelector('.cg-dialog-caption').textContent,/原始 PNG/);click('.cg-dialog-close');assert.ok(!doc.querySelector('#story-cg-dialog').open);
click('[data-action="toggle-full"]');assert.equal(doc.querySelectorAll('.event-figure,.story-cg-gallery,.reader-left a[href="#story-cg-gallery"]').length,0);click('[data-action="enable-full"]');
go('/map/rhodes');assert.ok(doc.querySelector('.map-cg-preview'));click('.map-topbar [data-action="toggle-full"]');assert.equal(doc.querySelectorAll('.map-cg-preview').length,0);click('[data-action="enable-full"]');
pass('expanded event processes, all chapter CG galleries, native-resolution assets, exact scene citations, large image navigation and spoiler protection');


assert.equal(w.OPERATOR_PROFILES.meta.records,438);assert.equal(w.OPERATOR_PROFILES.meta.artsSummaries,438);
const ifrit=w.PROFILE_UI.get('char_134_ifrit').options[0];assert.equal(ifrit.basic.find(x=>x.label==='身高').value,'159cm');assert.equal(ifrit.basic.find(x=>x.label==='种族').value,'萨卡兹');
const gallus=w.PROFILE_UI.get('char_4227_gallus').options[0];assert.ok(!gallus.basic.find(x=>x.label==='年龄').value.includes('机械'));assert.ok(gallus.extras.some(x=>x.label==='出厂时间'&&x.value==='十五年'));
for(const p of w.OPERATORS){const r=w.PROFILE_UI.get(p.id);assert.ok(r&&r.options.length);go('/character/'+p.id);assert.ok(doc.querySelector('#operator-dossier'));for(const o of r.options){assert.ok(o.basic.some(f=>f.label==='年龄'));assert.ok(o.arts?.summary&&o.arts.refs.length);assert.match(o.source.url,/handbook_info_table\.json$/);}}
go('/character/char_002_amiya');assert.equal(doc.querySelectorAll('[data-profile-variant] option').length,3);assert.match(doc.querySelector('.dossier-facts').textContent,/142cm/);const version=doc.querySelector('[data-profile-variant]');version.value='2';version.dispatchEvent(new w.Event('change',{bubbles:true}));assert.match(doc.querySelector('.dossier-facts').textContent,/150cm/);assert.match(doc.querySelector('.dossier-facts').textContent,/医疗/);assert.match(doc.querySelector('.dossier-facts').textContent,/年龄未公开/);
click('[data-action="toggle-full"]');assert.equal(doc.querySelectorAll('#operator-dossier').length,0);assert.ok(doc.querySelector('.dossier-preview'));click('[data-roster-enable]');assert.ok(doc.querySelector('#operator-dossier'));
go('/people');click('[data-roster-kind="operator"]');input('#filter-query','卡特斯');assert.match(doc.querySelector('#people-results').textContent,/阿米娅/);
go('/character/npc-kristen');assert.equal(doc.querySelectorAll('#operator-dossier').length,0);
pass('438 game-sourced operator dossiers, complete arts notes, unknown age handling, Amiya form-specific fields, search and spoiler gate');


assert.equal(w.REGIONAL_ORIGINS.meta.regions,22);assert.ok(w.REGIONAL_ORIGINS.meta.periods>=90);
for(const story of w.TERRA.stories){go('/story/'+story.id);const history=w.ORIGIN_UI.periods(story);assert.ok(history.length>=3,'Missing early history '+story.id);assert.equal(doc.querySelectorAll('.origin-period').length,history.length);assert.equal(doc.querySelector('.book-intro').textContent,story.origins.intro);assert.equal(doc.querySelector('.chapter-section').id,w.ORIGIN_UI.anchor(history[0]));for(const p of history){const el=doc.getElementById(w.ORIGIN_UI.anchor(p));assert.ok(el&&el.querySelectorAll('p').length>=2,'History paragraphs '+story.id+' '+p.id);assert.ok(el.querySelectorAll('.biography-evidence a').length>=1);}assert.equal(doc.querySelectorAll('.regional-timeline>.region-period').length,w.ORIGIN_UI.visible(story).length);for(const a of doc.querySelectorAll('.region-mobile-toc [data-anchor],.reader-left [data-anchor]'))assert.ok(doc.getElementById(a.dataset.anchor),'Broken history contents '+story.id);}
go('/story/nearl-light');const early=doc.querySelector('.regional-origins').textContent;assert.match(early,/神民统治/);assert.match(early,/骑士团制度/);assert.match(early,/一百二十年前/);assert.match(early,/拍卖/);assert.match(early,/商业联合会/);assert.ok(doc.querySelector('.regional-origins').compareDocumentPosition(doc.querySelector('.regional-timeline'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
go('/story/minos-heroes/part-1');await new Promise(r=>setTimeout(r,35));assert.ok(doc.querySelector('#history-supplements').open,'Legacy phase link expands historical supplement');
go('/atlas/kazimierz');assert.ok(doc.querySelector('.region-origin-overview a[href*="history-"]'));input('#filter-query','扈从购堡');assert.equal(doc.querySelectorAll('.catalogue-row').length,1);
go('/map/kazimierz');assert.match(doc.querySelector('.map-history-entry').hash,/history-pegasian-rule/);
go('/story/nearl-light');click('[data-action="toggle-full"]');assert.equal(doc.querySelectorAll('.origin-period,.region-period,.reader-left [data-anchor^="history-"]').length,0);click('[data-action="enable-full"]');
pass('22 sourced regional origin histories, foundations before modern episodes, precise chronology, searchable historical text, stable legacy links and spoiler gate');

assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'passed',checks:checked,regions:w.TERRA.regions.length,stories:w.TERRA.stories.length,operators:w.OPERATORS.length,npcs:w.NPC_INDEX.length,support:w.SUPPORT_UNITS.length},null,2));
dom.window.close();
