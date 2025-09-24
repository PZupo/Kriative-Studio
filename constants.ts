
export const PLATFORMS: ('Instagram' | 'TikTok' | 'YouTube')[] = ['Instagram', 'TikTok', 'YouTube'];

export const STYLES: ('Padrão' | 'Estilo Mangá')[] = ['Padrão', 'Estilo Mangá'];

// Centralized Format Configuration
export interface FormatConfig {
    dimensions: string;
    aspectRatio: '1:1' | '9:16' | '16:9' | '4:5' | '3:4';
    isMultiQuantity: boolean;
    isVideo: boolean;
    maxDuration?: number; // in seconds
    maxQuantity: number;
}

export const FORMAT_CONFIGS: { [key: string]: FormatConfig } = {
    // Instagram
    'Feed': { dimensions: '1080x1080px para 1:1', aspectRatio: '1:1', isMultiQuantity: true, isVideo: false, maxQuantity: 4 },
    'Stories': { dimensions: '1080x1920px para 9:16', aspectRatio: '9:16', isMultiQuantity: false, isVideo: true, maxDuration: 15, maxQuantity: 1 },
    'Reel': { dimensions: '1080x1920px para 9:16', aspectRatio: '9:16', isMultiQuantity: false, isVideo: true, maxDuration: 90, maxQuantity: 1 },
    'Carrossel': { dimensions: '1080x1080px para 1:1 (por item)', aspectRatio: '1:1', isMultiQuantity: true, isVideo: false, maxQuantity: 10 },
    // TikTok
    'Vídeo/Post': { dimensions: '1080x1920px para 9:16', aspectRatio: '9:16', isMultiQuantity: false, isVideo: true, maxDuration: 180, maxQuantity: 1 },
    // YouTube
    'Shorts': { dimensions: '1080x1920px para 9:16', aspectRatio: '9:16', isMultiQuantity: false, isVideo: true, maxDuration: 60, maxQuantity: 1 },
    'Vídeo': { dimensions: '1920x1080px para 16:9', aspectRatio: '16:9', isMultiQuantity: false, isVideo: true, maxDuration: 600, maxQuantity: 1 },
    // Manga
    'Revista': { dimensions: '1080x1440px (por página)', aspectRatio: '3:4', isMultiQuantity: true, isVideo: false, maxQuantity: 20 },
    // Shared
    'Vídeo Animado': { dimensions: '1080x1920px para 9:16', aspectRatio: '9:16', isMultiQuantity: false, isVideo: true, maxDuration: 60, maxQuantity: 1 },
};

export const FORMATS: { [key in typeof PLATFORMS[number]]: string[] } = {
    Instagram: ['Feed', 'Stories', 'Reel', 'Carrossel'],
    TikTok: ['Vídeo/Post', 'Stories', 'Vídeo Animado'],
    YouTube: ['Shorts', 'Vídeo'],
};

// Fix: Add and export the missing VIDEO_FORMATS constant to resolve an import error in LoadingScreen.tsx.
export const VIDEO_FORMATS: string[] = Object.keys(FORMAT_CONFIGS).filter(
    (key) => FORMAT_CONFIGS[key].isVideo
);

export const MANGA_FORMATS: string[] = ['Revista'];

export const VISUAL_STYLES: ('Realista' | 'Disney' | 'Pixar' | 'Studio Ghibli' | 'Cartoon' | 'Aquarela' | 'Minimalista' | 'Vintage')[] = [
    'Realista',
    'Disney',
    'Pixar',
    'Studio Ghibli',
    'Cartoon',
    'Aquarela',
    'Minimalista',
    'Vintage',
];

export const INPUT_TYPES: ('Prompt de Texto' | 'Prompt de Imagem')[] = ['Prompt de Texto', 'Prompt de Imagem'];

// Centralized Plan Configuration
export const PLAN_CONFIGS = {
    associado: {
        name: 'Associado',
        price: 'R$ 197,00/mês (Incluso no Pacote)',
        credits: 1000,
        maxVideoDuration: 90,
        features: ['1.000 créditos/mês', 'Vídeos de até 90s', 'Ideal para membros do pacote'],
    },
    pro: {
        name: 'Pro',
        price: 'R$ 97,00/mês',
        credits: 2500,
        maxVideoDuration: 180,
        features: ['2.500 créditos/mês', 'Vídeos de até 3 min', 'Perfeito para criadores de conteúdo'],
    },
    studio: {
        name: 'Studio',
        price: 'R$ 247,00/mês',
        credits: 7000,
        maxVideoDuration: 300,
        features: ['7.000 créditos/mês', 'Vídeos de até 5 min', 'Ideal para agências e equipes'],
    },
};
