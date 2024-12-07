import React, { useState, useEffect, useMemo } from "react"
import { Modal, Button, Dropdown } from "react-bootstrap"
import Swal from "sweetalert2"
import axios from "axios";
import moment from "moment"
import { Helmet } from "react-helmet-async";

import { useFirebase } from "../contexts/firebase-context";
import { getBranchList, getPatientList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";
import { escapeRegex, formatPatientNumber } from "../utils/commonUtils";
import { getDoctorDetails } from "./Audiometry";
import { printAudiometryReport } from "../utils/printAudiometryReport";
import { printInvoice } from "../utils/printInvoice";

const viewLocation = ({ latitude, longitude }) => {
    if (!latitude || !longitude) {
        Swal.fire("Oops!", "Map-coordinates not available", "info")
        return
    }

    window.open(`https://maps.google.com/?q=${latitude},${longitude}`)
}

const Patients = () => {
    const { currentUserInfo } = useFirebase()

    const [branchList, setBranchList] = useState([])
    const [patientList, setPatientList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    const [configurePatientModalShow, setConfigurePatientModalShow] = useState(false)
    const [patientData, setPatientData] = useState(null)

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

                            <button className="btn btn-success ms-auto me-2" onClick={() => { setConfigurePatientModalShow(true) }}>+ Add</button>
                        </div>

                        <div className="table-responsive" style={{ minHeight: "250px" }}>
                            <table className="table table-hover table-striped border border-light" style={{ minWidth: "950px" }}>
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
                                                                    <Dropdown.Item onClick={() => { setPatientData(x); setConfigurePatientModalShow(true); }} >Edit</Dropdown.Item>
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

            <ConfigurePatientsModal
                configurePatientModalShow={configurePatientModalShow}
                currentUserInfo={currentUserInfo}
                apiEndCallback={() => { getPatientList(currentUserInfo, setPatientList); }}
                modalCloseCallback={() => { setConfigurePatientModalShow(false); setPatientData(null); }}
                patientData={patientData}
            />

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
                                                        Swal.fire({
                                                            title: "Print with Header On/Off?",
                                                            showDenyButton: true,
                                                            showCancelButton: true,
                                                            confirmButtonText: "On",
                                                            denyButtonText: `Off`
                                                        }).then((result) => {
                                                            let h = result.isConfirmed ? true : result.isDenied ? false : null

                                                            if (h !== null) {
                                                                if (!x.trial_mode && x.doctor_id) {
                                                                    getDoctorDetails(x.doctor_id, currentUserInfo.uid, currentUserInfo.displayName)
                                                                        .then((doctor_details) => {
                                                                            printAudiometryReport(x, selectedPatientDetails, h, doctor_details, branchList)
                                                                        })
                                                                }
                                                                else {
                                                                    printAudiometryReport(x, selectedPatientDetails, h, null, branchList)
                                                                }
                                                            }
                                                        });
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
                                                        Swal.fire({
                                                            title: "Print with Header On/Off?",
                                                            showDenyButton: true,
                                                            showCancelButton: true,
                                                            confirmButtonText: "On",
                                                            denyButtonText: `Off`
                                                        }).then((result) => {
                                                            let h = result.isConfirmed ? true : result.isDenied ? false : null

                                                            if (h !== null) {
                                                                printInvoice(selectedPatientDetails, x.branch_id, x.invoice_number, moment.unix(x.date._seconds).format("DD-MM-YYYY"), x.mode_of_payment, x.discount_amount, x.line_items, x.accessory_items, h, branchList)
                                                            }
                                                        });
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

const ConfigurePatientsModal = ({ configurePatientModalShow, currentUserInfo, apiEndCallback, modalCloseCallback, patientData }) => {
    const [patientId, setPatientId] = useState(null)
    const [patientName, setPatientName] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [patientNumber, setPatientNumber] = useState(0)
    const [age, setAge] = useState("")
    const [sex, setSex] = useState("male")
    const [patientAddress, setPatientAddress] = useState("")
    const [notes, setNotes] = useState("")
    const [mapCoordinates, setMapCoordinates] = useState({ latitude: "", longitude: "" })
    const [isGeolocationLoading, setIsGeolocationLoading] = useState(false)
    const [isSaveApiLoading, setIsSaveApiLoading] = useState(false)

    useEffect(() => {
        if (patientData) {
            setPatientId(patientData.id)
            setPatientName(patientData.patient_name)
            setContactNumber(patientData.contact_number)
            setPatientNumber(patientData.patient_number)
            setAge(patientData.age)
            setSex(patientData.sex)
            setPatientAddress(patientData.patient_address)
            setNotes(patientData.notes)
            setMapCoordinates(patientData.map_coordinates)
        }

        if (currentUserInfo && configurePatientModalShow && !patientData) {
            axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-patient-number`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
                .then((res) => {
                    if (res.data.operation === "success") {
                        setPatientNumber(res.data.info)
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
    }, [patientData, currentUserInfo, configurePatientModalShow])


    const configurePatient = () => {

        if (!patientName) {
            Swal.fire('Oops!!', 'Patient name cannot be empty', 'warning');
            return false
        }
        if (!contactNumber) {
            Swal.fire('Oops!!', 'Contact number cannot be empty', 'warning');
            return false
        }
        if (!patientNumber) {
            Swal.fire('Oops!!', 'Patient number invalid', 'warning');
            return false
        }
        if (!age) {
            Swal.fire('Oops!!', 'Age cannot be empty', 'warning');
            return false
        }
        if (!sex) {
            Swal.fire('Oops!!', 'Sex cannot be empty', 'warning');
            return false
        }
        if (!patientAddress) {
            Swal.fire('Oops!!', 'Patient address cannot be empty', 'warning');
            return false
        }

        let data = {
            patient_id: patientId,

            patient_name: patientName,
            contact_number: contactNumber,
            patient_number: patientNumber,
            age: age,
            sex: sex,
            patient_address: patientAddress,
            notes: notes,
            map_coordinates: mapCoordinates,

            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
        }

        setIsSaveApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/configure-patient`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsSaveApiLoading(false)

                if (res.data.operation === "success") {
                    Swal.fire('Success!', res.data.message, 'success');
                    handleConfigurePatientModalClose()

                    apiEndCallback(res.data.info)
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

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            Swal.fire('Oops!!', 'Geolocation is not supported by your browser', 'danger');
        } else {
            setIsGeolocationLoading(true)

            navigator.geolocation.getCurrentPosition((position) => {
                setIsGeolocationLoading(false)
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                console.log(latitude, longitude);

                setMapCoordinates({ latitude, longitude })
            }, () => {
                setIsGeolocationLoading(false)
                Swal.fire('Unable to retrieve your location', 'Please allow location access from site settings', 'warning');
            }, {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000,
            });
        }
    }

    const handleConfigurePatientModalClose = () => {
        setPatientId(null)
        setPatientName("")
        setContactNumber("")
        setPatientNumber(0)
        setAge("")
        setSex("male")
        setPatientAddress("")
        setNotes("")
        setMapCoordinates({ latitude: "", longitude: "" })

        modalCloseCallback()
    }

    return (
        <Modal show={configurePatientModalShow} onHide={() => { handleConfigurePatientModalClose() }} size="lg" centered >
            <Modal.Header closeButton>
                <Modal.Title>{patientId ? "Update Patient" : "Add Patient"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="container">
                    <div className="row">
                        <div className="col-6">
                            <div className="form-group">
                                <label className="form-label my-1 required" htmlFor="patientName">Patient Name</label>
                                <input type="text" id="patientName" className="form-control" value={patientName} onChange={(e) => { setPatientName(e.target.value) }} placeholder="Enter name" />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="form-group">
                                <label className="form-label my-1 required" htmlFor="contactNumber">Contact Number</label>
                                <input type="text" id="contactNumber" className="form-control" value={contactNumber} onChange={(e) => { setContactNumber(e.target.value) }} placeholder="Enter contact no." />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6">
                            <div className="form-group">
                                <label className="form-label my-1 required" htmlFor="patientNumber">Patient No.</label>
                                <div className="input-group mb-3">
                                    <span className="input-group-text">PAT</span>
                                    <input type="number" id="patientNumber" className="form-control" value={patientNumber.toString()} onChange={(e) => { setPatientNumber(e.target.value === "" ? 0 : parseInt(e.target.value)) }} placeholder="Enter PAT No." />
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="form-group">
                                <label className="form-label my-1 required" htmlFor="age">Age</label>
                                <input type="text" id="age" className="form-control" value={age} onChange={(e) => { setAge(e.target.value) }} placeholder="Enter age" />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="form-group">
                                <label className="form-label my-1 required">Sex</label>
                                <div className="d-flex gap-4 text-white" style={{ margin: "0 40px" }}>
                                    <div className={`p-2 flex-grow-1 text-center rounded ${sex === "male" ? "bg-primary" : "bg-secondary"}`} style={{ cursor: "pointer" }} onClick={() => { setSex("male") }}>Male</div>
                                    <div className={`p-2 flex-grow-1 text-center rounded ${sex === "female" ? "bg-primary" : "bg-secondary"}`} style={{ cursor: "pointer" }} onClick={() => { setSex("female") }}>Female</div>
                                    <div className={`p-2 flex-grow-1 text-center rounded ${sex === "others" ? "bg-primary" : "bg-secondary"}`} style={{ cursor: "pointer" }} onClick={() => { setSex("others") }}>Others</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6">
                            <div className="form-group">
                                <label className="form-label my-1 required" htmlFor="patientAddress">Patient Address</label>
                                <textarea id="patientAddress" rows={3} className="form-control" value={patientAddress} onChange={(e) => { setPatientAddress(e.target.value) }} placeholder="Enter address" />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="form-group">
                                <label className="form-label my-1" htmlFor="notes">Notes</label>
                                <textarea id="notes" rows={3} className="form-control" value={notes} onChange={(e) => { setNotes(e.target.value) }} placeholder="Enter notes" />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6">
                            <div className="form-group">
                                <label className="form-label my-1" htmlFor="latitude">Latitude</label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <svg className="me-1" width="16" height="16" fill="crimson" viewBox="0 0 16 16">
                                            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
                                        </svg>
                                    </span>
                                    <input type="number" id="latitude" className="form-control" value={mapCoordinates.latitude} onChange={(e) => { setMapCoordinates({ ...mapCoordinates, latitude: e.target.value }) }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="form-group">
                                <label className="form-label my-1" htmlFor="longitude">Longitude</label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <svg className="me-1" width="16" height="16" fill="crimson" viewBox="0 0 16 16">
                                            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
                                        </svg>
                                    </span>
                                    <input type="number" id="longitude" className="form-control" value={mapCoordinates.longitude} onChange={(e) => { setMapCoordinates({ ...mapCoordinates, longitude: e.target.value }) }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <button className="btn btn-info my-3 mx-2" onClick={() => { getCurrentLocation() }} disabled={isGeolocationLoading}>
                                {
                                    isGeolocationLoading ?
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Loading...</> :
                                        <span>Get Current Location</span>
                                }
                            </button>
                            <button className="btn btn-primary my-3 mx-2" onClick={() => { viewLocation(mapCoordinates) }} disabled={!mapCoordinates.latitude || !mapCoordinates.longitude}>View Location</button>
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" disabled={isSaveApiLoading} onClick={() => { !isSaveApiLoading && configurePatient() }}> {isSaveApiLoading ? <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> : 'Submit'} </Button>
                <Button onClick={() => { handleConfigurePatientModalClose() }}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export { Patients as default, ConfigurePatientsModal }