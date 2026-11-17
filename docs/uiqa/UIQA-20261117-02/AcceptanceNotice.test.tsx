import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { it, expect } from 'vitest'
import { RemoteSelect } from '@/shared/ui/RemoteSelect'
it('notice A/B selection must backfill business code', async () => {
 const a={value:'013f0a7e-f0ad-4d1f-93f4-4f0fd2774dc0',label:'PIN-UIQA-20261117-02-01'}
 const b={value:'4b72e0ac-a9fe-493c-8d8b-d2ac95a9bf3f',label:'PIN-UIQA-20261117-02-02'}
 const values: {id:string,code:string}[]=[]
 render(<RemoteSelect ariaLabel="开票通知" value={null} fetchOptions={async()=>[a,b]} onChange={(id,option)=>{values.push({id,code:option?.label??''})}} />)
 fireEvent.mouseDown(screen.getByRole('combobox'))
 fireEvent.click(await screen.findByText(a.label))
 await waitFor(()=>expect(values).toHaveLength(1))
 fireEvent.mouseDown(screen.getByRole('combobox'))
 fireEvent.click(await screen.findByText(b.label))
 await waitFor(()=>expect(values).toHaveLength(2))
 console.log('BACKFILL',JSON.stringify(values))
 expect(values).toEqual([{id:a.value,code:a.label},{id:b.value,code:b.label}])
})
