import React, { useState, useEffect, useMemo } from "react"
import { Modal, Dropdown } from "react-bootstrap"
import Swal from "sweetalert2"
import axios from "axios";
import moment from "moment"
import { Helmet } from "react-helmet-async";

import { useFirebase } from "../contexts/firebase-context";
import { useModal } from "../contexts/modal-context";
import { getBranchList, getPatientList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";
import { escapeRegex, formatPatientNumber, viewLocation } from "../utils/commonUtils";
import { getDoctorDetails } from "./Audiometry";
import { printAudiometryReport } from "../utils/printAudiometryReport";
import { printInvoice } from "../utils/printInvoice";

const Patients = () => {
    const { currentUserInfo } = useFirebase()
    const { openModal, setModalView, setModalData } = useModal()

    const [branchList, setBranchList] = useState([])
    const [patientList, setPatientList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    const [patientDocsModalShow, setPatientDocsModalShow] = useState(false)
    const [selectedPatientDetails, setSelectedPatientDetails] = useState(null)
    const [patientDocs, setPatientDocs] = useState(null)
    const [patientDocsApiState, setPatientDocsApiState] = useState(false)


    const filteredPatientList = useMemo(() => {
        return patientList.filter(x => {
            let reg = new RegExp(escapeRegex(searchValue), "gi")

            if (searchBarState && searchValue !== "") {
                if ((reg.test(x.patient_number)) || (reg.test(x.patient_name)) || (reg.test(x.contact_number))) {
                    return true
                }
                return false
            }
            else {
                return true
            }
        })
    }, [searchBarState, searchValue, patientList])

    const getPatientDocs = (patient_id) => {
        setPatientDocsApiState(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-patient-docs-by-id`, { patient_id: patient_id, current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setPatientDocsApiState(false)
                if (res.data.operation === "success") {
                    setPatientDocs(res.data.info)
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

    useEffect(() => {
        if (currentUserInfo !== null) {
            getBranchList(currentUserInfo, setBranchList)
            getPatientList(currentUserInfo, setPatientList)
        }
    }, [currentUserInfo])

    let tp = Math.ceil(filteredPatientList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    return (
        <>
            <Helmet>
                <meta name="description" content="Happy Ears Kolkata is a React-powered app for efficient hearing care management, offering seamless invoice creation, inventory control, and secure patient data storage with integrated location tracking, created by Hritwick De. Patients page where patients, their respective visit location and consultation details are recorded" />
                <title>Patients | Happy Ears Kolkata Invoicing</title>
            </Helmet>

            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Patients</span>
                </div>

                <AuthWrapper page={"patients"}>
                    <>
                        <div className="d-flex align-items-end px-3 py-2">
                            <div className="d-flex mx-2">
                                <button className="btn btn-secondary rounded-pill me-1" onClick={() => { setSearchBarState(!searchBarState); setSearchValue("") }}>
                                    <svg width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                    </svg>
                                </button>
                                <input type="text" className="form-control" style={searchBarState ? { transition: "all 1s" } : { transition: "all 1s", width: "0", padding: "0", opacity: "0", visibility: "hidden" }} placeholder="Search..." onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(0); }} />
                            </div>

                            <button className="btn btn-success ms-auto me-2" onClick={() => {
                                setModalView("PATIENT_MODAL");
                                setModalData({
                                    currentUserInfo,
                                    apiEndCallback: () => {
                                        getPatientList(currentUserInfo, setPatientList);
                                    },
                                });
                                openModal()
                            }} >+ Add </button>
                        </div>

                        <div className="table-responsive" style={{ minHeight: "250px" }}>
                            <table className="table table-hover table-striped border border-light align-middle" style={{ minWidth: "950px" }}>
                                <thead>
                                    <tr className="table-dark">
                                        <th scope="col">Sl. No.</th>
                                        <th scope="col">Patient Number</th>
                                        <th scope="col">Patient Name</th>
                                        <th scope="col">Contact Number</th>
                                        <th scope="col">Age</th>
                                        <th scope="col">Sex</th>
                                        <th scope="col">Notes</th>
                                        <th scope="col">Added On</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        !filteredPatientList.length ? <tr><td colSpan={9} className="fs-4 text-center text-secondary">No patients added</td></tr> :
                                            filteredPatientList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                                return (
                                                    <tr key={i}>
                                                        <td>{(currentPage * 10) + i + 1}</td>
                                                        <td>{formatPatientNumber(x.patient_number)}</td>
                                                        <td>{x.patient_name}</td>
                                                        <td>{x.contact_number}</td>
                                                        <td>{x.age}</td>
                                                        <td>{x.sex}</td>
                                                        <td>
                                                            <button className="btn btn-info" onClick={() => { Swal.fire("Notes", x.notes || "N/A", "info") }}>
                                                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                                                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                        <td>{moment.unix(x.created_at._seconds).format("lll")}</td>
                                                        <td>
                                                            <Dropdown>
                                                                <Dropdown.Toggle variant="primary">
                                                                    <svg width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                                                                        <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                                                                    </svg>
                                                                </Dropdown.Toggle>

                                                                <Dropdown.Menu>
                                                                    <Dropdown.Item onClick={() => {
                                                                        setModalView("PATIENT_MODAL");
                                                                        setModalData({
                                                                            currentUserInfo,
                                                                            patientData: x,
                                                                            apiEndCallback: () => {
                                                                                getPatientList(currentUserInfo, setPatientList);
                                                                            },
                                                                        });
                                                                        openModal()
                                                                    }} >Edit</Dropdown.Item>
                                                                    <Dropdown.Item onClick={() => { viewLocation(x.map_coordinates) }} >View Location</Dropdown.Item>
                                                                    <Dropdown.Item onClick={() => { setPatientDocsModalShow(true); setSelectedPatientDetails(x); getPatientDocs(x.id); }} >View Patient Documents</Dropdown.Item>
                                                                </Dropdown.Menu>
                                                            </Dropdown>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                    }
                                </tbody>
                                {
                                    filteredPatientList.length !== 0 &&
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
                    </>
                </AuthWrapper>
            </div>

            <Modal show={patientDocsModalShow} onHide={() => { setPatientDocsModalShow(false) }} size="md" centered >
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
            </Modal>
        </>
    )
}

export default Patients