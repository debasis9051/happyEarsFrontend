import React from "react";
import { useFirebase } from "../contexts/firebase-context";
import { Navigate } from "react-router-dom";

const AuthWrapper = ({ children, page }) => {
    const { isLoading, isLoggedIn, userAccess } = useFirebase()

    if (!isLoading) {
        if (isLoggedIn) {
            if (userAccess[page]) {
                return (
                    <>
                        {children}
                    </>
                )
            }
            else {
                return <Navigate to="/unauthorized" replace={true} />
            }
        }
        else {
            return <div className="bg-white font-monospace fs-2 m-5 p-5 rounded text-black text-center">Please Sign in to access this feature</div>
        }
    }
    else {
        return <div className="bg-white font-monospace fs-2 m-5 p-5 rounded text-black text-center">Loading...</div>
    }
}

export default AuthWrapper
