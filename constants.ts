import { PlanKey } from "./types";

export const PLATFORMS = ['Instagram', 'TikTok', 'YouTube'];
export const STYLES = ['Padrão', 'Estilo Mangá'];
export const INPUT_TYPES = ['Prompt de Texto', 'Prompt de Imagem'];
export const VISUAL_STYLES = ['Realista', 'Disney', 'Pixar', 'Studio Ghibli', 'Cartoon', 'Aquarela', 'Minimalista', 'Vintage'];

export const VIDEO_FORMATS = ['Reel', 'Vídeo/Post', 'Shorts', 'Vídeo', 'Vídeo Animado'];

export const FORMATS: { [key: string]: string[] } = {
    Instagram: ['Feed', 'Stories', 'Reel', 'Carrossel'],
    TikTok: ['Vídeo/Post'],
    YouTube: ['Shorts', 'Vídeo'],
};

export const MANGA_FORMATS = ['Revista', 'Vídeo Animado'];

interface PlanConfig {
    name: string;
    price: string;
    credits: number;
    maxVideoDuration: number;
    features: string[];
}

export const PLAN_CONFIGS: Record<PlanKey, PlanConfig> = {
    pro: {
        name: 'Plano Pro',
        price: 'R$49/mês (ou R$490/ano)',
        credits: 100,
        maxVideoDuration: 60,
        features: [
            '100 créditos por mês',
            'Criação de imagens e carrosséis',
            'Vídeos de até 60 segundos',
            'Acesso a todos os estilos visuais',
            'Planejador de Conteúdo com IA'
        ],
    },
    studio: {
        name: 'Plano Studio',
        price: 'R$99/mês (ou R$990/ano)',
        credits: 250,
        maxVideoDuration: 180,
        features: [
            '250 créditos por mês',
            'Tudo do Plano Pro',
            'Vídeos de até 180 segundos',
            'Geração de mangá e storyboards',
            'Suporte prioritário',
            'Planejador de Conteúdo com IA',
        ],
    },
    associado: {
        name: 'Plano Associado',
        price: 'R$197/mês (Incluso no Pacote)',
        credits: 600,
        maxVideoDuration: 300,
        features: [
            '600 créditos por mês',
            'Tudo do Plano Studio',
            'Planejador de Conteúdo com IA',
            'Geração de vídeos longos (até 5 min)',
            'Funcionalidades beta exclusivas',
        ],
    },
};

export const FORMAT_CONFIGS: { [key: string]: any } = {
    // Instagram
    'Feed': { aspectRatio: '1:1', isMultiQuantity: false, isVideo: false },
    'Stories': { aspectRatio: '9:16', isMultiQuantity: false, isVideo: false },
    'Reel': { aspectRatio: '9:16', isVideo: true, maxDuration: 90 },
    'Carrossel': { aspectRatio: '1:1', isMultiQuantity: true, maxQuantity: 10, isVideo: false },
    // TikTok
    'Vídeo/Post': { aspectRatio: '9:16', isVideo: true, maxDuration: 180 },
    // YouTube
    'Shorts': { aspectRatio: '9:16', isVideo: true, maxDuration: 60 },
    'Vídeo': { aspectRatio: '16:9', isVideo: true, maxDuration: 300 },
    // Manga
    'Revista': { aspectRatio: '3:4', isMultiQuantity: true, maxQuantity: 20, isVideo: false }, // Pages
    'Vídeo Animado': { aspectRatio: '16:9', isVideo: true, maxDuration: 180 },
};
