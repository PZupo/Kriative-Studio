import React, { useState } from 'react';
import Button from './common/Button';

interface ImageEditModalProps {
    isOpen: boolean;
    imageUrl: string;
    onClose: () => void;
    onRegenerate: (prompt: string) => Promise<void>;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, imageUrl, onClose, onRegenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegenerateClick = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        try {
            await onRegenerate(prompt);
            setPrompt(''); // Reset prompt on success
        } catch (error) {
            console.error("Failed to regenerate image:", error);
            // Error toast is handled by the parent component
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl transform transition-all duration-300 scale-100 animate-fade-in flex flex-col md:flex-row gap-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex-shrink-0 md:w-1/2">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Imagem</h2>
                    <img src={imageUrl} alt="Editing preview" className="w-full h-auto object-contain rounded-lg shadow-md max-h-[60vh]" />
                </div>
                <div className="flex flex-col md:w-1/2">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Descreva as alterações:</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: adicione um chapéu de sol, mude a cor do céu para o pôr do sol, faça o objeto sorrir..."
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                        disabled={isLoading}
                    />
                    <div className="mt-auto pt-4 space-y-2">
                        <Button onClick={handleRegenerateClick} className="w-full" disabled={!prompt.trim() || isLoading}>
                            {isLoading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                                    Gerar Alteração
                                </>
                            )}
                        </Button>
                        <Button onClick={onClose} variant="ghost" className="w-full" disabled={isLoading}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditModal;
