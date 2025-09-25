
import React, { useState, useEffect, useMemo } from 'react';
import type { Selections } from '../../types';
import { FORMAT_CONFIGS } from '../../constants';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import { useNotification } from '../../contexts/NotificationContext';

interface Props {
    selections: Selections;
    onUpdate: (updates: Partial<Selections>) => void;
    onSubmit: () => void;
    onBack: () => void;
    creditsNeeded: number;
}

const Step6Describe: React.FC<Props> = ({ selections, onUpdate, onSubmit, onBack, creditsNeeded }) => {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const formatConfig = selections.format ? FORMAT_CONFIGS[selections.format] : null;

    const isMultiQuantity = formatConfig?.isMultiQuantity || false;
    const maxQuantity = formatConfig?.maxQuantity || 1;
    
    const hasEnoughCredits = user ? user.credits >= creditsNeeded : false;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            onUpdate({ imagePrompt: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGeneratePrompt = async () => {
        onUpdate({ prompt: "Gerando um prompt profissional..." });
        const prompt = await geminiService.generateProfessionalPrompt(selections);
        onUpdate({ prompt });
    };

    const handleSaveDraft = () => {
        const draft = {
            selections,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('kriative_studio_draft', JSON.stringify(draft));
        showToast('Rascunho salvo com sucesso!');
    };

    const isSubmitDisabled = !selections.prompt || (selections.inputType === 'Prompt de Imagem' && !selections.imagePrompt) || !hasEnoughCredits;

    useEffect(() => {
        // Cleanup object URL
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    return (
        <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-2">Agora, descreva sua ideia!</h2>
            <p className="text-gray-500 mb-6 text-center max-w-lg">Quanto mais detalhes você fornecer, melhor será o resultado. Seja específico sobre cores, objetos, humor e estilo.</p>

            <div className="w-full max-w-2xl space-y-6">
                {selections.inputType === 'Prompt de Imagem' && (
                    <div className="text-center p-4 border-2 border-dashed rounded-lg">
                        <label htmlFor="image-upload" className="cursor-pointer">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="mx-auto h-40 rounded-md object-contain" />
                            ) : (
                                <div className="text-gray-500">
                                    <i className="fa-solid fa-cloud-arrow-up text-4xl mb-2"></i>
                                    <p className="font-semibold">Clique para enviar uma imagem de referência</p>
                                    <p className="text-sm">PNG, JPG, GIF até 10MB</p>
                                </div>
                            )}
                        </label>
                        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>
                )}
                
                <div className="relative">
                    <textarea
                        value={selections.prompt}
                        onChange={(e) => onUpdate({ prompt: e.target.value })}
                        placeholder="Ex: Um gato astronauta flutuando no espaço, comendo um hambúrguer, em um estilo de desenho animado..."
                        rows={5}
                        className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    />
                    <button onClick={handleGeneratePrompt} title="Gerar um prompt profissional" className="absolute top-3 right-3 text-gray-400 hover:text-[#ff8c00]">
                       <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                    </button>
                </div>

                {isMultiQuantity && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           {selections.style === 'Estilo Mangá' ? 'Número de Páginas da Revista:' : 'Quantidade de Imagens:'}
                        </label>
                        <div className="flex items-center space-x-2">
                             <input
                                type="range"
                                min="1"
                                max={maxQuantity}
                                value={selections.quantity}
                                onChange={(e) => onUpdate({ quantity: parseInt(e.target.value, 10) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-bold text-lg text-[#008080] w-12 text-center">{selections.quantity}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex flex-col items-center w-full max-w-2xl space-y-4">
                 <div className="flex flex-wrap justify-center gap-4">
                    <Button onClick={onBack} variant="ghost">
                        <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
                    </Button>
                    <Button onClick={handleSaveDraft} variant="secondary">
                        <i className="fa-solid fa-save mr-2"></i> Salvar Rascunho
                    </Button>
                    <Button onClick={onSubmit} disabled={isSubmitDisabled}>
                        Gerar Conteúdo ({creditsNeeded} Créditos) <i className="fa-solid fa-rocket ml-2"></i>
                    </Button>
                </div>

                {!hasEnoughCredits ? (
                    <p className="mt-2 text-red-600 font-semibold text-center">
                       Créditos insuficientes para esta operação. <br/> Considere fazer um upgrade de plano para mais créditos.
                    </p>
                ) : (
                    <p className="mt-2 text-gray-500 font-semibold">
                       Seu saldo: {user?.credits} Créditos
                    </p>
                )}
            </div>
        </div>
    );
};

export default Step6Describe;
