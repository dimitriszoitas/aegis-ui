import type {Meta,StoryObj} from '@storybook/react-vite';
import {useState} from 'react';
import {Tag} from './tag';
export default {title:'Components/Tags/Tag',component:Tag} satisfies Meta<typeof Tag>;
function Tags(){const[selected,setSelected]=useState(false);const[removed,setRemoved]=useState(false);return <div className="stack">{(['sm','md'] as const).map(size=><div className="row" key={size}>{(['default','function','destroy','ai','success','warning'] as const).map(intent=><Tag size={size} intent={intent} key={intent}>{intent==='ai'?'AI suggested':'Credential access'}</Tag>)}</div>)}<div className="row"><Tag variant="interactive" selected={selected} onSelectedChange={setSelected}>Assigned to me</Tag><Tag variant="counter" count={24}>Identity</Tag>{!removed&&<Tag variant="removable" removeLabel="Remove PowerShell filter" onRemove={()=>setRemoved(true)}>PowerShell</Tag>}</div></div>;}
export const Matrix:StoryObj<typeof Tag>={render:()=> <Tags/>};
