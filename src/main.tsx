import {createRoot} from 'react-dom/client';
import {useEffect,useState} from 'react';
import Lab from './Lab';import About from './About';import Calendar from './Calendar';import MindMap from './MindMap';import './style.css';
function App(){const [route,setRoute]=useState(location.hash.split('?')[0]||'#/lab');useEffect(()=>{const update=()=>{setRoute(location.hash.split('?')[0]||'#/lab');window.scrollTo(0,0)};window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[]);return route==='#/map'?<MindMap/>:route==='#/about'?<About/>:route==='#/calendar'?<Calendar/>:<Lab/>}
createRoot(document.getElementById('root')!).render(<App/>);
