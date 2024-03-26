import React, { useState, useEffect } from "react"
import axios from "axios";
import Swal from "sweetalert2"
import { useNavigate } from "react-router-dom";

import { useFirebase } from "../contexts/firebase-context";
import AuthWrapper from "./AuthWrapper";

const AdminPanel = () => {
    const { currentUserInfo } = useFirebase()

    const navigate = useNavigate()

    const [salespersonName, setSalespersonName] = useState("")
    const [salespersonApiState, setSalespersonApiState] = useState(false)

    const [branchName, setBranchName] = useState("")
    const [branchInvoiceCode, setBranchInvoiceCode] = useState("")
    const [branchApiState, setBranchApiState] = useState(false)

    useEffect(() => {
        if (currentUserInfo) {
            if (!(process.env.REACT_APP_ADMIN_UID_LIST.split(",").includes(currentUserInfo.uid))) {
                navigate("/not-found")
            }
        }
    }, [currentUserInfo, navigate])

    return (
        <>
            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Admin Panel</span>
                </div>

                <AuthWrapper>
                    <>
                        <div className="container my-4">
                            <div className="row align-items-end mb-3 p-2 rounded" style={{ backgroundColor: "pink" }}>
                                <div className="col-md-5 p-1 form-group">
                                    <label className="required form-label my-1 text-black" htmlFor="salespersonName">Enter Salesperson's Name</label>
                                    <input type="text" id="salespersonName" className="form-control" value={salespersonName} onChange={(e) => { setSalespersonName(e.target.value.trim()) }} />
                                </div>
                                <div className="col-md-3 p-1">
                                    <button className="btn mx-2 text-white" style={{ backgroundColor: "darkmagenta" }} disabled={salespersonApiState} onClick={() => {
                                        if (!salespersonName) {
                                            Swal.fire("Oops", "Enter Salesperson name", "warning")
                                            return
                                        }

                                        let data = {
                                            salesperson_name: salespersonName,

                                            current_user_uid: currentUserInfo.uid,
                                            current_user_name: currentUserInfo.displayName
                                        }

                                        setSalespersonApiState(true)
                                        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/save-salesperson`, data, { headers: { 'Content-Type': 'application/json' } })
                                            .then((res) => {
                                                setSalespersonApiState(false)
                                                console.log(res.data)

                                                if (res.data.operation === "success") {
                                                    Swal.fire('Success!', res.data.message, 'success');
                                                }
                                                else {
                                                    Swal.fire('Oops!', res.data.message, 'error');
                                                }
                                            })
                                            .catch((err) => {
                                                console.log(err)
                                                Swal.fire('Error!!', err.message, 'error');
                                            })
                                    }}>
                                        {
                                            salespersonApiState ?
                                                <span>Please Wait <span className="spinner-border spinner-border-sm"></span></span> :
                                                <span>+ Add Salesperson</span>
                                        }
                                    </button>
                                </div>
                            </div>
                            <div className="row align-items-end mb-3 p-2 rounded" style={{ backgroundColor: "pink" }}>
                                <div className="col-md-4 p-1">
                                    <label className="required form-label my-1 text-black" htmlFor="branchName">Enter Branch Name</label>
                                    <input type="text" id="branchName" className="form-control" value={branchName} onChange={(e) => { setBranchName(e.target.value.trim()) }} />
                                </div>
                                <div className="col-md-3 p-1">
                                    <label className="required form-label my-1 text-black" htmlFor="branchInvoiceCode">Enter Branch Invoice Code</label>
                                    <input type="text" id="branchInvoiceCode" className="form-control" value={branchInvoiceCode} onChange={(e) => { setBranchInvoiceCode(e.target.value.trim()) }} />
                                </div>
                                <div className="col-md-2 p-1">
                                    <button className="btn mx-2 text-white" style={{ backgroundColor: "darkmagenta" }} onClick={() => {
                                        if (!branchName || !branchInvoiceCode) {
                                            Swal.fire("Oops", "Enter all Branch details", "warning")
                                            return
                                        }

                                        let data = {
                                            branch_name: branchName,
                                            branch_invoice_code: branchInvoiceCode,

                                            current_user_uid: currentUserInfo.uid,
                                            current_user_name: currentUserInfo.displayName
                                        }

                                        setBranchApiState(true)
                                        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/save-branch`, data, { headers: { 'Content-Type': 'application/json' } })
                                            .then((res) => {
                                                setBranchApiState(false)
                                                console.log(res.data)

                                                if (res.data.operation === "success") {
                                                    Swal.fire('Success!', res.data.message, 'success');
                                                }
                                                else {
                                                    Swal.fire('Oops!', res.data.message, 'error');
                                                }
                                            })
                                            .catch((err) => {
                                                console.log(err)
                                                Swal.fire('Error!!', err.message, 'error');
                                            })
                                    }}>
                                        {
                                            branchApiState ?
                                                <span>Please Wait <span className="spinner-border spinner-border-sm"></span></span> :
                                                <span>+ Add Branch</span>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>

                    </>
                </AuthWrapper>
            </div>
        </>
    )
}

export default AdminPanel