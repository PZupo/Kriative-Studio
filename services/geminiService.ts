
// FIX: Added a check to ensure the API key is defined, providing a clear error message to the developer if it's missing.
// FIX: Export API_KEY so other modules can use it without referencing process.env.
export const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY não encontrada. Por favor, crie um arquivo .env na raiz do projeto e adicione a linha: API_KEY=SUA_CHAVE_DE_API_AQUI");
}

import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Selections, GeneratedContent, MangaPanel, AIPlan } from '../types';
import { FORMAT_CONFIGS, VIDEO_FORMATS } from "../constants";

const ai = new GoogleGenAI({ apiKey: API_KEY });


const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const base64ToGenerativePart = (base64: string, mimeType: string = 'image/png') => {
    const data = base64.startsWith('data:') ? base64.split(',')[1] : base64;
    return {
        inlineData: { data, mimeType }
    };
};

// FIX: Added a robust JSON parsing function to handle potential markdown fences and whitespace from the API response.
const parseJsonResponse = (responseText: string) => {
    try {
        const cleanJsonString = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
        return JSON.parse(cleanJsonString);
    } catch (e) {
        console.error("Failed to parse JSON from response:", responseText);
        throw new Error("A IA retornou uma resposta de texto inválida.");
    }
};


class GeminiService {
    async generateContent(selections: Selections): Promise<GeneratedContent> {
        if (selections.style === 'Estilo Mangá') {
            return this.generateManga(selections);
        }
        if (selections.format && VIDEO_FORMATS.includes(selections.format)) {
            return this.generateVideo(selections);
        }
        return this.generateImagePost(selections);
    }

