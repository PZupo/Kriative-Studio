import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClasses = 'px-6 py-3 font-bold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

    const variants = {
        primary: 'bg-[#008080] text-white hover:bg-[#006666] focus:ring-[#008080]',
        secondary: 'bg-[#ff8c00] text-white hover:bg-[#cc7000] focus:ring-[#ff8c00]',
        ghost: 'bg-transparent text-[#008080] dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/50 focus:ring-[#008080]',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;