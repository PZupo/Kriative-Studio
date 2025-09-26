import React from 'react';
import type { Selections } from '../../types';
import { VISUAL_STYLES } from '../../constants';
import Button from '../common/Button';

interface Props {
    selections: Selections;
    onSelect: (style: Selections['visualStyle']) => void;
    onNext: () => void;
    onBack: () => void;
}

const styleIcons: { [key: string]: string } = {
    'Realista': 'fa-camera-retro',
    'Disney': 'fa-wand-magic-sparkles',
    'Pixar': 'fa-lightbulb',
    'Studio Ghibli': 'fa-leaf',
    'Cartoon': 'fa-face-smile-beam',
    'Aquarela': 'fa-paintbrush',
    'Minimalista': 'fa-square',
    'Vintage': 'fa-film',
};


const Step4VisualStyle: React.FC<Props> = ({ selections, onSelect, onNext, onBack }) => {
    return (
        <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">Qual estilo visual você busca?</h2>
            <div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
                {VISUAL_STYLES.map(style => (
                    <button
                        key={style}
                        onClick={() => onSelect(style as Selections['visualStyle'])}
                        className={`p-4 rounded-lg border-2 font-semibold transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center h-28
                            ${selections.visualStyle === style ? 'bg-[#008080] text-white border-transparent ring-4 ring-[#39ff14] ring-offset-2' : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'}`}
                    >
                        <i className={`fa-solid ${styleIcons[style]} text-3xl mb-2 transition-colors ${selections.visualStyle === style ? 'text-white' : 'text-[#ff8c00]'}`}></i>
                        <span>{style}</span>
                    </button>
                ))}
            </div>
            <div className="mt-8 flex space-x-4">
                <Button onClick={onBack} variant="ghost">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
                </Button>
                <Button onClick={onNext} disabled={!selections.visualStyle}>
                    Avançar <i className="fa-solid fa-arrow-right ml-2"></i>
                </Button>
            </div>
        </div>
    );
};

export default Step4VisualStyle;