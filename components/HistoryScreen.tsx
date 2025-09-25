import React, { useState, useEffect, useCallback } from 'react';
import type { SavedContentItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Button from './common/Button';
import ScheduleModal from './ScheduleModal';
import ConfirmationModal from './common/ConfirmationModal';

type AppView = 'studio' | 'history' | 'calendar';

interface Props {
    onNavigate: (view: AppView) => void;
}

const HistoryScreen: React.FC<Props> = ({ onNavigate }) => {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [items, setItems] = useState<SavedContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [itemToSchedule, setItemToSchedule] = useState<SavedContentItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<SavedContentItem | null>(null);

    const storageKey = `kriative_studio_saved_content_${user?.uid}`;

    const loadItems = useCallback(() => {
        if (!user) return;
        setIsLoading(true);
        try {
            const savedContentJson = localStorage.getItem(storageKey);
            const savedContent: SavedContentItem[] = savedContentJson ? JSON.parse(savedContentJson) : [];
            setItems(savedContent);
        } catch (error) {
            console.error("Failed to load saved content:", error);
            showToast("Erro ao carregar suas criações.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [user, storageKey, showToast]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const updateLocalStorage = (updatedItems: SavedContentItem[]) => {
        localStorage.setItem(storageKey, JSON.stringify(updatedItems));
        setItems(updatedItems);
    };

    const handleConfirmSchedule = (isoDate: string) => {
        if (!itemToSchedule) return;
        const updatedItems = items.map(item =>
            item.id === itemToSchedule.id ? { ...item, scheduledAt: isoDate } : item
        );
        updateLocalStorage(updatedItems);
        showToast("Post agendado com sucesso!", "success");
        setItemToSchedule(null);
    };

    const handleUnschedule = (id: string) => {
        const updatedItems = items.map(item =>
            item.id === id ? { ...item, scheduledAt: undefined } : item
        );
        updateLocalStorage(updatedItems);
        showToast("Agendamento cancelado.", "success");
    };
    
    const handleConfirmDelete = () => {
        if (!itemToDelete) return;
        const updatedItems = items.filter(item => item.id !== itemToDelete.id);
        updateLocalStorage(updatedItems);
        showToast("Criação excluída.", "success");
        setItemToDelete(null);
    };


    const renderItemCard = (item: SavedContentItem) => {
        const preview = item.content.videoUrl || (item.content.images && item.content.images[0]) || (item.content.storyboards && item.content.storyboards[0][0].image);
        const savedDate = new Date(item.savedAt).toLocaleDateString('pt-BR');

        return (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                <div className="relative">
                    {item.content.videoUrl ? (
                         <div className="w-full h-48 bg-black flex items-center justify-center">
                            <i className="fa-solid fa-film text-white text-4xl"></i>
                         </div>
                    ) : (
                        <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                    )}
                    {item.scheduledAt && (
                         <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <i className="fa-solid fa-calendar-check"></i>
                            <span>Agendado</span>
                        </div>
                    )}
                </div>
                <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-lg text-gray-800">{item.selections.format} para {item.selections.platform}</h3>
                    <p className="text-sm text-gray-500">Salvo em: {savedDate}</p>
                    
                    {item.scheduledAt && (
                        <p className="text-sm text-green-700 mt-2 font-semibold">
                           {new Date(item.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                    )}
                    
                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                         {item.scheduledAt ? (
                            <>
                                <Button onClick={() => setItemToSchedule(item)} variant="secondary" className="py-1 px-3 text-sm flex-1">Reagendar</Button>
                                <Button onClick={() => handleUnschedule(item.id)} variant="ghost" className="py-1 px-3 text-sm flex-1">Cancelar</Button>
                            </>
                         ) : (
                             <Button onClick={() => setItemToSchedule(item)} variant="primary" className="py-1 px-3 text-sm flex-1">
                                <i className="fa-solid fa-calendar-alt mr-2"></i>Agendar
                            </Button>
                         )}
                         <button onClick={() => setItemToDelete(item)} className="text-gray-400 hover:text-red-500 p-2 rounded-full transition-colors">
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-[#008080]">Minhas Criações</h1>
                <Button onClick={() => onNavigate('studio')} variant="secondary">
                    <i className="fa-solid fa-plus mr-2"></i> Criar Novo Conteúdo
                </Button>
            </div>

            {isLoading ? (
                <p className="text-center text-gray-600">Carregando suas criações...</p>
            ) : items.length === 0 ? (
                <div className="text-center py-16 bg-white/80 rounded-2xl shadow-lg border border-gray-200">
                        <i className="fa-solid fa-folder-open text-6xl text-gray-400 mb-4"></i>
                        <h2 className="text-2xl font-bold text-gray-700">Nenhuma criação salva ainda</h2>
                        <p className="text-gray-500 mt-2">Use o Studio para criar e salvar seu primeiro conteúdo!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map(renderItemCard)}
                </div>
            )}
            
            <ScheduleModal
                isOpen={!!itemToSchedule}
                onClose={() => setItemToSchedule(null)}
                onConfirm={handleConfirmSchedule}
            />
                <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Criação"
                message="Tem certeza que deseja excluir esta criação? Esta ação não pode ser desfeita."
            />
        </div>
    );
};

export default HistoryScreen;