import { jwtDecode } from "jwt-decode";

export const getUserId = () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const decoded = jwtDecode(token);
        return decoded?.userId || null;
    } catch (err) {
        console.error("Invalid token:", err);
        return null;
    }
};
