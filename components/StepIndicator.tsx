
import React from 'react';

interface StepIndicatorProps {
    currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    const steps = [
        'Plataforma', 'Estilo', 'Formato', 'Visual', 'Entrada', 'Descrição'
    ];

    return (
        <div className="flex justify-between items-center">
            {steps.map((label, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                    <React.Fragment key={stepNumber}>
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                                ${isActive ? 'bg-[#ff8c00] text-white scale-110 shadow-lg' : ''}
                                ${isCompleted ? 'bg-[#008080] text-white' : ''}
                                ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                            `}>
                                {isCompleted ? <i className="fa-solid fa-check"></i> : stepNumber}
                            </div>
                            <span className={`mt-2 text-xs md:text-sm font-semibold transition-colors duration-300 ${isActive ? 'text-[#ff8c00]' : 'text-gray-500'}`}>{label}</span>
                        </div>
                        {stepNumber < steps.length && <div className={`flex-1 h-1 mx-2 rounded-full ${isCompleted ? 'bg-[#008080]' : 'bg-gray-200'}`}></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default StepIndicator;
