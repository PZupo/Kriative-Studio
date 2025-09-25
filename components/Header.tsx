import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { PLAN_CONFIGS } from '../constants';
import Button from './common/Button';
import PlanModal from './PlanModal';
import PromoCodeModal from './PromoCodeModal';

type AppView = 'studio' | 'history' | 'calendar';

interface HeaderProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
    const { user, logout, updateUser } = useAuth();
    const { showToast } = useNotification();
    const [isPlanModalOpen, setPlanModalOpen] = useState(false);
    const [isPromoModalOpen, setPromoModalOpen] = useState(false);

    if (!user) return null;

    const planConfig = PLAN_CONFIGS[user.plan];

    const handleApplyPromoCode = (credits: number) => {
        updateUser({ credits: user.credits + credits });
        showToast(`${credits} créditos adicionados com sucesso!`, 'success');
        setPromoModalOpen(false);
    };
    
    const NavButton: React.FC<{ view: AppView; icon: string; label: string }> = ({ view, icon, label }) => (
        <button
            onClick={() => onNavigate(view)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                currentView === view ? 'bg-teal-100 text-teal-800 font-bold' : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            <i className={`fa-solid ${icon}`}></i>
            <span>{label}</span>
        </button>
    );

    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-50 animate-fade-in-down">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-8">
                           <h1 className="text-2xl font-bold text-[#008080]">Kriative<span className="text-[#ff8c00]">Studio</span></h1>
                           <nav className="hidden md:flex items-center space-x-2">
                                <NavButton view="studio" icon="fa-wand-magic-sparkles" label="Studio" />
                                <NavButton view="history" icon="fa-images" label="Minhas Criações" />
                                <NavButton view="calendar" icon="fa-calendar-alt" label="Calendário" />
                           </nav>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            <div className="flex items-center space-x-2 bg-teal-50 px-3 py-2 rounded-lg border border-teal-200">
                                <i className="fa-solid fa-coins text-yellow-500 text-lg"></i>
                                <span className="font-bold text-teal-800">{user.credits} Créditos</span>
                                <button onClick={() => setPromoModalOpen(true)} className="text-teal-600 hover:text-teal-800 font-semibold text-sm ml-2">
                                   + Código
                                </button>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800">{user.name}</p>
                                    <button onClick={() => setPlanModalOpen(true)} className="text-sm text-gray-500 hover:text-[#008080] font-medium">
                                        {planConfig.name} <i className="fa-solid fa-chevron-down text-xs"></i>
                                    </button>
                                </div>
                                <button onClick={logout} title="Sair" className="bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
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