import React, { useState } from 'react';
// FIX: Import useAuth from AuthContext to resolve missing member error.
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import AuthScreen from './components/AuthScreen';
import HistoryScreen from './components/HistoryScreen';
import CalendarScreen from './components/CalendarScreen';
import LiveScreen from './components/LiveScreen'; // Novo
import MissingConfigurationScreen from './components/MissingConfigurationScreen'; // Novo
import { isSupabaseConfigured } from './services/supabaseClient';
import * as geminiService from './services/geminiService';
import { isGeminiConfigured } from './services/geminiService';

// Studio components
import { Selections, GeneratedContent } from './types';
import { useNotification } from './contexts/NotificationContext';
import { VIDEO_FORMATS } from './constants';
import StepIndicator from './components/StepIndicator';
import Step1Platform from './components/steps/Step1Platform';
import Step2Style from './components/steps/Step2Style';
import Step3Format from './components/steps/Step3Format';
import Step4VisualStyle from './components/steps/Step4VisualStyle';
import Step5InputType from './components/steps/Step5InputType';
import Step6Describe from './components/steps/Step6Describe';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';

type AppView = 'studio' | 'history' | 'calendar' | 'live';

const StudioView: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { showToast } = useNotification();
    const [step, setStep] = useState(1);
    const [selections, setSelections] = useState<Selections>({
        platform: null,
        style: null,
        format: null,
        visualStyle: null,
        inputType: 'Prompt de Texto',
        prompt: '',
        imagePrompt: null,
        quantity: 1,
        duration: 30,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

    const creditsNeeded = React.useMemo(() => {
        const { style, format, quantity, duration } = selections;
        if (!format) return 1;
        if (style === 'Estilo Mangá') {
            if (format === 'Revista') return 2 + (quantity * 2);
            if (format === 'Vídeo Animado') return 15 + Math.ceil((duration || 0) / 10);
        }
        if (VIDEO_FORMATS.includes(format)) {
            return 5 + Math.ceil((duration || 0) / 15);
        }
        return quantity;
    }, [selections]);

    const handleSubmit = async () => {
        if (!user || user.credits < creditsNeeded) {
            showToast('Créditos insuficientes.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const content = await geminiService.generateContent(selections);
            setGeneratedContent(content);
            updateUser({ credits: user.credits - creditsNeeded });
            showToast('Conteúdo gerado com sucesso!', 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setStep(1);
        setSelections({
            platform: null, style: null, format: null, visualStyle: null,
            inputType: 'Prompt de Texto', prompt: '', imagePrompt: null, quantity: 1, duration: 30,
        });
        setGeneratedContent(null);
    };
    
    if (isLoading) return <LoadingScreen selections={selections} />;
    if (generatedContent) return <ResultScreen content={generatedContent} onReset={handleReset} selections={selections} />;

    const renderStep = () => {
        const props = { selections, onUpdate: (updates: Partial<Selections>) => setSelections(p => ({...p, ...updates})) };
        switch (step) {
            case 1: return <Step1Platform {...props} onSelect={p => props.onUpdate({platform: p})} onNext={() => setStep(2)} />;
            case 2: return <Step2Style {...props} onSelect={s => props.onUpdate({style: s, format: null})} onNext={() => setStep(3)} onBack={() => setStep(1)} />;
            case 3: return <Step3Format {...props} onNext={() => setStep(4)} onBack={() => setStep(2)} />;
            case 4: return <Step4VisualStyle {...props} onSelect={vs => props.onUpdate({visualStyle: vs})} onNext={() => setStep(5)} onBack={() => setStep(3)} />;
            case 5: return <Step5InputType {...props} onSelect={it => props.onUpdate({inputType: it})} onNext={() => setStep(6)} onBack={() => setStep(4)} />;
            case 6: return <Step6Describe {...props} onSubmit={handleSubmit} onBack={() => setStep(5)} creditsNeeded={creditsNeeded} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-10 border border-gray-200 dark:border-gray-700">
            <div className="mb-8">
                <StepIndicator currentStep={step} />
            </div>
            {renderStep()}
        </div>
    );
};

const App: React.FC = () => {
    const { user, loading } = useAuth();
    const [currentView, setCurrentView] = useState<AppView>('studio');
    
    // Verifica a configuração uma vez no carregamento.
    const isConfigured = isSupabaseConfigured && isGeminiConfigured;

    if (!isConfigured) {
        return <MissingConfigurationScreen />;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f5dc] dark:bg-gray-900 flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-[#008080] dark:text-teal-400"></i>
            </div>
        );
    }
    
    if (!user) {
        return <AuthScreen />;
    }

    const renderCurrentView = () => {
        switch (currentView) {
            case 'history': return <HistoryScreen onNavigate={setCurrentView} />;
            case 'calendar': return <CalendarScreen onNavigate={setCurrentView} />;
            case 'live': return <LiveScreen />;
            case 'studio': default: return <StudioView />;
        }
    };
    
    return (
        <div className="bg-[#f5f5dc] dark:bg-gray-900 min-h-screen font-sans">
            <Header currentView={currentView} onNavigate={setCurrentView} />
            <main className="pt-28 pb-10 px-4">
                {renderCurrentView()}
            </main>
        </div>
    );
};

export default App;