// FIX: Implemented the main App component to orchestrate the entire application flow, resolving the 'not a module' error.
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNotification } from './contexts/NotificationContext';
import type { Selections, GeneratedContent } from './types';
import { geminiService } from './services/geminiService';
import { FORMAT_CONFIGS } from './constants';

// Import components
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './ResultScreen';
import HistoryScreen from './components/HistoryScreen';
import CalendarScreen from './components/CalendarScreen';
import ConfigurationScreen from './components/ConfigurationScreen'; // Import the new component

// Step components
import Step1Platform from './components/steps/Step1Platform';
import Step2Style from './components/steps/Step2Style';
import Step3Format from './components/steps/Step3Format';
import Step4VisualStyle from './components/steps/Step4VisualStyle';
import Step5InputType from './components/steps/Step5InputType';
import Step6Describe from './components/steps/Step6Describe';

const initialSelections: Selections = {
    platform: null,
    style: null,
    format: null,
    visualStyle: null,
    inputType: null,
    prompt: '',
    imagePrompt: null,
    quantity: 1,
    duration: 30,
};

type AppView = 'studio' | 'history' | 'calendar';

function App() {
    const { user, isLoading: isAuthLoading, updateUser, isConfigurationMissing } = useAuth();
    const { showToast } = useNotification();

    // App state
    const [view, setView] = useState<AppView>('studio');
    const [currentStep, setCurrentStep] = useState(1);
    const [selections, setSelections] = useState<Selections>(initialSelections);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

    useEffect(() => {
        // Load draft from local storage on component mount
        const draftJson = localStorage.getItem('kriative_studio_draft');
        if (draftJson) {
            try {
                const draft = JSON.parse(draftJson);
                // Simple validation
                if (draft.selections && draft.selections.platform) {
                    setSelections(draft.selections);
                    showToast('Rascunho carregado com sucesso!');
                }
            } catch (e) {
                console.error("Failed to parse draft from localStorage", e);
                localStorage.removeItem('kriative_studio_draft');
            }
        }
    }, [showToast]);

    const handleUpdateSelections = (updates: Partial<Selections>) => {
        setSelections(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const calculateCredits = (): number => {
        if (!selections.format) return 1;
        
        let credits = 0;
        const config = FORMAT_CONFIGS[selections.format];
        
        if (config.isVideo) {
            // Example: 1 credit per 15 seconds of video
            credits = Math.ceil((selections.duration || config.maxDuration) / 15);
        } else if (selections.style === 'Estilo Mangá') {
            // Example: 2 credits per page for manga
            credits = selections.quantity * 2;
        } else {
            // 1 credit per image
            credits = selections.quantity;
        }
        
        // Add extra credit for complexity if image prompt is used
        if (selections.inputType === 'Prompt de Imagem' && selections.imagePrompt) {
            credits += 1;
        }
        
        return Math.max(1, credits);
    };
    
    const creditsNeeded = calculateCredits();

    const handleSubmit = async () => {
        if (!user) {
            showToast('Erro de autenticação.', 'error');
            return;
        }
        if (user.credits < creditsNeeded) {
            showToast('Créditos insuficientes.', 'error');
            return;
        }

        setIsLoading(true);
        setGeneratedContent(null);

        try {
            const content = await geminiService.generateContent(selections);
            setGeneratedContent(content);
            updateUser({ credits: user.credits - creditsNeeded });
            // Clear draft on successful submission
            localStorage.removeItem('kriative_studio_draft');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao gerar o conteúdo.";
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setGeneratedContent(null);
        setSelections(initialSelections);
        setCurrentStep(1);
        setView('studio');
    };

    const renderStudioContent = () => {
        if (isLoading) {
            return <LoadingScreen selections={selections} />;
        }
        if (generatedContent) {
            return <ResultScreen content={generatedContent} onReset={handleReset} selections={selections} />;
        }

        const steps = [
            <Step1Platform selections={selections} onSelect={(p) => handleUpdateSelections({ platform: p, format: null })} onNext={nextStep} />,
            <Step2Style selections={selections} onSelect={(s) => handleUpdateSelections({ style: s, format: null })} onNext={nextStep} onBack={prevStep} />,
            <Step3Format selections={selections} onUpdate={handleUpdateSelections} onNext={nextStep} onBack={prevStep} />,
            <Step4VisualStyle selections={selections} onSelect={(vs) => handleUpdateSelections({ visualStyle: vs })} onNext={nextStep} onBack={prevStep} />,
            <Step5InputType selections={selections} onSelect={(it) => handleUpdateSelections({ inputType: it })} onNext={nextStep} onBack={prevStep} />,
            <Step6Describe selections={selections} onUpdate={handleUpdateSelections} onSubmit={handleSubmit} onBack={prevStep} creditsNeeded={creditsNeeded} />
        ];

        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <StepIndicator currentStep={currentStep} />
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-10 border border-gray-200">
                    {steps[currentStep - 1]}
                </div>
            </div>
        );
    };

    const renderView = () => {
        switch (view) {
            case 'studio':
                return renderStudioContent();
            case 'history':
                return <HistoryScreen onNavigate={setView} />;
            case 'calendar':
                return <CalendarScreen onNavigate={setView} />;
            default:
                return renderStudioContent();
        }
    };

    if (isConfigurationMissing) {
        return <ConfigurationScreen />;
    }

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-[#008080]"></i>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    return (
        <div className="min-h-screen bg-[#f5f5dc] font-sans">
            <Header currentView={view} onNavigate={setView} />
            <main className="pt-28 pb-12 px-4">
                {renderView()}
            </main>
        </div>
    );
}

export default App;
