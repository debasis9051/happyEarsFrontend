import React from "react"
import { Link } from 'react-router-dom';

import { useFirebase } from "../contexts/firebase-context";

const Home = () => {
    const { currentUserInfo, isLoading } = useFirebase()

    return (
        <div>
            {
                isLoading ? <div className="d-flex justify-content-center"><div className="spinner-border" style={{width: "5rem", height: "5rem", margin:"20rem"}}></div></div> :
                    <div className="container py-5">
                        <div className="d-flex flex-wrap gap-2 my-2">
                            <div className="flex-grow-1">
                                <Link to="/audiometry" className="text-decoration-none">
                                    <div className="bg-primary bg-gradient text-white rounded fs-3 text-center" style={{ padding: "70px 10px" }}>Audiometry</div>
                                </Link>
                            </div>
                            <div className="flex-grow-1">
                                <Link to="/inventory" className="text-decoration-none">
                                    <div className="bg-info bg-gradient text-white rounded fs-3 text-center" style={{ padding: "70px 10px" }}>Inventory Management</div>
                                </Link>
                            </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2 my-2">
                            <div className="flex-grow-1">
                                <Link to="/generate-invoice" className="text-decoration-none">
                                    <div className="bg-success bg-gradient text-white rounded fs-3 text-center" style={{ padding: "70px 10px" }}>Generate Invoice</div>
                                </Link>
                            </div>
                            <div className="flex-grow-1">
                                <Link to="/sales-report" className="text-decoration-none">
                                    <div className="bg-danger bg-gradient text-white rounded fs-3 text-center" style={{ padding: "70px 10px" }}>Sales Report</div>
                                </Link>
                            </div>
                        </div>
                        {
                            currentUserInfo && (process.env.REACT_APP_ADMIN_UID_LIST.split(",").includes(currentUserInfo.uid)) &&
                            <div className="d-flex flex-wrap gap-2 my-2">
                                <div className="flex-grow-1">
                                    <Link to="/admin-panel" className="text-decoration-none">
                                        <div className="bg-gradient text-white rounded fs-3 text-center" style={{ padding: "70px 10px", backgroundColor: "midnightblue" }}>Admin Panel</div>
                                    </Link>
                                </div>
                            </div>
                        }
                    </div>
            }
        </div>
    )
}

export default Home