import type {Meta,StoryObj} from '@storybook/react-vite';
import {useState} from 'react';
import {Button} from '@/components/button';
import {ButtonGroup} from './button-group';
export default {title:'Components/Actions/ButtonGroup',component:ButtonGroup} satisfies Meta<typeof ButtonGroup>;
function DensityControls(){const[density,setDensity]=useState('Default');return <ButtonGroup aria-label="Grid density">{['Compact','Default','Comfortable'].map(label=><Button key={label} emphasis={density===label?'soft':'ghost'} intent={density===label?'function':'default'} aria-pressed={density===label} onClick={()=>setDensity(label)}>{label}</Button>)}</ButtonGroup>;}
export const Matrix:StoryObj<typeof ButtonGroup>={render:()=> <DensityControls/>};
