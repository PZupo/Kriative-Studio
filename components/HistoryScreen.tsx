import React, { useState, useEffect, useCallback } from 'react';
import { SavedContentItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Button from './common/Button';
import ConfirmationModal from './common/ConfirmationModal';
import ScheduleModal from './common/ScheduleModal';

type AppView = 'studio' | 'history' | 'calendar';

interface Props {
  onNavigate: (view: AppView) => void;
}

const HistoryScreen: React.FC<Props> = ({ onNavigate }) => {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [savedItems, setSavedItems] = useState<SavedContentItem[]>([]);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [itemToSchedule, setItemToSchedule] = useState<string | null>(null);

    const loadSavedItems = useCallback(() => {
        if (!user) return;
        const key = `kriative_studio_saved_content_${user.uid}`;
        try {
            const items: SavedContentItem[] = JSON.parse(localStorage.getItem(key) || '[]');
            setSavedItems(items);
        } catch (error) {
            console.error("Error loading saved items:", error);
            showToast("Falha ao carregar criações salvas.", "error");
        }
    }, [user, showToast]);

    useEffect(() => {
        loadSavedItems();
    }, [loadSavedItems]);

    const handleSaveItems = (items: SavedContentItem[]) => {
        if (!user) return;
        const key = `kriative_studio_saved_content_${user.uid}`;
        localStorage.setItem(key, JSON.stringify(items));
        setSavedItems(items);
    };

    const handleDeleteConfirm = () => {
        if (!itemToDelete) return;
        const newItems = savedItems.filter(item => item.id !== itemToDelete);
        handleSaveItems(newItems);
        showToast('Item excluído com sucesso!', 'success');
        setItemToDelete(null);
    };

    const handleScheduleConfirm = (isoDate: string) => {
        if (!itemToSchedule) return;
        const newItems = savedItems.map(item =>
            item.id === itemToSchedule ? { ...item, scheduledAt: isoDate } : item
        );
        handleSaveItems(newItems);
        showToast('Item agendado com sucesso! Veja no Calendário.', 'success');
        setItemToSchedule(null);
    };

    const formatReadableDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const ItemCard: React.FC<{ item: SavedContentItem }> = ({ item }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {item.content.images && item.content.images[0] ? (
                    <img src={item.content.images[0]} alt="Preview" className="w-full h-full object-cover" />
                ) : item.content.storyboards && item.content.storyboards[0][0].image ? (
                     <img src={item.content.storyboards[0][0].image} alt="Manga Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <i className={`fa-solid ${item.content.videoUrl ? 'fa-film' : 'fa-image'} text-4xl`}></i>
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">
                    {item.selections.format}
                </div>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Criado em: {formatReadableDate(item.savedAt)}
                </p>
                {item.scheduledAt && (
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                        Agendado para: {formatReadableDate(item.scheduledAt)}
                    </p>
                )}
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 line-clamp-3 flex-grow">
                   "{item.selections.prompt}"
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ghost" className="!px-3 !py-1 text-sm" onClick={() => setItemToSchedule(item.id)}>
                        <i className="fa-solid fa-calendar-alt mr-2"></i> Agendar
                    </Button>
                    <Button variant="danger" className="!px-3 !py-1 text-sm" onClick={() => setItemToDelete(item.id)}>
                        <i className="fa-solid fa-trash mr-2"></i> Excluir
                    </Button>
                </div>
            </div>
        </div>
    );
    
    return (
        <>
            <div className="max-w-6xl mx-auto animate-fade-in">
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <h1 className="text-4xl font-extrabold text-[#008080] dark:text-teal-400">Minhas Criações</h1>
                    <Button onClick={() => onNavigate('studio')} variant="primary">
                        <i className="fa-solid fa-plus mr-2"></i> Criar Novo Conteúdo
                    </Button>
                </div>
                {savedItems.length === 0 ? (
                    <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md">
                        <i className="fa-solid fa-folder-open text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
                        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Nenhuma criação salva ainda</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                           Volte ao Studio para criar seu primeiro conteúdo e salvá-lo aqui!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {savedItems.map(item => <ItemCard key={item.id} item={item} />)}
                    </div>
                )}
            </div>
            
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir esta criação? Esta ação não pode ser desfeita."
            />
            <ScheduleModal
                isOpen={!!itemToSchedule}
                onClose={() => setItemToSchedule(null)}
                onConfirm={handleScheduleConfirm}
            />
        </>
    );
};

export default HistoryScreen;
