import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Selections, GeneratedContent } from '../types';
import { FORMAT_CONFIGS, FormatConfig } from '../constants';

// Initialize the Google AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to a GoogleGenerativeAI.Part object
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

const getAspectRatioDescription = (aspectRatio: string, isVideo: boolean = false): string => {
    const type = isVideo ? 'vídeo' : 'imagem';
    switch (aspectRatio) {
        case '9:16':
            return `um ${type} vertical (proporção 9:16), ideal para celular`;
        case '3:4':
        case '4:5':
            return `um ${type} vertical (proporção ${aspectRatio})`;
        case '16:9':
            return `um ${type} horizontal (proporção 16:9), widescreen`;
        case '1:1':
            return `um ${type} quadrado (proporção 1:1)`;
        default:
            return `um ${type} com proporção ${aspectRatio}`;
    }
};


// --- Main Content Generation Logic ---
const generateContent = async (selections: Selections): Promise<GeneratedContent> => {
    console.log("Calling real AI content generation with selections:", selections);
    
    const formatConfig = selections.format ? FORMAT_CONFIGS[selections.format] : null;
    if (!formatConfig) {
        throw new Error(`Configuration for format "${selections.format}" not found.`);
    }

    // Branching logic based on selection type
    if (formatConfig.isVideo) {
        return generateVideoContent(selections, formatConfig);
    }
    if (selections.style === 'Estilo Mangá') {
        return generateMangaContent(selections, formatConfig);
    }
    if (selections.inputType === 'Prompt de Imagem' && selections.imagePrompt) {
        return generateEditedImageContent(selections, formatConfig);
    }
    return generateStandardImageContent(selections, formatConfig);
};

// --- Specialized Generation Functions ---

// 1. Video Generation (VEO)
const generateVideoContent = async (selections: Selections, formatConfig: FormatConfig): Promise<GeneratedContent> => {
    console.log("Calling VEO API for video generation...");
    const requestedDuration = selections.duration || formatConfig.maxDuration;
    const aspectRatioDesc = getAspectRatioDescription(formatConfig.aspectRatio, true);

    const prompt = `Crie um vídeo profissional para ${selections.platform}, formato ${selections.format}. O vídeo DEVE ser ${aspectRatioDesc}. O vídeo DEVE OBRIGATORIAMENTE incluir uma trilha sonora de fundo vibrante e apropriada ao tema. O áudio é um requisito essencial. Duração aproximada de ${requestedDuration} segundos. O estilo visual é ${selections.visualStyle}. Ideia principal: "${selections.prompt}"`;

    const imagePart = selections.imagePrompt ? await fileToGenerativePart(selections.imagePrompt) : undefined;
    const image = imagePart ? { imageBytes: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType } : undefined;

    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: image,
        config: { numberOfVideos: 1 }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed, no download link returned.");
    }
    
    const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
    
    const textResponse = await generateCopyAndHashtags(selections);

    return {
        images: [],
        copy: textResponse.copy,
        hashtags: textResponse.hashtags,
        videoUrl: videoUrl,
        duration: requestedDuration,
    };
};

// 2. Manga Generation (Gemini for text, Imagen for panels)
const generateMangaContent = async (selections: Selections, formatConfig: FormatConfig): Promise<GeneratedContent> => {
    console.log("Generating manga content...");
    
    const storyResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create a manga storyboard with ${selections.quantity} pages. The story is about: "${selections.prompt}". For each page, create 3 to 5 panels. Each panel needs a detailed visual 'description' and a short 'dialogue' text. The description should be a prompt for an image generation model.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    pages: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                panels: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            description: { type: Type.STRING },
                                            dialogue: { type: Type.STRING },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const storyData = JSON.parse(storyResponse.text);
    const storyboards: GeneratedContent['storyboards'] = [];

    for (const page of storyData.pages) {
        const pagePanels: { image: string, text: string }[] = [];
        for (const panel of page.panels) {
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `black and white manga panel, dramatic shading, ${panel.description}`,
                config: {
                    numberOfImages: 1,
                    aspectRatio: formatConfig.aspectRatio,
                    outputMimeType: 'image/png',
                },
            });

            if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
                const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                pagePanels.push({ image: imageUrl, text: panel.dialogue });
            }
        }
        storyboards.push(pagePanels);
    }
    
    const textResponse = await generateCopyAndHashtags(selections);

    return {
        images: [],
        copy: textResponse.copy,
        hashtags: textResponse.hashtags,
        storyboards: storyboards
    };
};

