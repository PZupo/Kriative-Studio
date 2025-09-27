import { GoogleGenAI, Modality } from "@google/genai";
import type { Selections, GeneratedContent, MangaPanel, AIPlan } from '../types';
import { FORMAT_CONFIGS, VIDEO_FORMATS } from "../constants";

// @ts-ignore
const API_KEY = import.meta.env?.VITE_API_KEY;

export const isGeminiConfigured = !!API_KEY;

const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
};

const base64ToGenerativePart = (base64: string, mimeType: string = 'image/png') => {
    const data = base64.startsWith('data:') ? base64.split(',')[1] : base64;
    return { inlineData: { data, mimeType } };
};

const parseJsonResponse = (responseText: string) => {
    try {
        const cleanJsonString = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
        return JSON.parse(cleanJsonString);
    } catch (e) {
        console.error("Falha ao analisar JSON da resposta:", responseText);
        throw new Error("A IA retornou uma resposta de texto inválida.");
    }
};

const getMockContent = async (selections: Selections): Promise<GeneratedContent> => {
    console.error("MODO DE FALHA: A geração de conteúdo foi chamada sem uma chave de API válida.");
    await new Promise(res => setTimeout(res, 500));
    return {
        images: [`https://placehold.co/1080x1080/ff0000/ffffff?text=ERRO:+API+NÃO+CONFIGURADA`],
        copy: "Erro: A API do Google Gemini não está configurada. Por favor, configure as variáveis de ambiente.",
        hashtags: "#erro #configuracao",
    };
};

const generateImagePost = async (selections: Selections): Promise<GeneratedContent> => {
    if (!ai) throw new Error("Cliente de IA Gemini não inicializado.");

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
    
    const imagePromises = Array.from({ length: quantity }, () => 
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

    const [textResponse, ...imageResponses] = await Promise.all([textPromise, ...imagePromises]);
    
    const textResult = parseJsonResponse(textResponse.text);
    const images = imageResponses.map(res => {
        const base64ImageBytes: string = res.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    });

    return { images, copy: textResult.copy, hashtags: textResult.hashtags };
};

const generateVideo = async (selections: Selections): Promise<GeneratedContent> => {
    if (!ai) throw new Error("Cliente de IA Gemini não inicializado.");

    const { prompt, visualStyle, platform, duration, imagePrompt } = selections;
    
    const videoPrompt = `Um vídeo cinematográfico de ${duration} segundos sobre: ${prompt}. Estilo: ${visualStyle}.`;
    
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
    if (!downloadLink) throw new Error("A geração de vídeo falhou em produzir um link de download.");
    
    const textPrompt = `
        Você é um roteirista de vídeos curtos para ${platform}. Crie um roteiro e uma legenda para um vídeo de ${duration} segundos.
        O vídeo é sobre: "${prompt}". O estilo visual é: ${visualStyle}.
        Sua resposta DEVE ser um JSON com a seguinte estrutura:
        {"copy": "...", "hashtags": "..."}
    `;
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt,
        config: { responseMimeType: 'application/json' }
    });
    const textResult = parseJsonResponse(textResponse.text);

    return {
        images: [],
        videoUrl: downloadLink,
        duration,
        copy: textResult.copy,
        hashtags: textResult.hashtags,
    };
};

const generateManga = async (selections: Selections): Promise<GeneratedContent> => {
     if (!ai) throw new Error("Cliente de IA Gemini não inicializado.");

    const { prompt, visualStyle, quantity, platform } = selections;
    
    const storyPrompt = `
        Você é um mangaká. Crie uma história curta para uma revista de ${quantity} páginas para ${platform}.
        Tema: "${prompt}". Estilo: ${visualStyle}.
        Para cada página, descreva 2 painéis com texto.
        Sua resposta DEVE ser um JSON com a seguinte estrutura:
        {"copy": "...", "hashtags": "...", "pages": [{"page": 1, "panels": [{"image_description": "...", "text": "..."}, ... ]}]}
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
            config: { numberOfImages: 1, aspectRatio: '3:4', outputMimeType: 'image/png' }
        })
    );
    
    const imageResponses = await Promise.all(imagePromises);
    const generatedImages = imageResponses.map(res => `data:image/png;base64,${res.generatedImages[0].image.imageBytes}`);

    let imageCounter = 0;
    const storyboards: MangaPanel[][] = story.pages.map((page: any) => 
        page.panels.map((panel: any) => ({
            image: generatedImages[imageCounter++],
            text: panel.text,
        }))
    );

    return { images: [], copy: story.copy, hashtags: story.hashtags, storyboards };
};

export const generateContent = async (selections: Selections): Promise<GeneratedContent> => {
    if (!ai) return getMockContent(selections);

    if (selections.style === 'Estilo Mangá') {
        return generateManga(selections);
    }
    if (selections.format && VIDEO_FORMATS.includes(selections.format)) {
        return generateVideo(selections);
    }
    return generateImagePost(selections);
};

export const generateProfessionalPrompt = async (selections: Selections): Promise<string> => {
    if (!ai) return "Erro: API não configurada.";

    const { prompt, platform, format, visualStyle } = selections;
    const request = `Melhore este prompt para IA de imagem: "${prompt}". Detalhes: plataforma ${platform}, formato ${format}, estilo ${visualStyle}. Retorne APENAS o prompt.`;

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: request });
    return response.text.trim();
};

export const editImage = async (base64ImageUrl: string, prompt: string): Promise<string> => {
    if (!ai) throw new Error("API não configurada.");

    const imagePart = base64ToGenerativePart(base64ImageUrl);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (!imagePartResponse || !imagePartResponse.inlineData) throw new Error("A IA não retornou uma imagem editada.");

    const base64ImageBytes: string = imagePartResponse.inlineData.data;
    return `data:${imagePartResponse.inlineData.mimeType};base64,${base64ImageBytes}`;
};

export const getAIContentPlan = async (topic: string): Promise<AIPlan> => {
    if (!ai) throw new Error("API não configurada.");

    const prompt = `Crie um plano de conteúdo para "${topic}". Responda em JSON: {"themes": ["..."], "schedule": {"Instagram": ["..."]}}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
    });
    
    return parseJsonResponse(response.text);
};