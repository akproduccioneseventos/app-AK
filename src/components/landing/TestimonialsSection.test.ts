import { testimonialToStory, type Testimonial } from './TestimonialsSection';

describe('testimonialToStory', () => {
  it('uses only the approved testimonial content supplied by the caller', () => {
    const testimonial: Testimonial = {
      id: 'review-1',
      name: 'Cliente real',
      role: 'Cliente AK',
      eventType: 'Boda',
      rating: 4,
      text: 'Excelente servicio.',
      avatarInitials: 'CR',
      avatarColor: 'bg-red-600',
    };

    const story = testimonialToStory(testimonial);

    expect(story).toMatchObject({
      id: 'testimonial-review-1',
      clientName: 'Cliente real',
      eventType: 'Boda',
      rating: 4,
      text: 'Excelente servicio.',
    });
    expect(story).not.toHaveProperty('logro');
    expect(story).not.toHaveProperty('servicios');
    expect(story).not.toHaveProperty('image');
  });
});
