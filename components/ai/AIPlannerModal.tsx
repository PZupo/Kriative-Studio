import React, { useState } from 'react';
import Button from '../common/Button';
import * as geminiService from '../../services/geminiService';
import { isGeminiConfigured } from '../../services/geminiService';
import { AIPlan } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

interface AIPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AIPlannerModal: React.FC<AIPlannerModalProps> = ({ isOpen, onClose }) => {
    const { showToast } = useNotification();
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<AIPlan | null>(null);
    const isAiConfigured = isGeminiConfigured;

    const handleGeneratePlan = async () => {
        if (!topic.trim()) {
            showToast('Por favor, insira um nicho ou tópico.', 'error');
            return;
        }
        setIsLoading(true);
        setPlan(null);
        try {
            const result = await geminiService.getAIContentPlan(topic);
            setPlan(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            showToast(`Falha ao gerar o plano: ${errorMessage}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setTopic('');
        setPlan(null);
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={handleClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <i className="fa-solid fa-brain text-[#008080] dark:text-teal-400"></i>
                        Planejador de Conteúdo com IA
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qual é o seu nicho ou tópico principal?</label>
                        <input
                            type="text"
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ex: Culinária vegana, finanças pessoais..."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={isLoading}
                        />
                    </div>
                    <Button onClick={handleGeneratePlan} disabled={isLoading || !topic} className="w-full">
                        {isLoading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                Analisando...
                            </>
                        ) : (
                           'Gerar Sugestões'
                        )}
                    </Button>
                    {!isAiConfigured && <p className="text-xs text-center text-orange-600">O planejador usará dados de exemplo pois a API Key não foi configurada.</p>}
                </div>
                
                {plan && (
                    <div className="mt-6 animate-fade-in space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-teal-200 dark:border-teal-800 pb-1 mb-2">💡 Temas de Conteúdo</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                {plan.themes.map((theme, i) => <li key={i}>{theme}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-orange-200 dark:border-orange-800 pb-1 mb-2">⏰ Melhores Horários para Postar</h3>
                            {Object.entries(plan.schedule).map(([platform, times]) => (
                                <div key={platform} className="text-sm">
                                    <strong className="text-gray-900 dark:text-gray-100">{platform}:</strong>
                                    {/* FIX: Add a type guard to ensure `times` is an array before calling `.join()`. This resolves the TypeScript error 'Property 'join' does not exist on type 'unknown'' and adds runtime safety against unexpected API responses. */}
                                    <span className="text-gray-700 dark:text-gray-300 ml-2">{Array.isArray(times) ? times.join(', ') : ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIPlannerModal;