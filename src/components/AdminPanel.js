import React, { useState, useEffect } from "react"
import axios from "axios";
import Swal from "sweetalert2"
import { useNavigate } from "react-router-dom";
import Dropzone from 'react-dropzone'

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

    const [doctorName, setDoctorName] = useState("")
    const [doctorRegistrationNumber, setDoctorRegistrationNumber] = useState("")
    const [doctorSignatureFile, setDoctorSignatureFile] = useState(null)
    const [doctorSignatureImage, setDoctorSignatureImage] = useState(null)
    const [doctorApiState, setDoctorApiState] = useState(false)

    const [scriptApiState, setScriptApiState] = useState(false)

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

                            <div className="card my-1 bg-success">
                                <div className="card-body">
                                    <div className="row g-0 align-items-end">
                                        <div className="col-md-5 p-1 form-group">
                                            <label className="required form-label my-1 text-black" htmlFor="salespersonName">Enter Salesperson's Name</label>
                                            <input type="text" id="salespersonName" className="form-control" value={salespersonName} onChange={(e) => { setSalespersonName(e.target.value.trim()) }} />
                                        </div>
                                        <div className="col-md-3 p-1">
                                            <button className="btn mx-2 text-white" style={{ backgroundColor: "brown" }} disabled={salespersonApiState} onClick={() => {
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
                                </div>
                            </div>

                            <div className="card my-1" style={{ backgroundColor: "yellow" }}>
                                <div className="card-body">
                                    <div className="row g-0 align-items-end" >
                                        <div className="col-md-4 p-1">
                                            <label className="required form-label my-1 text-black" htmlFor="branchName">Enter Branch Name</label>
                                            <input type="text" id="branchName" className="form-control" value={branchName} onChange={(e) => { setBranchName(e.target.value.trim()) }} />
                                        </div>
                                        <div className="col-md-3 p-1">
                                            <label className="required form-label my-1 text-black" htmlFor="branchInvoiceCode">Enter Branch Invoice Code</label>
                                            <input type="text" id="branchInvoiceCode" className="form-control" value={branchInvoiceCode} onChange={(e) => { setBranchInvoiceCode(e.target.value.trim()) }} />
                                        </div>
                                        <div className="col-md-2 p-1">
                                            <button className="btn mx-2 text-white" style={{ backgroundColor: "brown" }} disabled={branchApiState} onClick={() => {
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
                            </div>

                            <div className="card my-1" style={{ backgroundColor: "tomato" }}>
                                <div className="card-body">
                                    <div className="row g-0 align-items-end">
                                        <div className="col-md-6 p-1">
                                            <label className="required form-label my-1 text-black" htmlFor="doctorName">Enter Doctor Name</label>
                                            <input type="text" id="doctorName" className="form-control" value={doctorName} onChange={(e) => { setDoctorName(e.target.value) }} />
                                        </div>
                                        <div className="col-md-6 p-1">
                                            <label className="required form-label my-1 text-black" htmlFor="doctorRegistrationNumber">Enter Doctor Registration Number</label>
                                            <input type="text" id="doctorRegistrationNumber" className="form-control" value={doctorRegistrationNumber} onChange={(e) => { setDoctorRegistrationNumber(e.target.value.trim()) }} />
                                        </div>
                                    </div>
                                    <div className="row g-0 align-items-end">
                                        <div className="col-md-10 p-1">
                                            <label className="required form-label my-1 text-black">Choose Doctor Signature</label>
                                            {
                                                doctorSignatureFile === null ?
                                                    <Dropzone maxFiles={1}
                                                        onDrop={acceptedFiles => { 
                                                            if(acceptedFiles.length){
                                                                setDoctorSignatureFile(acceptedFiles[0]);
                                                                setDoctorSignatureImage(URL.createObjectURL(acceptedFiles[0])); 
                                                            }
                                                        }}
                                                        accept={{
                                                            "image/png": [".png"],
                                                        }}
                                                    >
                                                        {({ getRootProps, getInputProps }) => (
                                                            <section>
                                                                <div {...getRootProps()} style={{ border: "2px dotted green", borderRadius: "10px", fontSize: "x-large", fontWeight: "bolder", padding: "20px" }}>
                                                                    <input {...getInputProps()} />
                                                                    <span className="text-white">Drag 'n' drop some files here, or click to select files</span>
                                                                </div>
                                                            </section>
                                                        )}
                                                    </Dropzone>
                                                    :
                                                    <div className="fs-5 text-white">
                                                        <img className="m-3" src={doctorSignatureImage} alt="signature" height="200" onLoad={()=>{ URL.revokeObjectURL(doctorSignatureImage); }} /><br/>
                                                        <span className="me-3 fw-bold">Selected File:</span> {doctorSignatureFile.path}
                                                        <button className="btn btn-outline-danger ms-3 rounded-pill" onClick={() => { setDoctorSignatureFile(null); setDoctorSignatureImage(null); }}>🗙</button>
                                                    </div>
                                            }
                                        </div>
                                        <div className="col-md-2 p-1">
                                            <button className="btn mx-2 text-white" style={{ backgroundColor: "brown" }} disabled={doctorApiState} onClick={() => {
                                                if (!doctorName || !doctorRegistrationNumber || !doctorSignatureFile) {
                                                    Swal.fire("Oops", "Enter all Doctor details", "warning")
                                                    return
                                                }

                                                let data = new FormData()
                                                data.append("doctor_name", doctorName.trim())
                                                data.append("doctor_registration_number", doctorRegistrationNumber)
                                                data.append("doctor_signature_file", doctorSignatureFile)
                                                data.append("current_user_uid", currentUserInfo.uid)
                                                data.append("current_user_name", currentUserInfo.displayName)
                                                
                                                setDoctorApiState(true)
                                                axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/save-doctor`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
                                                    .then((res) => {
                                                        setDoctorApiState(false)
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
                                                    doctorApiState ?
                                                        <span>Please Wait <span className="spinner-border spinner-border-sm"></span></span> :
                                                        <span>+ Add Doctor</span>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card my-1" style={{ backgroundColor: "violet" }}>
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-md-2 p-1 text-end">
                                            <label className="form-label my-1 text-black">Custom Script</label>
                                        </div>
                                        <div className="col-md-3 p-1">
                                            <button className="btn mx-2 text-white" style={{ backgroundColor: "brown" }} disabled={scriptApiState} onClick={() => {
                                                let data = {
                                                    current_user_uid: currentUserInfo.uid,
                                                    current_user_name: currentUserInfo.displayName
                                                }

                                                setScriptApiState(true)
                                                axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/custom-script`, data, { headers: { 'Content-Type': 'application/json' } })
                                                    .then((res) => {
                                                        setScriptApiState(false)
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
                                                    scriptApiState ?
                                                        <span>Please Wait <span className="spinner-border spinner-border-sm"></span></span> :
                                                        <span>Start Execution</span>
                                                }
                                            </button>
                                        </div>
                                    </div>
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