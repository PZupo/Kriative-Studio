import React from 'react';
import type { Selections } from '../../types';
import { STYLES } from '../../constants';
import Button from '../common/Button';
import SelectionButton from '../common/SelectionButton';

interface Props {
    selections: Selections;
    onSelect: (style: Selections['style']) => void;
    onNext: () => void;
    onBack: () => void;
}

const styleIcons: { [key: string]: string } = {
    'Padrão': 'fa-image',
    'Estilo Mangá': 'fa-book-open',
};

const Step2Style: React.FC<Props> = ({ selections, onSelect, onNext, onBack }) => {
    return (
        <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">Qual estilo você prefere?</h2>
            <div className="w-full max-w-sm space-y-4">
                {STYLES.map(style => (
                    <SelectionButton
                        key={style}
                        label={style}
                        isSelected={selections.style === style}
                        onClick={() => onSelect(style as Selections['style'])}
                        icon={styleIcons[style]}
                    />
                ))}
            </div>
            <div className="mt-8 flex space-x-4">
                <Button onClick={onBack} variant="ghost">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
                </Button>
                <Button onClick={onNext} disabled={!selections.style}>
                    Avançar <i className="fa-solid fa-arrow-right ml-2"></i>
                </Button>
            </div>
        </div>
    );
};

export default Step2Style;