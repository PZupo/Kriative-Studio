import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Toast from '../components/common/Toast';

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface NotificationContextType {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
        }, 3500); // 3.5 seconds total lifetime
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end space-y-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} type={toast.type} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};