    private async generateImagePost(selections: Selections): Promise<GeneratedContent> {
        const { prompt, visualStyle, format, quantity, platform } = selections;
        const formatConfig = format ? FORMAT_CONFIGS[format] : { aspectRatio: '1:1' };

        const textPrompt = `
            Você é um especialista em marketing de mídia social. Crie um post para ${platform}.
            O post deve ser sobre: "${prompt}".
            O estilo visual é: ${visualStyle}.
            O formato da imagem deve ser com a proporção ${formatConfig.aspectRatio}.

            Sua resposta DEVE ser um JSON com a seguinte estrutura:
            {
                "copy": "Um texto criativo e engajador para a legenda do post, com emojis relevantes. Use no máximo 200 caracteres.",
                "hashtags": "Uma string com 5 a 7 hashtags relevantes, separadas por espaços."
            }
        `;

        const imageGenerationPrompt = `
            Crie uma imagem com a proporção de ${formatConfig.aspectRatio} para um post sobre "${prompt}".
            O estilo visual deve ser: ${visualStyle}.
            A imagem deve ser de alta qualidade, fotorealista e impactante.
        `;

        const textPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: textPrompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const imagePromises = [];
        for (let i = 0; i < quantity; i++) {
            imagePromises.push(
                ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: imageGenerationPrompt,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: formatConfig.aspectRatio,
                        outputMimeType: 'image/png',
                    }
                })
            );
        }

        const [textResponse, ...imageResponses] = await Promise.all([textPromise, ...imagePromises]);
        
        const textResult = parseJsonResponse(textResponse.text);
        const images = imageResponses.map(res => {
            const base64ImageBytes: string = res.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        });

        return {
            images,
            copy: textResult.copy,
            hashtags: textResult.hashtags,
        };
    }
    
    private async generateVideo(selections: Selections): Promise<GeneratedContent> {
        const { prompt, visualStyle, platform, duration, imagePrompt } = selections;

        const textPrompt = `
            Você é um roteirista de vídeos curtos para ${platform}. Crie um roteiro e uma legenda para um vídeo de ${duration} segundos.
            O vídeo é sobre: "${prompt}".
            O estilo visual é: ${visualStyle}.
            
            Sua resposta DEVE ser um JSON com a seguinte estrutura:
            {
                "copy": "Um texto criativo e engajador para a legenda do post, com emojis. Máximo 200 caracteres.",
                "hashtags": "Uma string com 5 a 7 hashtags relevantes, separadas por espaços."
            }
        `;
        
        const videoPrompt = `Um vídeo cinematográfico de ${duration} segundos sobre: ${prompt}. Estilo: ${visualStyle}.`;
        
        const textPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: textPrompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const videoRequest: any = {
            model: 'veo-2.0-generate-001',
            prompt: videoPrompt,
            config: { numberOfVideos: 1 }
        };

        if (imagePrompt) {
            const part = await fileToGenerativePart(imagePrompt);
            videoRequest.image = {
                imageBytes: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }

        let operation = await ai.models.generateVideos(videoRequest);
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed to produce a download link.");
        
        const textResponse = await textPromise;
        
        const textResult = parseJsonResponse(textResponse.text);
        return {
            images: [],
            videoUrl: downloadLink,
            duration,
            copy: textResult.copy,
            hashtags: textResult.hashtags,
        };
    }

    private async generateManga(selections: Selections): Promise<GeneratedContent> {
        const { prompt, visualStyle, quantity, platform } = selections;
        
        const storyPrompt = `
            Você é um mangaká (criador de mangá). Crie uma história curta para uma revista de ${quantity} páginas para a plataforma ${platform}.
            O tema da história é: "${prompt}".
            O estilo visual é ${visualStyle}, mas adaptado para um formato de mangá/quadrinhos.
            Para cada página, descreva 2 painéis (imagens) que contam a história visualmente.
            Para cada painel, inclua um texto curto (diálogo ou narração).
            Sua resposta DEVE ser um JSON com a seguinte estrutura:
            {
                "copy": "Um texto de introdução para o post da revista.",
                "hashtags": "Uma string com 5 hashtags sobre mangá e o tema.",
                "pages": [
                    {
                        "page": 1,
                        "panels": [
                            {"image_description": "Descrição detalhada da imagem para o painel 1", "text": "Texto para o painel 1"},
                            {"image_description": "Descrição detalhada da imagem para o painel 2", "text": "Texto para o painel 2"}
                        ]
                    }
                ]
            }
        `;

        const storyResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: storyPrompt,
            config: { responseMimeType: 'application/json' },
        });
        
        const story = parseJsonResponse(storyResponse.text);
        const allPanelDescriptions = story.pages.flatMap((p: any) => p.panels.map((panel: any) => panel.image_description));
        
        const imagePromises = allPanelDescriptions.map((desc: string) => 
            ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `${desc}, estilo de mangá preto e branco, ${visualStyle}`,
                config: {
                    numberOfImages: 1,
                    aspectRatio: '3:4',
                    outputMimeType: 'image/png'
                }
            })
        );
        
        const imageResponses = await Promise.all(imagePromises);
        const generatedImages = imageResponses.map(res => `data:image/png;base64,${res.generatedImages[0].image.imageBytes}`);

        let imageCounter = 0;
        const storyboards: MangaPanel[][] = story.pages.map((page: any) => {
            return page.panels.map((panel: any) => ({
                image: generatedImages[imageCounter++],
                text: panel.text,
            }));
        });

        return {
            images: [],
            copy: story.copy,
            hashtags: story.hashtags,
            storyboards,
        };
    }

    async generateProfessionalPrompt(selections: Selections): Promise<string> {
        const { prompt, platform, format, visualStyle } = selections;
        const request = `
          Você é um especialista em engenharia de prompt para IAs generativas de imagem.
          Melhore o seguinte prompt de usuário para gerar um conteúdo visualmente incrível.
          Adicione detalhes sobre composição, iluminação, cores e atmosfera.
          O conteúdo é para a plataforma ${platform}, no formato ${format}, com estilo visual ${visualStyle}.
          
          Prompt do usuário: "${prompt}"

          Retorne APENAS o prompt melhorado, sem nenhuma outra formatação ou texto.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: request,
        });

        return response.text.trim();
    }
    
    async editImage(base64ImageUrl: string, prompt: string): Promise<string> {
        const imagePart = base64ToGenerativePart(base64ImageUrl);
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [imagePart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePartResponse = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

        if (!imagePartResponse || !imagePartResponse.inlineData) {
            throw new Error("A IA não retornou uma imagem editada.");
        }

        const base64ImageBytes: string = imagePartResponse.inlineData.data;
        return `data:${imagePartResponse.inlineData.mimeType};base64,${base64ImageBytes}`;
    }

    async getAIContentPlan(topic: string): Promise<AIPlan> {
        const prompt = `
            Você é um estrategista de mídias sociais. Crie um plano de conteúdo para o nicho de "${topic}".
            O plano deve incluir:
            1. Uma lista de 5 temas de conteúdo criativos e engajadores.
            2. Uma sugestão de melhores horários para postar para Instagram, TikTok e YouTube.

            Sua resposta DEVE ser um JSON com a seguinte estrutura:
            {
                "themes": ["Tema 1", "Tema 2", "Tema 3", "Tema 4", "Tema 5"],
                "schedule": {
                    "Instagram": ["Segunda-feira, 11:00", "Quarta-feira, 14:00"],
                    "TikTok": ["Terça-feira, 19:00", "Sexta-feira, 20:00"],
                    "YouTube": ["Sábado, 12:00"]
                }
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
        });
        
        return parseJsonResponse(response.text);
    }
}

export const geminiService = new GeminiService();
