import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNotification } from './contexts/NotificationContext';
import { Selections, GeneratedContent } from './types';
import { isSupabaseConfigured } from './services/supabaseClient';
import * as geminiService from './services/geminiService';
import { isGeminiConfigured } from './services/geminiService';
import { FORMAT_CONFIGS } from './constants';

import AuthScreen from './components/AuthScreen';
import HistoryScreen from './components/HistoryScreen';
import CalendarScreen from './components/CalendarScreen';
import LiveScreen from './components/LiveScreen';
import MissingConfigurationScreen from './components/MissingConfigurationScreen';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import Step1Platform from './components/steps/Step1Platform';
import Step2Style from './components/steps/Step2Style';
import Step3Format from './components/steps/Step3Format';
import Step4VisualStyle from './components/steps/Step4VisualStyle';
import Step5InputType from './components/steps/Step5InputType';
import Step6Describe from './components/steps/Step6Describe';


type AppView = 'studio' | 'history' | 'calendar' | 'live';
type StudioState = 'configuring' | 'loading' | 'result';

const initialSelections: Selections = {
  platform: null,
  style: null,
  format: null,
  visualStyle: null,
  inputType: 'Prompt de Texto',
  prompt: '',
  imagePrompt: null,
  quantity: 1,
  duration: 30,
};

const App: React.FC = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const { showToast } = useNotification();
  
  const [view, setView] = useState<AppView>('studio');
  const [studioState, setStudioState] = useState<StudioState>('configuring');
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState<Selections>(initialSelections);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  useEffect(() => {
    try {
        const draft = localStorage.getItem('kriative_studio_draft');
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            if (parsedDraft.selections && parsedDraft.savedAt) {
                setSelections(parsedDraft.selections);
                showToast('Rascunho anterior carregado.', 'success');
                localStorage.removeItem('kriative_studio_draft');
            }
        }
    } catch (error) {
        console.error("Failed to load draft:", error);
        localStorage.removeItem('kriative_studio_draft');
    }
  }, [showToast]);

  const handleUpdateSelections = (updates: Partial<Selections>) => {
    setSelections(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const resetStudio = () => {
    setStudioState('configuring');
    setCurrentStep(1);
    setSelections(initialSelections);
    setGeneratedContent(null);
  };

  const creditsNeeded = useMemo(() => {
    const { format, quantity, duration, style } = selections;
    if (!format) return 1;

    const config = FORMAT_CONFIGS[format];
    if (style === 'Estilo Mangá') {
        if (format === 'Revista') return quantity * 2 + 1; // ~2 per page + 1 for story
        if (format === 'Vídeo Animado') return 7;
    }

    if (config?.isVideo) {
        if (duration <= 60) return 5;
        if (duration <= 90) return 7;
        if (duration <= 180) return 13;
        return 21; // Up to 300s
    }

    return quantity; // 1 per image
  }, [selections]);

  const handleSubmit = async () => {
    if (!user || user.credits < creditsNeeded) {
        showToast('Créditos insuficientes.', 'error');
        return;
    }

    setStudioState('loading');
    try {
        const content = await geminiService.generateContent(selections);
        setGeneratedContent(content);
        if (user) {
            updateUser({ credits: user.credits - creditsNeeded });
        }
        setStudioState('result');
        showToast('Conteúdo gerado com sucesso!', 'success');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        showToast(`Erro ao gerar conteúdo: ${errorMessage}`, 'error');
        setStudioState('configuring');
    }
  };

  const renderStudio = () => {
    switch (studioState) {
        case 'loading':
            return <LoadingScreen selections={selections} />;
        case 'result':
            return <ResultScreen content={generatedContent!} onReset={resetStudio} selections={selections} />;
        case 'configuring':
        default:
            return (
                <div className="w-full max-w-4xl mx-auto">
                    <div className="mb-10">
                        <StepIndicator currentStep={currentStep} />
                    </div>
                    {currentStep === 1 && <Step1Platform selections={selections} onSelect={(p) => handleUpdateSelections({ platform: p, format: null })} onNext={nextStep} />}
                    {currentStep === 2 && <Step2Style selections={selections} onSelect={(s) => handleUpdateSelections({ style: s, format: null })} onNext={nextStep} onBack={prevStep} />}
                    {currentStep === 3 && <Step3Format selections={selections} onUpdate={handleUpdateSelections} onNext={nextStep} onBack={prevStep} />}
                    {currentStep === 4 && <Step4VisualStyle selections={selections} onSelect={(vs) => handleUpdateSelections({ visualStyle: vs })} onNext={nextStep} onBack={prevStep} />}
                    {currentStep === 5 && <Step5InputType selections={selections} onSelect={(it) => handleUpdateSelections({ inputType: it })} onNext={nextStep} onBack={prevStep} />}
                    {currentStep === 6 && <Step6Describe selections={selections} onUpdate={handleUpdateSelections} onSubmit={handleSubmit} onBack={prevStep} creditsNeeded={creditsNeeded} />}
                </div>
            );
    }
  };

  const renderView = () => {
    switch(view) {
        case 'studio': return renderStudio();
        case 'history': return <HistoryScreen onNavigate={setView} />;
        case 'calendar': return <CalendarScreen onNavigate={setView} />;
        case 'live': return <LiveScreen />;
        default: return renderStudio();
    }
  };
  
  if (!isSupabaseConfigured || !isGeminiConfigured) {
    return <MissingConfigurationScreen />;
  }
  
  if (authLoading) {
    return (
        <div className="min-h-screen bg-[#f5f5dc] dark:bg-gray-900 flex items-center justify-center">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-[#008080]"></i>
        </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5dc] dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200">
      <Header currentView={view} onNavigate={setView} />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
