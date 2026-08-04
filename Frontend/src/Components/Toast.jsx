import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from "../utils/toast.slice.js";

const Toast = ({ id, message, type }) => {
    const dispatch = useDispatch();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 2700); // Trigger exit animation slightly before 3000ms removal

        const removeTimer = setTimeout(() => {
            dispatch(removeToast(id));
        }, 3000); // 3000ms auto-dismiss lifecycle

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [dispatch, id]);

    const handleManualDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            dispatch(removeToast(id));
        }, 300); // wait for exit animation
    };

    const getToastStyles = () => {
        switch (type) {
            case 'error':
                return 'bg-red-500/10 border-red-500/20 text-red-200 dark:text-red-100 shadow-[0_8px_32px_rgba(239,68,68,0.15)]';
            case 'success':
                return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200 dark:text-emerald-100 shadow-[0_8px_32px_rgba(16,185,129,0.15)]';
            case 'info':
                return 'bg-blue-500/10 border-blue-500/20 text-blue-200 dark:text-blue-100 shadow-[0_8px_32px_rgba(59,130,246,0.15)]';
            default:
                return 'bg-neutral-900/80 border-neutral-800 text-neutral-100 shadow-[0_8px_32px_rgba(0,0,0,0.3)]';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'error':
                return <i className="ri-error-warning-fill text-red-400 text-xl"></i>;
            case 'success':
                return <i className="ri-checkbox-circle-fill text-emerald-400 text-xl"></i>;
            case 'info':
                return <i className="ri-information-fill text-blue-400 text-xl"></i>;
            default:
                return <i className="ri-notification-fill text-accent text-xl"></i>;
        }
    };

    return (
        <div 
            className={`relative pointer-events-auto flex items-center gap-4 p-4 pr-12 rounded-xl border backdrop-blur-xl transition-all duration-300 ${
                isExiting ? 'toast-slide-out' : 'toast-slide-in'
            } ${getToastStyles()}`}
            style={{ width: 'max-content', minWidth: '320px', maxWidth: '420px' }}
        >
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10">
                {getIcon()}
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[10px] font-sans uppercase tracking-[0.15em] opacity-40">
                    {type === 'error' ? 'Alert' : type === 'success' ? 'Success' : 'Notice'}
                </span>
                <p className="text-xs font-medium tracking-wide leading-relaxed font-sans">{message}</p>
            </div>
            <button 
                onClick={handleManualDismiss}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 opacity-40 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
                <i className="ri-close-line text-sm"></i>
            </button>
        </div>
    );
};

export const ToastContainer = () => {
    const toasts = useSelector((state) => state.toast.toasts);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none flex flex-col gap-3">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </div>
    );
};
