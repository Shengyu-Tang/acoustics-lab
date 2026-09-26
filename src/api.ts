export type Session={signedIn:boolean,isAdmin:boolean,isOwner:boolean,name:string,userId?:string};
let apiBase='';
export async function configure(){try{const r=await fetch('./config.json',{cache:'no-store'});if(r.ok){const cfg=await r.json();const candidate=String(cfg.apiBase||'').replace(/\/$/,'');if(candidate&&!/^https:\/\//.test(candidate))throw new Error('服务地址必须为 HTTPS');apiBase=candidate;}}catch{apiBase='';}}
export function available(){return !!apiBase||location.hostname==='127.0.0.1'||location.hostname==='localhost'}
export function apiUrl(path:string){return apiBase+path}
export function token(){return sessionStorage.getItem('acoustics-session')||''}
export function saveToken(value:string){sessionStorage.setItem('acoustics-session',value)}
export function clearToken(){sessionStorage.removeItem('acoustics-session')}
export async function api(path:string,options:RequestInit={}){if(!available())throw new Error('账号与讨论服务尚未接入。课程实验和知识导图可正常使用。');const headers=new Headers(options.headers);headers.set('Content-Type','application/json');if(token())headers.set('Authorization','Bearer '+token());const response=await fetch(apiUrl(path),{...options,headers,credentials:'omit',cache:'no-store'});let data;try{data=await response.json()}catch{throw new Error('服务暂不可用，请稍后再试。')}if(!response.ok)throw new Error(data.error||'请求未完成');return data;}
export async function logout(){try{await api('/api/auth/logout',{method:'POST',body:'{}'})}finally{clearToken();location.hash='/account'}}
export async function githubLogin(){if(!available())throw new Error('管理员登录服务尚未接入。');const bytes=crypto.getRandomValues(new Uint8Array(32));const verifier=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');sessionStorage.setItem('github-verifier',verifier);const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));const challenge=btoa(String.fromCharCode(...digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');location.assign(apiUrl('/api/auth/github?challenge='+challenge));}
