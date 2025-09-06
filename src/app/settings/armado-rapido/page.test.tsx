
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArmadoRapidoSettingsPage, { AddOrEditDialog } from './page';
import * as armadoRapidoActions from '@/app/actions/armado-rapido';
import * as serviciosActions from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

// Mocking server actions
jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn(),
  updateArmadoRapidoAndSyncServices: jest.fn(),
}));
jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn(),
}));

const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));


// Mock data
const mockCateringServices: ServicioEmpresa[] = [
    { id: 's1', nombre: 'Pizzetas', tipoItem: 'Servicio', categoria: 'Servicio de catering', subcategoria: 'Entrada', precioVenta: 100, unidad: 'Por persona' },
    { id: 's2', nombre: 'Asado', tipoItem: 'Servicio', categoria: 'Servicio de catering', subcategoria: 'Plato Principal', precioVenta: 500, unidad: 'Por persona' },
    { id: 's3', nombre: 'Hamburguesas', tipoItem: 'Servicio', categoria: 'Servicio de catering', subcategoria: 'Menú Adolescente / Niño', precioVenta: 200, unidad: 'Por persona' },
    { id: 's4', nombre: 'Tragos', tipoItem: 'Servicio', categoria: 'Servicio de catering', subcategoria: 'Servicio Adicional', precioVenta: 150, unidad: 'Por persona' },
];

const mockMenu: MenuArmadoRapido = {
    id: 'menu_catering',
    nombre: 'Menú de Catering',
    serviciosIncluidos: [
        { id: 's1', nombre: 'Pizzetas', categoria: 'Entrada', precioFijo: 100 },
        { id: 's2', nombre: 'Asado', categoria: 'Plato Principal', precioFijo: 500 },
        { id: 's3', nombre: 'Hamburguesas', categoria: 'Menú Adolescente / Niño', precioFijo: 200 },
        { id: 's4', nombre: 'Tragos', categoria: 'Servicio Adicional', precioFijo: 150 },
    ],
};


describe('AddOrEditDialog for Menus', () => {

    it('correctly groups services by category', () => {
        render(
            <AddOrEditDialog
                isOpen={true}
                onOpenChange={() => {}}
                onSave={() => {}}
                item={mockMenu}
                vendibleServices={mockCateringServices}
                mode="menu"
                onServiceCreated={() => {}}
            />
        );

        // Check if category headers are rendered
        expect(screen.getByText('Entrada')).toBeInTheDocument();
        expect(screen.getByText('Plato Principal')).toBeInTheDocument();
        expect(screen.getByText('Menú Adolescente / Niño')).toBeInTheDocument();
        expect(screen.getByText('Servicio Adicional')).toBeInTheDocument();

        // Check if services are under the correct category header
        const entradaHeader = screen.getByText('Entrada');
        const platoPrincipalHeader = screen.getByText('Plato Principal');

        // This is a simplified way to check proximity. More complex structures might need different assertions.
        // We find the parent container of the header and check if the service is within that container.
        const entradaSection = entradaHeader.closest('div');
        if(entradaSection) {
            expect(entradaSection).toHaveTextContent('Pizzetas');
            expect(entradaSection).not.toHaveTextContent('Asado');
        }

        const platoPrincipalSection = platoPrincipalHeader.closest('div');
         if(platoPrincipalSection) {
            expect(platoPrincipalSection).toHaveTextContent('Asado');
            expect(platoPrincipalSection).not.toHaveTextContent('Pizzetas');
        }
    });

});
