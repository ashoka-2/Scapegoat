import { createSlice } from "@reduxjs/toolkit";

const toastSlice = createSlice({
    name: "toast",
    initialState: {
        toasts: []
    },
    reducers: {
        addToast: (state, action) => {
            state.toasts.push({
                id: Date.now(),
                message: action.payload.message,
                type: action.payload.type || "info",
            });
            if (state.toasts.length > 3) {
                state.toasts.shift();
            }
        },
        removeToast: (state, action) => {
            state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
        }
    }
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
