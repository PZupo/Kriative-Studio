import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import Button from './common/Button';
import ForgotPasswordModal from './ForgotPasswordModal';
// FIX: Import useAuth from AuthContext to resolve missing member error.
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

const AuthScreen: React.FC = () => {
    const { loginWithGoogle, login, signup } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotModalOpen, setForgotModalOpen] = useState(false);
    const { showToast } = useNotification();

    const isBackendConfigured = () => supabase !== null;

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBackendConfigured()) {
            showToast('Funcionalidade indisponível: o backend não foi configurado.', 'error');
            return;
        }
        setIsLoading(true);

        try {
            if (isLogin) {
                const { error } = await login(email, password);
                if (error) throw error;
            } else {
                const { error } = await signup(name, email, password, 'pro');
                if (error) {
                    if (error.message.includes('User already registered')) {
                        throw new Error('Usuário já existe. Tente fazer login.');
                    }
                    throw error;
                }
                showToast('Confirme seu e-mail para ativar a conta.', 'success');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!isBackendConfigured()) {
            showToast('Funcionalidade indisponível: o backend não foi configurado.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await loginWithGoogle();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao tentar logar com o Google.";
            showToast(errorMessage, 'error');
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-[#f5f5dc] dark:bg-gray-900 flex items-center justify-center p-4 font-sans">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-fade-in">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#008080] dark:text-teal-400">Kriative<span className="text-[#ff8c00]">Studio</span></h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta para começar'}</p>
                    </div>

                    <form onSubmit={handleAuthAction} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome completo"
                                    required
                                    className="w-full p-3 mt-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="w-full p-3 mt-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full p-3 mt-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>
                        <div className="pt-2">
                             <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (isLogin ? 'Entrando...' : 'Criando...') : (isLogin ? 'Entrar' : 'Criar Conta')}
                            </Button>
                        </div>
                    </form>
                    
                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-400 dark:text-gray-500 text-sm">OU</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <div>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full border-2 border-gray-300 dark:border-gray-600 !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <i className="fa-brands fa-google mr-2"></i>
                            Entrar com Google
                        </Button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-[#008080] dark:text-teal-400 hover:underline ml-1">
                                {isLogin ? 'Crie uma' : 'Faça login'}
                            </button>
                        </p>
                         <button onClick={() => setForgotModalOpen(true)} className="font-semibold text-gray-500 dark:text-gray-400 hover:text-[#ff8c00] hover:underline mt-2">
                            Esqueceu sua senha?
                        </button>
                    </div>
                </div>
            </div>
            <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)} />
        </>
    );
};

export default AuthScreen;