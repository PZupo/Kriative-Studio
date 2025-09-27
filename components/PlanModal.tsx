import React, { useState } from 'react';
// FIX: Import useAuth from AuthContext to resolve missing member error.
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { PLAN_CONFIGS } from '../constants';
import { PlanKey } from '../types';
import Button from './common/Button';
import { apiService } from '../services/apiService';
import { generateUsageSuggestionsPDF } from '../utils/generatePDF';

interface PlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();
    const { showToast } = useNotification();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !user) return null;

    const handleSelectPlan = async (planKey: PlanKey) => {
        if (planKey === user.plan) {
            showToast('Você já está neste plano.', 'success');
            return;
        }

        setIsProcessing(true);
        try {
            // Call the edge function to create a checkout session
            const { url } = await apiService.createCheckoutSession(planKey);
            
            // Redirect the user to the Stripe checkout page
            window.location.href = url;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento.";
            showToast(errorMessage, 'error');
        } finally {
            // The user will be redirected, so this might not even be seen
            setIsProcessing(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Gerenciar Plano</h2>
                        <p className="text-gray-500 dark:text-gray-400">Escolha o plano que melhor se adapta às suas necessidades.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(Object.keys(PLAN_CONFIGS) as PlanKey[]).map(planKey => {
                        const plan = PLAN_CONFIGS[planKey];
                        const isCurrentPlan = user.plan === planKey;
                        return (
                            <div
                                key={planKey}
                                className={`p-6 rounded-lg border-2 flex flex-col h-full
                                    ${isCurrentPlan ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 shadow-lg' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700'}`}
                            >
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{plan.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{planKey === 'associado' ? 'Parte do pacote de marketing' : 'Assinatura Individual'}</p>
                                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4">{plan.price.split('(')[0]}</p>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-start">
                                            <i className="fa-solid fa-check-circle text-green-500 mr-2 mt-1 shrink-0"></i>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={() => handleSelectPlan(planKey)}
                                    disabled={isProcessing}
                                    variant={isCurrentPlan ? 'secondary' : 'primary'}
                                    className="w-full mt-auto"
                                >
                                    {isCurrentPlan ? 'Plano Atual' : isProcessing ? 'Processando...' : 'Selecionar'}
                                </Button>
                            </div>
                        );
                    })}
                </div>
                 <div className="mt-6 text-center">
                    <button onClick={generateUsageSuggestionsPDF} className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 hover:underline font-semibold">
                        <i className="fa-solid fa-download mr-1"></i>
                        Baixar guia de sugestões de uso de créditos (PDF)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanModal;