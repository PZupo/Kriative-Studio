import React from 'react';

const ConfigurationScreen: React.FC = () => {
    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border-2 border-amber-200 p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
                    <i className="fa-solid fa-cogs text-4xl text-amber-600"></i>
                </div>
                <h1 className="text-3xl font-bold text-amber-800 mb-4">Configuração do Backend Necessária</h1>
                <p className="text-lg text-gray-700 mb-6">
                    O aplicativo não pode se conectar ao backend porque as chaves de API não foram definidas.
                </p>
                <div className="bg-gray-50 p-6 rounded-lg text-left border border-gray-200">
                    <p className="text-md font-semibold text-gray-800 mb-2">Ação Requerida:</p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>Abra o arquivo: <code className="bg-amber-100 text-amber-900 font-mono p-1 rounded text-sm">services/supabaseClient.ts</code></li>
                        <li>Insira a <strong>URL do Projeto</strong> e a <strong>Chave Pública (anon key)</strong> do seu projeto Supabase.</li>
                        <li>Salve o arquivo. A aplicação será recarregada automaticamente.</li>
                    </ol>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                    Você pode encontrar suas chaves no painel do seu projeto Supabase, em "Project Settings" {'>'} "API".
                </p>
            </div>
        </div>
    );
};

export default ConfigurationScreen;
