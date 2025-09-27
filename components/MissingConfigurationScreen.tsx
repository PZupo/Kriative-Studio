import React from 'react';

const MissingConfigurationScreen: React.FC = () => {
    // @ts-ignore
    const isViteLoaded = !!import.meta.env;

    return (
        <div className="min-h-screen bg-red-50 dark:bg-gray-900 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-red-200 dark:border-red-900/50">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                        <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-red-700">Configuração Incompleta</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
                        O aplicativo não pôde ser iniciado porque as chaves de API essenciais não foram configuradas.
                    </p>
                </div>

                <div className="mt-8 space-y-6 text-left">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Para Desenvolvedores (Ambiente Local)</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Para executar o aplicativo localmente, crie um arquivo chamado <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-1 rounded">.env.local</code> na pasta raiz do seu projeto e adicione as seguintes variáveis:
                        </p>
                        <pre className="bg-gray-800 dark:bg-gray-900 text-white p-4 rounded-lg text-sm overflow-x-auto">
                            <code>
                                VITE_SUPABASE_URL="SUA_URL_DO_PROJETO_SUPABASE"<br />
                                VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_SUPABASE"<br />
                                VITE_API_KEY="SUA_CHAVE_DE_API_DO_GOOGLE_GEMINI"
                            </code>
                        </pre>
                         <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Após adicionar o arquivo, reinicie o servidor de desenvolvimento.
                        </p>
                    </div>

                     <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Para Implantação (Netlify, Vercel, etc.)</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Para que o aplicativo funcione online, você deve configurar as mesmas variáveis de ambiente no painel do seu provedor de hospedagem:
                        </p>
                         <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>Acesse as configurações do seu site (ex: <span className="font-semibold">Site settings &gt; Build & deploy &gt; Environment</span> na Netlify).</li>
                            <li>Adicione as três variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_KEY`) com seus respectivos valores.</li>
                            <li>Acione um novo "deploy" (reimplantação) para que as alterações tenham efeito.</li>
                        </ol>
                    </div>
                    
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                            <i className="fa-solid fa-credit-card"></i>
                            Aviso: Geração de Imagens
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                            O modelo de geração de imagens do Google (Imagen) requer que sua Chave de API esteja associada a um projeto do <strong>Google Cloud Platform</strong> com o <strong>faturamento ativado</strong>.
                            Chaves de API gratuitas geradas no Google AI Studio podem não funcionar para esta funcionalidade.
                        </p>
                    </div>

                     {!isViteLoaded && (
                        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                            <strong>Aviso:</strong> O aplicativo parece não estar rodando em um ambiente Vite. A leitura de variáveis de ambiente pode não funcionar como esperado.
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default MissingConfigurationScreen;