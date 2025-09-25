import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { PlanKey } from '../types';
import { PLAN_CONFIGS } from '../constants';
import Button from './common/Button';
import ForgotPasswordModal from './ForgotPasswordModal';

type AuthView = 'login' | 'register_plans' | 'register_details';

const AuthScreen: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');
    
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPassOpen, setForgotPassOpen] = useState(false);
    
    const { login, signup, loginWithGoogle } = useAuth();
    const { showToast } = useNotification();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            // O listener do AuthContext irá lidar com o sucesso
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "E-mail ou senha inválidos.";
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            // O Supabase irá redirecionar para o Google e, na volta,
            // o listener do AuthContext irá capturar a sessão.
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : "Falha no login com Google.";
            showToast(errorMessage, 'error');
        }
    };

    const handlePlanSelect = (plan: PlanKey) => {
        setSelectedPlan(plan);
        setView('register_details');
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan) {
            showToast('Ocorreu um erro, por favor selecione o plano novamente.', 'error');
            setView('register_plans');
            return;
        }
        setIsLoading(true);
        try {
            await signup(name, email, password, selectedPlan);
             // O listener do AuthContext irá lidar com o sucesso
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Falha ao criar a conta.";
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderLogin = () => (
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]" />
            </div>
            <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Entrar'}</Button>
            </div>
        </form>
    );

    const renderPlanSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(PLAN_CONFIGS) as PlanKey[]).map(planKey => {
                const plan = PLAN_CONFIGS[planKey];
                return (
                    <button
                        key={planKey}
                        onClick={() => handlePlanSelect(planKey)}
                        className="p-6 rounded-lg border-2 border-gray-200 bg-white hover:border-teal-500 hover:shadow-xl transition-all flex flex-col text-left h-full group"
                    >
                        <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                        <p className="text-gray-500 text-sm mb-4">{planKey === 'associado' ? 'Parte do pacote de marketing' : 'Assinatura Individual'}</p>
                        <p className="text-2xl font-extrabold text-gray-900 mb-4">{plan.price.split('(')[0]}</p>
                        <ul className="space-y-2 text-sm text-gray-600 mb-6">
                            {plan.features.map(feature => (
                                <li key={feature} className="flex items-start">
                                    <i className="fa-solid fa-check-circle text-green-500 mr-2 mt-1 shrink-0"></i>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-auto">
                            <span className="block w-full text-center bg-[#ff8c00] text-white font-bold py-3 rounded-lg shadow-md group-hover:bg-[#cc7000] transition-colors">
                                Escolher Plano
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
    
    const renderRegisterDetails = () => (
        <form onSubmit={handleRegister} className="space-y-4">
             <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-center">
                <p className="font-semibold text-teal-800">Plano Selecionado: {PLAN_CONFIGS[selectedPlan!].name}</p>
                <button type="button" onClick={() => setView('register_plans')} className="text-xs text-teal-600 hover:underline">Trocar plano</button>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]" />
            </div>
             <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Criar Conta e Continuar'}</Button>
            </div>
        </form>
    );

    const titles: Record<AuthView, string> = {
        login: 'Bem-vindo de volta!',
        register_plans: 'Escolha o plano perfeito para você',
        register_details: 'Complete seus dados para começar'
    };
    
    const containerWidth = view === 'register_plans' ? 'max-w-5xl' : 'max-w-md';

    return (
        <>
            <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
                <div className={`w-full ${containerWidth} bg-white rounded-2xl shadow-xl p-8 animate-fade-in transition-all duration-300`}>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#008080]">Kriative<span className="text-[#ff8c00]">Studio</span></h1>
                        <p className="text-gray-500 mt-2">{titles[view]}</p>
                    </div>

                    {view === 'login' && renderLogin()}
                    {view === 'register_plans' && renderPlanSelection()}
                    {view === 'register_details' && renderRegisterDetails()}

                    {view !== 'register_plans' && (
                        <>
                            <div className="relative my-6 text-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">OU</span>
                                </div>
                            </div>

                            <Button variant="secondary" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                                <i className="fa-brands fa-google mr-2"></i> Entrar com Google
                            </Button>
                        </>
                    )}


                    <div className="mt-6 text-center">
                        {view === 'login' ? (
                             <p className="text-sm text-gray-600">
                                Não tem uma conta?{' '}
                                <button onClick={() => setView('register_plans')} className="font-semibold text-[#008080] hover:underline">Cadastre-se</button>
                            </p>
                        ) : (
                             <p className="text-sm text-gray-600">
                                Já tem uma conta?{' '}
                                <button onClick={() => setView('login')} className="font-semibold text-[#008080] hover:underline">Faça login</button>
                            </p>
                        )}
                        {view === 'login' && (
                            <button onClick={() => setForgotPassOpen(true)} className="block mx-auto mt-2 text-xs text-gray-500 hover:underline">
                                Esqueceu a senha?
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <ForgotPasswordModal isOpen={isForgotPassOpen} onClose={() => setForgotPassOpen(false)} />
        </>
    );
};

export default AuthScreen;