import { createContext, useContext, useEffect, useState } from 'react'
import axios from "axios";
import Swal from "sweetalert2"
import firebaseConfig from '../happy-ears-firebase-config.js'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { defaultAccess } from '../components/AdminPanel.js';

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()


const FirebaseContext = createContext(null)

export const useFirebase = () => useContext(FirebaseContext)

export const FirebaseProvider = ({ children }) => {

    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)
    const [userAccess, setUserAccess] = useState(defaultAccess)

    //defaulting userAccess to true for testing purposes
    // const [userAccess, setUserAccess] = useState(Object.fromEntries(Object.keys(defaultAccess).map(key => [key, true])))

    const getUserDetails = (user_uid) => {
        return axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-user-details`, { user_uid }, { headers: { 'Content-Type': 'application/json' } })
    }

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            setLoading(true)

            if (user) {
                setUser(user)

                getUserDetails(user.uid)
                    .then((res) => {
                        if (res.data.operation === "success" && res.data.info) {
                            res.data.info?.auth_access && setUserAccess(res.data.info.auth_access)
                        }
                        else if (res.data.operation === "success" && !res.data.info) {
                            axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/create-user`, { user_uid: user.uid, user_name: user.displayName, user_email: user.email, user_photo: user.photoURL }, { headers: { 'Content-Type': 'application/json' } })
                                .then((res) => {
                                    console.log("new user created");
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                        }
                        else {
                            Swal.fire('Error!!', res.data.message, 'error');
                        }

                        setLoading(false)
                    })
                    .catch((err) => {
                        setLoading(false)

                        console.log(err)
                        Swal.fire('Error!!', err.message, 'error');
                    })
            }
            else {
                setUser(null)
                setUserAccess({
                    audiometry: false,
                    inventory: false,
                    generate_invoice: false,
                    sales_report: false,
                    admin_panel: false,
                })

                setLoading(false)
            }
        })
    }, [])

    const signInWithGoogleAccountPopup = () => {
        return signInWithPopup(auth, googleProvider)
            .then((result) => {
                const user = result.user;
                setUser(user)

                getUserDetails(user.uid)
                    .then((res) => {
                        if (res.data.operation !== "success") {
                            axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/create-user`, { user_uid: user.uid, user_name: user.displayName, user_email: user.email, user_photo: user.photoURL }, { headers: { 'Content-Type': 'application/json' } })
                                .then((res) => {
                                    console.log("new user created");
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                        }
                        else {
                            res.data.info?.auth_access && setUserAccess(res.data.info.auth_access)
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                        Swal.fire('Error!!', err.message, 'error');
                    })
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.customData.email

                console.log(errorCode, errorMessage, email)
            });
    }

    const signOutFromApp = () => {
        return signOut(auth).then(() => {
            console.log("signout successful")
        }).catch((error) => {
            console.log(error)
        });
    }

    return (
        <FirebaseContext.Provider value={{ signInWithGoogleAccountPopup, signOutFromApp, currentUserInfo: user, isLoggedIn: user ? true : false, isLoading: loading, userAccess: userAccess }}>
            {children}
        </FirebaseContext.Provider>
    )
}
