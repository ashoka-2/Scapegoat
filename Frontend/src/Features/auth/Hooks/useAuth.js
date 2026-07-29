import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setUser, setLoading, setError } from "../State/auth.slice.js";
import { register, login, getMe, logout } from "../Services/auth.api.js";

import { addToast } from "../../../utils/toast.slice.js";

export const useAuth = () => {
  const dispatch = useDispatch();

  const handleRegister = useCallback(async ({ email, contact, password, fullname, isSeller = false }) => {
        dispatch(setLoading(true))
        try {
            const data = await register({ email, contact, password, fullname, isSeller })
            dispatch(setUser(data.user))
            dispatch(addToast({ message: "Welcome to Snitch! Account created successfully.", type: "success" }))
        } catch (error) {
            const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Registration failed. Please try again."
            dispatch(addToast({ message, type: "error" }))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }, [dispatch])

    const handleLogin = useCallback(async ({ identifier, password }) => {
        dispatch(setLoading(true))
        try {
            const data = await login({ identifier, password })
            dispatch(setUser(data.user))
            dispatch(addToast({ message: "Welcome back! Login successful.", type: "success" }))
            return data.user;
        } catch (error) {
            const message = error.response?.data?.message || "Invalid credentials. Please check your email/contact and password."
            dispatch(addToast({ message, type: "error" }))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }, [dispatch])

    const fetchMe = useCallback(async () => {
        dispatch(setLoading(true))
        try {
            const data = await getMe()
            dispatch(setUser(data.user))
        } catch (error) {
            console.log("Not logged in");
            dispatch(setUser(null))
        } finally {
            dispatch(setLoading(false))
        }
    }, [dispatch])

    const handleLogout = useCallback(async () => {
        try {
            await logout()
            dispatch(setUser(null))
            dispatch(addToast({ message: "Logged out successfully.", type: "info" }))
        } catch (error) {
            console.error("Logout failed", error);
            // Even if backend fails, we should probably clear local state
            dispatch(setUser(null))
        }
    }, [dispatch])




    return {handleLogin,handleRegister,handleLogout,fetchMe}
};
