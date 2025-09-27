// FIX: Implemented the full geminiService to resolve module and import errors.
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Selections, GeneratedContent, MangaPanel, AIPlan } from '../types';
import { FORMAT_CONFIGS } from "../constants";

// @ts-ignore
const API_KEY = import.meta.env?.VITE_API_KEY;

export const isGeminiConfigured = !!API_KEY;

const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Helper function to convert File object to base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove data:image/jpeg;base64, part
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

export const generateContent = async (selections: Selections): Promise<GeneratedContent> => {
    if (!ai) {
        // Fallback for demo mode
        console.warn("Gemini API not configured. Returning mock data.");
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            images: ['https://placehold.co/1080x1080/008080/FFF?text=Demo+Image+1', 'https://placehold.co/1080x1080/ff8c00/FFF?text=Demo+Image+2'],
            copy: "Este é um texto de exemplo gerado no modo de demonstração. Configure sua chave de API do Gemini para obter resultados reais.",
            hashtags: "#demo #placeholder #kriativestudio",
        };
    }

    const { format, style } = selections;
    const formatConfig = format ? FORMAT_CONFIGS[format] : null;

    if (style === 'Estilo Mangá') {
        if (format === 'Revista') {
            return generateMangaMagazine(selections);
        }
        if (format === 'Vídeo Animado') {
            return generateMangaVideo(selections);
        }
    }

    if (formatConfig?.isVideo) {
        return generateVideo(selections);
    }

    return generateImageContent(selections);
};

const generateImageContent = async (selections: Selections): Promise<GeneratedContent> => {
    if (!ai) throw new Error("Gemini not configured.");
    const { visualStyle, prompt, quantity, format } = selections;
    const formatConfig = format ? FORMAT_CONFIGS[format] : null;

    const fullPrompt = `Crie uma imagem no estilo ${visualStyle}. A imagem deve ser sobre: "${prompt}".`;

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: quantity,
            aspectRatio: formatConfig?.aspectRatio || '1:1',
            outputMimeType: 'image/png'
        }
    });

    const images = imageResponse.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);

    const textPrompt = `Crie uma legenda para post de rede social e hashtags relevantes para uma imagem sobre: "${prompt}". A legenda deve ser curta e envolvente. Separe a legenda das hashtags com '---'.`;
    
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt
    });

    const [copy, hashtags] = textResponse.text.split('---');

    return {
        images,
        copy: copy ? copy.trim() : `Confira esta incrível imagem sobre ${prompt}!`,
        hashtags: hashtags ? hashtags.trim() : `#${prompt.split(' ')[0]}`,
    };
};

const generateVideo = async (selections: Selections): Promise<GeneratedContent> => {
    if (!ai) throw new Error("Gemini not configured.");
    const { visualStyle, prompt, duration, imagePrompt, format } = selections;
    const formatConfig = format ? FORMAT_CONFIGS[format] : null;
    const aspectRatio = formatConfig?.aspectRatio || '16:9'; // Default to horizontal if not specified
    
    const fullPrompt = `Crie um vídeo no estilo ${visualStyle}, com uma proporção de tela de ${aspectRatio}. O vídeo deve ser sobre: "${prompt}". Duração de ${duration} segundos.`;
    
    let operation;
    if (imagePrompt) {
        const base64Image = await fileToBase64(imagePrompt);
        operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: fullPrompt,
            image: {
                imageBytes: base64Image,
                mimeType: imagePrompt.type,
            },
            config: {
                numberOfVideos: 1,
            }
        });
    } else {
        operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfVideos: 1,
            }
        });
    }
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUrl = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!videoUrl) {
        throw new Error("Falha ao gerar o vídeo. Nenhum URL retornado.");
    }
    
    const textPrompt = `Crie uma legenda para post de rede social e hashtags relevantes para um vídeo sobre: "${prompt}". A legenda deve ser curta e envolvente. Separe a legenda das hashtags com '---'.`;
    
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt
    });

    const [copy, hashtags] = textResponse.text.split('---');

    return {
        images: [],
        copy: copy ? copy.trim() : `Confira este incrível vídeo sobre ${prompt}!`,
        hashtags: hashtags ? hashtags.trim() : `#${prompt.split(' ')[0]}`,
        videoUrl,
        duration: selections.duration
    };
};

const generateMangaMagazine = async (selections: Selections): Promise<GeneratedContent> => {
    if (!ai) throw new Error("Gemini not configured.");
    const { prompt, quantity } = selections;

    const storyPrompt = `Crie uma história de mangá curta e emocionante com base no seguinte tema: "${prompt}". A história deve ser dividida em ${quantity} páginas. Para cada página, descreva de 3 a 4 painéis (quadrinhos), cada um com uma breve descrição da cena e um diálogo ou narração curta. Use o formato:
    PÁGINA X:
    Painel 1: [Descrição da cena] | Texto: [Diálogo/Narração]
    Painel 2: [Descrição da cena] | Texto: [Diálogo/Narração]
    ...`;

    const storyResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: storyPrompt
    });

    const storyText = storyResponse.text;
    const pagesText = storyText.split(/PÁGINA \d+:/).filter(p => p.trim() !== '');

    const storyboards: MangaPanel[][] = [];

    for (const pageText of pagesText) {
        const panelsText = pageText.split(/Painel \d+:/).filter(p => p.trim() !== '');
        const pagePanels: MangaPanel[] = [];
        
        for (const panelText of panelsText) {
            const [description, text] = panelText.split('| Texto:');
            if (description && text) {
                 const imagePrompt = `Estilo mangá preto e branco, dramático: ${description.trim()}`;
                 const imageResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: imagePrompt,
                    config: { numberOfImages: 1, aspectRatio: '3:4', outputMimeType: 'image/png' }
                });
                const imageUrl = `data:image/png;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
                pagePanels.push({ image: imageUrl, text: text.trim() });
            }
        }
        storyboards.push(pagePanels);
    }

    const textPrompt = `Crie um breve resumo e hashtags para uma revista de mangá sobre: "${prompt}". Separe o resumo das hashtags com '---'.`;
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt
    });
    
    const [copy, hashtags] = textResponse.text.split('---');

    return {
        images: [],
        copy: copy ? copy.trim() : `Uma emocionante história de mangá sobre ${prompt}!`,
        hashtags: hashtags ? hashtags.trim() : `#manga #${prompt.split(' ')[0]}`,
        storyboards,
    };
};

