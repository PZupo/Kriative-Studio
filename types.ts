// FIX: Defined PlanKey as a string literal union to break a circular type dependency with constants.ts.
// This resolves the 'circularly references itself' error and subsequent type resolution issues in other files.
export type PlanKey = 'pro' | 'studio' | 'associado';

export interface User {
    uid: string;
    name: string;
    email: string;
    plan: PlanKey;
    credits: number;
    mangaGenerations: number;
}

export type Platform = 'Instagram' | 'TikTok' | 'YouTube' | null;
export type Style = 'Padrão' | 'Estilo Mangá' | null;
export type Format = string | null; // Formats are dynamic based on platform
export type VisualStyle = 'Realista' | 'Disney' | 'Pixar' | 'Studio Ghibli' | 'Cartoon' | 'Aquarela' | 'Minimalista' | 'Vintage' | null;
export type InputType = 'Prompt de Texto' | 'Prompt de Imagem' | null;

export interface Selections {
    platform: Platform;
    style: Style;
    format: Format;
    visualStyle: VisualStyle;
    inputType: InputType;
    prompt: string;
    imagePrompt: File | null;
    quantity: number;
    duration: number;
}

export interface MangaPanel {
    image: string; // base64 data URL
    text: string;
}

export interface GeneratedContent {
    images: string[]; // array of base64 data URLs
    copy: string;
    hashtags: string;
    storyboards?: MangaPanel[][]; // For Manga style
    videoUrl?: string; // URL to the generated video
    duration?: number;
}

export interface SavedContentItem {
    id: string;
    selections: Selections;
    content: GeneratedContent;
    savedAt: string; // ISO string
    scheduledAt?: string; // ISO string
}

export interface AIPlan {
    themes: string[];
    schedule: {
      [platform: string]: string[];
    };
}