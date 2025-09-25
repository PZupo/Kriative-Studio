import React from 'react';
import Button from './common/Button';

interface Props {
    message: string;
    onRetry?: () => void;
}

const StartupErrorScreen: React.FC<Props> = ({ message, onRetry }) => {
    return (
        <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                     <i className="fa-solid fa-bomb text-4xl text-red-600"></i>
                </div>
                <h1 className="text-3xl font-bold text-red-700">Ocorreu um Erro Crítico</h1>
                <p className="text-gray-600 mt-4">
                    Não foi possível carregar o aplicativo. Por favor, verifique a mensagem de erro abaixo.
                </p>
                <div className="mt-6 text-left bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-red-800 font-mono text-sm">{message}</p>
                </div>
                {onRetry && (
                     <div className="mt-8">
                        <Button onClick={onRetry} variant="danger">
                           Tentar Novamente
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StartupErrorScreen;
