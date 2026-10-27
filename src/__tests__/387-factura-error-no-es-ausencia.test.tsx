/** @jest-environment jsdom */
import React, {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import ViewInvoicePage from '@/app/(app)/invoices/[id]/page';
const mockInvoice=jest.fn(),mockSettings=jest.fn(),mockBudgets=jest.fn(),mockToast=jest.fn();
jest.mock('next/navigation',()=>({useParams:()=>({id:'qa387-invoice'}),useRouter:()=>({})}));
jest.mock('@/hooks/use-toast',()=>({useToast:()=>({toast:mockToast})}));
jest.mock('@/app/actions/invoices',()=>({getInvoiceById:(...args:unknown[])=>mockInvoice(...args),addPaymentToInvoice:jest.fn()}));
jest.mock('@/app/actions/settings',()=>({getInvoiceTemplateSettings:(...args:unknown[])=>mockSettings(...args)}));
jest.mock('@/app/actions/presupuestos',()=>({getPresupuestos:(...args:unknown[])=>mockBudgets(...args)}));
let root:Root,container:HTMLDivElement;
beforeEach(()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 mockInvoice.mockReset();mockSettings.mockReset();mockBudgets.mockReset();mockToast.mockReset();
 mockSettings.mockResolvedValue({companyName:'QA387'});
 mockBudgets.mockResolvedValue([]);
 container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
test('387 control: factura realmente ausente deja de cargar y lo informa',async()=>{
 mockInvoice.mockResolvedValue(null);
 await act(async()=>{root.render(<ViewInvoicePage/>);await Promise.resolve();});
 expect(container.querySelector('.animate-spin')).toBeNull();
 expect(container.textContent).toMatch(/factura no encontrada/i);
});
test('387 control: lectura aun pendiente no inventa ausencia',async()=>{
 mockInvoice.mockImplementation(()=>new Promise(()=>{}));
 await act(async()=>{root.render(<ViewInvoicePage/>);});
 expect(container.querySelector('.animate-spin')).not.toBeNull();
 expect(container.textContent).not.toMatch(/factura no encontrada/i);
});
test('387 si falla una lectura no afirmar que la factura no existe o fue eliminada',async()=>{
 mockInvoice.mockResolvedValue({id:'qa387-invoice',totalAmount:1000,items:[],payments:[],currency:'UYU'});
 mockSettings.mockRejectedValue(new Error('QA387_TEMPORARY_READ_FAILURE'));
 await act(async()=>{root.render(<ViewInvoicePage/>);await Promise.resolve();});
 expect(mockInvoice).toHaveBeenCalledTimes(1);
 expect(mockSettings).toHaveBeenCalledTimes(1);
 expect(mockToast).toHaveBeenCalled();
 expect(container.querySelector('.animate-spin')).toBeNull();
 expect(container.textContent).not.toMatch(/factura no encontrada|no existe|eliminada/i);
});
