import React, { useState, useEffect, useMemo } from "react"
import { Tab, Tabs } from "react-bootstrap"
import Dropzone from 'react-dropzone'
import Select from "react-select"
import Swal from "sweetalert2"
import axios from "axios";
import moment from "moment"
import { Helmet } from "react-helmet-async";

import { useFirebase } from "../contexts/firebase-context";
import { useModal } from "../contexts/modal-context";
import { getPatientList, getServiceList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";
import { dropDownStyle, escapeRegex, formatPatientNumber } from "../utils/commonUtils";

const Service = () => {
    const { currentUserInfo } = useFirebase()
    const { openModal, setModalView, setModalData } = useModal()

    const [currentTab, setCurrentTab] = useState("tab1")

    const [patientList, setPatientList] = useState([])
    const [serviceList, setServiceList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")


    const [selectedPatient, setSelectedPatient] = useState(null)
    const [problemDescription, setProblemDescription] = useState("")
    const [isServiceCreateApiLoading, setIsServiceCreateApiLoading] = useState(false)

    const [selectedService, setSelectedService] = useState(null)
    const [serviceCloseMode, setServiceCloseMode] = useState(null)
    const [outcomeDetails, setOutcomeDetails] = useState(null)
    const [technician, setTechnician] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [uploadedFileImage, setUploadedFileImage] = useState(null)
    const [isServiceCloseApiLoading, setIsServiceCloseApiLoading] = useState(false)

    const filteredServiceList = useMemo(() => {
        return serviceList.filter(x => {
            let pd = patientList.find(p => p.id === x.patient_id)
            let reg = new RegExp(escapeRegex(searchValue), "gi")

            if (searchBarState && searchValue !== "") {
                if (
                    (reg.test(pd.patient_number)) ||
                    (reg.test(pd.patient_name)) ||
                    (reg.test(pd.contact_number)) ||
                    (reg.test(x.problem_description)) ||
                    (reg.test(x.service_id)) ||
                    (reg.test(x.status)) ||
                    (reg.test(x.technician))
                ) {
                    return true
                }
                return false
            }
            else {
                return true
            }
        })
    }, [searchBarState, searchValue, serviceList, patientList])

    useEffect(() => {
        if (currentUserInfo !== null) {
            getPatientList(currentUserInfo, setPatientList)
            getServiceList(currentUserInfo, setServiceList)
        }
    }, [currentUserInfo])

    const clearServiceRequestForm = () => {
        setSelectedPatient(null)
        setProblemDescription("")
    }

    const clearServiceCloseForm = () => {
        setSelectedService(null)
        setServiceCloseMode(null)
        setOutcomeDetails(null)
        setTechnician(null)
        setUploadedFile(null)
        setUploadedFileImage(null)
    }

    const createNewServiceRequest = () => {
        if (selectedPatient === null) {
            Swal.fire('Oops!!', 'Select a Patient', 'warning');
            return false
        }
        if (!problemDescription.trim()) {
            Swal.fire('Oops!!', 'Enter Problem Description', 'warning');
            return false
        }

        let data = {
            patient_id: selectedPatient.value,
            problem_description: problemDescription,

            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName,
        }

        setIsServiceCreateApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/create-service-request`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsServiceCreateApiLoading(false)

                if (res.data.operation === "success") {
                    Swal.fire('Success!!', res.data.message, 'success');

                    setCurrentTab("tab1")
                    clearServiceRequestForm()
                    getServiceList(currentUserInfo, setServiceList)
                }
                else {
                    Swal.fire('Oops!', res.data.message, 'error');
                }
            })
            .catch((err) => {
                console.log(err)
                Swal.fire('Error!!', err.message, 'error');
            })
    }

    const completeServiceRequest = () => {
        let data = new FormData()
        data.append("service_unique_id", selectedService.value)
        data.append("outcome_details", outcomeDetails)
        data.append("technician", technician)
        data.append("uploaded_file", uploadedFile)
        data.append("current_user_uid", currentUserInfo.uid)
        data.append("current_user_name", currentUserInfo.displayName)

        setIsServiceCloseApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/complete-service-request`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => {
                setIsServiceCloseApiLoading(false)

                if (res.data.operation === "success") {
                    Swal.fire('Success!!', res.data.message, 'success');

                    setCurrentTab("tab1")
                    clearServiceCloseForm()
                    getServiceList(currentUserInfo, setServiceList)
                }
                else {
                    Swal.fire('Oops!', res.data.message, 'error');
                }
            })
            .catch((err) => {
                console.log(err)
                Swal.fire('Error!!', err.message, 'error');
            })
    }

    const cancelServiceRequest = () => {
        let data = {
            service_unique_id: selectedService.value,
            outcome_details: outcomeDetails,

            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
        }

        setIsServiceCloseApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/cancel-service-request`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsServiceCloseApiLoading(false)

                if (res.data.operation === "success") {
                    Swal.fire('Success!!', res.data.message, 'success');

                    setCurrentTab("tab1")
                    clearServiceCloseForm()
                    getServiceList(currentUserInfo, setServiceList)
                }
                else {
                    Swal.fire('Oops!', res.data.message, 'error');
                }
            })
            .catch((err) => {
                console.log(err)
                Swal.fire('Error!!', err.message, 'error');
            })
    }

    let tp = Math.ceil(filteredServiceList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    return (
        <>
            <Helmet>
                <meta name="description" content="Happy Ears Kolkata is a React-powered app for efficient hearing care management, offering seamless invoice creation, inventory control, and secure patient data storage with integrated location tracking, created by Hritwick De. Service page where patient service requests and its details are recorded" />
                <title>Service | Happy Ears Kolkata Invoicing</title>
            </Helmet>

            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Service</span>
                </div>

                <AuthWrapper page={"service"}>
                    <>
                        <div className="container-fluid">
                            <Tabs className="mb-3" activeKey={currentTab}
                                onSelect={(k) => {
                                    if (k === "tab1") {
                                        clearServiceRequestForm();
                                        clearServiceCloseForm();
                                    }
                                    setCurrentTab(k);
                                }}
                            >
                                <Tab eventKey="tab1" title="Records">

                                    <div className="d-flex align-items-end px-3 py-2">
                                        <div className="d-flex mx-2">
                                            <button className="btn btn-secondary rounded-pill me-1" onClick={() => { setSearchBarState(!searchBarState); setSearchValue("") }}>
                                                <svg width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                                </svg>
                                            </button>
                                            <input type="text" className="form-control" style={searchBarState ? { transition: "all 1s" } : { transition: "all 1s", width: "0", padding: "0", opacity: "0", visibility: "hidden" }} placeholder="Search..." onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(0); }} />
                                        </div>

                                        <button className="btn btn-success ms-auto me-2" onClick={() => { setCurrentTab("tab2") }} >+ Create Service Request</button>
                                    </div>

                                    <div className="table-responsive" style={{ minHeight: "250px" }}>
                                        <table className="table table-hover table-striped border border-light align-middle" style={{ minWidth: "950px" }}>
                                            <thead>
                                                <tr className="table-dark">
                                                    <th scope="col">Sl. No.</th>
                                                    <th scope="col">Service ID</th>
                                                    <th scope="col">Patient</th>
                                                    <th scope="col">Contact Number</th>
                                                    <th scope="col">Description</th>
                                                    <th scope="col">Added On</th>
                                                    <th scope="col">Closed On</th>
                                                    <th scope="col">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    !patientList.length || !filteredServiceList.length ? <tr><td colSpan={9} className="fs-4 text-center text-secondary">No service requests yet</td></tr> :
                                                        filteredServiceList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                                            let patientDetails = patientList.find(p => p.id === x.patient_id)

                                                            return (
                                                                <tr key={i}>
                                                                    <td>{(currentPage * 10) + i + 1}</td>
                                                                    <td>{x.service_id}</td>
                                                                    <td>{patientDetails.patient_name} <span className="badge text-primary">{formatPatientNumber(patientDetails.patient_number)}</span></td>
                                                                    <td>{patientDetails.contact_number}</td>
                                                                    <td>
                                                                        <button className="btn btn-info" onClick={() => {
                                                                            Swal.fire("Notes", x.problem_description || "N/A", "info")
                                                                            Swal.fire({
                                                                                html: `
                                                                                    <div class="my-2 text-start"><span class="fs-5 fw-bold">Problem Description</span></br>${x.problem_description}</div>
                                                                                    ${x.outcome_details ? `<div class="my-2 text-start"><span class="fs-5 fw-bold">Outcome Details</span></br> ${x.outcome_details}</div>` : ""}
                                                                                    ${x.technician ? `<div class="my-2 text-start"><span class="fs-5 fw-bold">Technician:</span> ${x.technician}</div>` : ""}
                                                                                    ${x.file_reference ? `<img class="my-2 text-start w-100" src="${x.file_reference}" alt="Uploaded file">` : ""}
                                                                                `,
                                                                            });
                                                                        }}>
                                                                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                                                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                                                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                                                            </svg>
                                                                        </button>
                                                                    </td>
                                                                    <td>{moment.unix(x.created_at._seconds).format("lll")}</td>
                                                                    <td>{x.closed_at ? moment.unix(x.closed_at._seconds).format("lll") : "N/A"}</td>
                                                                    <td><span className={`badge ${x.status === "PENDING" ? "text-warning" : x.status === "COMPLETED" ? "text-success" : "text-danger"}`}>{x.status}</span></td>
                                                                </tr>
                                                            )
                                                        })
                                                }
                                            </tbody>
                                            {
                                                filteredServiceList.length !== 0 &&
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan={9}>
                                                            <div className="d-flex justify-content-center">
                                                                <ul className="pagination m-0">
                                                                    {
                                                                        currentPage + 1 !== 1 &&
                                                                        <li className="page-item" onClick={() => { setCurrentPage(currentPage - 1) }}>
                                                                            <div className="page-link" style={{ cursor: "pointer" }} >&laquo;</div>
                                                                        </li>
                                                                    }
                                                                    {
                                                                        Array.from({ length: e - s + 1 }, (_, i) => i + s).map((x, i) => {
                                                                            return (
                                                                                <li key={i} className={`page-item ${x - 1 === currentPage ? "active" : ""}`} onClick={() => { setCurrentPage(x - 1) }}>
                                                                                    <div className="page-link" style={{ cursor: "pointer" }} >{x}</div>
                                                                                </li>
                                                                            )
                                                                        })
                                                                    }
                                                                    {
                                                                        currentPage + 1 !== tp &&
                                                                        <li className="page-item" onClick={() => { setCurrentPage(currentPage + 1) }}>
                                                                            <div className="page-link" style={{ cursor: "pointer" }} >&raquo;</div>
                                                                        </li>
                                                                    }
                                                                </ul>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            }
                                        </table>
                                    </div>

                                </Tab>
                                <Tab eventKey="tab2" title="Service Request">

                                    <div className="card container my-5 p-3">
                                        <div className="card-header rounded d-flex align-items-center justify-content-between">
                                            <h4 className="m-0">Create Service Request</h4>
                                        </div>
                                        <div className="card-body">

                                            <div className="row">
                                                <div className="col-5 d-flex gap-2">
                                                    <div className="form-group flex-grow-1">
                                                        <label className="form-label my-1 required">Patient</label>
                                                        <Select
                                                            options={patientList.map(x => ({ label: x.patient_name, value: x.id }))}
                                                            value={selectedPatient}
                                                            onChange={(val) => { setSelectedPatient(val); }}
                                                            styles={dropDownStyle}
                                                            placeholder="Select a Patient..."
                                                        />
                                                    </div>
                                                    <div className="align-self-end">
                                                        <button className="btn btn-success p-1" title="Add Patient"
                                                            onClick={() => {
                                                                setModalView("PATIENT_MODAL");
                                                                setModalData({
                                                                    currentUserInfo,
                                                                    apiEndCallback: (responseData) => {
                                                                        getPatientList(currentUserInfo, setPatientList);
                                                                        setSelectedPatient({ label: responseData.patient_name, value: responseData.patient_id });
                                                                    }
                                                                });
                                                                openModal()
                                                            }}
                                                        >
                                                            <svg width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-12">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="problemDescription">Problem Description</label>
                                                        <textarea id="problemDescription" rows={3} maxLength={150} className="form-control" value={problemDescription} onChange={(e) => { setProblemDescription(e.target.value) }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer rounded text-end">
                                            <button className="btn btn-success mx-2" disabled={isServiceCreateApiLoading}
                                                onClick={() => {
                                                    if (isServiceCreateApiLoading) return;

                                                    Swal.fire({
                                                        title: "Are you sure? The Details cannot be changed after submission.",
                                                        text: "Please check the details before submitting.",
                                                        showCancelButton: true,
                                                        confirmButtonText: "Submit",
                                                    }).then((result) => {
                                                        if (result.isConfirmed) {
                                                            createNewServiceRequest()
                                                        }
                                                    });
                                                }}
                                            >
                                                {
                                                    isServiceCreateApiLoading ?
                                                        <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : "Submit"
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card container my-5 p-3">
                                        <div className="card-header rounded d-flex align-items-center justify-content-between">
                                            <h4 className="m-0">Close Service Request</h4>
                                        </div>
                                        <div className="card-body">

                                            <div className="row align-items-center">
                                                <div className="col-3">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required">Service ID</label>
                                                        <Select
                                                            options={serviceList.filter(x => x.status === "PENDING").map(x => ({ label: x.service_id, value: x.id }))}
                                                            value={selectedService}
                                                            onChange={(val) => { setSelectedService(val); }}
                                                            styles={dropDownStyle}
                                                            placeholder="Select a Service Number..."
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-5">
                                                    <label className="form-label my-1">Patient</label>
                                                    {
                                                        (() => {
                                                            if (!selectedService) {
                                                                return <div>
                                                                    <span className="fs-5">No Service selected</span>
                                                                </div>
                                                            }

                                                            let patientDetails = patientList.find(x => x.id === serviceList.find(y => y.id === selectedService.value).patient_id)

                                                            return <div>
                                                                <span className="fs-5">{patientDetails.patient_name}</span>
                                                                <span className="badge text-primary">{formatPatientNumber(patientDetails.patient_number)}</span>
                                                            </div>
                                                        })()
                                                    }
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required">Mark as:</label>
                                                        <div className="d-flex gap-4 text-white" style={{ margin: "0 40px" }}>
                                                            <div className={`p-2 flex-grow-1 text-center rounded ${serviceCloseMode === "COMPLETE" ? "bg-success" : "bg-secondary"}`} style={{ cursor: "pointer" }} onClick={() => { setServiceCloseMode("COMPLETE") }}>COMPLETE</div>
                                                            <div className={`p-2 flex-grow-1 text-center rounded ${serviceCloseMode === "CANCEL" ? "bg-danger" : "bg-secondary"}`} style={{ cursor: "pointer" }} onClick={() => { setServiceCloseMode("CANCEL") }}>CANCEL</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-12">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="outcomeDetails">Outcome Details</label>
                                                        <textarea id="outcomeDetails" rows={3} maxLength={150} className="form-control" value={outcomeDetails || ""} onChange={(e) => { setOutcomeDetails(e.target.value) }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {
                                                serviceCloseMode === "COMPLETE" &&
                                                <div className="row">
                                                    <div className="col-6">
                                                        <div className="form-group">
                                                            <label className="form-label my-1 required" htmlFor="technician">Technician</label>
                                                            <input type="text" id="technician" className="form-control" value={technician || ""} onChange={(e) => { setTechnician(e.target.value) }} />
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <label className="required form-label my-1">Choose Upload File</label>
                                                        {
                                                            uploadedFile === null ?
                                                                <Dropzone maxFiles={1}
                                                                    onDrop={acceptedFiles => {
                                                                        if (acceptedFiles.length) {
                                                                            setUploadedFile(acceptedFiles[0]);
                                                                            setUploadedFileImage(URL.createObjectURL(acceptedFiles[0]));
                                                                        }
                                                                    }}
                                                                    accept={{
                                                                        "image/png": [".png"],
                                                                        "image/jpeg": [".jpg", ".jpeg"],
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
                                                                    <img className="m-3" src={uploadedFileImage} alt="signature" height="200" onLoad={() => { URL.revokeObjectURL(uploadedFileImage); }} /><br />
                                                                    <span className="me-3 fw-bold">Selected File:</span> {uploadedFile.path}
                                                                    <button className="btn btn-outline-danger ms-3 rounded-pill" onClick={() => { setUploadedFile(null); setUploadedFileImage(null); }}>🗙</button>
                                                                </div>
                                                        }
                                                    </div>
                                                </div>
                                            }

                                        </div>
                                        <div className="card-footer rounded text-end">
                                            <button className="btn btn-success mx-2" disabled={isServiceCloseApiLoading}
                                                onClick={() => {
                                                    if (isServiceCloseApiLoading) return;

                                                    if (selectedService === null) {
                                                        Swal.fire('Oops!!', 'Select a Service ID', 'warning');
                                                        return
                                                    }
                                                    if (serviceCloseMode === null) {
                                                        Swal.fire('Oops!!', 'Select a Service Mode', 'warning');
                                                        return
                                                    }
                                                    if (outcomeDetails === null || !outcomeDetails.trim()) {
                                                        Swal.fire('Oops!!', 'Enter Outcome Details', 'warning');
                                                        return
                                                    }
                                                    if (serviceCloseMode === "COMPLETE") {
                                                        if (technician === null || !technician.trim()) {
                                                            Swal.fire('Oops!!', 'Enter Technician Name', 'warning');
                                                            return
                                                        }
                                                        if (uploadedFile === null) {
                                                            Swal.fire('Oops!!', 'Upload a file', 'warning');
                                                            return
                                                        }
                                                    }

                                                    if (serviceCloseMode === "COMPLETE") { completeServiceRequest(); }
                                                    else { cancelServiceRequest() }
                                                }}
                                            >
                                                {
                                                    isServiceCloseApiLoading ?
                                                        <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : "Submit"
                                                }
                                            </button>
                                        </div>
                                    </div>

                                </Tab>
                            </Tabs>
                        </div>
                    </>
                </AuthWrapper>
            </div>
        </>
    )
}

export default Service