import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';

const PrivateRoutes = () => {
    const auth = window.sessionStorage.getItem("token");

    // Define routes that are allowed for unauthorized users
    const allowedRoutes = ["/login", "/signup"];

    // Check if the current route is allowed for unauthorized users
    const isRouteAllowed = allowedRoutes.includes(window.location.pathname);

    // If the user is unauthorized and the route is not allowed, navigate to login
    if (!auth && !isRouteAllowed) {
        return <Navigate to="/login" />;
    }

    // If the user is authorized or the route is allowed, render the outlet
    return <Outlet />;
};

export default PrivateRoutes;