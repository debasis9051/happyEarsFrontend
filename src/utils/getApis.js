import axios from "axios";
import Swal from "sweetalert2"

const getProductList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-product-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
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

const getBranchList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-branch-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
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

const getSalespersonList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-salesperson-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
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

const getInvoiceList = async (currentUserInfo, svRef) => {
    axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/get-invoice-list`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
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

export { getProductList, getBranchList, getSalespersonList, getInvoiceList }