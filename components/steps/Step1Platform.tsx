
import React from 'react';
import type { Selections } from '../../types';
import { PLATFORMS } from '../../constants';
import Button from '../common/Button';
import SelectionButton from '../common/SelectionButton';

interface Props {
    selections: Selections;
    onSelect: (platform: Selections['platform']) => void;
    onNext: () => void;
}

const platformIcons: { [key: string]: string } = {
    'Instagram': 'fa-brands fa-instagram',
    'TikTok': 'fa-brands fa-tiktok',
    'YouTube': 'fa-brands fa-youtube',
};

const Step1Platform: React.FC<Props> = ({ selections, onSelect, onNext }) => {
    return (
        <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6">Para qual plataforma é o conteúdo?</h2>
            <div className="w-full max-w-sm space-y-4">
                {PLATFORMS.map(platform => (
                    <SelectionButton
                        key={platform}
                        label={platform}
                        isSelected={selections.platform === platform}
                        onClick={() => onSelect(platform as Selections['platform'])}
                        icon={platformIcons[platform]}
                    />
                ))}
            </div>
            <div className="mt-8">
                <Button onClick={onNext} disabled={!selections.platform}>
                    Avançar <i className="fa-solid fa-arrow-right ml-2"></i>
                </Button>
            </div>
        </div>
    );
};

export default Step1Platform;
