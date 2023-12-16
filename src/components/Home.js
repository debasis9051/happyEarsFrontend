import React, { useState, useEffect, useRef } from "react"
import { Link } from 'react-router-dom';
import axios from "axios";

const Home = () => {

    return (
        <div>
            <div className="container py-5">
                <div className="d-flex flex-wrap gap-2 my-2">
                    <div className="flex-grow-1">
                        <Link to="/audiometry" className="text-decoration-none">
                            <div className="bg-primary text-white rounded fs-3 text-center" style={{ padding: "70px 10px" }}>Audiometry</div>
                        </Link>
                    </div>
                    <div className="flex-grow-1">
                        <Link to="/inventory" className="text-decoration-none">
                            <div className="bg-info text-white rounded fs-3 text-center" style={{ padding: "70px 10px" }}>Inventory Management</div>
                        </Link>
                    </div>
                </div>
                <div className="d-flex flex-wrap gap-2 my-2">
                    <div className="flex-grow-1">
                        <Link to="/generate-invoice" className="text-decoration-none">
                            <div className="bg-success text-white rounded fs-3 text-center" style={{ padding: "70px 10px" }}>Generate Invoice</div>
                        </Link>
                    </div>
                    <div className="flex-grow-1">
                        <Link to="/sales-report" className="text-decoration-none">
                            <div className="bg-danger text-white rounded fs-3 text-center" style={{ padding: "70px 10px" }}>Sales Report</div>
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Home