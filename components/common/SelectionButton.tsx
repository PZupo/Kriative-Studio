import React from 'react';

interface SelectionButtonProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    icon?: string;
    disabled?: boolean;
}

const SelectionButton: React.FC<SelectionButtonProps> = ({ label, isSelected, onClick, icon, disabled = false }) => {
    const baseClasses = 'w-full text-left p-4 rounded-xl border-2 transition-all duration-300 transform focus:outline-none';

    // Determine classes based on state
    const selectedClasses = 'bg-[#008080] text-white ring-4 ring-offset-2 ring-[#39ff14] scale-105 shadow-xl border-transparent';
    const unselectedClasses = 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md border-gray-200 dark:border-gray-600 hover:scale-105';
    const disabledClasses = 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-700'; // No hover scale

    const stateClasses = disabled
        ? disabledClasses
        : isSelected
            ? selectedClasses
            : unselectedClasses;

    // Determine icon color
    const iconColor = isSelected ? 'text-white' : disabled ? 'text-gray-400 dark:text-gray-500' : 'text-[#ff8c00]';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${stateClasses}`}
        >
            <div className="flex items-center space-x-4">
                {icon && <i className={`fa-solid ${icon} text-2xl w-8 text-center ${iconColor}`}></i>}
                <span className="font-semibold text-lg">{label}</span>
            </div>
        </button>
    );
};

export default SelectionButton;