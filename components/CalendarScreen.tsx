import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Import useAuth from AuthContext to resolve missing member error.
import { useAuth } from '../contexts/AuthContext';
import { SavedContentItem } from '../types';
import Button from './common/Button';
import AIPlannerModal from './ai/AIPlannerModal';
import UpgradeModal from './common/UpgradeModal';
import PlanModal from './PlanModal';

type AppView = 'studio' | 'history' | 'calendar';

interface Props {
    onNavigate: (view: AppView) => void;
}

const CalendarScreen: React.FC<Props> = ({ onNavigate }) => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduledItems, setScheduledItems] = useState<SavedContentItem[]>([]);
    const [isPlannerOpen, setPlannerOpen] = useState(false);
    const [isUpgradeOpen, setUpgradeOpen] = useState(false);
    const [isPlanModalOpen, setPlanModalOpen] = useState(false);

    const loadScheduledItems = useCallback(() => {
        if (!user) return;
        const storageKey = `kriative_studio_saved_content_${user.uid}`;
        try {
            const allItems: SavedContentItem[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const scheduled = allItems.filter(item => item.scheduledAt);
            setScheduledItems(scheduled);
        } catch (error) {
            console.error("Failed to load scheduled items:", error);
        }
    }, [user]);

    useEffect(() => {
        loadScheduledItems();
    }, [loadScheduledItems]);

    const handleOpenPlanner = () => {
        if (user?.plan === 'pro' || user?.plan === 'studio' || user?.plan === 'associado') {
             setPlannerOpen(true);
        } else {
             setUpgradeOpen(true);
        }
    };
    
    const handleOpenUpgrade = () => {
        setUpgradeOpen(false);
        setPlanModalOpen(true);
    };

    const daysInMonth = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return date.getDate();
    }, [currentDate]);

    const firstDayOfMonth = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        return date.getDay();
    }, [currentDate]);

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };

    const renderCalendar = () => {
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth();

        return [...blanks, ...days].map((day, index) => {
            if (!day) return <div key={`blank-${index}`} className="border dark:border-gray-700 rounded-md"></div>;
            
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const itemsForDay = scheduledItems.filter(item => {
                const itemDate = new Date(item.scheduledAt!);
                return itemDate.getFullYear() === dayDate.getFullYear() &&
                       itemDate.getMonth() === dayDate.getMonth() &&
                       itemDate.getDate() === dayDate.getDate();
            });

            return (
                <div key={day} className={`border dark:border-gray-700 rounded-md p-2 flex flex-col min-h-[120px] ${isCurrentMonth && day === today.getDate() ? 'bg-teal-50 dark:bg-teal-900/30' : 'bg-white dark:bg-gray-800'}`}>
                    <span className={`font-bold ${isCurrentMonth && day === today.getDate() ? 'text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto">
                        {itemsForDay.map(item => (
                            <div key={item.id} className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-xs p-1 rounded">
                                {item.selections.format}
                            </div>
                        ))}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <h1 className="text-4xl font-extrabold text-[#008080] dark:text-teal-400">Calendário de Conteúdo</h1>
                <Button onClick={handleOpenPlanner} variant="primary">
                    <i className="fa-solid fa-brain mr-2"></i> Planejador IA
                </Button>
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <Button onClick={() => changeMonth(-1)} variant="ghost"><i className="fa-solid fa-chevron-left"></i></Button>
                    <h2 className="text-2xl font-bold capitalize dark:text-gray-200">{monthName} {year}</h2>
                    <Button onClick={() => changeMonth(1)} variant="ghost"><i className="fa-solid fa-chevron-right"></i></Button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {renderCalendar()}
                </div>
            </div>

            <AIPlannerModal isOpen={isPlannerOpen} onClose={() => setPlannerOpen(false)} />
            <UpgradeModal 
                isOpen={isUpgradeOpen} 
                onClose={() => setUpgradeOpen(false)}
                onUpgrade={handleOpenUpgrade}
                featureName="Planejador de Conteúdo com IA"
            />
            <PlanModal isOpen={isPlanModalOpen} onClose={() => setPlanModalOpen(false)} />
        </div>
    );
};

export default CalendarScreen;