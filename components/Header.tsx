import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlanModal from './PlanModal';
import Button from './common/Button';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const [isPlanModalOpen, setPlanModalOpen] = useState(false);

    const planColors: { [key: string]: string } = {
        associado: 'bg-gradient-to-r from-purple-500 to-indigo-500',
        pro: 'bg-gradient-to-r from-[#ff8c00] to-orange-400',
        studio: 'bg-gradient-to-r from-gray-700 to-gray-900',
    };
    
    const currentPlanColor = user ? planColors[user.plan] : '';

    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-[#008080] text-white shadow-lg p-4 z-50 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-palette text-3xl text-[#39ff14]"></i>
                    <h1 className="text-2xl font-bold tracking-wider">Kriative Social Studio</h1>
                </div>
                <div className="flex items-center space-x-4">
                    {user && (
                        <>
                            <div className="hidden md:flex items-center space-x-4 bg-black/20 px-4 py-2 rounded-full">
                                <span className="font-semibold">{user.name}</span>
                                <div className="w-px h-5 bg-white/50"></div>
                                <div className={`flex items-center space-x-2 ${currentPlanColor} px-3 py-1 rounded-full text-sm font-bold capitalize`}>
                                    <i className="fa-solid fa-gem"></i>
                                    <span>{user.plan}</span>
                                </div>
                                <div className="w-px h-5 bg-white/50"></div>
                                <div className="flex items-center space-x-2">
                                    <i className="fa-solid fa-coins text-yellow-300"></i>
                                    <span className="font-bold">{user.credits} Créditos</span>
                                </div>
                            </div>
                             <Button onClick={() => setPlanModalOpen(true)} variant="secondary" className="py-2 px-4 text-sm hidden lg:block">
                                Mudar de Plano
                            </Button>
                        </>
                    )}
                    <button onClick={logout} className="bg-transparent hover:bg-white/10 px-4 py-2 rounded-lg font-semibold transition-colors">
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span className="hidden md:inline ml-2">Sair</span>
                    </button>
                </div>
            </header>
            <PlanModal isOpen={isPlanModalOpen} onClose={() => setPlanModalOpen(false)} />
        </>
    );
};

export default Header;