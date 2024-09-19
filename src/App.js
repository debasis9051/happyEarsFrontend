import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Helmet } from "react-helmet";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import "./bootstrap.css";
import "./App.css";

import { FirebaseProvider } from './contexts/firebase-context';

import Navbar from "./components/Navbar.js"

import NotFound from "./components/NotFound.js"
import Unauthorized from "./components/Unauthorized.js"
import Home from "./components/Home.js"
import AdminPanel from "./components/AdminPanel.js"
import Audiometry from "./components/Audiometry.js"
import Inventory from "./components/Inventory.js"
import GenerateInvoice from "./components/GenerateInvoice.js"
import SalesReport from "./components/SalesReport.js"
import Patients from "./components/Patients.js"

function App() {
    return (
        <FirebaseProvider>
            <div className="App">
                <Helmet>
                    <meta name="description" content="Happy Ears Kolkata is a React-powered app for efficient hearing care management, offering seamless invoice creation, inventory control, and secure patient data storage with integrated location tracking, created by Hritwick De" />
                    <title>Happy Ears Kolkata Invoicing</title>
                </Helmet>

                <BrowserRouter basename="/">
                    <Navbar />

                    <Routes>
                        <Route path="*" element={<NotFound />} />
                        <Route path="/unauthorized" element={<Unauthorized />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/admin-panel" element={<AdminPanel />} />
                        <Route path="/audiometry" element={<Audiometry />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/generate-invoice/:audiometryId?" element={<GenerateInvoice />} />
                        <Route path="/sales-report" element={<SalesReport />} />
                        <Route path="/patients" element={<Patients />} />
                    </Routes>
                </BrowserRouter>
            </div>
        </FirebaseProvider>
    )
}

export default App;
