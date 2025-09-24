
import React, { useState, useEffect } from 'react';
import type { Selections } from '../types';
import { VIDEO_FORMATS } from '../constants';

interface Props {
    selections: Selections;
}

const videoMessages = [
    "Renderizando os frames iniciais...",
    "Sincronizando as trilhas de áudio e vídeo...",
    "Aplicando efeitos visuais de alta fidelidade...",
    "Compilando a linha do tempo do seu vídeo...",
    "A mágica do vídeo leva um tempinho, aguarde...",
    "Estamos quase lá, ajustando os detalhes finais!"
];

const LoadingScreen: React.FC<Props> = ({ selections }) => {
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("Nossa IA está criando algo incrível para você!");

    const isVideo = VIDEO_FORMATS.includes(selections.format || '');

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return 95;
                }
                // Slower progress for video
                const increment = isVideo ? Math.random() * 2 : Math.random() * 10;
                return Math.min(prev + increment, 95);
            });
        }, isVideo ? 500 : 200);

        return () => clearInterval(interval);
    }, [isVideo]);

    useEffect(() => {
        if (isVideo) {
            setMessage(videoMessages[0]);
            let messageIndex = 0;
            const messageInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % videoMessages.length;
                setMessage(videoMessages[messageIndex]);
            }, 3000);
            return () => clearInterval(messageInterval);
        }
    }, [isVideo]);

    return (
        <div className="fixed inset-0 bg-[#f5f5dc] flex flex-col items-center justify-center z-50">
            <div className="text-center">
                <i className={`fa-solid ${isVideo ? 'fa-clapperboard' : 'fa-wand-magic-sparkles'} text-6xl text-[#008080] animate-pulse`}></i>
                <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-2">Gerando o seu {isVideo ? 'vídeo' : 'conteúdo'}...</h2>
                <p className="text-lg text-gray-600 mb-8 transition-opacity duration-500">{message}</p>
                <div className="w-full max-w-md bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                        className="bg-gradient-to-r from-[#39ff14] to-[#008080] h-4 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
