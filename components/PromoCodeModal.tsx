
import React, { useState } from 'react';
import Button from './common/Button';
import { useNotification } from '../contexts/NotificationContext';

interface PromoCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (credits: number) => void;
}

const VALID_CODES: { [key: string]: number } = {
    'BEMVINDO25': 25,
    'KRIATIVE50': 50,
    'SUPERPROMO100': 100,
};

const PromoCodeModal: React.FC<PromoCodeModalProps> = ({ isOpen, onClose, onApply }) => {
    const [code, setCode] = useState('');
    const { showToast } = useNotification();

    const handleApply = () => {
        const upperCode = code.toUpperCase();
        if (VALID_CODES[upperCode]) {
            onApply(VALID_CODES[upperCode]);
            setCode('');
        } else {
            showToast('Código promocional inválido ou expirado.', 'error');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Adicionar Créditos</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                <div>
                    <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 mb-1">Código Promocional</label>
                    <input
                        type="text"
                        id="promo-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Ex: BEMVINDO25"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    />
                </div>
                 <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleApply} disabled={!code}>Aplicar Código</Button>
                </div>
            </div>
        </div>
    );
};

export default PromoCodeModal;
