import React from 'react';

interface Props {
    missing: ('URL' | 'KEY')[];
}

const ConfigurationScreen: React.FC<Props> = ({ missing }) => {

    const missingItems = missing.join(' e ');

    return (
        <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                    <i className="fa-solid fa-wrench text-4xl text-yellow-500"></i>
                </div>
                <h1 className="text-3xl font-bold text-[#008080]">Configuração do Backend Necessária</h1>
                <p className="text-gray-600 mt-4 text-lg">
                    O aplicativo está quase pronto! Para se conectar ao seu banco de dados na nuvem,
                    é necessário fornecer as chaves de acesso.
                </p>

                <div className="mt-8 text-left bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Ação Necessária</h2>
                    <p className="text-red-600 font-bold text-lg mb-4">
                        Está faltando: {missingItems}
                    </p>
                    <ol className="list-decimal list-inside space-y-3 text-gray-700">
                        <li>
                            Abra o arquivo <code className="bg-gray-200 text-red-700 font-mono p-1 rounded">services/supabaseClient.ts</code> no editor.
                        </li>
                        <li>
                            Acesse seu <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-teal-600 font-bold hover:underline">painel do Supabase</a>.
                        </li>
                        <li>
                            Vá para <strong className="text-gray-900">Project Settings &gt; API</strong>.
                        </li>
                        <li>
                           Copie a <strong className="text-gray-900">URL do Projeto</strong> e a chave pública <strong className="text-gray-900">public anon key</strong>.
                        </li>
                        <li>
                            Cole esses valores nas constantes correspondentes dentro do arquivo <code className="bg-gray-200 text-red-700 font-mono p-1 rounded">supabaseClient.ts</code>.
                        </li>
                    </ol>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                    Assim que o arquivo for salvo com as chaves corretas, esta tela desaparecerá e o aplicativo funcionará.
                </p>
            </div>
        </div>
    );
};

export default ConfigurationScreen;
