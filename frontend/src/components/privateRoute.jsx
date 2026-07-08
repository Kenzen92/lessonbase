import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { getToken } from '../utils/tokenStorage';
import { useAuth } from '../contexts/auth_context';

const PrivateRoutes = () => {
    const auth = getToken();

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

// Gates a subtree to one role. Waits for the auth context to resolve the
// user type (it's fetched, not stored) before deciding, so a hard refresh on
// a role-scoped URL doesn't bounce a legitimate user.
export const RoleRoute = ({ allow, redirectTo = "/dashboard" }) => {
    const { auth } = useAuth();

    if (auth.isLoading) return null;
    if (auth.userType !== allow) return <Navigate to={redirectTo} replace />;
    return <Outlet />;
};

export default PrivateRoutes;