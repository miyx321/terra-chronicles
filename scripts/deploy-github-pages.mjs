import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const owner='miyx321',repo=process.argv.find(x=>x.startsWith('--repo='))?.slice(7)||'terra-chronicles';
if(!/^[A-Za-z0-9_.-]{1,100}$/.test(repo))throw Error('Invalid repository name');
const target=owner+'/'+repo,remote='https://github.com/'+target+'.git';
const stateFile=path.join(root,'.runtime','github-deployment.json');
let token='';
function command(args,{allowFailure=false}={}){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});if(r.status!==0&&!allowFailure)throw Error('git '+args[0]+' failed: '+(r.stderr||r.error?.message||'').slice(-1600));return r;}
async function api(route,{method='GET',body,allow=[]}={}){const response=await fetch('https://api.github.com/'+route,{method,headers:{'User-Agent':'Terra-Chronicles-Pages-Migration','Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','Authorization':'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(90000)});const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={message:'Unexpected GitHub response'};}if(!response.ok&&!allow.includes(response.status))throw Error('GitHub '+method+' '+route+' returned '+response.status+': '+data.message);return {status:response.status,data};}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function saveState(data){fs.mkdirSync(path.dirname(stateFile),{recursive:true});fs.writeFileSync(stateFile,JSON.stringify(data,null,2));}

try{
 const credential=spawnSync('git',['credential','fill'],{cwd:root,encoding:'utf8',input:'protocol=https\nhost=github.com\nusername='+owner+'\n\n',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});
 const pairs=Object.fromEntries((credential.stdout||'').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)];}));
 token=pairs.password||'';if(credential.status!==0||!token)throw Error('GitHub authentication is required for '+owner+'. Run git credential-manager github login --username '+owner+' --device --no-ui.');
 const user=(await api('user')).data;if(user.login.toLowerCase()!==owner.toLowerCase())throw Error('Authenticated account '+user.login+' does not match '+owner);
 const repository=await api('repos/'+target,{allow:[404]});
 if(process.argv.includes('--check-auth')){console.log(JSON.stringify({authenticatedUser:user.login,repository:target,repositoryExists:repository.status===200,repositorySizeKiB:repository.data.size}));process.exit(0);}
 if(!process.argv.includes('--deploy'))throw Error('Use --check-auth or --deploy.');
 const checked=spawnSync(process.execPath,['scripts/check-static.mjs'],{cwd:root,encoding:'utf8'});if(checked.status!==0)throw Error(checked.stderr||checked.stdout);console.log(checked.stdout.trim());
 let localGit=fs.existsSync(path.join(root,'.git'));
 if(repository.status===200&&!localGit){const refs=await api('repos/'+target+'/git/matching-refs/heads/',{allow:[409]});if(refs.status!==409&&refs.data.length)throw Error('Target repository already contains commits. It has not been changed. Choose a new name with --repo=NEW_NAME.');}
 if(repository.status===404){await api('user/repos',{method:'POST',body:{name:repo,description:'泰拉行纪：明日方舟地区历史、人物纪事、干员档案与高清剧情图册。',private:false,auto_init:false}});console.log('Created public repository '+target);}
 if(!localGit){command(['init','-b','main']);localGit=true;command(['remote','add','origin',remote]);}
 const configured=command(['remote','get-url','origin']).stdout.trim();if(configured.toLowerCase()!==remote.toLowerCase())throw Error('Local origin does not match the selected GitHub repository.');
 const commit=message=>command(['-c','user.name='+user.login,'-c','user.email='+user.id+'+'+user.login+'@users.noreply.github.com','commit','--quiet','-m',message]);
 const push=()=>command(['-c','credential.username='+owner,'push','--quiet','-u','origin','main']);
 const hasHead=command(['rev-parse','--verify','HEAD'],{allowFailure:true}).status===0;
 if(!hasHead){command(['add','README.md','.gitignore','.terra-export.json']);commit('Initialize standalone Terra Chronicles repository');push();console.log('Initialized main branch');}
 else {command(['fetch','--quiet','origin','main']);if(command(['merge-base','--is-ancestor','origin/main','HEAD'],{allowFailure:true}).status!==0)throw Error('Remote history has advanced; reconcile it before deploying.');if(command(['rev-parse','HEAD']).stdout.trim()!==command(['rev-parse','origin/main']).stdout.trim())push();}
 await api('repos/'+target,{method:'PATCH',body:{default_branch:'main'}});
 const pages=await api('repos/'+target+'/pages',{allow:[404]});
 if(pages.status===404){await api('repos/'+target+'/pages',{method:'POST',body:{build_type:'workflow'}});console.log('Enabled GitHub Pages with GitHub Actions');}
 else if(pages.data.build_type!=='workflow'){await api('repos/'+target+'/pages',{method:'PUT',body:{build_type:'workflow'}});}
 // Upload new media in bounded commits. The workflow is added after the assets,
 // so its first run sees the complete site rather than a partial upload.
 const tracked=new Set(command(['ls-files','-z','dist/assets']).stdout.split('\0').filter(Boolean));
 const media=[];function collect(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())collect(p);else if(!tracked.has(p))media.push(p);}}collect('dist/assets');
 const workflowTracked=command(['ls-files','--error-unmatch','.github/workflows/pages.yml'],{allowFailure:true}).status===0;
 if(media.length&&!workflowTracked){const appFiles=fs.readdirSync(path.join(root,'dist'),{withFileTypes:true}).filter(e=>e.isFile()).map(e=>'dist/'+e.name);command(['add','--',...appFiles]);if(command(['diff','--cached','--quiet'],{allowFailure:true}).status===1){commit('Add static application and story data');push();}
  const batches=[];let batch=[],bytes=0;for(const file of media){const n=fs.statSync(path.join(root,file)).size;if(bytes+n>40*1024*1024&&batch.length){batches.push(batch);batch=[];bytes=0;}batch.push(file);bytes+=n;}if(batch.length)batches.push(batch);
  fs.mkdirSync(path.join(root,'.runtime'),{recursive:true});for(let i=0;i<batches.length;i++){const spec=path.join(root,'.runtime','asset-paths.bin');fs.writeFileSync(spec,batches[i].join('\0')+'\0');command(['add','--pathspec-from-file='+spec,'--pathspec-file-nul']);commit('Add website media batch '+(i+1)+' of '+batches.length);console.log('Uploading media batch '+(i+1)+' / '+batches.length);push();}
 }
 command(['add','--all']);if(command(['diff','--cached','--quiet'],{allowFailure:true}).status===1)commit('Update Terra Chronicles content and Pages configuration');
 const sha=command(['rev-parse','HEAD']).stdout.trim();
 console.log('Uploading website assets to '+target+' ...');push();console.log('Source uploaded: '+sha);
 saveState({repository:target,commit:sha,status:'source-uploaded'});
 let run,lastStatus='';const deadline=Date.now()+15*60*1000;
 while(Date.now()<deadline){const list=(await api('repos/'+target+'/actions/workflows/pages.yml/runs?head_sha='+sha+'&per_page=5',{allow:[404]})).data;run=list.workflow_runs?.[0];if(run){const status=run.status+(run.conclusion?':'+run.conclusion:'');if(status!==lastStatus){console.log('GitHub Actions '+status+' '+run.html_url);lastStatus=status;}if(run.status==='completed')break;}await sleep(5000);}
 if(!run||run.status!=='completed')throw Error('Deployment is still pending. Inspect the repository Actions page.');
 saveState({repository:target,commit:sha,runId:run.id,runUrl:run.html_url,status:run.conclusion});
 if(run.conclusion!=='success')throw Error('GitHub Pages deployment failed: '+run.html_url);
 const result=(await api('repos/'+target+'/pages')).data;
 const response=await fetch(result.html_url,{signal:AbortSignal.timeout(90000)});const html=await response.text();if(response.status!==200||!html.includes('泰拉行纪'))throw Error('Workflow passed, but the published homepage is not yet verifiable at '+result.html_url);
 await api('repos/'+target,{method:'PATCH',body:{homepage:result.html_url}});
 const final={status:'deployed',repository:target,url:result.html_url,commit:sha,runUrl:run.html_url};saveState(final);console.log(JSON.stringify(final));
}catch(error){console.error(String(error.message||error).split(token||'__no_token__').join('[redacted]'));process.exitCode=1;}finally{token='';}
