import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import Button from './common/Button';
import ForgotPasswordModal from './ForgotPasswordModal';

const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotModalOpen, setForgotModalOpen] = useState(false);
    const { showToast } = useNotification();

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSupabaseConfigured) {
            showToast('Funcionalidade indisponível: o backend não foi configurado.', 'error');
            return;
        }
        setIsLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                showToast('Login bem-sucedido!', 'success');
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name,
                        },
                    },
                });
                if (error) throw error;
                // Supabase returns a user object even if they already exist, but with an empty identities array.
                // We check for this to provide a more specific error message.
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                     showToast('Usuário já existe. Tente fazer login.', 'error');
                } else {
                     showToast('Confirme seu e-mail para ativar a conta.', 'success');
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4 font-sans">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#008080]">Kriative<span className="text-[#ff8c00]">Studio</span></h1>
                        <p className="text-gray-500 mt-2">{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta para começar'}</p>
                    </div>

                    <form onSubmit={handleAuthAction} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome completo"
                                    required
                                    className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                            />
                        </div>
                        <div className="pt-2">
                             <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (isLogin ? 'Entrando...' : 'Criando...') : (isLogin ? 'Entrar' : 'Criar Conta')}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-600">
                            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-[#008080] hover:underline ml-1">
                                {isLogin ? 'Crie uma' : 'Faça login'}
                            </button>
                        </p>
                         <button onClick={() => setForgotModalOpen(true)} className="font-semibold text-gray-500 hover:text-[#ff8c00] hover:underline mt-2">
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
