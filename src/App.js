import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./bootstrap.min.css";
import { FirebaseProvider } from './contexts/firebase-context';
// import "./App.css";

import Home from "./components/Home.js"
import Login from "./components/Login.js"
import Audiometry from "./components/Audiometry.js"
import Inventory from "./components/Inventory.js"
import GenerateInvoice from "./components/GenerateInvoice.js"
import SalesReport from "./components/SalesReport.js"

function App() {
    return (
        <FirebaseProvider>
            <div className="App">
                <BrowserRouter basename="/">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/audiometry" element={<Audiometry />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/generate-invoice" element={<GenerateInvoice />} />
                        <Route path="/sales-report" element={<SalesReport />} />
                    </Routes>
                </BrowserRouter>
            </div>
        </FirebaseProvider>
    )
}

export default App;
