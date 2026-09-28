import {useEffect,useRef,useState} from 'react';

export default function VisitCounter(){
 const raw=useRef<HTMLSpanElement>(null);
 const [count,setCount]=useState<string|null>(null),[unavailable,setUnavailable]=useState(false);
 useEffect(()=>{
  // page_pv groups this GitHub Pages pathname; hash routes share one total.
  // Keep the component mounted across route changes to count document loads only.
  if(location.hostname!=='shengyu-tang.github.io'){setUnavailable(true);return}
  const node=raw.current!;
  const observer=new MutationObserver(()=>{const value=node.textContent?.trim();if(value&&/^\d+$/.test(value)){setCount(BigInt(value).toLocaleString('zh-CN'));setUnavailable(false)}});
  observer.observe(node,{childList:true,subtree:true,characterData:true});
  const script=document.createElement('script');
  script.src='https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';script.async=true;
  script.onerror=()=>setUnavailable(true);document.head.appendChild(script);
  const timeout=window.setTimeout(()=>setUnavailable(true),12000);
  return()=>{observer.disconnect();clearTimeout(timeout);script.remove()};
 },[]);
 return <div aria-label="网站访问统计" style={{maxWidth:1560,margin:'0 auto',padding:'20px 24px 32px',textAlign:'center',color:'#688491',fontSize:13,borderTop:'1px solid #dce7ec'}}>
  <span id="busuanzi_value_page_pv" ref={raw} hidden/>
  <span role="status">累计访问：<strong style={{color:'#087b80',fontVariantNumeric:'tabular-nums'}}>{count??(unavailable?'暂不可用':'统计中…')}</strong>{count!==null?' 次':''}</span>
  <span style={{marginLeft:14,fontSize:12}}>统计服务：<a href="https://busuanzi.ibruce.info/" target="_blank" rel="noreferrer">不蒜子</a></span>
 </div>;
}
