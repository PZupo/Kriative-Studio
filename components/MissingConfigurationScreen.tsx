// FIX: Implemented the MissingConfigurationScreen component to resolve module not found errors.
import React from 'react';

const MissingConfigurationScreen: React.FC = () => {
    // @ts-ignore
    const isSupabaseMissing = !import.meta.env?.VITE_SUPABASE_URL || !import.meta.env?.VITE_SUPABASE_ANON_KEY;
    // @ts-ignore
    const isGeminiMissing = !import.meta.env?.VITE_API_KEY;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border-t-8 border-red-500">
                <div className="text-center">
                    <i className="fa-solid fa-triangle-exclamation text-5xl text-red-500 mb-4"></i>
                    <h1 className="text-3xl font-bold text-gray-800">Erro de Configuração</h1>
                    <p className="text-gray-600 mt-2">
                        O aplicativo não pode ser iniciado porque uma ou mais variáveis de ambiente essenciais não foram definidas.
                    </p>
                </div>

                <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Ações Necessárias</h2>
                    <p className="mb-4 text-gray-600">
                        Para resolver isso, crie um arquivo <code className="bg-gray-200 text-red-600 font-mono p-1 rounded text-sm">.env.local</code> na raiz do projeto e adicione as seguintes variáveis:
                    </p>
                    <div className="space-y-4">
                        {isSupabaseMissing && (
                            <div>
                                <h3 className="font-semibold text-gray-800">Configuração do Supabase (Backend)</h3>
                                <pre className="bg-gray-800 text-white p-3 rounded-md mt-1 text-sm overflow-x-auto">
                                    <code>
                                        VITE_SUPABASE_URL=SUA_URL_DO_PROJETO_SUPABASE<br />
                                        VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_SUPABASE
                                    </code>
                                </pre>
                                <p className="text-xs text-gray-500 mt-1">Essas chaves são necessárias para autenticação e gerenciamento de usuários.</p>
                            </div>
                        )}
                        {isGeminiMissing && (
                             <div>
                                <h3 className="font-semibold text-gray-800">Configuração do Google AI (Gemini)</h3>
                                <pre className="bg-gray-800 text-white p-3 rounded-md mt-1 text-sm overflow-x-auto">
                                    <code>
                                        VITE_API_KEY=SUA_CHAVE_DE_API_DO_GEMINI
                                    </code>
                                </pre>
                                <p className="text-xs text-gray-500 mt-1">Esta chave é necessária para todas as funcionalidades de geração de conteúdo por IA.</p>
                            </div>
                        )}
                    </div>
                     <p className="mt-6 text-sm text-gray-600">
                        Após adicionar as chaves ao arquivo <code className="bg-gray-200 text-red-600 font-mono p-1 rounded text-sm">.env.local</code>, você precisará <strong className="font-semibold">reiniciar o servidor de desenvolvimento</strong> para que as alterações entrem em vigor.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MissingConfigurationScreen;
