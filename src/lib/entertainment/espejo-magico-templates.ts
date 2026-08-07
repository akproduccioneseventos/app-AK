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
  supermodel: {
    id: 'supermodel',
    categoryId: 'showbiz',
    label: 'Supermodelo Pasarela',
    promptDescription:
      'a high-fashion supermodel walking down a premium fashion runway, flashing camera lights from photographers in the dark background, wearing an elegant designer outfit, haute couture aesthetic',
  },
  rock_legend: {
    id: 'rock_legend',
    categoryId: 'showbiz',
    label: 'Leyenda del Rock',
    promptDescription:
      'a legendary rock singer performing live on a huge stadium stage with dramatic red and orange spotlights, pyrotechnics fire erupting, holding a vintage microphone stand, massive cheering crowd in background',
  },
  steampunk_explorer: {
    id: 'steampunk_explorer',
    categoryId: 'cinema',
    label: 'Viajero Steampunk',
    promptDescription:
      'a steampunk explorer wearing brass goggles, a leather vest with gears, standing on the deck of a wooden flying airship amidst high altitude clouds and mechanical details, warm brass and copper tones',
  },
  anime_hero: {
    id: 'anime_hero',
    categoryId: 'cinema',
    label: 'Héroe Anime',
    promptDescription:
      'a powerful 2D anime hero with spiky hair, wearing detailed combat robes, surrounded by an intense glowing blue energy aura, standing in a dynamic action pose in a fantasy valley landscape',
  },
  cyber_elf: {
    id: 'cyber_elf',
    categoryId: 'fantasy',
    label: 'Elfo Cyberpunk',
    promptDescription:
      'a high-tech cyber elf with pointed ears, wearing glowing holographic garments, standing in a magical bioluminescent futuristic garden under neon-colored alien trees',
  },
  viking_warrior: {
    id: 'viking_warrior',
    categoryId: 'fantasy',
    label: 'Guerrero Vikingo',
    promptDescription:
      'a rugged viking warrior with braided hair, wearing fur-lined leather armor, standing on the deck of a longship under a spectacular green aurora borealis sky with ocean waves crashing',
  },
  silicon_founder: {
    id: 'silicon_founder',
    categoryId: 'corporate',
    label: 'Presentador Tech',
    promptDescription:
      'a confident tech founder giving a keynote presentation on a modern stage, wearing a smart casual blazer and t-shirt, warm stage lighting, large presentation screen blurred in the background',
  },
  influencer_travel: {
    id: 'influencer_travel',
    categoryId: 'corporate',
    label: 'Influencer Viajes',
    promptDescription:
      'a stylish travel blogger wearing fashionable sunglasses and summer outfit, standing on a luxury terrace in Santorini overlooking the deep blue Aegean sea at golden sunset',
  },
  plastic_toy: {
    id: 'plastic_toy',
    categoryId: 'fun',
    label: 'Muñeco de Acción',
    promptDescription:
      'a vintage plastic action figure toy inside an unopened retro collector box with colorful packaging and retro brand logo, plastic glossy texture, toy store display lighting',
  },
  chibi_avatar: {
    id: 'chibi_avatar',
    categoryId: 'fun',
    label: 'Avatar Chibi 3D',
    promptDescription:
      'a cute 3D chibi character with oversized head and big expressive eyes, wearing pastel-colored clothes, standing in a dreamy wonderland filled with candy canes, giant lollipops, and cotton candy clouds',
  },

  // ── Estilos sumados el 7 de agosto de 2026 ──────────────────────────────
  // Se eligieron para cubrir los huecos que tenia el catalogo: casi todo
  // apuntaba a adolescentes y adultos, y faltaba material para quinceaneras,
  // bodas y cumpleanos de nenes, que son la mayoria de las fiestas.
  quinceanera_gala: {
    id: 'quinceanera_gala',
    categoryId: 'showbiz',
    label: 'Gala de Quince',
    promptDescription:
      'the guest of honor at a grand quinceanera gala, wearing an elegant voluminous ball gown with delicate embroidery and a small tiara, descending a marble staircase decorated with white flowers and warm golden chandeliers',
  },
  red_carpet: {
    id: 'red_carpet',
    categoryId: 'showbiz',
    label: 'Alfombra Roja',
    promptDescription:
      'a celebrity arriving on a red carpet premiere, wearing haute couture, dozens of paparazzi camera flashes firing in the background, step-and-repeat banner wall, confident glamorous pose',
  },
  latin_singer: {
    id: 'latin_singer',
    categoryId: 'showbiz',
    label: 'Cantante Latino',
    promptDescription:
      'a charismatic latin music singer performing at an outdoor summer festival, holding a microphone, tropical stage lighting in warm pink and orange, palm trees and a huge cheering crowd behind',
  },
  novios_cinematic: {
    id: 'novios_cinematic',
    categoryId: 'fantasy',
    label: 'Boda de Pelicula',
    promptDescription:
      'a romantic cinematic wedding portrait, wearing elegant formal wedding attire, standing in a sunlit garden with soft bokeh, petals floating in the air, warm film-like color grading',
  },
  vintage_1950s: {
    id: 'vintage_1950s',
    categoryId: 'fantasy',
    label: 'Vintage 1950s',
    promptDescription:
      'a classic 1950s portrait, wearing period clothing with polka dots or a sharp suit, styled retro hair, standing next to a pastel vintage car at an american diner, saturated kodachrome colors',
  },
  futbolista: {
    id: 'futbolista',
    categoryId: 'corporate',
    label: 'Futbolista',
    promptDescription:
      'a professional football player celebrating a goal on a packed stadium pitch at night, wearing a team kit, floodlights flaring, blurred cheering crowd and confetti in the air',
  },
  astronauta_nino: {
    id: 'astronauta_nino',
    categoryId: 'fun',
    label: 'Explorador Espacial',
    promptDescription:
      'a cheerful young space explorer wearing a colorful cartoon-style spacesuit with a bubble helmet, floating among friendly smiling planets and glittering stars, bright playful illustration',
  },
  superheroe_infantil: {
    id: 'superheroe_infantil',
    categoryId: 'fun',
    label: 'Superheroe Animado',
    promptDescription:
      'a friendly cartoon superhero for children, wearing a bright colorful costume with a small cape and a star emblem, standing in a heroic pose on a rooftop of a cheerful cartoon city, soft rounded 3d animation style',
  },
  dinosaurios: {
    id: 'dinosaurios',
    categoryId: 'fun',
    label: 'Aventura Jurasica',
    promptDescription:
      'a brave young explorer wearing a safari hat and vest in a lush prehistoric jungle, friendly cartoon dinosaurs peeking between giant ferns, warm adventurous lighting',
  },
  princesa_cuento: {
    id: 'princesa_cuento',
    categoryId: 'fun',
    label: 'Cuento de Hadas',
    promptDescription:
      'a storybook fairytale character wearing a shimmering pastel gown or a small prince outfit, surrounded by glowing fireflies in an enchanted forest with a distant castle, soft magical illustration style',
  },
};
