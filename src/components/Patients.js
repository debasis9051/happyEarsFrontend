import React, { useState, useEffect } from "react"
import { Modal, Button, Dropdown } from "react-bootstrap"
import Swal from "sweetalert2"
import axios from "axios";
import { Helmet } from "react-helmet";

import { useFirebase } from "../contexts/firebase-context";
import { getPatientList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";

const Patients = () => {
    const { currentUserInfo } = useFirebase()

    const [patientList, setPatientList] = useState([])

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")


    const [configurePatientModalShow, setConfigurePatientModalShow] = useState(false)
    const [patientId, setPatientId] = useState(null)
    const [patientName, setPatientName] = useState("")
    const [notes, setNotes] = useState("")
    const [mapCoordinates, setMapCoordinates] = useState({ latitude: "", longitude: "" })
    const [isGeolocationLoading, setIsGeolocationLoading] = useState(false)
    const [isSaveApiLoading, setIsSaveApiLoading] = useState(false)


    const filteredPatientList = patientList.filter(x => {
        if (searchBarState && searchValue !== "") {
            if (((new RegExp(searchValue, "gi")).test(x.patient_name))) {
                return true
            }
            return false
        }
        else {
            return true
        }
    })

    useEffect(() => {
        if (currentUserInfo !== null) {
            getPatientList(currentUserInfo, setPatientList)
        }
    }, [currentUserInfo])

    let tp = Math.ceil(filteredPatientList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    const configurePatientModalInit = (patient_data) => {
        setConfigurePatientModalShow(true)

        setPatientId(patient_data.id)
        setPatientName(patient_data.patient_name)
        setNotes(patient_data.notes)
        setMapCoordinates(patient_data.map_coordinates)
    }

    const configurePatient = () => {

        if (!patientName) {
            Swal.fire('Oops!!', 'Patient name cannot be empty', 'warning');
            return false
        }
        if (!mapCoordinates.latitude || !mapCoordinates.longitude) {
            Swal.fire('Oops!!', 'Patient address location cannot be empty', 'warning');
            return false
        }

        let data = {
            patient_id: patientId,
            patient_name: patientName,
            map_coordinates: mapCoordinates,
            notes: notes,

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
                    getPatientList(currentUserInfo, setPatientList)
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

    const handleConfigurePatientModalClose = () => {
        setConfigurePatientModalShow(false)

        setPatientId(null)
        setPatientName("")
        setNotes("")
        setMapCoordinates({ latitude: "", longitude: "" })
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

    const viewLocation = ({latitude, longitude}) => {
        window.open(`https://maps.google.com/?q=${latitude},${longitude}`)
    }

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

                        <table className="table table-hover m-auto align-middle" style={{ width: "97%" }}>
                            <thead>
                                <tr className="table-dark">
                                    <th scope="col">Sl. No.</th>
                                    <th scope="col">Patient Name</th>
                                    <th scope="col">Notes</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    filteredPatientList.length === 0 ? <tr><td colSpan={4} className="fs-4 text-center text-secondary">No patients added</td></tr> :
                                        filteredPatientList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                            return (
                                                <tr key={i} className={i % 2 ? "table-secondary" : "table-light"}>
                                                    <td>{(currentPage * 10) + i + 1}</td>
                                                    <td>{x.patient_name}</td>
                                                    <td style={{ maxWidth: "700px", overflow: "hidden", textOverflow: "ellipsis" }}>{x.notes}</td>
                                                    <td>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="primary">
                                                                <svg width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                                                                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                                                                </svg>
                                                            </Dropdown.Toggle>

                                                            <Dropdown.Menu>
                                                                <Dropdown.Item onClick={() => { configurePatientModalInit(x) }} >Edit</Dropdown.Item>
                                                                <Dropdown.Item onClick={() => { viewLocation(x.map_coordinates) }} >View Location</Dropdown.Item>
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
                    </>
                </AuthWrapper>
            </div>

            <Modal show={configurePatientModalShow} onHide={() => { handleConfigurePatientModalClose() }} centered >
                <Modal.Header closeButton>
                    <Modal.Title>{patientId ? "Update Patient" : "Add Patient"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="container">
                        <div className="row">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="patientName">Patient Name</label>
                                    <input type="text" id="patientName" className="form-control" value={patientName} onChange={(e) => { setPatientName(e.target.value) }} placeholder="Enter name" />
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="form-label my-1" htmlFor="notes">Notes</label>
                                    <textarea id="notes" rows={3} className="form-control" value={notes} onChange={(e) => { setNotes(e.target.value) }} />
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="latitude">Latitude</label>
                                    <div className="input-group">
                                        <span class="input-group-text">
                                            <svg className="me-1" width="16" height="16" fill="crimson" viewBox="0 0 16 16">
                                                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
                                            </svg>
                                        </span>
                                        <input type="number" id="latitude" className="form-control" value={mapCoordinates.latitude} onChange={(e) => { setMapCoordinates({ ...mapCoordinates, latitude: e.target.value }) }} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="form-label my-1 required" htmlFor="longitude">Longitude</label>
                                    <div className="input-group">
                                        <span class="input-group-text">
                                            <svg className="me-1" width="16" height="16" fill="crimson" viewBox="0 0 16 16">
                                                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
                                            </svg>
                                        </span>
                                        <input type="number" id="longitude" className="form-control" value={mapCoordinates.longitude} onChange={(e) => { setMapCoordinates({ ...mapCoordinates, longitude: e.target.value }) }} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <button className="btn btn-info my-3 mx-2" onClick={() => { getCurrentLocation() }} disabled={isGeolocationLoading}>
                                    {
                                        isGeolocationLoading ?
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Loading...
                                            </>
                                            :
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
        </>
    )
}

export default Patients