import React from "react";
import { useFirebase } from "../contexts/firebase-context";

const AuthWrapper = ({ children }) => {
    const { isLoading, isLoggedIn, isAuthenticated } = useFirebase()

    if (!isLoading) {
        if (isLoggedIn) {
            if (isAuthenticated) {
                return (
                    <>
                        {children}
                    </>
                )
            }
            else {
                return <div className="bg-white font-monospace fs-2 m-5 p-5 rounded text-black text-center">This account is not authenticated</div>
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
