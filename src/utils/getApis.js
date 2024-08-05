import axios from "axios";
import Swal from "sweetalert2"

//make common get api structure

const getProductList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-product-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
            }
            else {
                console.log(res.data.message,"/get-product-list");
            }
        })
        .catch((err) => {
            console.log(err)
            Swal.fire('Error!!', err.message, 'error');
        })
}

const getBranchList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-branch-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
            }
            else {
                console.log(res.data.message,"/get-branch-list");
            }
        })
        .catch((err) => {
            console.log(err)
            Swal.fire('Error!!', err.message, 'error');
        })
}

const getSalespersonList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-salesperson-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
            }
            else {
                console.log(res.data.message,"/get-salesperson-list");
            }
        })
        .catch((err) => {
            console.log(err)
            Swal.fire('Error!!', err.message, 'error');
        })
}

const getInvoiceList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-invoice-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
            }
            else {
                console.log(res.data.message,"/get-invoice-list");
            }
        })
        .catch((err) => {
            console.log(err)
            Swal.fire('Error!!', err.message, 'error');
        })
}

const getAudiometryList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-audiometry-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
            }
            else {
                console.log(res.data.message,"/get-audiometry-list");
            }
        })
        .catch((err) => {
            console.log(err)
            Swal.fire('Error!!', err.message, 'error');
        })
}

const getDoctorList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-doctor-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
            }
            else {
                console.log(res.data.message,"/get-doctor-list");
            }
        })
        .catch((err) => {
            console.log(err)
            Swal.fire('Error!!', err.message, 'error');
        })
}

const getUserList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-user-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
            }
            else {
                console.log(res.data.message,"/get-user-list");
            }
        })
        .catch((err) => {
            console.log(err)
            Swal.fire('Error!!', err.message, 'error');
        })
}

export { getProductList, getBranchList, getSalespersonList, getInvoiceList, getAudiometryList, getDoctorList, getUserList }