import React, { useState, useEffect } from "react"
import axios from "axios";
import Swal from "sweetalert2"
import Dropzone from 'react-dropzone'
import { Accordion } from 'react-bootstrap';
import { Helmet } from "react-helmet-async";

import { useFirebase } from "../contexts/firebase-context";
import AuthWrapper from "./AuthWrapper";
import { getUserList } from "../utils/getApis"

const defaultAccess = {
    admin_panel: false,
    audiometry: false,
    generate_invoice: false,
    inventory: false,
    sales_report: false,
    patients: false,
}

const AdminPanel = () => {
    const { currentUserInfo } = useFirebase()

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

    const [userList, setUserList] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedUserAccess, setSelectedUserAccess] = useState(defaultAccess)
    const [accessApiState, setAccessApiState] = useState(false)

    useEffect(() => {
        if (currentUserInfo !== null) {
            getUserList(currentUserInfo, setUserList)
        }
    }, [currentUserInfo])

    return (
        <>
            <Helmet>
                <meta name="description" content="Happy Ears Kolkata is a React-powered app for efficient hearing care management, offering seamless invoice creation, inventory control, and secure patient data storage with integrated location tracking, created by Hritwick De. Administrator Page to be accessed by authorized personnel only for aditional features" />
                <title>Admin Panel | Happy Ears Kolkata Invoicing </title>
            </Helmet>

            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Admin Panel</span>
                </div>

                <AuthWrapper page={"admin_panel"}>
                    <div className="mx-5">

                        <div className="card my-1" style={{ backgroundColor: "skyblue" }}>
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

                                                        setSalespersonName("")
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

                                                        setBranchName("")
                                                        setBranchInvoiceCode("")
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
                                                        if (acceptedFiles.length) {
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
                                                    <img className="m-3" src={doctorSignatureImage} alt="signature" height="200" onLoad={() => { URL.revokeObjectURL(doctorSignatureImage); }} /><br />
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

                                                        setDoctorName("")
                                                        setDoctorRegistrationNumber("")
                                                        setDoctorSignatureFile(null)
                                                        setDoctorSignatureImage(null)
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

                        <Accordion>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>All Users</Accordion.Header>
                                <Accordion.Body>
                                    <div className="row rounded" style={{ backgroundColor: "#002410" }}>
                                        <div className="col-md-6 p-3 border-end border-secondary scrollbar-custom" style={{ maxHeight: "400px", overflowY: "auto" }}>
                                            {
                                                userList.length === 0 ? <span className="fs-4 text-center text-secondary">No users added</span> :
                                                    userList.map((x) => {
                                                        return (
                                                            <div key={x.id} className={`d-flex gap-2 p-2 bg-hover-3a4e1e rounded ${selectedUser && selectedUser.id === x.id ? "bg-164d9d" : ""}`} onClick={() => { setSelectedUser(x); setSelectedUserAccess({ ...defaultAccess, ...(x?.auth_access || {}) }); }}>
                                                                <div>
                                                                    <img src={x.user_photo} alt='user_image' className='rounded' width="40" referrerPolicy="no-referrer" />
                                                                </div>
                                                                <div>
                                                                    <div>{x.user_name}</div>
                                                                    <div style={{ fontSize: "smaller", color: "#6cd584" }}>{x.user_email}</div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                            }
                                        </div>
                                        <div className="col-md-6 p-3">
                                            {
                                                selectedUser ?
                                                    <>
                                                        <span className="fs-6">Access for <span className="fw-bold">{selectedUser.user_name}</span></span>
                                                        <div className="my-4">
                                                            {
                                                                (() => {
                                                                    let t = Object.keys(selectedUserAccess)
                                                                    t.sort()

                                                                    return t.map((x, i) => {
                                                                        return (
                                                                            <div key={i} className="form-check fs-4">
                                                                                <input className="form-check-input" type="checkbox" value="" checked={selectedUserAccess[x]} onChange={() => { setSelectedUserAccess({ ...selectedUserAccess, [x]: !selectedUserAccess[x] }) }} />
                                                                                <label className="form-check-label text-capitalize">{x.replaceAll("_", " ")}</label>
                                                                            </div>
                                                                        )
                                                                    })
                                                                })()
                                                            }
                                                        </div>
                                                        <div className="text-center"><button className="btn btn-primary" disabled={accessApiState} onClick={() => {
                                                            let data = {
                                                                user_id: selectedUser.id,
                                                                user_access: selectedUserAccess,

                                                                current_user_uid: currentUserInfo.uid,
                                                                current_user_name: currentUserInfo.displayName
                                                            }

                                                            setAccessApiState(true)
                                                            axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/update-user-access`, data, { headers: { 'Content-Type': 'application/json' } })
                                                                .then((res) => {
                                                                    setAccessApiState(false)
                                                                    console.log(res.data)

                                                                    getUserList(currentUserInfo, setUserList)
                                                                    if (res.data.operation === "success") {
                                                                        Swal.fire('Success!', res.data.message, 'success').then(() => { window.location.reload() });
                                                                    }
                                                                    else {
                                                                        Swal.fire('Oops!', res.data.message, 'error');
                                                                    }
                                                                })
                                                                .catch((err) => {
                                                                    console.log(err)
                                                                    Swal.fire('Error!!', err.message, 'error');
                                                                })
                                                        }}>Update</button></div>
                                                    </>
                                                    :
                                                    <div className="text-center"><span className="fs-3">No User Selected</span></div>
                                            }
                                        </div>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>

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
                </AuthWrapper>
            </div>
        </>
    )
}

export default AdminPanel