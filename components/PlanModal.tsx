import React, { useState } from 'react';
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
            // In a real app, this would redirect to a Stripe checkout page.
            // We'll simulate the checkout and update the user's plan locally.
            const { url } = await apiService.createCheckoutSession(planKey, user.uid);
            console.log("Redirecting to checkout:", url);

            // SIMULATION: For this app, we'll just update the plan directly.
            // In a real app, this would be handled by a Stripe webhook.
            showToast('Simulando upgrade... Plano atualizado com sucesso!', 'success');
            const newPlanConfig = PLAN_CONFIGS[planKey];
            updateUser({ plan: planKey, credits: user.credits + newPlanConfig.credits }); // Add new credits on top of old for simulation
            onClose();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento.";
            showToast(errorMessage, 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Plano</h2>
                        <p className="text-gray-500">Escolha o plano que melhor se adapta às suas necessidades.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">
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
                                    ${isCurrentPlan ? 'border-teal-500 bg-teal-50 shadow-lg' : 'border-gray-200 bg-white'}`}
                            >
                                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                <p className="text-gray-500 text-sm mb-4">{planKey === 'associado' ? 'Parte do pacote de marketing' : 'Assinatura Individual'}</p>
                                <p className="text-2xl font-extrabold text-gray-900 mb-4">{plan.price.split('(')[0]}</p>
                                <ul className="space-y-2 text-sm text-gray-600 mb-6 flex-grow">
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
                                    {isCurrentPlan ? 'Plano Atual' : 'Selecionar'}
                                </Button>
                            </div>
                        );
                    })}
                </div>
                 <div className="mt-6 text-center">
                    <button onClick={generateUsageSuggestionsPDF} className="text-sm text-teal-600 hover:text-teal-800 hover:underline font-semibold">
                        <i className="fa-solid fa-download mr-1"></i>
                        Baixar guia de sugestões de uso de créditos (PDF)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanModal;
