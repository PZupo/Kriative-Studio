import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import { PLAN_CONFIGS } from '../constants';

type PlanKey = keyof typeof PLAN_CONFIGS;

const AuthScreen: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<PlanKey>('pro');
    const [isAssociadoInvite, setIsAssociadoInvite] = useState(false);
    const { login } = useAuth();

    useEffect(() => {
        // Check for the special invitation link on component mount
        const urlParams = new URLSearchParams(window.location.search);
        const planFromUrl = urlParams.get('plan');
        if (planFromUrl === 'associado') {
            setIsAssociadoInvite(true);
            setSelectedPlan('associado');
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !name) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        login(name, email, selectedPlan);
    };

    const inputClasses = "mt-1 block w-full py-2 px-3 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff8c00]";

    // View for the general public, showing all plans
    const PublicPricingView = () => (
        <>
            <div className="text-center mb-8">
                <i className="fa-solid fa-palette text-5xl text-[#008080]"></i>
                <h1 className="text-4xl font-bold text-gray-800 mt-4">Bem-vindo ao Kriative Social Studio</h1>
                <p className="text-gray-500 text-lg">Escolha o plano perfeito para decolar sua criação de conteúdo.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <PlanCard planKey="pro" />
                <PlanCard planKey="studio" />
                <PlanCard planKey="associado" />
            </div>

            <div className="max-w-md mx-auto">
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} placeholder="Seu nome" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="voce@exemplo.com" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} placeholder="••••••••" required />
                    </div>
                    <Button type="submit" className="w-full text-lg">
                        Criar Conta e Assinar Plano {PLAN_CONFIGS[selectedPlan].name}
                    </Button>
                </form>
            </div>
        </>
    );

    // Simplified view for members coming from the invitation link
    const AssociadoWelcomeView = () => (
        <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
                <i className="fa-solid fa-star text-5xl text-yellow-400"></i>
                <h1 className="text-4xl font-bold text-gray-800 mt-4">Bem-vindo, Associado!</h1>
                <p className="text-gray-500 text-lg">Seu acesso ao Kriative Social Studio está pronto. Crie sua conta para começar.</p>
            </div>
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-center mb-6">
                <p className="font-bold text-teal-800">Plano Associado Ativado</p>
            </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} placeholder="Seu nome" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Seu Melhor Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="voce@exemplo.com" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Crie uma Senha</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full text-lg">
                    Acessar o Studio
                </Button>
            </form>
        </div>
    );
    
    // Helper component for the public view
    const PlanCard: React.FC<{ planKey: PlanKey }> = ({ planKey }) => {
        const plan = PLAN_CONFIGS[planKey];
        const isSelected = selectedPlan === planKey;
        return (
            <div
                onClick={() => setSelectedPlan(planKey)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform ${isSelected ? 'bg-teal-50 border-teal-500 scale-105 shadow-2xl' : 'bg-white border-gray-200 hover:shadow-lg hover:border-teal-300'}`}
            >
                <h3 className={`text-2xl font-bold ${isSelected ? 'text-teal-700' : 'text-gray-800'}`}>{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{planKey === 'associado' ? 'Parte do pacote de marketing' : 'Assinatura Individual'}</p>
                <p className="text-3xl font-extrabold text-gray-900 mb-4">{plan.price.split('(')[0]}</p>
                <ul className="space-y-2 text-gray-600">
                    {plan.features.map(feature => (
                        <li key={feature} className="flex items-center">
                            <i className="fa-solid fa-check-circle text-green-500 mr-2"></i>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5dc] p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                {isAssociadoInvite ? <AssociadoWelcomeView /> : <PublicPricingView />}
            </div>
        </div>
    );
};

export default AuthScreen;