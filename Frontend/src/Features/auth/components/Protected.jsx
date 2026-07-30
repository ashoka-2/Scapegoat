import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router'

const Protected = ({ children }) => {
    const user = useSelector(state => state.auth.user)
    const location = useLocation()
    
    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (user && user.profileCompleted === false && location.pathname !== '/complete-profile') {
        return <Navigate to="/complete-profile" replace />
    }

    if (user && user.profileCompleted && location.pathname === '/complete-profile') {
        return <Navigate to="/" replace />
    }

    return children
}

export default Protected
