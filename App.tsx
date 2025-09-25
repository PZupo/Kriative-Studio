import React, { useState, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured, missingConfig } from './services/supabaseClient';
import type { Selections, GeneratedContent } from './types';
import { FORMAT_CONFIGS } from './constants';

// Import Screens and Components
import ConfigurationScreen from './components/ConfigurationScreen';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import HistoryScreen from './components/HistoryScreen';
import CalendarScreen from './components/CalendarScreen';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './ResultScreen';
import StartupErrorScreen from './components/StartupErrorScreen';

// Import Step components
import Step1Platform from './components/steps/Step1Platform';
import Step2Style from './components/steps/Step2Style';
import Step3Format from './components/steps/Step3Format';
import Step4VisualStyle from './components/steps/Step4VisualStyle';
import Step5InputType from './components/steps/Step5InputType';
import Step6Describe from './components/steps/Step6Describe';
import StepIndicator from './components/StepIndicator';
import { geminiService } from './services/geminiService';
import { useNotification } from './contexts/NotificationContext';

type AppView = 'studio' | 'history' | 'calendar';
type GenerationState = 'configuring' | 'loading' | 'result';

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

const App: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { showToast } = useNotification();
    
    // Global App State
    const [currentView, setCurrentView] = useState<AppView>('studio');
    const [error, setError] = useState<string | null>(null);

    // Generation Flow State
    const [generationState, setGenerationState] = useState<GenerationState>('configuring');
    const [currentStep, setCurrentStep] = useState(1);
    const [selections, setSelections] = useState<Selections>(initialSelections);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

    // Catch any critical errors during startup
    if (!isSupabaseConfigured) {
        return <ConfigurationScreen missing={missingConfig} />;
    }

    if (!user) {
        return <AuthScreen />;
    }

    const handleUpdateSelections = (updates: Partial<Selections>) => {
        setSelections(prev => ({ ...prev, ...updates }));
    };

    const handleNextStep = () => {
        setCurrentStep(prev => prev + 1);
    };

    const handleBackStep = () => {
        setCurrentStep(prev => prev - 1);
    };
    
    const creditsNeeded = useMemo(() => {
        const { style, format, quantity, duration } = selections;
        if (!format) return 1;

        const formatConfig = FORMAT_CONFIGS[format];
        if (!formatConfig) return 1;

        if (style === 'Estilo Mangá') {
             if (format === 'Revista') return quantity * 2 + 1; // 2 per page + 1 for copy
             if (format === 'Vídeo Animado') return 7; // Flat rate for animated video
        }
        
        if (formatConfig.isVideo) {
             if (duration <= 60) return 5;
             if (duration <= 180) return 13;
             return 21;
        }

        if (formatConfig.isMultiQuantity) {
            return quantity + 1; // 1 per image + 1 for copy
        }
        
        return 1; // Standard single image
    }, [selections]);

    const handleSubmit = async () => {
        if (!user || user.credits < creditsNeeded) {
            showToast('Créditos insuficientes para gerar este conteúdo.', 'error');
            return;
        }

        setGenerationState('loading');
        try {
            const content = await geminiService.generateContent(selections);
            setGeneratedContent(content);
            setGenerationState('result');
            // Deduct credits
            updateUser({ credits: user.credits - creditsNeeded });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
            console.error("Generation failed:", err);
            setError(`Falha na geração: ${errorMessage}`);
            showToast(`Falha na geração: ${errorMessage}`, 'error');
            setGenerationState('configuring'); // Go back to config on error
        }
    };

    const handleReset = () => {
        setSelections(initialSelections);
        setGeneratedContent(null);
        setCurrentStep(1);
        setGenerationState('configuring');
        setError(null);
    };

    const renderStudio = () => {
        if (error) {
            return <StartupErrorScreen message={error} onRetry={handleReset} />;
        }
        
        switch (generationState) {
            case 'loading':
                return <LoadingScreen selections={selections} />;
            case 'result':
                return <ResultScreen content={generatedContent!} onReset={handleReset} selections={selections} />;
            case 'configuring':
            default:
                const steps = [
                    <Step1Platform selections={selections} onSelect={(p) => handleUpdateSelections({ platform: p })} onNext={handleNextStep} />,
                    <Step2Style selections={selections} onSelect={(s) => handleUpdateSelections({ style: s })} onNext={handleNextStep} onBack={handleBackStep} />,
                    <Step3Format selections={selections} onUpdate={handleUpdateSelections} onNext={handleNextStep} onBack={handleBackStep} />,
                    <Step4VisualStyle selections={selections} onSelect={(vs) => handleUpdateSelections({ visualStyle: vs })} onNext={handleNextStep} onBack={handleBackStep} />,
                    <Step5InputType selections={selections} onSelect={(it) => handleUpdateSelections({ inputType: it })} onNext={handleNextStep} onBack={handleBackStep} />,
                    <Step6Describe selections={selections} onUpdate={handleUpdateSelections} onSubmit={handleSubmit} onBack={handleBackStep} creditsNeeded={creditsNeeded} />,
                ];
                return (
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-10">
                            <StepIndicator currentStep={currentStep} />
                        </div>
                        {steps[currentStep - 1]}
                    </div>
                );
        }
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'history':
                return <HistoryScreen onNavigate={setCurrentView} />;
            case 'calendar':
                return <CalendarScreen onNavigate={setCurrentView} />;
            case 'studio':
            default:
                return renderStudio();
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5dc] font-sans">
            <Header currentView={currentView} onNavigate={setCurrentView} />
            <main className="pt-28 pb-12 px-4">
                {renderCurrentView()}
            </main>
        </div>
    );
};

export default App;
