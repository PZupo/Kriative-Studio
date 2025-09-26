import React, { useState } from 'react';
import Button from './common/Button';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../services/supabaseClient';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useNotification();

    const handleReset = async () => {
        if (!supabase) {
            showToast('Funcionalidade indisponível: o backend não foi configurado.', 'error');
            return;
        }

        if (!email) {
            showToast('Por favor, insira seu email.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            showToast('Se uma conta existir, um link de redefinição foi enviado.', 'success');
            onClose();
            setEmail('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            showToast(errorMessage, 'error');
            alert("Lembre-se de configurar o template de e-mail de redefinição de senha no seu painel do Supabase em Authentication > Email Templates.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Redefinir Senha</h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Insira seu e-mail e enviaremos um link para você voltar a acessar sua conta.
                    </p>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                        type="email"
                        id="reset-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={isLoading}
                    />
                </div>
                 <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                    <Button variant="primary" onClick={handleReset} disabled={isLoading || !email}>
                        {isLoading ? 'Enviando...' : 'Enviar Link'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;