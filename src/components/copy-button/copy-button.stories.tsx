import type {Meta,StoryObj} from '@storybook/react-vite';
import {CopyButton} from './copy-button';
export default {title:'Components/Actions/CopyButton',component:CopyButton,args:{text:'T1059.001', 'aria-label':'Copy technique ID'}} satisfies Meta<typeof CopyButton>;
export const Matrix:StoryObj<typeof CopyButton>={render:args=><div className="row"><code>T1059.001</code><CopyButton {...args}/></div>};
