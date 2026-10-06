import type {Meta,StoryObj} from '@storybook/react-vite';
import {SeverityBadge} from './severity-badge';
export default {title:'Components/Tags/SeverityBadge',component:SeverityBadge} satisfies Meta<typeof SeverityBadge>;
export const Matrix:StoryObj<typeof SeverityBadge>={render:()=> <div className="stack">{[false,true].map(compact=><div key={String(compact)} className="row">{(['critical','high','medium','low','info'] as const).map(severity=><SeverityBadge severity={severity} compact={compact} key={severity}/>)}</div>)}</div>};
