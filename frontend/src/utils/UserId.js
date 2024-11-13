import { jwtDecode } from 'jwt-decode';

const token = localStorage.getItem('token');
const decodedToken = jwtDecode(token);
const userId = decodedToken.userId;

export default userId;