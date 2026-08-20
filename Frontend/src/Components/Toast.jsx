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
                return 'bg-white/95 dark:bg-neutral-900/95 border-red-500/40 text-neutral-900 dark:text-neutral-100 shadow-[0_10px_35px_rgba(239,68,68,0.2)]';
            case 'success':
                return 'bg-white/95 dark:bg-neutral-900/95 border-emerald-500/40 text-neutral-900 dark:text-neutral-100 shadow-[0_10px_35px_rgba(16,185,129,0.2)]';
            case 'info':
                return 'bg-white/95 dark:bg-neutral-900/95 border-blue-500/40 text-neutral-900 dark:text-neutral-100 shadow-[0_10px_35px_rgba(59,130,246,0.2)]';
            default:
                return 'bg-white/95 dark:bg-neutral-900/95 border-border-theme text-neutral-900 dark:text-neutral-100 shadow-[0_10px_35px_rgba(0,0,0,0.15)]';
        }
    };

    const getBadgeStyles = () => {
        switch (type) {
            case 'error':
                return 'text-red-600 dark:text-red-400';
            case 'success':
                return 'text-emerald-600 dark:text-emerald-400';
            case 'info':
                return 'text-blue-600 dark:text-blue-400';
            default:
                return 'text-accent';
        }
    };

    const getIconContainerStyles = () => {
        switch (type) {
            case 'error':
                return 'bg-red-500/10 border-red-500/25 text-red-500';
            case 'success':
                return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500';
            case 'info':
                return 'bg-blue-500/10 border-blue-500/25 text-blue-500';
            default:
                return 'bg-accent/10 border-accent/25 text-accent';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'error':
                return <i className="ri-error-warning-fill text-base sm:text-lg"></i>;
            case 'success':
                return <i className="ri-checkbox-circle-fill text-base sm:text-lg"></i>;
            case 'info':
                return <i className="ri-information-fill text-base sm:text-lg"></i>;
            default:
                return <i className="ri-notification-fill text-base sm:text-lg"></i>;
        }
    };

    return (
        <div 
            className={`relative pointer-events-auto flex items-center gap-3 p-3 sm:p-3.5 pr-9 sm:pr-10 rounded-2xl border backdrop-blur-2xl transition-all duration-300 w-full sm:w-auto min-w-0 sm:min-w-[270px] max-w-[92vw] sm:max-w-[390px] shadow-xl ${
                isExiting ? 'toast-slide-out' : 'toast-slide-in'
            } ${getToastStyles()}`}
        >
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl border ${getIconContainerStyles()}`}>
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className={`text-[9px] sm:text-[10px] font-sans uppercase font-black tracking-widest ${getBadgeStyles()}`}>
                    {type === 'error' ? 'Alert' : type === 'success' ? 'Success' : 'Notice'}
                </span>
                <p className="text-[11px] sm:text-xs font-bold leading-snug font-sans break-words text-neutral-800 dark:text-neutral-200">
                    {message}
                </p>
            </div>
            <button 
                onClick={handleManualDismiss}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                title="Dismiss"
            >
                <i className="ri-close-line text-sm"></i>
            </button>
        </div>
    );
};

export const ToastContainer = () => {
    const toasts = useSelector((state) => state.toast.toasts);

    return (
        <div className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-[9999] pointer-events-none flex flex-col items-center sm:items-end gap-2">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </div>
    );
};
