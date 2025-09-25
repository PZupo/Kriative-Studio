import React, { useState } from 'react';
import Button from '../common/Button';
import { geminiService } from '../../services/geminiService';
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
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fa-solid fa-brain text-[#008080]"></i>
                        Planejador de Conteúdo com IA
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Qual é o seu nicho ou tópico principal?</label>
                        <input
                            type="text"
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ex: Culinária vegana, finanças pessoais..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
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
                </div>
                
                {plan && (
                    <div className="mt-6 animate-fade-in space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-teal-200 pb-1 mb-2">💡 Temas de Conteúdo</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                {plan.themes.map((theme, i) => <li key={i}>{theme}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-orange-200 pb-1 mb-2">⏰ Melhores Horários para Postar</h3>
                            {Object.entries(plan.schedule).map(([platform, times]) => (
                                <div key={platform} className="text-sm">
                                    <strong className="text-gray-900">{platform}:</strong>
                                    <span className="text-gray-700 ml-2">{times.join(', ')}</span>
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