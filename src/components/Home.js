import React from "react"
import { Link } from 'react-router-dom';

import { useFirebase } from "../contexts/firebase-context";

const Home = () => {
    const { userAccess, isLoading } = useFirebase()

    return (
        <div>
            {
                isLoading ? <div className="d-flex justify-content-center"><div className="spinner-border" style={{ width: "5rem", height: "5rem", margin: "20rem" }}></div></div> :
                    <div className="container py-5">

                        <div className="d-flex flex-wrap gap-2">
                            <div className="my-1" style={{ flex: "2" }}>
                                <PageButton permission={userAccess["audiometry"]} link={"/audiometry"} color="bg-primary" label="Audiometry" />
                            </div>
                            <div className="my-1" style={{ flex: "3" }}>
                                <PageButton permission={userAccess["inventory"]} link={"/inventory"} color="bg-info" label="Inventory Management" />
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            <div className="my-1" style={{ flex: "3" }}>
                                <PageButton permission={userAccess["generate_invoice"]} link={"/generate-invoice"} color="bg-success" label="Generate Invoice" />
                            </div>
                            <div className="my-1" style={{ flex: "2" }}>
                                <PageButton permission={userAccess["sales_report"]} link={"/sales-report"} color="bg-danger" label="Sales Report" />
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            {
                                userAccess["admin_panel"] &&
                                <div className="my-1" style={{ flex: "1" }}>
                                    <Link to="/admin-panel" className="text-decoration-none">
                                        <div className="bg-gradient bg-hover-dark text-white rounded fs-3 text-center" style={{ padding: "70px 10px", backgroundColor: "midnightblue" }}>Admin Panel</div>
                                    </Link>
                                </div>
                            }
                        </div>
                    </div>
            }
        </div>
    )
}

const PageButton = ({permission, link, color, label}) =>{
    if (permission) {
        return (
            <Link to={link} className="text-decoration-none">
                <div className={`${color} bg-gradient bg-hover-dark text-white rounded fs-3 text-center`} style={{ padding: "70px 10px" }}>{label}</div>
            </Link>
        )
    } else {
        return (
            <div className={`${color} bg-gradient bg-hover-dark text-white rounded fs-3 text-center text-unauthorized`} style={{ padding: "70px 10px" }}><span>{label}</span></div>
        )
    }
}

export default Home