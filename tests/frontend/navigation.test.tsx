import {beforeEach,describe,expect,it,vi} from 'vitest';
import {act,render,screen,waitFor} from '@testing-library/react';
import App from '../../frontend/src/App';
import {jobFixture} from './fixtures';
import type {Job} from '../../frontend/src/types';

const network=vi.hoisted(()=>({list:vi.fn(),read:vi.fn()}));
vi.mock('../../frontend/src/client',async original=>({...await original<typeof import('../../frontend/src/client')>(),listJobs:network.list,readJob:network.read}));
vi.mock('../../frontend/src/webmcp',()=>({pageContext:()=>({}),registerWorkTools:()=>()=>{}}));
beforeEach(()=>{network.list.mockReset();network.read.mockReset();window.history.replaceState(null,'','#job=first');});

describe('work record navigation',()=>{
  it('removes the previous job immediately while a different record loads',async()=>{
    const first=await jobFixture();first.id='first';first.terms.title='First assignment';
    const second=await jobFixture();second.id='second';second.terms.title='Second assignment';
    let finish!:(job:Job)=>void;
    network.list.mockResolvedValue(['first','second']);
    network.read.mockImplementation((id:string)=>id==='first'?Promise.resolve(first):new Promise<Job>(resolve=>{finish=resolve;}));
    render(<App/>);await screen.findByRole('heading',{name:'First assignment'});
    act(()=>{window.history.replaceState(null,'','#job=second');window.dispatchEvent(new HashChangeEvent('hashchange'));});
    expect(screen.queryByRole('heading',{name:'First assignment'})).not.toBeInTheDocument();
    await waitFor(()=>expect(network.read).toHaveBeenCalledWith('second'));
    await act(async()=>{finish(second);});
    expect(await screen.findByRole('heading',{name:'Second assignment'})).toBeInTheDocument();
  });
  it('does not clear a loaded job on a same-job citation hash change',async()=>{
    const job=await jobFixture();job.id='first';job.terms.title='Stable assignment';
    network.list.mockResolvedValue(['first']);network.read.mockResolvedValue(job);
    render(<App/>);await screen.findByRole('heading',{name:'Stable assignment'});
    act(()=>{window.history.replaceState(null,'','#job=first&evidence=A');window.dispatchEvent(new HashChangeEvent('hashchange'));});
    expect(screen.getByRole('heading',{name:'Stable assignment'})).toBeInTheDocument();
    expect(network.read).toHaveBeenCalledTimes(1);
  });
});
