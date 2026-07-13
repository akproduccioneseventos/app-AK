export type FaceSwapCategoryId =
  | 'showbiz'
  | 'cinema'
  | 'fantasy'
  | 'corporate'
  | 'fun';

export interface CategoryDefinition {
  id: FaceSwapCategoryId;
  label: string;
}

export const FACESWAP_CATEGORIES: CategoryDefinition[] = [
  { id: 'showbiz', label: 'Estrellas & Farandula' },
  { id: 'cinema', label: 'Cine & Accion' },
  { id: 'fantasy', label: 'Fantasia e Historia' },
  { id: 'corporate', label: 'Estilo de Vida & Pro' },
  { id: 'fun', label: 'Divertidos & Ninos' },
];

export interface EspejoTemplateDefinition {
  id: string;
  categoryId: FaceSwapCategoryId;
  label: string;
  promptDescription: string;
  previewUrl?: string;
}

export const ESPEJO_TEMPLATES: Record<string, EspejoTemplateDefinition> = {
  kpop_stars: {
    id: 'kpop_stars',
    categoryId: 'showbiz',
    label: 'K-Pop Star',
    promptDescription:
      'a famous K-pop music idol performing on a massive stage under colorful spotlights and flashing purple neon lasers, wearing a highly stylish modern streetwear outfit with chains, shiny makeup, dynamic concert crowd in background',
  },
  rockstar: {
    id: 'rockstar',
    categoryId: 'showbiz',
    label: 'Rock Star',
    promptDescription:
      'an electrifying rock star on stage, wearing a black studded leather jacket and distressed jeans, holding a vintage electric guitar, surrounded by smoke machines, warm backlighting, and a roaring concert audience',
  },
  pop_idol: {
    id: 'pop_idol',
    categoryId: 'showbiz',
    label: 'Pop Icon',
    promptDescription:
      'a glamorous pop music icon dancing under glittering disco ball reflections, wearing a sparkling metallic silver outfit, holding a glowing wireless microphone, bokeh light circles in background',
  },
  dj_premium: {
    id: 'dj_premium',
    categoryId: 'showbiz',
    label: 'DJ Set Club',
    promptDescription:
      'a professional electronic music DJ wearing cool headphones around the neck, standing behind a glowing high-tech Pioneer DJ deck and mixer setup in a premium nightclub with laser beams and dancing crowd in background',
  },
  movie_poster: {
    id: 'movie_poster',
    categoryId: 'cinema',
    label: 'Afiche de Cine',
    promptDescription:
      'a heroic protagonist inside an epic action movie poster billboard, dramatic orange fire and blue sparks explosion in the background, debris flying, cinematic high contrast lighting, movie title text overlay simulated at the bottom',
  },
  superhero: {
    id: 'superhero',
    categoryId: 'cinema',
    label: 'Superheroe',
    promptDescription:
      'a powerful superhero wearing a detailed high-tech metallic skintight suit with a glowing emblem on the chest, a long cape flowing dramatically in the wind, standing in a heroic power pose on a skyscraper rooftop overlooking a city skyline at sunset',
  },
  secret_agent: {
    id: 'secret_agent',
    categoryId: 'cinema',
    label: 'Agente Secreto',
    promptDescription:
      'a sophisticated secret agent wearing a classic tailored black tuxedo or an elegant evening gown, standing in a high-tech modern glass building looking over a city at night, holding a prop, James Bond aesthetic',
  },
  cyberpunk_warrior: {
    id: 'cyberpunk_warrior',
    categoryId: 'cinema',
    label: 'Guerrero Cyberpunk',
    promptDescription:
      'a futuristic cyberpunk mercenary with glowing blue cybernetic implants on the face and arms, wearing a technical high-collar jacket, standing on a rainy neo-tokyo street filled with neon signs and flying vehicles',
  },
  medieval_legends: {
    id: 'medieval_legends',
    categoryId: 'fantasy',
    label: 'Caballero / Hada',
    promptDescription:
      'a legendary medieval figure: either a brave knight in detailed shining silver armor holding a sword, or a magical fairy with iridescent wings, standing in a dreamy enchanted meadow next to an old stone castle',
  },
  royalty: {
    id: 'royalty',
    categoryId: 'fantasy',
    label: 'Regal / Realeza',
    promptDescription:
      'a grand royal king or queen wearing heavy red velvet robes trimmed with luxurious white fur, a magnificent golden crown adorned with rubies and emeralds, holding a royal scepter, sitting on a massive carved golden throne inside a grand castle hall',
  },
  gatsby_1920s: {
    id: 'gatsby_1920s',
    categoryId: 'fantasy',
    label: 'Gran Gatsby 1920s',
    promptDescription:
      'a glamorous guest at a 1920s Gatsby party, wearing a black tuxedo or a sparkling flapper dress with pearl necklaces and a feathered headband, holding a champagne glass, gold art deco background pattern with warm luxury lighting',
  },
  pirate_captain: {
    id: 'pirate_captain',
    categoryId: 'fantasy',
    label: 'Capitan Pirata',
    promptDescription:
      'a pirate captain wearing a weathered leather tricorn hat, a long dramatic coat, standing at the wooden helm of a grand pirate ship with the ocean waves crashing around and a dark storm brewing in the background',
  },
  oil_painting: {
    id: 'oil_painting',
    categoryId: 'fantasy',
    label: 'Pintura al Oleo',
    promptDescription:
      'a classical renaissance oil painting portrait, showing rich brush strokes, fine canvas texture, warm Rembrandt-style chiascuro lighting, rich classical clothing, making the person look like a masterpiece hanging in a museum',
  },
  space_commander: {
    id: 'space_commander',
    categoryId: 'corporate',
    label: 'Astronauta',
    promptDescription:
      'a space commander wearing a detailed white NASA spacesuit with patches, helmet visor open to reveal the face, floating in zero gravity inside a space station cockpit with planet Earth visible through the window behind them',
  },
  master_chef: {
    id: 'master_chef',
    categoryId: 'corporate',
    label: 'Master Chef',
    promptDescription:
      'a professional gourmet master chef wearing a clean double-breasted white chef jacket and a tall white chef hat, standing in a premium modern stainless steel restaurant kitchen preparing a beautifully plated dish',
  },
  linkedin_premium: {
    id: 'linkedin_premium',
    categoryId: 'corporate',
    label: 'LinkedIn Premium',
    promptDescription:
      'a confident professional wearing a smart tailored blazer and crisp white shirt, standing in a modern sunlit corporate office building, warm professional corporate headshot photography',
  },
  f1_driver: {
    id: 'f1_driver',
    categoryId: 'corporate',
    label: 'Piloto de F1',
    promptDescription:
      'a professional racing car driver wearing a detailed red racing suit covered in sponsor patches, holding a helmet under one arm, standing in the pit lane of a race track with garage and F1 car blurred in background',
  },
  tiny_pirate: {
    id: 'tiny_pirate',
    categoryId: 'fun',
    label: 'Pequeno Pirata',
    promptDescription:
      'a cute cartoon pirate character wearing an oversized floppy pirate hat with a friendly skull illustration, standing next to a wooden treasure chest filled with gold coins on a bright sunny tropical beach, fun friendly cartoon style',
  },
  cartoon_3d: {
    id: 'cartoon_3d',
    categoryId: 'fun',
    label: 'Avatar 3D Animado',
    promptDescription:
      'a highly expressive 3D cartoon character in the style of a modern animated movie, clean rendering, soft lighting, friendly features, vibrant colorful clothing, standing in a cheerful fantasy park background',
  },
  classic_comic: {
    id: 'classic_comic',
    categoryId: 'fun',
    label: 'Pop Art Comic',
    promptDescription:
      'a classic comic book illustration with bold black outlines, high contrast pop art colors (bright cyan, yellow, magenta), retro dot halftone pattern background, speech bubble next to the person with party sparkles',
  },
};
