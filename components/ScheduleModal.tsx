import React, { useState, useEffect } from 'react';
import Button from './common/Button';
import { useNotification } from '../contexts/NotificationContext';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (isoDate: string) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const { showToast } = useNotification();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            // Set default to 1 hour from now
            now.setHours(now.getHours() + 1);
            
            // Format for input type="date" -> YYYY-MM-DD
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            setDate(`${year}-${month}-${day}`);

            // Format for input type="time" -> HH:MM
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            setTime(`${hours}:${minutes}`);
        }
    }, [isOpen]);

    const getTodayString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    const handleConfirm = () => {
        if (!date || !time) {
            showToast('Por favor, selecione data e hora.', 'error');
            return;
        }

        const scheduledDateTime = new Date(`${date}T${time}`);
        if (scheduledDateTime < new Date()) {
            showToast('Não é possível agendar no passado.', 'error');
            return;
        }

        onConfirm(scheduledDateTime.toISOString());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Agendar Postagem</h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                        <input
                            type="date"
                            id="schedule-date"
                            value={date}
                            min={getTodayString()}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:dark]"
                        />
                    </div>
                     <div>
                        <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora</label>
                        <input
                            type="time"
                            id="schedule-time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:dark]"
                        />
                    </div>
                </div>
                 <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleConfirm}>Confirmar Agendamento</Button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;