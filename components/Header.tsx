import React, { useState } from 'react';
// FIX: Import useAuth from AuthContext to resolve missing member error.
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { PLAN_CONFIGS } from '../constants';
import Button from './common/Button';
import PlanModal from './PlanModal';
import PromoCodeModal from './PromoCodeModal';
import { useTheme } from '../contexts/ThemeContext';

type AppView = 'studio' | 'history' | 'calendar';

interface HeaderProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
    const { user, logout, updateUser } = useAuth();
    const { showToast } = useNotification();
    const { theme, toggleTheme } = useTheme();
    const [isPlanModalOpen, setPlanModalOpen] = useState(false);
    const [isPromoModalOpen, setPromoModalOpen] = useState(false);
    
    if (!user) return null;

    const planConfig = user.plan && PLAN_CONFIGS[user.plan] ? PLAN_CONFIGS[user.plan] : null;

    const handleApplyPromoCode = (credits: number) => {
        updateUser({ credits: user.credits + credits });
        showToast(`${credits} créditos adicionados com sucesso!`, 'success');
        setPromoModalOpen(false);
    };
    
    const NavButton: React.FC<{ view: AppView; icon: string; label: string }> = ({ view, icon, label }) => (
        <button
            onClick={() => onNavigate(view)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                currentView === view ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
        >
            <i className={`fa-solid ${icon}`}></i>
            <span>{label}</span>
        </button>
    );

    return (
        <>
            <header className="fixed left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 z-50 animate-fade-in-down top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-8">
                           <h1 className="text-2xl font-bold text-[#008080] dark:text-teal-400">Kriative<span className="text-[#ff8c00]">Studio</span></h1>
                           <nav className="hidden md:flex items-center space-x-2">
                                <NavButton view="studio" icon="fa-wand-magic-sparkles" label="Studio" />
                                <NavButton view="history" icon="fa-images" label="Minhas Criações" />
                                <NavButton view="calendar" icon="fa-calendar-alt" label="Calendário" />
                           </nav>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-teal-50 dark:bg-teal-900/50 px-3 py-2 rounded-lg border border-teal-200 dark:border-teal-800">
                                <i className="fa-solid fa-coins text-yellow-500 text-lg"></i>
                                <span className="font-bold text-teal-800 dark:text-teal-300">{user.credits} Créditos</span>
                                <button onClick={() => setPromoModalOpen(true)} className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 font-semibold text-sm ml-2">
                                   + Código
                                </button>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
                                    <button onClick={() => setPlanModalOpen(true)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#008080] dark:hover:text-teal-400 font-medium">
                                        {planConfig ? planConfig.name : 'Sem Plano'} <i className="fa-solid fa-chevron-down text-xs"></i>
                                    </button>
                                </div>
                                <button onClick={toggleTheme} title="Alterar tema" className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                                    <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                                </button>
                                <button onClick={logout} title="Sair" className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                                    <i className="fa-solid fa-right-from-bracket"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <PlanModal isOpen={isPlanModalOpen} onClose={() => setPlanModalOpen(false)} />
            <PromoCodeModal isOpen={isPromoModalOpen} onClose={() => setPromoModalOpen(false)} onApply={handleApplyPromoCode} />
        </>
    );
};

export default Header;