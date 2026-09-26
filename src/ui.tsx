import {createContext,useContext,type ReactNode} from 'react';
const TabsContext=createContext({value:'',onValueChange:(_s:string)=>{}});
export function Tabs({value,onValueChange,children}:{value:string,onValueChange:(s:string)=>void,children:ReactNode}){return <TabsContext.Provider value={{value,onValueChange}}>{children}</TabsContext.Provider>}
export function TabsList({children,className=''}:{children:ReactNode,className?:string}){return <div className={'native-tabs '+className} role="tablist">{children}</div>}
export function TabsTrigger({value,children}:{value:string,children:ReactNode}){const ctx=useContext(TabsContext);return <button role="tab" aria-selected={ctx.value===value} onClick={()=>ctx.onValueChange(value)}>{children}</button>}
export function TabsContent({value,children}:{value:string,children:ReactNode}){const ctx=useContext(TabsContext);return ctx.value===value?<section role="tabpanel">{children}</section>:null}
export function Slider({value,onValueChange,...props}:{value:number[],onValueChange:(n:number[])=>void,min:number,max:number,step:number,'aria-label':string}){return <input className="native-range" type="range" value={value[0]} {...props} onChange={e=>onValueChange([Number(e.target.value)])}/>}
export function SidebarProvider({children,className=''}:{children:ReactNode,className?:string}){return <div className={className}>{children}</div>}
export function Sidebar({children,className=''}:{children:ReactNode,className?:string,collapsible?:string}){return <aside className={className}>{children}</aside>}
export function SidebarContent({children}:{children:ReactNode}){return <div>{children}</div>}
