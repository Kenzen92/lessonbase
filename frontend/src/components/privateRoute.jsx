import { Outlet, Navigate } from 'react-router-dom'

const PrivateRoutes = () => {
    let auth =  window.sessionStorage.getItem("Token")
    return(
        auth ? <Outlet/> : <Navigate to="/login"/>
    )
}

export default PrivateRoutes