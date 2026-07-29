import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router'

const Protected = ({ children }) => {
    const user = useSelector(state => state.auth.user)
    
    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default Protected
