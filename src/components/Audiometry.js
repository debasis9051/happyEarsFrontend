import { useState, useEffect, useMemo } from "react"
import { Dropdown, Tab, Tabs, FormCheck } from "react-bootstrap"
import axios from "axios";
import Swal from "sweetalert2"
import moment from "moment"
import Select from "react-select"
import { Helmet } from "react-helmet-async";

import { useFirebase } from "../contexts/firebase-context";
import { useModal } from "../contexts/modal-context";
import { getAudiometryList, getBranchList, getDoctorList, getPatientList } from "../utils/getApis"
import AuthWrapper from "./AuthWrapper";
import { printAudiometryReport } from "../utils/printAudiometryReport"
import { escapeRegex, dropDownStyle, formatPatientNumber } from "../utils/commonUtils";

// import { dummyBranchList } from "../testData/branchList";
// import { dummyAudiometryList } from "../testData/audiometryList";
// import { dummyDoctorList } from "../testData/doctorList";
// import { dummyPatientList } from "../testData/patientList";


const acConfig = [
    { frequency: 250, min: -10, max: 120, optional: false },
    { frequency: 500, min: -10, max: 120, optional: false },
    { frequency: 1000, min: -10, max: 120, optional: false },
    { frequency: 2000, min: -10, max: 120, optional: false },
    { frequency: 3000, min: -10, max: 120, optional: true },
    { frequency: 4000, min: -10, max: 120, optional: false },
    { frequency: 6000, min: -10, max: 120, optional: true },
    { frequency: 8000, min: -10, max: 100, optional: false }
]
const bcConfig = [
    { frequency: 250, min: -10, max: 70, optional: false },
    { frequency: 500, min: -10, max: 70, optional: false },
    { frequency: 1000, min: -10, max: 70, optional: false },
    { frequency: 2000, min: -10, max: 70, optional: false },
    { frequency: 3000, min: -10, max: 70, optional: true },
    { frequency: 4000, min: -10, max: 70, optional: false },
]

function removeFrequency(arr, freq) {
    const index = arr.findIndex(obj => obj.frequency === freq);
    if (index === -1) return { arr, removed: null };
    const [removed] = arr.splice(index, 1);
    return { arr, removed };
}

function insertSorted(arr, obj) {
    const index = arr.findIndex(item => item.frequency > obj.frequency);
    if (index === -1) {
        arr.push(obj); // insert at end if larger than all
    } else {
        arr.splice(index, 0, obj);
    }
    return arr;
}

const calculateHearingLoss = (frequencyData) => {
    let readings = frequencyData.reduce((p, o) => {
        if ([500, 1000, 2000].includes(o.frequency)) { p[o.frequency] = o.decibal; return p }
        else { return p }
    }, {})

    let unit
    if (readings[500] === null) {
        unit = 0
    }
    else if (readings[1000] === null) {
        unit = readings[500] / 3
    }
    else if (readings[2000] === null) {
        unit = (readings[500] + readings[1000]) / 3
    }
    else {
        unit = (readings[500] + readings[1000] + readings[2000]) / 3
    }
    unit = Math.round(unit * 100) / 100

    // console.log(readings, unit)

    let color = "#000000"
    let text = ""

    if (unit <= 25) { color = "#b8eeaa"; text = "Normal Hearing"; }
    else if (unit <= 45) { color = "#d5eaae"; text = "Mild Hearing loss"; }
    else if (unit <= 55) { color = "#e9d1af"; text = "Moderate Hearing loss"; }
    else if (unit <= 70) { color = "#f3b2a1"; text = "Moderately-severe Hearing loss"; }
    else if (unit <= 90) { color = "#f5d6da"; text = "Severe Hearing loss"; }
    else { color = "#f6a2b3"; text = "Profound Hearing loss"; }

    return { unit, color, text }
}

