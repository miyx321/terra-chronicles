export async function verifyJourney({w,doc,go,click,input,assert}){
 const citations=new Set(w.JOURNEY_REFERENCE.chapters.map(c=>c.id));
 assert.equal(w.JOURNEY_REFERENCE.meta.regions,22);
 assert.equal(w.JOURNEY_REFERENCE.meta.personNotes,20);
 for(const region of Object.values(w.REGIONAL_ORIGINS.regions))assert.ok(region.periods.some(p=>p.refs.some(r=>r.evidence==='journey')),'Missing book material '+region.id);
 for(const r of w.TERRA.regions){const story=w.TERRA.stories.find(s=>s.region===r.id);go('/story/'+story.id);assert.ok(doc.querySelector('.origin-period'));for(const a of doc.querySelectorAll('.origin-period a[href^="#/sources/reference/"]'))assert.ok(citations.has(a.hash.split('/').at(-1)),'Broken source reference '+a.href);}
 const rim=w.REGIONAL_ORIGINS.regions.rim;
 assert.match(rim.periods.slice(0,3).map(p=>p.body).join(' '),/屯堡/);
 assert.match(rim.periods.slice(0,3).map(p=>p.body).join(' '),/移民/);
 assert.match(w.REGIONAL_ORIGINS.regions.kazimierz.periods[0].body,/天马/);
 assert.match(w.REGIONAL_ORIGINS.regions.kazimierz.periods[1].body,/梦魔/);
 assert.match(w.REGIONAL_ORIGINS.regions.kazimierz.periods[1].body,/监正会/);
 go('/sources/reference/journey-kazimierz');await new Promise(r=>setTimeout(r,35));
 for(const c of w.JOURNEY_REFERENCE.chapters)assert.equal(doc.querySelectorAll('[id="'+c.id+'"]').length,1,'Source anchor uniqueness '+c.id);
 assert.ok(doc.getElementById('journey-kazimierz').open,'Book citation opens chapter details');
 for(const note of w.JOURNEY_REFERENCE.personNotes){const p=w.ROSTER_RENDER.index.get(note.personId);assert.ok(p,'Missing supplement subject '+note.name);go('/character/'+p.id);assert.match(doc.querySelector('#life-journey').textContent,new RegExp(note.title));assert.ok(doc.querySelector('.biography-toc [data-anchor="life-journey"]'));assert.ok(doc.querySelector('#life-journey a[href^="#/sources/reference/"]'));}
 go('/character/char_002_amiya');assert.ok(doc.querySelector('.journey-race-links a[href^="#/races/"]'),'Dossier to race link');
 const races=w.TERRA_RACES.entries;assert.equal(races.length,32);
 go('/races');assert.equal(doc.querySelectorAll('.race-card').length,32);
 input('#race-query','萨卡兹');assert.ok(doc.querySelector('.race-card[href="#/races/sarkaz"]'));
 input('#race-query','完全不存在的种族条目');assert.equal(doc.querySelectorAll('.race-card').length,0);click('[data-race-reset]');assert.equal(doc.querySelectorAll('.race-card').length,32);
 const filter=doc.getElementById('race-region');filter.value='iberia';filter.dispatchEvent(new w.Event('change',{bubbles:true}));assert.ok(doc.querySelectorAll('.race-card').length>0);filter.value='all';filter.dispatchEvent(new w.Event('change',{bubbles:true}));
 for(const race of races){go('/races/'+race.id);assert.equal(doc.querySelector('h1').textContent,race.name+'纪事');assert.equal(doc.querySelectorAll('.race-section').length,race.sections.length);assert.ok(doc.querySelector('.race-section .biography-evidence a'));for(const a of doc.querySelectorAll('.race-person'))assert.ok(w.ROSTER_RENDER.index.has(a.hash.split('/')[2]),'Missing race character '+a.href);const linked=w.RACES_UI.people(race);const ids=linked.map(x=>x.p.id);assert.equal(new Set(ids).size,ids.length,'Duplicate alternate form in race page '+race.id);for(const row of linked)for(const value of row.races)assert.ok(race.profileNames.includes(value),'Inferred race '+race.id+'/'+value);}
 const large=races.find(r=>w.RACES_UI.people(r).length>24);assert.ok(large);go('/races/'+large.id);assert.equal(doc.querySelectorAll('.race-person').length,24);click('[data-race-more]');assert.equal(doc.querySelectorAll('.race-person').length,Math.min(48,w.RACES_UI.people(large).length));
 click('.reading-tools [data-action="toggle-full"]');assert.equal(doc.querySelectorAll('.race-section').length,0);click('.spoiler-gate [data-action="toggle-full"]');assert.ok(doc.querySelector('.race-section'));
 click('[data-action="search"]');input('#global-search','埃拉菲亚');assert.ok(doc.querySelector('#search-results a[href^="#/races/"]'));click('[data-action="close-search"]');
 assert.equal(w.TERRA_MAPS.default,'clear');go('/map/yan');assert.equal(doc.getElementById('map-stage').dataset.mapMode,'clear');assert.match(doc.querySelector('.map-disclaimer').textContent,/社区参考图/);assert.equal(doc.querySelector('.map-reference-image').getAttribute('width'),'4081');
 click('[data-map-phase="2"]');const event=doc.querySelector('.map-read-event').hash;
 click('[data-map-fullscreen]');click('[data-map-source="original"]');assert.equal(doc.getElementById('map-stage').dataset.mapMode,'original');assert.ok(doc.querySelector('.map-console.is-expanded'));assert.equal(doc.querySelector('.map-read-event').hash,event);assert.equal(doc.querySelectorAll('[data-map-region]').length,22);assert.match(doc.querySelector('.map-disclaimer').textContent,/原生迷雾/);
 click('[data-map-source="clear"]');assert.equal(doc.querySelectorAll('[data-map-region]').length,22);assert.ok(doc.querySelector('.map-console.is-expanded'));click('[data-map-fullscreen]');
 const image=doc.querySelector('.map-reference-image'),ref=w.TERRA_MAPS.maps.clear;
 for(const [id,position]of Object.entries(ref.positions)){if(!position)continue;const node=doc.querySelector('.map-node[data-map-region="'+id+'"]');assert.ok(node,id);assert.ok(Math.abs(parseFloat(node.style.left)-(30+position[0]*1140))<.01);assert.ok(Math.abs(parseFloat(node.style.top)-(parseFloat(image.style.top)+position[1]*parseFloat(image.style.height)))<.01);}
 go('/atlas');go('/map/yan');assert.equal(doc.getElementById('map-stage').dataset.mapMode,'clear','Map source persists across routes');
 return '22 expanded regional histories, 20 sourced person supplements, 32 race features, evidence anchors, exact dossier links and independently calibrated map switching';
}
