import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestimoniosSlide } from './testimonios-slide';
import { getTestimonials } from '@/app/actions/feedback';

// Mock the action
jest.mock('@/app/actions/feedback', () => ({
  getTestimonials: jest.fn()
}));

// Mock framer-motion to prevent errors in JSDOM
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    __esModule: true,
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>
    }
  };
});

describe('TestimoniosSlide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('llama a getTestimonials al montar el componente', async () => {
    // Arrange
    (getTestimonials as jest.Mock).mockResolvedValue([
      { id: '1', clientName: 'Test Client', text: 'Excelente servicio', isApproved: true }
    ]);

    // Act
    render(<TestimoniosSlide tipoFiesta="Boda" />);

    // Assert
    await waitFor(() => {
      expect(getTestimonials).toHaveBeenCalledTimes(1);
    });
    
    // Check that mock data was rendered
    expect(await screen.findByText(/Excelente servicio/i)).toBeInTheDocument();
  });

  it('muestra datos compartidos por defecto si la base de datos está vacía', async () => {
    // Arrange
    (getTestimonials as jest.Mock).mockResolvedValue([]);

    // Act
    render(<TestimoniosSlide tipoFiesta="Boda" />);

    // Assert
    await waitFor(() => {
      expect(getTestimonials).toHaveBeenCalledTimes(1);
    });
    
    // Check for some text from sharedTestimonials (like 'Barra excelente')
    // One of the default shared testimonials has the text "Las hamburguesas y la picada que mandaron para la mesa de los chicos estuvo espectacular..."
    expect(await screen.findByText(/espectacular/i)).toBeInTheDocument();
  });
});
