import React, { useState, useEffect, useMemo } from "react"
import { Tab, Tabs, Dropdown } from "react-bootstrap"
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
    const [isServiceRequestApiLoading, setIsServiceRequestApiLoading] = useState(false)

    // const [patientDocsModalShow, setPatientDocsModalShow] = useState(false)
    // const [selectedPatientDetails, setSelectedPatientDetails] = useState(null)
    // const [patientDocs, setPatientDocs] = useState(null)
    // const [patientDocsApiState, setPatientDocsApiState] = useState(false)


    // filter by patient id, description of service, etc
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
    }, [searchBarState, searchValue, serviceList])

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

        setIsServiceRequestApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/create-service-request`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsServiceRequestApiLoading(false)

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

    const completeServiceRequest = (service_unique_id, outcome_details, technician, file) => {
        let data = new FormData()
        data.append("service_unique_id", service_unique_id)
        data.append("outcome_details", outcome_details)
        data.append("technician", technician)
        data.append("uploaded_file", file)
        data.append("current_user_uid", currentUserInfo.uid)
        data.append("current_user_name", currentUserInfo.displayName)

        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/complete-service-request`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => {
                if (res.data.operation === "success") {
                    Swal.fire('Success!!', res.data.message, 'success');
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

    const cancelServiceRequest = (service_unique_id, reason) => {
        let data = {
            service_unique_id: service_unique_id,
            outcome_details: reason,

            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
        }

        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/cancel-service-request`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                if (res.data.operation === "success") {
                    Swal.fire('Success!!', res.data.message, 'success');
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
                                                    <th scope="col">Actions</th>
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
                                                                                    ${x.outcome_details ? `<div class="my-2 text-start"><span class="fs-5 fw-bold">Outcome Details</span></br> ${x.outcome_details}</div>`: "" }
                                                                                    ${x.technician ? `<div class="my-2 text-start"><span class="fs-5 fw-bold">Technician:</span> ${x.technician}</div>`: "" }
                                                                                `,
                                                                                icon: "info",
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
                                                                    <td>
                                                                        <Dropdown>
                                                                            <Dropdown.Toggle variant="primary">
                                                                                <svg width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                                                                                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                                                                                </svg>
                                                                            </Dropdown.Toggle>
                                                                            <Dropdown.Menu>
                                                                                {
                                                                                    x.status === "PENDING" ?
                                                                                        <>
                                                                                            <Dropdown.Item onClick={() => {
                                                                                                Swal.fire({
                                                                                                    title: "Service Completion",
                                                                                                    text: "Enter details of the service completion",
                                                                                                    html: `
                                                                                                        <textarea id="swal-textarea" class="swal2-textarea form-control mx-0 my-2" placeholder="Enter details here"></textarea>
                                                                                                        <input type="text" id="swal-text-input" class="swal2-input form-control mx-0 my-2" placeholder="Enter Technician" />
                                                                                                        <input type="file" id="swal-file-input" class="swal2-file form-control my-2" />
                                                                                                    `,
                                                                                                    preConfirm: () => {
                                                                                                        const textareaValue = document.getElementById('swal-textarea').value;
                                                                                                        const textInputValue = document.getElementById('swal-text-input').value;
                                                                                                        const fileInput = document.getElementById('swal-file-input');
                                                                                                        const file = fileInput.files[0];

                                                                                                        if (!textareaValue.trim()) {
                                                                                                            Swal.showValidationMessage("Please enter details in the textarea");
                                                                                                        } else if (!textInputValue.trim()) {
                                                                                                            Swal.showValidationMessage("Please enter technician name");
                                                                                                        } else if (!file) {
                                                                                                            Swal.showValidationMessage("Please select a file");
                                                                                                        } else {
                                                                                                            completeServiceRequest(x.id, textareaValue, textInputValue, file);
                                                                                                        }
                                                                                                    },
                                                                                                    showCancelButton: true,
                                                                                                    confirmButtonText: "Submit",
                                                                                                    allowOutsideClick: () => !Swal.isLoading(),
                                                                                                })
                                                                                            }} >Mark as Complete</Dropdown.Item>

                                                                                            <Dropdown.Item onClick={() => {
                                                                                                Swal.fire({
                                                                                                    title: "Are you sure? Enter a reason",
                                                                                                    input: "text",
                                                                                                    inputAttributes: { autocapitalize: "off" },
                                                                                                    showCancelButton: true,
                                                                                                    confirmButtonText: "Submit",
                                                                                                    showLoaderOnConfirm: true,
                                                                                                    preConfirm: (reason) => {
                                                                                                        if (!reason.trim()) {
                                                                                                            Swal.showValidationMessage("Enter a valid reason")
                                                                                                        } else {
                                                                                                            cancelServiceRequest(x.id, reason)
                                                                                                        }
                                                                                                    },
                                                                                                    allowOutsideClick: () => !Swal.isLoading()
                                                                                                })
                                                                                            }} >Mark as Cancelled</Dropdown.Item>
                                                                                        </>
                                                                                        :
                                                                                        <Dropdown.Item><span className="text-secondary">No options</span></Dropdown.Item>
                                                                                }
                                                                            </Dropdown.Menu>
                                                                        </Dropdown>
                                                                    </td>
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

                                    <div className="container card container my-5 p-3">
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
                                            <button className="btn btn-success mx-2" disabled={isServiceRequestApiLoading}
                                                onClick={() => {
                                                    if (isServiceRequestApiLoading) return;

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
                                                    isServiceRequestApiLoading ?
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

            {/* <Modal show={patientDocsModalShow} onHide={() => { setPatientDocsModalShow(false) }} size="md" centered >
                <Modal.Header closeButton>
                    <Modal.Title>Patient Documents</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        !patientDocs || patientDocsApiState ? <div><div className="spinner-border"></div></div> :
                            <div className="container">
                                <div className="mb-4">
                                    <h5 className="m-0">Audiometry Reports</h5>
                                    {
                                        patientDocs?.audiometry.length ? patientDocs.audiometry.map((x, i) => {
                                            return <div key={x.id} className="row align-items-center">
                                                <div className="col-5">Report {i + 1}</div>
                                                <div className="col-5">{moment.unix(x.created_at._seconds).format("lll")}</div>
                                                <div className="col-2">
                                                    <svg className="text-info hover-grow" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" onClick={() => {
                                                        setModalView("PRINT_CONFIG_MODAL");
                                                        setModalData({
                                                            submitCallback: (printConfigData) => {
                                                                if (!x.trial_mode && x.doctor_id) {
                                                                    getDoctorDetails(x.doctor_id, currentUserInfo.uid, currentUserInfo.displayName)
                                                                        .then((doctor_details) => {
                                                                            printAudiometryReport(x, selectedPatientDetails, printConfigData, doctor_details, branchList)
                                                                        })
                                                                }
                                                                else {
                                                                    printAudiometryReport(x, selectedPatientDetails, printConfigData, null, branchList)
                                                                }
                                                            }
                                                        })
                                                        openModal()
                                                    }}>
                                                        <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                                        <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        }) : <div>No Audiometry Reports created for this Patient</div>
                                    }
                                </div>
                                <div className="mt-4">
                                    <h5 className="m-0">Invoices</h5>
                                    {
                                        patientDocs?.invoices.length ? patientDocs.invoices.map(x => {
                                            return <div key={x.id} className="row align-items-center">
                                                <div className="col-5">{x.invoice_number}</div>
                                                <div className="col-5">{moment.unix(x.created_at._seconds).format("lll")}</div>
                                                <div className="col-2">
                                                    <svg className="text-info hover-grow" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" onClick={() => {
                                                        setModalView("PRINT_CONFIG_MODAL");
                                                        setModalData({
                                                            submitCallback: (printConfigData) => {
                                                                printInvoice(selectedPatientDetails, x.branch_id, x.invoice_number, moment.unix(x.date._seconds).format("DD-MM-YYYY"), x.mode_of_payment, x.discount_amount, x.line_items, x.accessory_items, printConfigData, branchList)
                                                            }
                                                        })
                                                        openModal()
                                                    }}>
                                                        <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                                        <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        }) : <div>No Invoices created for this Patient</div>
                                    }
                                </div>
                            </div>
                    }
                </Modal.Body>
            </Modal> */}
        </>
    )
}

export default Service