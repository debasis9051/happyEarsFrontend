import React from "react"
import { Link } from 'react-router-dom';

import { useFirebase } from "../contexts/firebase-context";

const colors = [
    "#3288bd",
    "#5e4fa2",
    "#66c2a5",
    "#9e0142",
    "#f46d43",
    "#b2abd2",
    "#fee08b"
]

const Home = () => {
    const { userAccess, isLoading } = useFirebase()


    return (
        <div>
            {
                isLoading ? <div className="d-flex justify-content-center"><div className="spinner-border" style={{ width: "5rem", height: "5rem", margin: "20rem" }}></div></div> :
                    <div className="container py-5">
                        <div className="d-flex flex-wrap gap-2">
                            <div className="my-1" style={{ flex: "2" }}>
                                <PageButton permission={userAccess["audiometry"]} link={"/audiometry"} color={colors[0]} label="Audiometry" />
                            </div>
                            <div className="my-1" style={{ flex: "4" }}>
                                <PageButton permission={userAccess["inventory"]} link={"/inventory"} color={colors[1]} label="Inventory Management" />
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            <div className="my-1" style={{ flex: "3" }}>
                                <PageButton permission={userAccess["generate_invoice"]} link={"/generate-invoice"} color={colors[2]} label="Generate Invoice" />
                            </div>
                            <div className="my-1" style={{ flex: "2" }}>
                                <PageButton permission={userAccess["sales_report"]} link={"/sales-report"} color={colors[3]} label="Sales Report" />
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            <div className="my-1" style={{ flex: "1" }}>
                                <PageButton permission={userAccess["patients"]} link={"/patients"} color={colors[4]} label="Patients" />
                            </div>
                            <div className="my-1" style={{ flex: "1" }}>
                                <PageButton permission={userAccess["service"]} link={"/service"} color={colors[5]} label="Service" isNew />
                            </div>
                            {
                                userAccess["admin_panel"] &&
                                <div className="my-1" style={{ flex: "1" }}>
                                    <PageButton permission={userAccess["admin_panel"]} link={"/admin-panel"} color={colors[6]} label="Admin Panel" />
                                </div>
                            }
                        </div>
                    </div>
            }
        </div>
    )
}

const PageButton = ({ permission, link, color, label, isNew = false }) => {
    if (permission) {
        return (
            <Link to={link} className="text-decoration-none">
                <div className={`bg-gradient bg-hover-dark text-black rounded fs-3 text-center ${isNew ? "new-stamp" : ""}`} style={{ padding: "70px 10px", backgroundColor: color }}>{label}</div>
            </Link>
        )
    } else {
        return (
            <div className="bg-gradient bg-hover-dark text-black rounded fs-3 text-center text-unauthorized" style={{ padding: "70px 10px", backgroundColor: color }}><span>{label}</span></div>
        )
    }
}

export default Home