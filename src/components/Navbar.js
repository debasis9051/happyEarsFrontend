import React from 'react'
import { useFirebase } from "../contexts/firebase-context";
import { Link } from 'react-router-dom';

const Navbar = () => {
    const { signInWithGoogleAccountPopup, signOutFromApp, currentUserInfo, isLoggedIn, isLoading } = useFirebase()

    return (
        <>
            <nav className="navbar navbar-expand-lg bg-warning" data-bs-theme="dark">
                <div className="container-fluid">
                    <div className="navbar-brand">
                        <Link to="/"><img id='logo' src="/happy_ears_logo.png" alt="company_logo" width="110" /></Link>
                    </div>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse justify-content-between" id="navbarColor01">
                        <ul className="navbar-nav">
                            {
                                isLoggedIn && <li className="nav-item my-auto">
                                    <span className='text-black fw-bold'>{currentUserInfo.displayName}</span>
                                </li>
                            }
                        </ul>
                        <div className=''>
                            {
                                isLoading ?
                                    <div className="p-2">
                                        <span className="me-2">Loading...</span>
                                        <svg style={{ margin: "auto", background: "#fff0" }} width="20px" height="20px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                                            <g transform="translate(50 50)">
                                                <g>
                                                    <animateTransform attributeName="transform" type="rotate" calcMode="discrete" values="0;90;180;270;360" keyTimes="0;0.25;0.5;0.75;1" dur="2.5s" repeatCount="indefinite"></animateTransform>
                                                    <path d="M-40 0A40 40 0 1 0 40 0" fill="#e15b64">
                                                        <animate attributeName="fill" calcMode="discrete" values="#e15b64;#f47e60;#f8b26a;#abbd81;#e15b64" keyTimes="0;0.24;0.49;0.74;0.99" dur="2.5s" repeatCount="indefinite"></animate>
                                                    </path>
                                                    <path d="M-40 0A40 40 0 0 1 40 0" fill="#f47e60">
                                                        <animate attributeName="fill" calcMode="discrete" values="#f47e60;#f8b26a;#abbd81;#e15b64;#f47e60" keyTimes="0;0.25;0.5;0.75;1" dur="2.5s" repeatCount="indefinite"></animate>
                                                    </path>
                                                    <path d="M-39 0L39 0" stroke="#bb222c" strokeWidth="2">
                                                        <animate attributeName="stroke" values="#e15b64;#bb222c;#df390f;#f47e60;#df390f;#ed7d0b;#f8b26a;#ed7d0b;#7d924d;#abbd81;#7d924d;#bb222c;#e15b64" keyTimes="0;0.124;0.125;0.25;0.374;0.375;0.5;0.624;0.625;0.75;0.874;0.875;1" dur="2.5s" repeatCount="indefinite"></animate>
                                                    </path>
                                                    <g>
                                                        <path d="M-40 0A40 40 0 0 1 40 0Z" fill="#bb222c">
                                                            <animate attributeName="fill" values="#e15b64;#bb222c;#df390f;#f47e60;#df390f;#ed7d0b;#f8b26a;#ed7d0b;#7d924d;#abbd81;#7d924d;#bb222c;#e15b64" keyTimes="0;0.124;0.125;0.25;0.374;0.375;0.5;0.624;0.625;0.75;0.874;0.875;1" dur="2.5s" repeatCount="indefinite"></animate>
                                                            <animateTransform attributeName="transform" type="scale" values="1 1;1 0;1 -1;1 1" keyTimes="0;0.5;0.999;1" dur="0.625s" repeatCount="indefinite"></animateTransform>
                                                        </path>
                                                    </g>
                                                </g>
                                            </g>
                                        </svg>
                                    </div> :
                                    isLoggedIn ?
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-danger" onClick={() => { signOutFromApp() }}>Logout</button>
                                            <div className="">
                                                <img src={currentUserInfo.photoURL} alt='user_image' className='rounded' width="40" />
                                            </div>
                                        </div>
                                        :
                                        <div className=''>
                                            <button className="btn btn-secondary" onClick={() => { signInWithGoogleAccountPopup() }}>
                                                <span className="me-2">
                                                    <svg width="16px" height="16px" viewBox="-3 0 262 262" preserveAspectRatio="xMidYMid">
                                                        <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
                                                        <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
                                                        <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
                                                        <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
                                                    </svg>
                                                </span>
                                                Sign In with Google
                                            </button>
                                        </div>
                            }
                        </div>
                    </div>

                </div>
            </nav>
        </>
    )
}

export default Navbar
