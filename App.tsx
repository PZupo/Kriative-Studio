
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import type { Selections, GeneratedContent, User } from './types';
import { FORMAT_CONFIGS } from './constants';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import Step1Platform from './components/steps/Step1Platform';
import Step2Style from './components/steps/Step2Style';
import Step3Format from './components/steps/Step3Format';
import Step4VisualStyle from './components/steps/Step4VisualStyle';
import Step5InputType from './components/steps/Step5InputType';
import Step6Describe from './components/steps/Step6Describe';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';
import { geminiService } from './services/geminiService';
import Button from './components/common/Button';
import { useNotification } from './contexts/NotificationContext';

const initialSelections: Selections = {
    platform: null,
    style: null,
    format: null,
    visualStyle: null,
    inputType: null,
    quantity: 1,
    prompt: '',
    imagePrompt: null,
    duration: undefined,
};

interface SavedDraft {
    selections: Selections;
    savedAt: string;
}

const CREDIT_COST = {
    PER_IMAGE: 1,
    PER_MANGA_PAGE: 5,
    PER_VIDEO_SECOND: 2,
};

const App: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { showToast } = useNotification();
    const [selections, setSelections] = useState<Selections>(initialSelections);
    const [currentStep, setCurrentStep] = useState(1);
    const [appState, setAppState] = useState<'selecting' | 'loading' | 'result'>('selecting');
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [draft, setDraft] = useState<SavedDraft | null>(null);

     useEffect(() => {
        if (user) {
            const savedDraftJson = localStorage.getItem('kriative_studio_draft');
            if (savedDraftJson) {
                try {
                    const parsedDraft = JSON.parse(savedDraftJson);
                    setDraft(parsedDraft);
                } catch (e) {
                    console.error("Failed to parse draft from localStorage", e);
                    localStorage.removeItem('kriative_studio_draft');
                }
            }
        }
    }, [user]);

    const creditsNeeded = useMemo(() => {
        const formatConfig = selections.format ? FORMAT_CONFIGS[selections.format] : null;
        if (!formatConfig) return 0;

        if (formatConfig.isVideo) {
            return (selections.duration || 0) * CREDIT_COST.PER_VIDEO_SECOND;
        }
        if (selections.style === 'Estilo Mangá') {
            return selections.quantity * CREDIT_COST.PER_MANGA_PAGE;
        }
        return selections.quantity * CREDIT_COST.PER_IMAGE;
    }, [selections]);

    const handleUpdate = (updates: Partial<Selections>) => {
        setSelections(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => {
        if (currentStep === 3) {
            if (selections.style === 'Estilo Mangá') {
                 handleUpdate({ visualStyle: null, inputType: 'Prompt de Texto' });
                 setCurrentStep(6);
                 return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, 6));
    };

    const handleBack = () => {
         if (currentStep === 6 && selections.style === 'Estilo Mangá') {
            setCurrentStep(3);
            return;
        }
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!user || user.credits < creditsNeeded) {
            showToast("Créditos insuficientes para esta ação.", "error");
            return;
        }

        updateUser({ credits: Math.max(0, user.credits - creditsNeeded) });

        setAppState('loading');
        try {
            const content = await geminiService.generateContent(selections);
            setGeneratedContent(content);
            setAppState('result');
        } catch (error) {
            console.error("Error generating content:", error);
            
            // Refund credits on failure
            updateUser({ credits: user.credits });
            
            let userMessage = "Ocorreu um erro ao gerar o conteúdo. Seus créditos foram restaurados.";

            if (error instanceof Error && error.message) {
                 const lowerCaseMessage = error.message.toLowerCase();
                 if (lowerCaseMessage.includes('resource_exhausted') || lowerCaseMessage.includes('quota exceeded')) {
                    userMessage = "Limite de uso da API atingido. Verifique sua cota ou tente novamente mais tarde.";
                } else if (lowerCaseMessage.includes('api key not valid')) {
                     userMessage = "Chave de API inválida. Verifique suas configurações.";
                } else {
                     userMessage = `Erro: ${error.message.substring(0, 100)}...`;
                }
            }

            showToast(userMessage, 'error');
            setAppState('selecting');
        }
    };

    const handleReset = () => {
        setSelections(initialSelections);
        setCurrentStep(1);
        setGeneratedContent(null);
        setAppState('selecting');
    };

    const loadDraft = () => {
        if (draft) {
            setSelections(draft.selections);
            setCurrentStep(6);
            setDraft(null);
        }
    };

    const dismissDraft = () => {
        localStorage.removeItem('kriative_studio_draft');
        setDraft(null);
    };


    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1Platform selections={selections} onSelect={(platform) => handleUpdate({ platform, format: null })} onNext={handleNext} />;
            case 2:
                return <Step2Style selections={selections} onSelect={(style) => handleUpdate({ style, format: null, visualStyle: null, inputType: null, prompt: '' })} onNext={handleNext} onBack={handleBack} />;
            case 3:
                return <Step3Format selections={selections} onUpdate={handleUpdate} onNext={handleNext} onBack={handleBack} />;
            case 4:
                return <Step4VisualStyle selections={selections} onSelect={(visualStyle) => handleUpdate({ visualStyle })} onNext={handleNext} onBack={handleBack} />;
            case 5:
                return <Step5InputType selections={selections} onSelect={(inputType) => handleUpdate({ inputType })} onNext={handleNext} onBack={handleBack} />;
            case 6:
                return <Step6Describe selections={selections} onUpdate={handleUpdate} onSubmit={handleSubmit} onBack={handleBack} />;
            default:
                return null;
        }
    };

    if (!user) {
        return <AuthScreen />;
    }
    
    if (appState === 'loading') {
        return <LoadingScreen selections={selections} />;
    }

    if (appState === 'result' && generatedContent) {
        return <ResultScreen content={generatedContent} onReset={handleReset} selections={selections} />;
    }

    return (
        <div className="min-h-screen bg-[#f5f5dc] font-sans">
            <Header />
            {draft && appState === 'selecting' && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-teal-100 border border-teal-500 text-teal-900 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center space-x-3">
                        <i className="fa-solid fa-save text-2xl"></i>
                        <div>
                            <p className="font-bold">Rascunho Encontrado!</p>
                            <p className="text-sm">Quer continuar de onde parou?</p>
                        </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                        <Button onClick={loadDraft} variant="primary" className="py-2 px-4 text-sm">Carregar</Button>
                        <button onClick={dismissDraft} className="text-teal-700 hover:text-teal-900 w-8 h-8 rounded-full hover:bg-teal-200 transition-colors">
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>
            )}
            <main className="pt-28 pb-12 px-4 md:px-8">
                <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-10 border border-gray-200">
                    <div className="mb-10">
                        <StepIndicator currentStep={currentStep} />
                    </div>
                    {renderStep()}
                </div>
            </main>
        </div>
    );
};

export default App;
