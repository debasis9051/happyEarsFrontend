import axios from "axios";
import Swal from "sweetalert2"

const listRequestBody = (url, currentUserInfo, svRef) => {
    return axios.post(`${process.env.REACT_APP_BACKEND_ORIGIN}/${url}`, { current_user_uid: currentUserInfo.uid, current_user_name: currentUserInfo.displayName }, { headers: { 'Content-Type': 'application/json' } })
        .then((res) => {
            if (res.data.operation === "success") {
                svRef(res.data.info)
            }
            else {
                console.log(res.data.message, `/${url}`);
            }
        })
        .catch((err) => {
            console.log(err)
            Swal.fire('Error!!', err.message, 'error');
        })
}

const getProductList = (currentUserInfo, svRef) => listRequestBody("get-product-list", currentUserInfo, svRef)
const getBranchList = (currentUserInfo, svRef) => listRequestBody("get-branch-list", currentUserInfo, svRef)
const getSalespersonList = (currentUserInfo, svRef) => listRequestBody("get-salesperson-list", currentUserInfo, svRef)
const getInvoiceList = (currentUserInfo, svRef) => listRequestBody("get-invoice-list", currentUserInfo, svRef)
const getAudiometryList = (currentUserInfo, svRef) => listRequestBody("get-audiometry-list", currentUserInfo, svRef)
const getDoctorList = (currentUserInfo, svRef) => listRequestBody("get-doctor-list", currentUserInfo, svRef)
const getUserList = (currentUserInfo, svRef) => listRequestBody("get-user-list", currentUserInfo, svRef)
const getPatientList = (currentUserInfo, svRef) => listRequestBody("get-patient-list", currentUserInfo, svRef)
const getServiceList = (currentUserInfo, svRef) => listRequestBody("get-service-list", currentUserInfo, svRef)

export { getProductList, getBranchList, getSalespersonList, getInvoiceList, getAudiometryList, getDoctorList, getUserList, getPatientList, getServiceList }