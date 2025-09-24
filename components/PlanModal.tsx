import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_CONFIGS } from '../constants';
import Button from './common/Button';

interface PlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PlanKey = keyof typeof PLAN_CONFIGS;

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose }) => {
    const { user, switchPlan } = useAuth();

    if (!isOpen || !user) return null;

    const handlePlanSwitch = (planKey: PlanKey) => {
        // Here you would typically trigger a payment flow with Stripe, etc.
        // For this demo, we'll just switch the plan directly.
        switchPlan(planKey);
        onClose();
    };

    const PlanCard: React.FC<{ planKey: PlanKey }> = ({ planKey }) => {
        const plan = PLAN_CONFIGS[planKey];
        const isCurrent = user.plan === planKey;

        return (
            <div className={`p-6 rounded-xl border-2 transition-all ${isCurrent ? 'bg-teal-50 border-teal-500' : 'bg-white'}`}>
                <h3 className={`text-2xl font-bold ${isCurrent ? 'text-teal-700' : 'text-gray-800'}`}>{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{planKey === 'associado' ? 'Parte do pacote de marketing' : 'Assinatura Individual'}</p>
                <p className="text-3xl font-extrabold text-gray-900 mb-4">{plan.price.split('(')[0]}</p>
                 <ul className="space-y-2 text-gray-600 mb-6">
                    {plan.features.map(feature => (
                        <li key={feature} className="flex items-start">
                            <i className="fa-solid fa-check-circle text-green-500 mr-2 mt-1"></i>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                <Button 
                    onClick={() => handlePlanSwitch(planKey)} 
                    disabled={isCurrent}
                    className="w-full"
                    variant={isCurrent ? 'secondary' : 'primary'}
                >
                    {isCurrent ? 'Plano Atual' : 'Mudar para este Plano'}
                </Button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Nossos Planos</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                   <PlanCard planKey="pro" />
                   <PlanCard planKey="studio" />
                   <PlanCard planKey="associado" />
                </div>
            </div>
        </div>
    );
};

export default PlanModal;
