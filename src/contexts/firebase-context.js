import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from "axios";
import firebaseConfig from '../happy-ears-firebase-config.js'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()


const FirebaseContext = createContext(null)

export const useFirebase = () => useContext(FirebaseContext)

export const FirebaseProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        onAuthStateChanged(auth, (user) => {
            // console.log(user)

            if (user) {
                setUser(user)
            }
            else {
                setUser(null)
            }
            setLoading(false)
        })
    }, [])

    const signInWithGoogleAccountPopup = () => {
        return signInWithPopup(auth, googleProvider)
            .then((result) => {
                // const credential = GoogleAuthProvider.credentialFromResult(result);
                // const token = credential.accessToken;
                const user = result.user;

                setUser(user)

                // console.log(user)

                return axios.post("http://localhost:4000/create-user", {user_uid: user.uid, user_name: user.displayName, user_email: user.email, user_photo: user.photoURL }, { headers: { 'Content-Type': 'application/json' } })
                .then((res) => {
                    console.log(res.data);
                })
                .catch((err) => {
                    console.log(err)
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
        <FirebaseContext.Provider value={{ signInWithGoogleAccountPopup, signOutFromApp, currentUserInfo: user, isLoggedIn: user ? true : false, isLoading: loading }}>
            {children}
        </FirebaseContext.Provider>
    )
}
