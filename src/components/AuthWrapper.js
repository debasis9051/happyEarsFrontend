import React, { useState, useEffect } from "react";
import { useFirebase } from "../contexts/firebase-context";
import axios from "axios";
import Swal from "sweetalert2"

const AuthWrapper = ({ children }) => {
    const { currentUserInfo, isLoggedIn, isLoading } = useFirebase()
    const [userList, setUserList] = useState([])
    const [userListApiState, setUserListApiState] = useState(false)

    const getAuthenticatedUserList = async () => {
        setUserListApiState(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-authenticated-user-list`, {}, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setUserListApiState(false)
                if (res.data.operation === "success") {
                    setUserList(res.data.info)
                }
                else {
                    Swal.fire('Oops!', res.data.message, 'error');
                }
            })
            .catch((err) => {
                console.log(err)
                Swal.fire('Error!!', err.message, 'error');
            })
    }

    useEffect(() => {
        getAuthenticatedUserList()
    }, [])

    if (!isLoading || !userListApiState) {
        if (isLoggedIn) {
            if (userList.find(x => x.id === currentUserInfo.uid)) {
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