const generateMangaVideo = async (selections: Selections): Promise<GeneratedContent> => {
     if (!ai) throw new Error("Gemini not configured.");
    const { prompt, duration } = selections;
    const videoPrompt = `Crie um vídeo de anime com base na seguinte história: "${prompt}". O vídeo deve ter um estilo de mangá animado, com legendas e uma narração dramática. Duração de ${duration} segundos.`;

    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: videoPrompt,
        config: { numberOfVideos: 1 }
    });
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUrl = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!videoUrl) {
        throw new Error("Falha ao gerar o vídeo de mangá.");
    }

    const textPrompt = `Crie uma legenda para post de rede social e hashtags relevantes para um vídeo de mangá animado sobre: "${prompt}". Separe a legenda das hashtags com '---'.`;
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt
    });

    const [copy, hashtags] = textResponse.text.split('---');

    return {
        images: [],
        copy: copy ? copy.trim() : `Uma emocionante animação sobre ${prompt}!`,
        hashtags: hashtags ? hashtags.trim() : `#manga #anime #${prompt.split(' ')[0]}`,
        videoUrl,
        duration,
    };
};

export const editImage = async (base64ImageDataUrl: string, prompt: string): Promise<string> => {
    if (!ai) throw new Error("Gemini not configured.");
    
    const [header, base64Data] = base64ImageDataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [imagePart, textPart]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const newBase64 = part.inlineData.data;
            const newMimeType = part.inlineData.mimeType;
            return `data:${newMimeType};base64,${newBase64}`;
        }
    }

    throw new Error("A IA não retornou uma imagem editada.");
};

export const generateProfessionalPrompt = async (selections: Selections): Promise<string> => {
    if (!ai) return "Modo de demonstração: Um gato astronauta em um fundo cósmico.";
    
    const { platform, style, format, visualStyle, prompt } = selections;

    const request = `Aja como um especialista em engenharia de prompts para IA de geração de imagem. Melhore o seguinte prompt do usuário para gerar um resultado de alta qualidade, detalhado e visualmente impressionante.
    
    **Contexto:**
    - Plataforma: ${platform}
    - Estilo Geral: ${style}
    - Formato: ${format}
    - Estilo Visual: ${visualStyle}
    
    **Prompt do Usuário:** "${prompt}"
    
    **Sua Tarefa:**
    Reescreva o prompt do usuário em um prompt profissional e detalhado em inglês. Adicione detalhes sobre composição, iluminação, paleta de cores, emoção, e detalhes específicos do estilo visual. O prompt deve ser otimizado para um modelo de geração de imagem como o Imagen. Retorne APENAS o prompt aprimorado.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: request
    });

    return response.text.trim();
};

export const getAIContentPlan = async (topic: string): Promise<AIPlan> => {
    if (!ai) {
        // Fallback for demo mode
        return {
            themes: ["5 receitas fáceis (Demo)", "Benefícios para a saúde (Demo)", "Como começar (Demo)"],
            schedule: {
                Instagram: ["Seg 09:00", "Qua 12:00", "Sex 18:00 (Demo)"],
                TikTok: ["Ter 20:00", "Qui 21:00 (Demo)"],
                YouTube: ["Sáb 11:00 (Demo)"],
            }
        };
    }
    
    const prompt = `Crie um plano de conteúdo semanal simples para um criador focado no nicho de "${topic}".
    O plano deve incluir:
    1. Uma lista de 3 a 5 temas de conteúdo (ex: "5 dicas para iniciantes", "Mito vs Verdade sobre X").
    2. Uma sugestão de melhores horários de postagem para Instagram, TikTok e YouTube.

    Formate a resposta EXATAMENTE como o seguinte JSON:
    {
        "themes": ["tema 1", "tema 2", ...],
        "schedule": {
            "Instagram": ["Dia HH:MM", "Dia HH:MM", ...],
            "TikTok": ["Dia HH:MM", ...],
            "YouTube": ["Dia HH:MM", ...]
        }
    }`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    themes: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    schedule: {
                        type: Type.OBJECT,
                        properties: {
                            Instagram: { type: Type.ARRAY, items: { type: Type.STRING } },
                            TikTok: { type: Type.ARRAY, items: { type: Type.STRING } },
                            YouTube: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["Instagram", "TikTok", "YouTube"]
                    }
                },
                required: ["themes", "schedule"]
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AIPlan;
    } catch (e) {
        console.error("Failed to parse AI plan JSON:", e);
        throw new Error("A IA retornou um plano em formato inválido.");
    }
};