// 3. Image Editing (Gemini Nano Banana)
const generateEditedImageContent = async (selections: Selections, formatConfig: FormatConfig): Promise<GeneratedContent> => {
    console.log("Calling Gemini for image editing...");
    const imagePart = await fileToGenerativePart(selections.imagePrompt!);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                imagePart,
                { text: `Edit this image based on the following prompt, maintaining a professional quality. Prompt: "${selections.prompt}"` },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    let imageUrl = '';
    let copy = `Here is the edited image based on your prompt: "${selections.prompt.substring(0, 50)}...".`;
    
    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            } else if (part.text) {
                copy = part.text;
            }
        }
    }

    if (!imageUrl) {
        throw new Error("Image editing failed to return an image.");
    }
    
    const textResponse = await generateCopyAndHashtags(selections);

    return {
        images: [imageUrl],
        copy: copy,
        hashtags: textResponse.hashtags,
    };
};

// 4. Standard Text-to-Image (Imagen)
const generateStandardImageContent = async (selections: Selections, formatConfig: FormatConfig): Promise<GeneratedContent> => {
    console.log("Calling Imagen for text-to-image generation...");
    
    const aspectRatioDesc = getAspectRatioDescription(formatConfig.aspectRatio);

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a high-quality image for ${selections.platform}. It MUST be ${aspectRatioDesc}. Visual Style: ${selections.visualStyle}. The idea is: "${selections.prompt}"`,
        config: {
            numberOfImages: selections.quantity,
            aspectRatio: formatConfig.aspectRatio,
            outputMimeType: 'image/png',
        },
    });

    const generatedImages = imageResponse.generatedImages.map(img => {
        const base64ImageBytes = img.image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    });

    if (generatedImages.length === 0) {
        throw new Error("Image generation failed to return any images.");
    }

    const textResponse = await generateCopyAndHashtags(selections);

    return {
        images: generatedImages,
        copy: textResponse.copy,
        hashtags: textResponse.hashtags,
    };
};


// --- Text Generation Helpers ---
const generateCopyAndHashtags = async (selections: Selections): Promise<{ copy: string, hashtags: string }> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate a compelling social media copy and a list of relevant hashtags for the following concept. The platform is ${selections.platform}. The concept is: "${selections.prompt}". Return the response as a JSON object with two keys: "copy" and "hashtags". Hashtags should be a single string.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    copy: { type: Type.STRING },
                    hashtags: { type: Type.STRING },
                },
            },
        },
    });

    try {
        const result = JSON.parse(response.text);
        return {
            copy: result.copy || "Failed to generate copy.",
            hashtags: result.hashtags || "#error",
        };
    } catch (e) {
        console.error("Failed to parse JSON for copy/hashtags", e);
        return {
            copy: "Our AI created this amazing content for you! ✨",
            hashtags: "#kriativestudio #ai #generatedcontent"
        };
    }
};

const generateProfessionalPrompt = async (selections: Selections): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a professional prompt engineer for AI image generators. Based on the user's simple idea, create a detailed, vivid, and artistic prompt.
            - User's Idea: "${selections.prompt}"
            - Target Platform: ${selections.platform}
            - Desired Visual Style: ${selections.visualStyle || 'any'}
            Generate only the prompt text, without any preamble.`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating professional prompt:", error);
        return `Error generating prompt. Original idea: ${selections.prompt}`;
    }
};

const editImage = async (imageUrl: string, prompt: string): Promise<string> => {
    console.log("Calling Gemini for in-app image editing...");

    const base64Data = imageUrl.split(',')[1];
    if (!base64Data) {
        throw new Error("Invalid image URL format for editing.");
    }
    const mimeType = imageUrl.match(/data:(.*);base64,/)?.[1] || 'image/png';

    const imagePart = {
        inlineData: { data: base64Data, mimeType },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                imagePart,
                { text: `Apply this edit to the image: "${prompt}". Respond only with the modified image.` },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    let newImageUrl = '';
    if (response.candidates && response.candidates.length > 0) {
        const imagePart = response.candidates[0].content.parts.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const newMimeType = imagePart.inlineData.mimeType || 'image/png';
            newImageUrl = `data:${newMimeType};base64,${base64ImageBytes}`;
        }
    }

    if (!newImageUrl) {
        throw new Error("Image editing failed to produce a new image.");
    }

    return newImageUrl;
};


export const geminiService = {
    generateContent,
    generateProfessionalPrompt,
    editImage
};