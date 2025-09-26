import React from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, type }) => {
    const baseClasses = 'px-4 py-3 rounded-lg shadow-xl text-white font-semibold flex items-center space-x-3';
    const typeClasses = {
        success: 'bg-gradient-to-r from-green-500 to-emerald-500',
        error: 'bg-gradient-to-r from-red-500 to-rose-500',
    };
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]} animate-toast-in`}>
            <i className={`fa-solid ${icon[type]}`}></i>
            <span>{message}</span>
        </div>
    );
};

export default Toast;