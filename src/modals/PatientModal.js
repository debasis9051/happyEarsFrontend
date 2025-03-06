import React, { useState, useEffect } from "react"
import { Modal, Button } from 'react-bootstrap';
import Swal from "sweetalert2"
import axios from "axios";

import { useModal } from "../contexts/modal-context";
import { viewLocation } from "../utils/commonUtils";

const PatientModal = () => {

    const { modalShow, modalData, closeModal } = useModal()
    const { currentUserInfo, apiEndCallback, patientData = null } = modalData

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

        if (currentUserInfo && !patientData) {
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
    }, [patientData, currentUserInfo])


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
                    handlePatientModalClose()

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

    const handlePatientModalClose = () => {
        setPatientId(null)
        setPatientName("")
        setContactNumber("")
        setPatientNumber(0)
        setAge("")
        setSex("male")
        setPatientAddress("")
        setNotes("")
        setMapCoordinates({ latitude: "", longitude: "" })

        closeModal()
    }

    return (
        <Modal show={modalShow} onHide={() => { handlePatientModalClose() }} size="lg" centered >
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
                <Button onClick={() => { handlePatientModalClose() }}>Close</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default PatientModal