const getDoctorDetails = (doctor_id, current_user_uid, current_user_name) => {
    return axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-doctor-details`, { doctor_id: doctor_id, current_user_uid: current_user_uid, current_user_name: current_user_name }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                return res.data.info
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

const Audiometry = () => {
    const { currentUserInfo } = useFirebase()
    const { openModal, setModalView, setModalData } = useModal()

    const [currentTab, setCurrentTab] = useState("tab1")

    const [branchList, setBranchList] = useState([])
    const [audiometryList, setAudiometryList] = useState([])
    const [doctorList, setDoctorList] = useState([])
    const [patientList, setPatientList] = useState([])

    //for testing purpose
    // const [branchList, setBranchList] = useState(dummyBranchList)
    // const [audiometryList, setAudiometryList] = useState(dummyAudiometryList)
    // const [doctorList, setDoctorList] = useState(dummyDoctorList)
    // const [patientList, setPatientList] = useState(dummyPatientList)

    const [currentPage, setCurrentPage] = useState(0)
    const [searchBarState, setSearchBarState] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [branchFilter, setBranchFilter] = useState(null)


    const [audiometryReportMode, setAudiometryReportMode] = useState("add")
    const [audiometryReportId, setAudiometryReportId] = useState(null)
    const [trialMode, setTrialMode] = useState(true)

    const [selectedBranch, setSelectedBranch] = useState(null)
    const [date, setDate] = useState(moment().format("YYYY-MM-DD"))

    const [selectedPatient, setSelectedPatient] = useState(null)

    const [recommendedMachine, setRecommendedMachine] = useState("")
    const [clientChosenMachine, setClientChosenMachine] = useState("")
    const [remarks, setRemarks] = useState("")

    const [referredBy, setReferredBy] = useState("")
    const [audiometer, setAudiometer] = useState("")
    const [complaint, setComplaint] = useState("")

    const [acLeftEarPta, setAcLeftEarPta] = useState({ masked: false, data: acConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) })
    const [acRightEarPta, setAcRightEarPta] = useState({ masked: false, data: acConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) })

    const [bcInput, setBcInput] = useState(false)
    const [bcLeftEarPta, setBcLeftEarPta] = useState({ masked: false, data: bcConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) })
    const [bcRightEarPta, setBcRightEarPta] = useState({ masked: false, data: bcConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) })

    const [tuningFork, setTuningFork] = useState(null)
    const [rinne, setRinne] = useState({ left: null, right: null })
    const [weber, setWeber] = useState(null)
    const [selectedDoctor, setSelectedDoctor] = useState(null)

    const [provisionalDiagnosis, setProvisionalDiagnosis] = useState({ left: "", right: "" })
    const [recommendations, setRecommendations] = useState(["Aural Hygiene", "Follow Up", "Refer Back to Ent.", "Hearing Aid Trial and Fitting"])

    const [isAudiometryReportApiLoading, setIsAudiometryReportApiLoading] = useState(false)


    const filteredAudiometryList = useMemo(() => {
        return branchFilter ? audiometryList.filter(x => x.branch_id === branchFilter.value).filter(x => {
            let pd = patientList.find(p => p.id === x.patient_id)
            let reg = new RegExp(escapeRegex(searchValue), "gi")

            if (searchBarState && searchValue !== "") {
                if ((reg.test(pd.patient_number)) || (reg.test(pd.patient_name)) || (reg.test(pd.contact_number))) {
                    return true
                }
                return false
            }
            else {
                return true
            }
        }) : []
    }, [branchFilter, searchBarState, searchValue, audiometryList, patientList])


    useEffect(() => {
        if (currentUserInfo !== null) {
            getBranchList(currentUserInfo, setBranchList)
            getAudiometryList(currentUserInfo, setAudiometryList)
            getDoctorList(currentUserInfo, setDoctorList)
            getPatientList(currentUserInfo, setPatientList)
        }
    }, [currentUserInfo])

    useEffect(() => {
        if (branchList.length > 0) {
            let b = branchList.find(x => x.branch_invoice_code === "RANI")
            setBranchFilter({ label: b.branch_name, value: b.id })
        }
    }, [branchList])

    const updateAudiometryReportInit = (audiometry_report_data) => {
        setAudiometryReportMode("update");
        setAudiometryReportId(audiometry_report_data.id)
        setTrialMode(audiometry_report_data.trial_mode)

        setSelectedBranch({ label: branchList.find(x => x.id === audiometry_report_data.branch_id).branch_name, value: audiometry_report_data.branch_id })
        setDate(moment.unix(audiometry_report_data.date._seconds).format("YYYY-MM-DD"))

        setSelectedPatient({ label: patientList.find(x => x.id === audiometry_report_data.patient_id).patient_name, value: audiometry_report_data.patient_id })

        setAcLeftEarPta(audiometry_report_data.ac_left_ear_pta)
        setAcRightEarPta(audiometry_report_data.ac_right_ear_pta)

        setBcInput(audiometry_report_data.bc_input)
        setBcLeftEarPta(audiometry_report_data.bc_left_ear_pta)
        setBcRightEarPta(audiometry_report_data.bc_right_ear_pta)

        if (audiometry_report_data.trial_mode) {
            setRecommendedMachine(audiometry_report_data.recommended_machine)
            setClientChosenMachine(audiometry_report_data.client_chosen_machine)
            setRemarks(audiometry_report_data.remarks)
        }
        else {
            setReferredBy(audiometry_report_data.referred_by)
            setAudiometer(audiometry_report_data.audiometer)
            setComplaint(audiometry_report_data.complaint)

            setTuningFork(audiometry_report_data.tuning_fork)
            setRinne(audiometry_report_data.rinne)
            setWeber(audiometry_report_data.weber)
            if (audiometry_report_data.doctor_id) {
                setSelectedDoctor({ label: doctorList.find(x => x.id === audiometry_report_data.doctor_id).doctor_name, value: audiometry_report_data.doctor_id })
            }
            setProvisionalDiagnosis(audiometry_report_data.provisional_diagnosis)
            setRecommendations(audiometry_report_data.recommendations)
        }

        setCurrentTab("tab2")
    }

    const processAudiometryReport = () => {
        if (selectedBranch === null) {
            Swal.fire('Oops!!', 'Select a Branch', 'warning');
            return false
        }
        if (date === "") {
            Swal.fire('Oops!!', 'Date cannot be empty', 'warning');
            return false
        }
        if (selectedPatient === null) {
            Swal.fire('Oops!!', 'Select a Patient', 'warning');
            return false
        }

        if (trialMode) {
            if (recommendedMachine === "") {
                Swal.fire('Oops!!', 'Recommended Machine cannot be empty', 'warning');
                return false
            }
            if (clientChosenMachine === "") {
                Swal.fire('Oops!!', 'Client Chosen Machine cannot be empty', 'warning');
                return false
            }
        }
        else {
            if (referredBy === "") {
                Swal.fire('Oops!!', 'Referred By cannot be empty', 'warning');
                return false
            }
            if (audiometer === "") {
                Swal.fire('Oops!!', 'Audiometer cannot be empty', 'warning');
                return false
            }

            if (complaint === "") {
                Swal.fire('Oops!!', 'Complaint cannot be empty', 'warning');
                return false
            }

            if ((rinne.left === null) || (rinne.right === null)) {
                Swal.fire('Oops!!', 'Select values for All Rinne fields', 'warning');
                return false
            }
            if (weber === null) {
                Swal.fire('Oops!!', 'Weber cannot be empty', 'warning');
                return false
            }

            if (provisionalDiagnosis.left === "" || provisionalDiagnosis.right === "") {
                Swal.fire('Oops!!', 'Enter a Provisional Diagnosis for both ears', 'warning');
                return false
            }
            if (!recommendations.find(x => x !== "")) {
                Swal.fire('Oops!!', 'Enter at least 1 Recommendation', 'warning');
                return false
            }
        }

        let data = {
            trial_mode: trialMode,

            branch_id: selectedBranch.value,
            date: date,

            patient_id: selectedPatient.value,

            recommended_machine: trialMode ? recommendedMachine : null,
            client_chosen_machine: trialMode ? clientChosenMachine : null,
            remarks: trialMode ? remarks : null,

            referred_by: trialMode ? null : referredBy,
            audiometer: trialMode ? null : audiometer,
            complaint: trialMode ? null : complaint,

            ac_left_ear_pta: acLeftEarPta,
            ac_right_ear_pta: acRightEarPta,

            bc_input: bcInput,
            bc_left_ear_pta: bcLeftEarPta,
            bc_right_ear_pta: bcRightEarPta,

            tuning_fork: trialMode ? null : tuningFork,
            rinne: trialMode ? null : rinne,
            weber: trialMode ? null : weber,
            doctor_id: !trialMode && selectedDoctor ? selectedDoctor.value : null,

            provisional_diagnosis: trialMode ? null : provisionalDiagnosis,
            recommendations: trialMode ? null : recommendations.filter(x => x !== ""),

            current_user_uid: currentUserInfo.uid,
            current_user_name: currentUserInfo.displayName
        }

        if (audiometryReportMode !== "add") data["audiometry_report_id"] = audiometryReportId

        setIsAudiometryReportApiLoading(true)
        axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/${audiometryReportMode === "add" ? "save-audiometry-report" : "update-audiometry-report"}`, data, { headers: { 'Content-Type': 'application/json' } })
            .then((res) => {
                setIsAudiometryReportApiLoading(false)
                if (res.data.operation === "success") {
                    getAudiometryList(currentUserInfo, setAudiometryList)
                    handleAudiometryReportClose()
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
    }

    const handleAudiometryReportClose = () => {
        setCurrentTab("tab1")

        setAudiometryReportMode("add")
        setAudiometryReportId(null)
        setTrialMode(true)

        clearAudiometryForm()
    }

    const clearAudiometryForm = () => {
        setSelectedBranch(null)
        setDate(moment().format("YYYY-MM-DD"))

        setSelectedPatient(null)

        setRecommendedMachine("")
        setClientChosenMachine("")
        setRemarks("")

        setReferredBy("")
        setAudiometer("")
        setComplaint("")

        setAcLeftEarPta({ masked: false, data: acConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) })
        setAcRightEarPta({ masked: false, data: acConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) })

        setBcInput(false)
        setBcLeftEarPta({ masked: false, data: bcConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) })
        setBcRightEarPta({ masked: false, data: bcConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) })

        setTuningFork(null)
        setRinne({ left: null, right: null })
        setWeber(null)
        setSelectedDoctor(null)

        setProvisionalDiagnosis({ left: "", right: "" })
        setRecommendations(["Aural Hygiene", "Follow Up", "Refer Back to Ent.", "Hearing Aid Trial and Fitting"])
    }

    let tp = Math.ceil(filteredAudiometryList.length / 10)
    let c = currentPage + 1
    let s = (c - 2) - (c + 2 > tp ? (c + 2) - tp : 0)
    s = (s < 1 ? 1 : s)
    let e = (c + 2) + (c - 2 < 1 ? 1 - (c - 2) : 0)
    e = (e > tp ? tp : e)

    return (
        <>
            <Helmet>
                <meta name="description" content="Happy Ears Kolkata is a React-powered app for efficient hearing care management, offering seamless invoice creation, inventory control, and secure patient data storage with integrated location tracking, created by Hritwick De. Audiometry Page used to record and calibrate hearing audiograms of patients" />
                <title>Audiometry | Happy Ears Kolkata Invoicing</title>
            </Helmet>

            <div>
                <div className="d-flex align-items-center">
                    <span className="fs-3 px-3 pt-3">Audiometry</span>
                </div>

                <AuthWrapper page={"audiometry"}>
                    <>
                        <div className="container-fluid">
                            <Tabs className="mb-3" activeKey={currentTab}
                                onSelect={(k) => {
                                    if (k === "tab1") {
                                        handleAudiometryReportClose();
                                    }
                                    else {
                                        setCurrentTab(k);
                                    }
                                }}
                            >
                                <Tab eventKey="tab1" title="Records">

                                    <div className="d-flex align-items-end px-3 py-2">
                                        <label className="form-label m-0 me-2 fs-5">Filters: </label>
                                        <div className="form-group mx-1">
                                            <label className="form-label m-0">Branch</label>
                                            <Select
                                                options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                                value={branchFilter}
                                                onChange={(val) => { setBranchFilter(val); setCurrentPage(0); }}
                                                styles={dropDownStyle}
                                                placeholder="Select a Branch..."
                                            />
                                        </div>
                                        <div className="d-flex mx-2">
                                            <button className="btn btn-secondary rounded-pill me-1" onClick={() => { setSearchBarState(!searchBarState); setSearchValue("") }}>
                                                <svg width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                                </svg>
                                            </button>
                                            <input type="text" className="form-control" style={searchBarState ? { transition: "all 1s" } : { transition: "all 1s", width: "0", padding: "0", opacity: "0", visibility: "hidden" }} placeholder="Search..." onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(0); }} />
                                        </div>

                                        <button className="btn btn-success ms-auto me-2" onClick={() => { setCurrentTab("tab2") }}>+ Add Audiometry Report</button>
                                    </div>

                                    <div className="table-responsive" style={{ minHeight: "250px" }}>
                                        <table className="table table-hover table-striped border border-light align-middle" style={{ minWidth: "950px" }}>
                                            <thead>
                                                <tr className="table-dark">
                                                    <th scope="col">Sl. No.</th>
                                                    <th scope="col">Patient Number</th>
                                                    <th scope="col">Patient Name</th>
                                                    <th scope="col">Contact Number</th>
                                                    <th scope="col">LHL(db)</th>
                                                    <th scope="col">RHL(db)</th>
                                                    <th scope="col">Added On</th>
                                                    <th scope="col">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    !patientList.length || !filteredAudiometryList.length ? <tr><td colSpan={8} className="fs-4 text-center text-secondary">No audiometry reports added</td></tr> :
                                                        filteredAudiometryList.slice(currentPage * 10, (currentPage * 10) + 10).map((x, i) => {
                                                            let patientDetails = patientList.find(p => p.id === x.patient_id)

                                                            return (
                                                                <tr key={i}>
                                                                    <td>{(currentPage * 10) + i + 1}</td>
                                                                    <td>{formatPatientNumber(patientDetails.patient_number)}</td>
                                                                    <td>{patientDetails.patient_name}</td>
                                                                    <td>{patientDetails.contact_number}</td>
                                                                    <td>{calculateHearingLoss(x.ac_left_ear_pta.data).unit}</td>
                                                                    <td>{calculateHearingLoss(x.ac_right_ear_pta.data).unit}</td>
                                                                    <td>{moment.unix(x.created_at._seconds).format("lll")}</td>
                                                                    <td>
                                                                        <Dropdown>
                                                                            <Dropdown.Toggle variant="primary">
                                                                                <svg width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                                                                                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                                                                                </svg>
                                                                            </Dropdown.Toggle>

                                                                            <Dropdown.Menu>
                                                                                <Dropdown.Item onClick={() => { updateAudiometryReportInit(x) }} >Edit Report </Dropdown.Item>
                                                                                <Dropdown.Item href={`/generate-invoice/${x.id}`} >Generate Invoice </Dropdown.Item>
                                                                                <Dropdown.Item
                                                                                    onClick={() => {
                                                                                        setModalView("PRINT_CONFIG_MODAL");
                                                                                        setModalData({
                                                                                            submitCallback: (printConfigData) => {
                                                                                                if (!x.trial_mode && x.doctor_id) {
                                                                                                    getDoctorDetails(x.doctor_id, currentUserInfo.uid, currentUserInfo.displayName)
                                                                                                        .then((doctor_details) => {
                                                                                                            printAudiometryReport(x, patientDetails, printConfigData, doctor_details, branchList)
                                                                                                        })
                                                                                                }
                                                                                                else {
                                                                                                    printAudiometryReport(x, patientDetails, printConfigData, null, branchList)
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                        openModal()
                                                                                    }}
                                                                                >Print Report
                                                                                </Dropdown.Item>
                                                                            </Dropdown.Menu>
                                                                        </Dropdown>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                }
                                            </tbody>
                                            {
                                                filteredAudiometryList.length !== 0 &&
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan={8}>
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
                                <Tab eventKey="tab2" title="Audiometry Report">

                                    <div className="card container my-5 p-3">
                                        <div className="card-header rounded d-flex align-items-center justify-content-between">
                                            <h4 className="m-0">{audiometryReportMode === "add" ? "Add" : "Update"} Audiometry Report</h4>
                                            <div className="d-flex align-items-center gap-2">
                                                <h5 className="m-0">Trial Mode</h5>
                                                <FormCheck className="fs-4" type="switch" disabled={audiometryReportMode === "update"} checked={trialMode} onChange={(e) => { setTrialMode(e.target.checked); clearAudiometryForm(); }} />
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required">Branch</label>
                                                        <Select
                                                            options={branchList.map(x => ({ label: x.branch_name, value: x.id }))}
                                                            value={selectedBranch}
                                                            onChange={(val) => { setSelectedBranch(val); }}
                                                            isDisabled={audiometryReportMode === "update"}
                                                            styles={dropDownStyle}
                                                            placeholder="Select a Branch..."
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-3">
                                                    <div className="form-group">
                                                        <label className="form-label my-1 required" htmlFor="date">Date</label>
                                                        <input type="date" id="date" className="form-control" value={date} onChange={(e) => { setDate(e.target.value) }} />
                                                    </div>
                                                </div>
                                                <div className="col-5 d-flex gap-2">
                                                    <div className="form-group flex-grow-1">
                                                        <label className="form-label my-1 required">Patient</label>
                                                        <Select
                                                            options={patientList.map(x => ({ label: x.patient_name, value: x.id }))}
                                                            value={selectedPatient}
                                                            onChange={(val) => { setSelectedPatient(val); }}
                                                            isDisabled={audiometryReportMode === "update"}
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
                                                {
                                                    trialMode ?
                                                        <>
                                                            <div className="col-6">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required" htmlFor="recommendedMachine">Recommended Machine</label>
                                                                    <input type="text" id="recommendedMachine" className="form-control" value={recommendedMachine} onChange={(e) => { setRecommendedMachine(e.target.value) }} />
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required" htmlFor="clientChosenMachine">Client Chosen Machine</label>
                                                                    <input type="text" id="clientChosenMachine" className="form-control" value={clientChosenMachine} onChange={(e) => { setClientChosenMachine(e.target.value) }} />
                                                                </div>
                                                            </div>
                                                        </>
                                                        :
                                                        <>
                                                            <div className="col-6">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required" htmlFor="referredBy">Referred By</label>
                                                                    <input type="text" id="referredBy" className="form-control" value={referredBy} onChange={(e) => { setReferredBy(e.target.value) }} />
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="form-group">
                                                                    <label className="form-label my-1 required">Audiometer</label>
                                                                    <Select
                                                                        options={["Proton DX5", "Proton DX3"].map(x => ({ label: x, value: x }))}
                                                                        value={audiometer ? { label: audiometer, value: audiometer } : null}
                                                                        onChange={(val) => { setAudiometer(val.value); }}
                                                                        styles={dropDownStyle}
                                                                        placeholder="Select an Audiometer..."
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>
                                                }
                                            </div>

                                            <div className="row">
                                                {
                                                    trialMode ?
                                                        <div className="col-12">
                                                            <div className="form-group">
                                                                <label className="form-label my-1" htmlFor="remarks">Remarks</label>
                                                                <textarea id="remarks" rows={3} className="form-control" value={remarks} onChange={(e) => { setRemarks(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                        :
                                                        <div className="col-12">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="complaint">Complaint</label>
                                                                <textarea id="complaint" rows={3} maxLength={150} className="form-control" value={complaint} onChange={(e) => { setComplaint(e.target.value) }} />
                                                            </div>
                                                        </div>
                                                }
                                            </div>

                                            <br />
                                            <h4 className="text-center my-2">Air Conduction (AC)</h4>
                                            <div className="row">
                                                <div className="col-xl-6 text-center">
                                                    <h5 className="mt-3">Left Ear PTA</h5>
                                                    <AudiogramInput ptaData={acLeftEarPta} setPtaData={setAcLeftEarPta} earside={"LEFT"} config={acConfig} />
                                                </div>

                                                <div className="col-xl-6 text-center">
                                                    <h5 className="mt-3">Right Ear PTA</h5>
                                                    <AudiogramInput ptaData={acRightEarPta} setPtaData={setAcRightEarPta} earside={"RIGHT"} config={acConfig} />
                                                </div>
                                            </div>
                                            <br />
                                            <h4 className="text-center my-2">Bone Conduction (BC)</h4>
                                            <FormCheck className="fs-4 text-center" type="switch" checked={bcInput}
                                                onChange={(e) => {
                                                    setBcInput(e.target.checked);
                                                    setBcLeftEarPta({ masked: false, data: bcConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) });
                                                    setBcRightEarPta({ masked: false, data: bcConfig.filter(x => x.optional !== true).map(x => ({ frequency: x.frequency, decibal: 0 })) });
                                                }}
                                            />
                                            {
                                                bcInput &&
                                                <div className="row">
                                                    <div className="col-xl-6 text-center">
                                                        <h5 className="mt-3">Left Ear PTA</h5>
                                                        <AudiogramInput ptaData={bcLeftEarPta} setPtaData={setBcLeftEarPta} earside={"LEFT"} config={bcConfig} hearingLossRatingPanel={false} />
                                                    </div>

                                                    <div className="col-xl-6 text-center">
                                                        <h5 className="mt-3">Right Ear PTA</h5>
                                                        <AudiogramInput ptaData={bcRightEarPta} setPtaData={setBcRightEarPta} earside={"RIGHT"} config={bcConfig} hearingLossRatingPanel={false} />
                                                    </div>
                                                </div>
                                            }
                                            <br />

                                            {
                                                !trialMode &&
                                                <>
                                                    <div className="row">
                                                        <div className="col-4">
                                                            <div className="form-group">
                                                                <label className="form-label my-1">Tuning Fork(Hz)</label>
                                                                <Select
                                                                    options={["520(hz)", "256(hz)"].map(x => ({ label: x, value: x }))}
                                                                    value={tuningFork === null ? null : { label: tuningFork, value: tuningFork }}
                                                                    onChange={(val) => { setTuningFork(val.value) }}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select Tuning Fork..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-4">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required">Rinne (Left)</label>
                                                                <Select
                                                                    options={["Positive (+ve)", "Negative (-ve)"].map(x => ({ label: x, value: x }))}
                                                                    value={rinne.left === null ? null : { label: rinne.left, value: rinne.left }}
                                                                    onChange={(val) => { setRinne({ ...rinne, left: val.value }) }}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-4">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required">Rinne (Right)</label>
                                                                <Select
                                                                    options={["Positive (+ve)", "Negative (-ve)"].map(x => ({ label: x, value: x }))}
                                                                    value={rinne.right === null ? null : { label: rinne.right, value: rinne.right }}
                                                                    onChange={(val) => { setRinne({ ...rinne, right: val.value }) }}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1">Doctor</label>
                                                                <Select
                                                                    options={doctorList.map(x => ({ label: x.doctor_name, value: x.id }))}
                                                                    value={selectedDoctor}
                                                                    onChange={(val) => { setSelectedDoctor(val); }}
                                                                    isClearable
                                                                    isDisabled={audiometryReportMode === "update"}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select a Doctor..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required">Weber</label>
                                                                <Select
                                                                    options={["Left", "Center", "Right"].map(x => ({ label: x, value: x }))}
                                                                    value={weber === null ? null : { label: weber, value: weber }}
                                                                    onChange={(val) => { setWeber(val.value) }}
                                                                    styles={dropDownStyle}
                                                                    placeholder="Select..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="provisionalDiagnosisLeft">Provisional Diagnosis (Left)</label>
                                                                <textarea id="provisionalDiagnosisLeft" rows={3} maxLength={130} className="form-control" value={provisionalDiagnosis.left} onChange={(e) => { setProvisionalDiagnosis({ ...provisionalDiagnosis, left: e.target.value }) }} />
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="form-group">
                                                                <label className="form-label my-1 required" htmlFor="provisionalDiagnosisRight">Provisional Diagnosis (Right)</label>
                                                                <textarea id="provisionalDiagnosisRight" rows={3} maxLength={130} className="form-control" value={provisionalDiagnosis.right} onChange={(e) => { setProvisionalDiagnosis({ ...provisionalDiagnosis, right: e.target.value }) }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row">
                                                        <div className="col-12">
                                                            <label className="form-label my-1 required" htmlFor="recommendations">Recommendations</label>
                                                            {
                                                                recommendations.map((x, i) => {
                                                                    return (
                                                                        <div key={i} className="d-flex align-items-center gap-5 my-2">
                                                                            <input type="text" className="form-control" maxLength={30} value={x}
                                                                                onChange={(e) => {
                                                                                    let t = [...recommendations]
                                                                                    t.splice(i, 1, e.target.value)
                                                                                    setRecommendations(t)
                                                                                }}
                                                                            />
                                                                            {
                                                                                recommendations.length > 1 &&
                                                                                <button className="btn btn-outline-danger rounded-pill" onClick={() => {
                                                                                    let t = [...recommendations]
                                                                                    t.splice(i, 1)
                                                                                    setRecommendations(t)
                                                                                }}>
                                                                                    <span className="">✖</span>
                                                                                </button>
                                                                            }
                                                                        </div>
                                                                    )
                                                                })
                                                            }
                                                            {recommendations.length < 4 && <button className="btn btn-primary" onClick={() => { setRecommendations([...recommendations, ""]) }}>+ Add</button>}
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                        </div>
                                        <div className="card-footer rounded text-end">
                                            <button className="btn btn-success mx-2" disabled={isAudiometryReportApiLoading}
                                                onClick={() => {
                                                    if (isAudiometryReportApiLoading) return;

                                                    Swal.fire({
                                                        title: `Are you sure? ${audiometryReportMode === "add" && !trialMode && !selectedDoctor ? "<span class='text-danger heartbeat'>The Doctor has not been Selected</span>" : ""}`,
                                                        showCancelButton: true,
                                                        confirmButtonText: "Submit",
                                                    }).then((result) => {
                                                        if (result.isConfirmed) {
                                                            processAudiometryReport()
                                                        }
                                                    });
                                                }}
                                            >
                                                {
                                                    isAudiometryReportApiLoading ?
                                                        <div>Loading...<span className="spinner-border spinner-border-sm"></span></div> :
                                                        (audiometryReportMode === "add" ? "Submit" : "Update")
                                                }
                                            </button>
                                            <button className="btn btn-danger mx-2" onClick={() => { handleAudiometryReportClose() }}>Close</button>
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

const AudiogramInput = ({ ptaData, setPtaData, earside, config, hearingLossRatingPanel = true }) => {
    return (
        <div className="border border-5 border-primary rounded-5 d-inline-block">
            <div className="d-flex justify-content-center">
                <div style={{ fontSize: "smaller", writingMode: "tb", textOrientation: "upright" }}>frequency</div>
                <div className="pt-3 pe-3">
                    {
                        config.map((cd, i) => {

                            let min = cd.min
                            let max = cd.max

                            let t = ptaData.data.find(y => y.frequency === cd.frequency)
                            if (t) {
                                return (
                                    <div key={i} className="row gx-0 align-items-center my-2">
                                        <div className="col-2 px-2">{cd.frequency}</div>
                                        <div className="col-9 px-2 d-flex">
                                            <button className="btn btn-primary rounded-0 rounded-start fs-4" style={{ height: "40px", lineHeight: "10px" }}
                                                disabled={t.decibal === null || t.decibal <= min}
                                                onClick={() => {
                                                    let temp = ptaData.data.map(x => ({ ...x }))
                                                    let fq = temp.find(y => y.frequency === cd.frequency)
                                                    fq.decibal = t.decibal <= min ? min : fq.decibal - 5
                                                    setPtaData({ ...ptaData, data: temp })
                                                }}
                                            >&ndash;</button>
                                            <input type={t.decibal === null ? "text" : "number"} className="form-control rounded-0"
                                                value={t.decibal === null ? "NR" : t.decibal.toString()}
                                                onChange={(e) => {
                                                    let value = parseInt(e.target.value === "" ? 0 : e.target.value)

                                                    let temp = ptaData.data.map(x => ({ ...x }))
                                                    let fq = temp.find(y => y.frequency === cd.frequency)
                                                    fq.decibal = value > max ? max : value < min ? min : value
                                                    setPtaData({ ...ptaData, data: temp })
                                                }}
                                                onBlur={(e) => {
                                                    let temp = ptaData.data.map(x => ({ ...x }))
                                                    let fq = temp.find(y => y.frequency === cd.frequency)
                                                    fq.decibal = Math.round(fq.decibal / 5) * 5
                                                    setPtaData({ ...ptaData, data: temp })
                                                }}
                                                disabled={t.decibal === null}
                                            />
                                            <button className="btn btn-primary rounded-0 rounded-end fs-4" style={{ height: "40px", lineHeight: "10px" }}
                                                disabled={t.decibal === null || t.decibal >= max}
                                                onClick={() => {
                                                    let temp = ptaData.data.map(x => ({ ...x }))
                                                    let fq = temp.find(y => y.frequency === cd.frequency)
                                                    fq.decibal = fq.decibal >= max ? max : fq.decibal + 5
                                                    setPtaData({ ...ptaData, data: temp })
                                                }}
                                            >&#43;</button>
                                        </div>
                                        <div className={`col-1 px-2 rounded-circle ${t.decibal === null ? "bg-danger" : "bg-success"}`} style={{ width: "30px", height: "30px", cursor: "pointer" }}
                                            onClick={() => {
                                                let temp = ptaData.data.map(x => ({ ...x }))
                                                let fq = temp.find(y => y.frequency === cd.frequency)
                                                fq.decibal = fq.decibal !== null ? null : 0
                                                setPtaData({ ...ptaData, data: temp })
                                            }}
                                        ></div>
                                    </div>
                                )
                            } else { return null; }
                        })
                    }
                </div>
            </div>
            {
                hearingLossRatingPanel &&
                (() => {
                    let { unit, color, text } = calculateHearingLoss(ptaData.data)

                    return (
                        <div className="d-flex align-items-center justify-content-center mt-2">
                            <span className="mx-3 fw-bold">{earside === "LEFT" ? "LHL" : "RHL"} - {Math.round(unit * 1000) / 1000}</span>
                            <div className="fw-bold p-2 rounded text-black text-nowrap" style={{ backgroundColor: color }}>{text}</div>
                        </div>
                    )
                })()
            }
            <hr className="mb-1" />
            <h5>Settings</h5>
            <div className="d-flex align-items-center justify-content-center mb-2">
                {
                    config.filter(x => x.optional === true).map((cd, i) => {
                        return (
                            <div className="d-flex align-items-center" key={i}>
                                <span className="text-white">{cd.frequency} Hz</span>
                                <FormCheck className="fs-5" type="switch" checked={ptaData.data.find(x => x.frequency === cd.frequency) !== undefined}
                                    onChange={(e) => {
                                        let temp = ptaData.data.map(x => ({ ...x }))
                                        temp = e.target.checked ? insertSorted(temp, { frequency: cd.frequency, decibal: 0 }) : removeFrequency(temp, cd.frequency).arr
                                        setPtaData({ ...ptaData, data: temp });
                                    }}
                                />
                            </div>
                        )
                    })
                }
                <div className="d-flex align-items-center">
                    <span className="text-white">Masked</span>
                    <FormCheck className="fs-5" type="switch" checked={ptaData.masked} onChange={(e) => { setPtaData({ ...ptaData, masked: e.target.checked }); }} />
                </div>
            </div>
        </div>
    )
}

export { Audiometry as default, getDoctorDetails, calculateHearingLoss, acConfig, bcConfig }