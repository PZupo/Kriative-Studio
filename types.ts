export interface Selections {
    platform: 'Instagram' | 'TikTok' | 'YouTube' | null;
    style: 'Padrão' | 'Estilo Mangá' | null;
    format: string | null;
    visualStyle: 'Realista' | 'Disney' | 'Pixar' | 'Studio Ghibli' | 'Cartoon' | 'Aquarela' | 'Minimalista' | 'Vintage' | null;
    inputType: 'Prompt de Texto' | 'Prompt de Imagem' | null;
    quantity: number;
    prompt: string;
    imagePrompt: File | null;
    duration?: number;
}

export interface GeneratedContent {
    images: string[];
    copy: string;
    hashtags: string;
    storyboards?: { image: string, text: string }[][];
    videoUrl?: string;
    duration?: number;
}

export interface User {
    uid: string;
    email: string | null;
    name: string | null;
    plan: 'associado' | 'pro' | 'studio'; // Expanded to support multiple subscription plans
    credits: number;
    mangaGenerations: number;
}

export interface SavedContentItem {
    id: string;
    selections: Selections;
    content: GeneratedContent;
    savedAt: string;
}
