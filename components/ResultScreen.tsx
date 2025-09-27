import React, { useState, TouchEvent, useEffect } from 'react';
import type { GeneratedContent, Selections, SavedContentItem } from '../types';
import Button from './common/Button';
import { useNotification } from '../contexts/NotificationContext';
import { FORMAT_CONFIGS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import * as geminiService from '../services/geminiService';
import ImageEditModal from './ImageEditModal';

interface Props {
    content: GeneratedContent;
    onReset: () => void;
    selections: Selections;
}

const ResultScreen: React.FC<Props> = ({ content, onReset, selections }) => {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [currentContent, setCurrentContent] = useState<GeneratedContent>(content);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [editingState, setEditingState] = useState<{ url: string; index: number } | null>(null);


    const formatConfig = selections.format ? FORMAT_CONFIGS[selections.format] : null;
    const isCarousel = selections.format === 'Carrossel' && currentContent.images && currentContent.images.length > 1;
    
    const isVerticalFormat = ['9:16', '3:4', '4:5'].includes(formatConfig?.aspectRatio || '');
    const verticalContainerClass = isVerticalFormat ? 'max-w-sm mx-auto' : '';

    useEffect(() => {
        let isActive = true;
        let createdUrl: string | null = null;

        if (currentContent.videoUrl) {
            setIsVideoLoading(true);
            setVideoBlobUrl(null); // Clear previous video

            const fetchVideo = async () => {
                try {
                    // @ts-ignore
                    const apiKey = import.meta.env?.VITE_API_KEY;
                    if (!apiKey) {
                        throw new Error("Chave de API do Gemini não encontrada para buscar o vídeo.");
                    }
                    const response = await fetch(`${currentContent.videoUrl!}&key=${apiKey}`);
                    if (!response.ok) throw new Error('A resposta da rede não foi ok');

                    const blob = await response.blob();
                    createdUrl = URL.createObjectURL(blob);

                    if (isActive) {
                        setVideoBlobUrl(createdUrl);
                    }
                } catch (error) {
                    console.error("Falha ao buscar o vídeo para pré-visualização:", error);
                    if (isActive) showToast("Erro ao carregar a pré-visualização do vídeo.", "error");
                } finally {
                    if (isActive) setIsVideoLoading(false);
                }
            };

            fetchVideo();
        }

        return () => {
            isActive = false;
            if (createdUrl) {
                URL.revokeObjectURL(createdUrl);
            }
        };
    }, [currentContent.videoUrl, showToast]);


    const handleCopy = (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy);
        showToast('Copiado para a área de transferência!');
    };
    
    const handleDownloadImage = (imageUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `kriative-studio-image-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadVideo = () => {
        if (!videoBlobUrl) {
            showToast('O vídeo ainda não está pronto para download.', 'error');
            return;
        }
        showToast('Iniciando download do vídeo...', 'success');
        const link = document.createElement('a');
        link.href = videoBlobUrl;
        link.download = 'kriative-studio-video.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveContent = () => {
        if (!user) {
            showToast('Você precisa estar logado para salvar o conteúdo.', 'error');
            return;
        }

        const newSavedItem: SavedContentItem = {
            id: `saved_${Date.now()}`,
            selections,
            content: currentContent,
            savedAt: new Date().toISOString(),
        };

        const storageKey = `kriative_studio_saved_content_${user.uid}`;
        let savedContent: SavedContentItem[] = [];

        try {
            const existingContent = localStorage.getItem(storageKey);
            if (existingContent) {
                savedContent = JSON.parse(existingContent);
            }
        } catch (error) {
            console.error("Erro ao analisar conteúdo salvo do localStorage:", error);
            savedContent = [];
        }

        savedContent.unshift(newSavedItem);
        const MAX_SAVED_ITEMS = 10;
        if (savedContent.length > MAX_SAVED_ITEMS) {
            savedContent = savedContent.slice(0, MAX_SAVED_ITEMS);
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(savedContent));
            showToast('Salvo! Agende em "Minhas Criações".');
        } catch (error) {
            console.error('Falha ao salvar conteúdo no localStorage:', error);
            showToast('Erro ao salvar: o conteúdo é muito grande para a galeria.', 'error');
        }
    };

    const handleRegenerateImage = async (prompt: string) => {
        if (!editingState) return;

        try {
            const newImageUrl = await geminiService.editImage(editingState.url, prompt);
            
            const newImages = [...currentContent.images];
            newImages[editingState.index] = newImageUrl;

            setCurrentContent(prev => ({
                ...prev,
                images: newImages,
            }));
            
            showToast('Imagem atualizada com sucesso!', 'success');
            setEditingState(null);
        } catch (error) {
            console.error("Erro ao regenerar imagem:", error);
            showToast(error instanceof Error ? error.message : 'Falha ao editar a imagem.', 'error');
            throw error;
        }
    };

    const prevSlide = () => {
        if (!currentContent.images) return;
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? currentContent.images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const nextSlide = () => {
        if (!currentContent.images) return;
        const isLastSlide = currentIndex === currentContent.images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };
    
    const minSwipeDistance = 50;
    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    const onTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) nextSlide();
        else if (isRightSwipe) prevSlide();
        setTouchStart(null);
        setTouchEnd(null);
    };


    const ConfigurationSummary: React.FC<{ selections: Selections }> = ({ selections }) => (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Resumo da Configuração</h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                <p><strong className="font-semibold text-gray-900 dark:text-gray-100">Plataforma:</strong> {selections.platform}</p>
                <p><strong className="font-semibold text-gray-900 dark:text-gray-100">Estilo:</strong> {selections.style}</p>
                <p><strong className="font-semibold text-gray-900 dark:text-gray-100">Formato:</strong> {selections.format}</p>
                {selections.visualStyle && <p><strong className="font-semibold text-gray-900 dark:text-gray-100">Estilo Visual:</strong> {selections.visualStyle}</p>}
                {currentContent.duration && <p><strong className="font-semibold text-gray-900 dark:text-gray-100">Duração:</strong> {currentContent.duration}s</p>}
            </div>
        </div>
    );

    return (
        <>
            <div className="max-w-6xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-10 border border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-[#008080] dark:text-teal-400">Seu Conteúdo está Pronto!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Aqui está o que nossa IA criou para você. Explore, copie e use!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b-2 border-[#ff8c00] pb-2">
                           {currentContent.videoUrl ? 'Vídeo Gerado' : 'Visuais Gerados'}
                        </h2>
                        {currentContent.videoUrl ? (
                            <div className="space-y-4">
                                 <div className={`w-full rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${verticalContainerClass}`} style={{ aspectRatio: (formatConfig?.aspectRatio || '16:9').replace(':', ' / ') }}>
                                    {isVideoLoading ? (
                                        <div className="text-center text-gray-500 dark:text-gray-400">
                                            <i className="fa-solid fa-spinner fa-spin text-4xl"></i>
                                            <p className="mt-2 font-semibold">Carregando pré-visualização...</p>
                                        </div>
                                    ) : videoBlobUrl ? (
                                        <video key={videoBlobUrl} controls className="w-full h-full rounded-lg">
                                            <source src={videoBlobUrl} type="video/mp4" />
                                            Seu navegador não suporta a tag de vídeo.
                                        </video>
                                    ) : (
                                        <div className="text-center text-red-500">
                                            <i className="fa-solid fa-video-slash text-4xl"></i>
                                            <p className="mt-2 font-semibold">Falha ao carregar o vídeo.</p>
                                        </div>
                                    )}
                                </div>
                                <Button onClick={handleDownloadVideo} variant="secondary" className="w-full" disabled={!videoBlobUrl}>
                                    <i className="fa-solid fa-download mr-2"></i> Baixar Vídeo
                                </Button>
                            </div>
                        ) : currentContent.storyboards && currentContent.storyboards.length > 0 ? (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                                {currentContent.storyboards.map((page, pageIndex) => (
                                    <div key={pageIndex} className="p-4 bg-white dark:bg-gray-800 rounded shadow-sm">
                                        <h3 className="font-bold mb-2 dark:text-gray-200">Página {pageIndex + 1}</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {page.map((panel, panelIndex) => (
                                                <div key={panelIndex} className="border dark:border-gray-700 rounded">
                                                    <img src={panel.image} alt={`Painel ${panelIndex + 1}`} className="w-full h-auto object-cover rounded-t" />
                                                    <p className="text-xs p-1 bg-gray-50 dark:bg-gray-700 dark:text-gray-300 rounded-b">{panel.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : isCarousel && currentContent.images ? (
                            <div 
                                className="relative w-full max-w-lg mx-auto group"
                                style={{ aspectRatio: (formatConfig?.aspectRatio || '1:1').replace(':', ' / ') }}
                                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                            >
                                <div className="overflow-hidden rounded-lg h-full shadow-lg bg-gray-100 dark:bg-gray-900">
                                    <div className="flex transition-transform duration-700 ease-in-out h-full" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                                        {currentContent.images.map((img, index) => (
                                            <img key={index} src={img} alt={`Carousel content ${index + 1}`} className="w-full h-full object-cover flex-shrink-0" />
                                        ))}
                                    </div>
                                </div>
                                <button onClick={prevSlide} className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-black/40 text-white w-10 h-10 rounded-full transition-opacity focus:outline-none flex items-center justify-center hover:bg-black/60">
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <button onClick={nextSlide} className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-black/40 text-white w-10 h-10 rounded-full transition-opacity focus:outline-none flex items-center justify-center hover:bg-black/60">
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                                <div className="absolute top-3 right-3 flex space-x-2">
                                    <button onClick={() => setEditingState({ url: currentContent.images[currentIndex], index: currentIndex })} className="bg-black/40 text-white w-10 h-10 rounded-full transition-opacity focus:outline-none flex items-center justify-center hover:bg-black/60" title="Editar Imagem">
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                    <button onClick={() => handleDownloadImage(currentContent.images[currentIndex], currentIndex)} className="bg-black/40 text-white w-10 h-10 rounded-full transition-opacity focus:outline-none flex items-center justify-center hover:bg-black/60" title="Baixar Imagem">
                                        <i className="fa-solid fa-download"></i>
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                                    {currentContent.images.map((_, index) => (
                                        <button key={index} onClick={() => setCurrentIndex(index)} className={`w-3 h-3 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50 hover:bg-white'}`}></button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {currentContent.images && currentContent.images.map((img, index) => (
                                     <div key={index} className={`relative group overflow-hidden rounded-lg shadow-md bg-gray-100 dark:bg-gray-700 ${verticalContainerClass}`} style={{ aspectRatio: (formatConfig?.aspectRatio || '1:1').replace(':', ' / ') }}>
                                        <img src={img} alt={`Generated content ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex justify-end items-center space-x-3">
                                            <button onClick={() => setEditingState({ url: img, index })} className="text-white text-xl hover:text-yellow-400 transition-colors" title="Editar Imagem"><i className="fa-solid fa-pencil"></i></button>
                                            <button onClick={() => handleDownloadImage(img, index)} className="text-white text-xl hover:text-[#39ff14] transition-colors" title="Baixar Imagem"><i className="fa-solid fa-download"></i></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <ConfigurationSummary selections={selections} />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Copy (Texto)</h2>
                            <div className="relative p-4 bg-teal-50 dark:bg-teal-900/50 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                <p>{currentContent.copy}</p>
                                <button onClick={() => handleCopy(currentContent.copy)} className="absolute top-2 right-2 text-gray-400 hover:text-[#008080] dark:hover:text-teal-400"><i className="fa-solid fa-copy"></i></button>
                            </div>
                        </div>
                         <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Hashtags</h2>
                            <div className="relative p-4 bg-orange-50 dark:bg-orange-900/50 rounded-lg text-gray-700 dark:text-gray-300">
                                <p className="italic">{currentContent.hashtags}</p>
                                 <button onClick={() => handleCopy(currentContent.hashtags)} className="absolute top-2 right-2 text-gray-400 hover:text-[#ff8c00]"><i className="fa-solid fa-copy"></i></button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center space-y-4">
                     <div className="flex flex-wrap justify-center items-center gap-4">
                        <Button onClick={handleSaveContent} variant="primary"><i className="fa-solid fa-star mr-2"></i> Salvar na Galeria</Button>
                        <Button onClick={onReset} variant="secondary" className="text-lg"><i className="fa-solid fa-plus mr-2"></i> Criar Novo Conteúdo</Button>
                    </div>
                </div>
            </div>
             <ImageEditModal isOpen={!!editingState} imageUrl={editingState?.url || ''} onClose={() => setEditingState(null)} onRegenerate={handleRegenerateImage} />
        </>
    );
};

export default ResultScreen;