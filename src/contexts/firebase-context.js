import React, { createContext, useContext, useEffect, useState } from 'react'
import firebaseConfig from '../happy-ears-firebase-config.json'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()


const FirebaseContext = createContext(null)

export const useFirebase = () => useContext(FirebaseContext)

export const FirebaseProvider = ({ children }) => {

    const [user, setUser] = useState(null)

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            console.log(user)
            
            if (user) {
                setUser(user)
            }
            else {
                setUser(null)
            }
        })
    }, [])

    const signInWithGoogleAccountPopup = () => {
        return signInWithPopup(auth, googleProvider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                const user = result.user;

                setUser(user)

                console.log(credential, token, user)
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
        <FirebaseContext.Provider value={{ signInWithGoogleAccountPopup, signOutFromApp, isLoggedIn: user ? true : false }}>
            {children}
        </FirebaseContext.Provider>
    )
}
