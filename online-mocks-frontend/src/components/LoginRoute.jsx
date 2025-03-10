import { Navigate } from "react-router-dom";

const LoginRoute = ({ children, adminRoute = false, hrRoute = false }) => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  if (token) {
    return (
      <Navigate
        to={
          role === "admin"
            ? "/admin-dashboard"
            : role === "hr"
            ? "/hr-dashboard"
            : "/volunteer-dashboard"
        }
      />
    );
  }
  
  return children;
};

export default LoginRoute;
