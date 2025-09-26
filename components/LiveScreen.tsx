import React, { useState, useRef, useEffect } from 'react';
// FIX: Removed 'LiveSession' from import as it is not an exported member of '@google/genai'.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useNotification } from '../contexts/NotificationContext';
import Button from './common/Button';
import { isGeminiConfigured } from '../services/geminiService';

// @ts-ignore
const API_KEY = import.meta.env.VITE_API_KEY;
const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// --- Funções de Codificação/Decodificação de Áudio ---
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}
// --- Fim das Funções de Áudio ---

interface TranscriptionEntry {
    speaker: 'user' | 'model';
    text: string;
}

const LiveScreen: React.FC = () => {
    const { showToast } = useNotification();
    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');

    // FIX: The `LiveSession` type is not exported, so using `any` as a fallback for the session promise.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopConversation = () => {
        sessionPromiseRef.current?.then(session => session.close());
        streamRef.current?.getTracks().forEach(track => track.stop());
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        scriptProcessorRef.current?.disconnect();
        
        setIsActive(false);
        setIsConnecting(false);
        sessionPromiseRef.current = null;
        streamRef.current = null;
    };

    useEffect(() => {
        return () => {
            // Cleanup on component unmount
            if(isActive) {
                stopConversation();
            }
        };
    }, [isActive]);

    const startConversation = async () => {
        if (!ai) {
            showToast('API do Gemini não configurada.', 'error');
            return;
        }

        setIsConnecting(true);
        setTranscriptionHistory([]);
        setCurrentInput('');
        setCurrentOutput('');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = inputAudioContext;
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = outputAudioContext;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);

                        setIsConnecting(false);
                        setIsActive(true);
                        showToast('Conectado! Pode começar a falar.', 'success');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcription
                        if (message.serverContent?.inputTranscription) {
                           setCurrentInput(prev => prev + message.serverContent.inputTranscription.text);
                        }
                         if (message.serverContent?.outputTranscription) {
                           setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
                        }
                         if (message.serverContent?.turnComplete) {
                            const fullInput = currentInput + (message.serverContent.inputTranscription?.text || '');
                            const fullOutput = currentOutput + (message.serverContent.outputTranscription?.text || '');

                            setTranscriptionHistory(prev => [
                                ...prev,
                                { speaker: 'user', text: fullInput },
                                { speaker: 'model', text: fullOutput }
                            ]);
                            setCurrentInput('');
                            setCurrentOutput('');
                        }

                        // Handle audio output
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const nextStartTime = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            nextStartTimeRef.current = nextStartTime;

                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);

                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                            });

                            source.start(nextStartTime);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Erro na sessão:', e);
                        showToast('Ocorreu um erro na conexão.', 'error');
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Sessão fechada');
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'Você é um assistente prestativo e amigável chamado Kriative AI.',
                },
            });

        } catch (error) {
            console.error('Falha ao iniciar a conversa:', error);
            showToast('Não foi possível acessar o microfone.', 'error');
            setIsConnecting(false);
        }
    };

    const handleButtonClick = () => {
        if (isActive || isConnecting) {
            stopConversation();
        } else {
            startConversation();
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-10 border border-gray-200 dark:border-gray-700 animate-fade-in">
             <div className="text-center mb-6">
                <h1 className="text-4xl font-extrabold text-[#008080] dark:text-teal-400">Conversa ao Vivo com a IA</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Fale diretamente com a Kriative AI. Clique em "Iniciar" e comece a conversar!</p>
            </div>

            <div className="w-full h-80 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 overflow-y-auto border border-gray-200 dark:border-gray-700 mb-6 flex flex-col space-y-4">
                {transcriptionHistory.map((entry, index) => (
                    <div key={index} className={`p-3 rounded-lg max-w-[80%] ${entry.speaker === 'user' ? 'bg-teal-100 dark:bg-teal-900 self-end' : 'bg-gray-200 dark:bg-gray-700 self-start'}`}>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{entry.text}</p>
                    </div>
                ))}
                 {currentInput && <div className="p-3 rounded-lg max-w-[80%] bg-teal-100/50 dark:bg-teal-900/50 self-end italic text-gray-500 dark:text-gray-400">{currentInput}</div>}
                 {currentOutput && <div className="p-3 rounded-lg max-w-[80%] bg-gray-200/50 dark:bg-gray-700/50 self-start italic text-gray-500 dark:text-gray-400">{currentOutput}</div>}
            </div>
            
            <div className="flex flex-col items-center justify-center space-y-4">
                <Button onClick={handleButtonClick} variant={isActive ? 'danger' : 'primary'} className="w-full max-w-xs text-lg" disabled={isConnecting}>
                    {isConnecting ? (
                        <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Conectando...</>
                    ) : isActive ? (
                        <><i className="fa-solid fa-stop mr-2"></i>Parar Conversa</>
                    ) : (
                        <><i className="fa-solid fa-microphone mr-2"></i>Iniciar Conversa</>
                    )}
                </Button>
                 <div className={`flex items-center space-x-2 text-gray-500 dark:text-gray-400 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Ouvindo...</span>
                </div>
            </div>
        </div>
    );
};

export default LiveScreen;