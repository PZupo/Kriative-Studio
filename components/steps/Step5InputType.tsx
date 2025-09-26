import React from 'react';
import type { Selections } from '../../types';
import { INPUT_TYPES } from '../../constants';
import Button from '../common/Button';
import SelectionButton from '../common/SelectionButton';

interface Props {
    selections: Selections;
    onSelect: (type: Selections['inputType']) => void;
    onNext: () => void;
    onBack: () => void;
}

const inputTypeIcons: { [key: string]: string } = {
    'Prompt de Texto': 'fa-keyboard',
    'Prompt de Imagem': 'fa-camera',
};

const Step5InputType: React.FC<Props> = ({ selections, onSelect, onNext, onBack }) => {
    return (
        <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">Como você quer descrever sua ideia?</h2>
            <div className="w-full max-w-sm space-y-4">
                {INPUT_TYPES.map(type => (
                    <SelectionButton
                        key={type}
                        label={type}
                        isSelected={selections.inputType === type}
                        onClick={() => onSelect(type as Selections['inputType'])}
                        icon={inputTypeIcons[type]}
                    />
                ))}
            </div>
            <div className="mt-8 flex space-x-4">
                <Button onClick={onBack} variant="ghost">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
                </Button>
                <Button onClick={onNext} disabled={!selections.inputType}>
                    Avançar <i className="fa-solid fa-arrow-right ml-2"></i>
                </Button>
            </div>
        </div>
    );
};

export default Step5InputType;