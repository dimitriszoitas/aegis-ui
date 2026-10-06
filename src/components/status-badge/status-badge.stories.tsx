import type {Meta,StoryObj} from '@storybook/react-vite';
import {StatusBadge,StatusDot} from './status-badge';
export default {title:'Components/Tags/StatusBadge',component:StatusBadge} satisfies Meta<typeof StatusBadge>;
export const Matrix:StoryObj<typeof StatusBadge>={render:()=> <div className="stack"><div className="row">{(['new','triaged','in-progress','resolved','false-positive'] as const).map(status=><StatusBadge status={status} key={status}/>)}</div><div className="row">{(['new','triaged','in-progress','resolved','false-positive'] as const).map(status=><StatusDot status={status} key={status}/>)}</div></div>};
