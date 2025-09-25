import React from 'react';
import Button from './Button';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    featureName: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, featureName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all text-center" onClick={(e) => e.stopPropagation()}>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 -mt-16 border-4 border-white">
                    <i className="fa-solid fa-crown text-3xl text-white"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Recurso Premium</h2>
                <p className="text-gray-600 mb-6">
                    O <span className="font-bold text-[#008080]">{featureName}</span> é um recurso exclusivo dos planos Pro e Studio.
                    Faça um upgrade para desbloquear esta e outras funcionalidades incríveis!
                </p>
                <div className="flex justify-center gap-4">
                    <Button variant="ghost" onClick={onClose}>
                        Agora Não
                    </Button>
                    <Button variant="primary" onClick={onUpgrade}>
                        Ver Planos
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;