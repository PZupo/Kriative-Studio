import React from 'react';
import Button from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                         <i className="fa-solid fa-exclamation-triangle text-2xl text-red-600"></i>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">{title}</h3>
                    <div className="mt-2 px-4 py-2">
                        <p className="text-sm text-gray-500">{message}</p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 flex justify-center gap-3">
                    <Button variant="ghost" onClick={onClose} className="py-2 px-4">
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={onConfirm} className="py-2 px-4">
                        Confirmar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
