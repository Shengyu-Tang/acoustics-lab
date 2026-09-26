'use client';
import {useEffect,useState} from 'react';
import {api} from './api';
import {Tabs,TabsList,TabsTrigger} from './ui';
import topics from './topics.json';
type Item={id:string,topic:string,nickname:string,body:string,status:string,created_at:number};
export default function Queue(){const [status,setStatus]=useState('pending'),[rows,setRows]=useState<Item[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(''),[loading,setLoading]=useState(false);
 async function load(){setLoading(true);setMessage('');try{const d=await api('/api/admin?status='+status);setRows(d.comments)}catch(e){setMessage((e as Error).message)}finally{setLoading(false)}}useEffect(()=>{void load()},[status]);
 async function review(id:string,next:string){setBusy(id);try{await api('/api/admin',{method:'POST',body:JSON.stringify({id,status:next})});await load();setMessage(next==='approved'?'评论已公开。':'评论已设为不公开。')}catch(e){setMessage((e as Error).message)}finally{setBusy('')}}
 return <section className="paper"><p>新评论默认为待审核。批准后才能在课程讨论区显示；已公开评论也可撤下。每次操作均保留审核记录。</p><Tabs value={status} onValueChange={setStatus}><TabsList><TabsTrigger value="pending">待审核</TabsTrigger><TabsTrigger value="approved">已公开</TabsTrigger><TabsTrigger value="rejected">未公开</TabsTrigger></TabsList></Tabs><button className="secondary" onClick={load}>刷新列表</button><p role="status">{loading?'正在加载…':message}</p>{!loading&&!rows.length&&!message&&<div className="empty">此队列暂无评论。</div>}{rows.map(c=><article className="review-card" key={c.id}><div className="discussion-heading"><strong>{c.nickname}</strong><time>{new Date(c.created_at).toLocaleString('zh-CN')}</time></div><a href={'#/lab?topic='+encodeURIComponent(c.topic)}>{c.topic} · {topics.find(t=>t.id===c.topic)?.title}</a><p>{c.body}</p><div className="review-actions">{c.status!=='approved'&&<button className="primary" disabled={!!busy} onClick={()=>review(c.id,'approved')}>批准并公开</button>}{c.status!=='rejected'&&<button className="secondary" disabled={!!busy} onClick={()=>review(c.id,'rejected')}>{c.status==='approved'?'撤下公开评论':'不予公开'}</button>}</div></article>)}<p className="muted">每个队列显示最近 200 条；课程讨论区显示每个知识点最近 100 条已公开评论。</p></section>
}
