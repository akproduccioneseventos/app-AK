export interface GenerateImageInput {
  prompt: string;
  title?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface GenerateImageOutput {
  imageDataUri: string;
  altText: string;
  promptUsed: string;
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const title = input.title?.trim() || 'AK Producciones';
  const primary = input.primaryColor || '#D71920';
  const secondary = input.secondaryColor || '#111827';
  const prompt = input.prompt?.trim() || 'Experiencia tecnologica para eventos';
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#ffffff"/>
  <circle cx="1050" cy="110" r="210" fill="${primary}" opacity="0.10"/>
  <circle cx="170" cy="680" r="260" fill="${secondary}" opacity="0.08"/>
  <rect x="90" y="100" width="1020" height="600" rx="44" fill="#f8fafc" stroke="#e5e7eb"/>
  <rect x="145" y="155" width="910" height="490" rx="32" fill="#ffffff"/>
  <path d="M180 530 C330 390 440 460 560 350 C700 220 815 310 1030 190" fill="none" stroke="${primary}" stroke-width="18" stroke-linecap="round" opacity="0.85"/>
  <text x="190" y="275" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="900" fill="${secondary}">${title}</text>
  <text x="190" y="350" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#475569">${prompt}</text>
  <text x="190" y="595" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900" fill="${primary}">Experiencia digital AK</text>
</svg>`;

  return {
    imageDataUri: svgDataUri(svg),
    altText: `${title}: ${prompt}`,
    promptUsed: prompt,
  };
}

export const generateImageFlow = generateImage;
