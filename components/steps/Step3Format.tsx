import React, { useMemo } from 'react';
import type { Selections } from '../../types';
import { FORMATS, MANGA_FORMATS, FORMAT_CONFIGS, PLAN_CONFIGS } from '../../constants';
import Button from '../common/Button';
import SelectionButton from '../common/SelectionButton';
// FIX: Import useAuth from AuthContext to resolve missing member error.
import { useAuth } from '../../contexts/AuthContext';

interface Props {
    selections: Selections;
    onUpdate: (updates: Partial<Selections>) => void;
    onNext: () => void;
    onBack: () => void;
}

const formatIcons: { [key: string]: string } = {
    'Feed': 'fa-square',
    'Stories': 'fa-circle-notch',
    'Reel': 'fa-film',
    'Carrossel': 'fa-images',
    'Vídeo/Post': 'fa-video',
    'Shorts': 'fa-mobile-screen-button',
    'Vídeo': 'fa-tv',
    'Revista': 'fa-book-journal-whills',
    'Vídeo Animado': 'fa-person-running',
};


const Step3Format: React.FC<Props> = ({ selections, onUpdate, onNext, onBack }) => {
    const { user } = useAuth();
    
    const maxPlanDuration = user ? PLAN_CONFIGS[user.plan].maxVideoDuration : 90;

    const availableFormats = useMemo(() => {
        if (selections.style === 'Estilo Mangá') {
            return MANGA_FORMATS;
        }
        return selections.platform ? FORMATS[selections.platform] : [];
    }, [selections.platform, selections.style]);

    const selectedFormatConfig = useMemo(() => {
        return selections.format ? FORMAT_CONFIGS[selections.format] : null;
    }, [selections.format]);

    const handleFormatSelect = (format: string) => {
        const config = FORMAT_CONFIGS[format];
        const updates: Partial<Selections> = { format };

        if (!config.isMultiQuantity) {
            updates.quantity = 1;
        }

        if (config.isVideo) {
            // Set duration, but respect the plan's absolute maximum
            updates.duration = Math.min(config.maxDuration || maxPlanDuration, maxPlanDuration);
        } else {
            // Clear duration if switching to a non-video format
            updates.duration = undefined; 
        }
        
        onUpdate(updates);
    };

    const currentMaxDuration = selectedFormatConfig?.isVideo
        ? Math.min(selectedFormatConfig.maxDuration || maxPlanDuration, maxPlanDuration)
        : maxPlanDuration;

    return (
        <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">Escolha o formato do conteúdo:</h2>
            <div className="w-full max-w-sm space-y-4">
                {availableFormats.map(format => (
                    <SelectionButton
                        key={format}
                        label={format}
                        isSelected={selections.format === format}
                        onClick={() => handleFormatSelect(format)}
                        icon={formatIcons[format]}
                    />
                ))}
            </div>

            {selectedFormatConfig && selectedFormatConfig.isVideo && (
                <div className="w-full max-w-sm mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg animate-fade-in border border-gray-200 dark:border-gray-700">
                    <label htmlFor="duration-slider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duração do Vídeo: <span className="font-bold text-[#008080] dark:text-teal-400">{selections.duration || currentMaxDuration}s</span>
                    </label>
                    <input
                        id="duration-slider"
                        type="range"
                        min="5"
                        max={currentMaxDuration}
                        value={selections.duration || currentMaxDuration}
                        onChange={(e) => onUpdate({ duration: parseInt(e.target.value, 10) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#008080]"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>5s</span>
                        <span>{currentMaxDuration}s</span>
                    </div>
                </div>
            )}

            <div className="mt-8 flex space-x-4">
                <Button onClick={onBack} variant="ghost">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
                </Button>
                <Button onClick={onNext} disabled={!selections.format}>
                    Avançar <i className="fa-solid fa-arrow-right ml-2"></i>
                </Button>
            </div>
        </div>
    );
};

export default Step3Format;