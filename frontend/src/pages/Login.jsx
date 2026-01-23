import React from 'react'
import loginImage from '../assets/tabletLogin.jpg';
import api from '../utils/Api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [message, setMessage] = useState("")
    const [formData, setFormData] = useState({
        userName: "",
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/login', formData, {
                headers: { "Content-Type": "application/json" },
                withCredentials:true
            })
            if (response.data.success) {
                localStorage.setItem('token',response.data.token);
                   navigate('/');
            }
        } catch (err) {
            console.log(err);
            setMessage(err.response?.data?.message || "An error occurred");
        }
    }



    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl flex flex-col md:flex-row gap-6 p-6 shadow-xl border border-gray-100">
                <div className="w-full md:w-1/2 flex justify-center items-center">
                    <img className="w-full max-w-sm object-contain" src={loginImage} alt="Login illustration" />
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-center items-center gap-3 p-2">
                    <p className="text-center font-bold text-2xl">Login to Your Account</p>
                    {message && (
                        <p className="font-semibold text-sm text-red-600 text-center px-2">
                            {message}
                        </p>
                    )}
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 w-full max-w-sm"
                    >
                        <div className="flex flex-col gap-1">
                            <label htmlFor="email" className="font-semibold">Email :</label>
                            <input
                                type="email"
                                className="w-full text-sm p-2 rounded-md border focus:outline-none"
                                id="email"
                                name="email"
                                placeholder="Your email ..."
                                onChange={handleChange}
                                value={formData.email}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="password" className="font-semibold">Password :</label>
                            <input
                                type="password"
                                className="w-full text-sm p-2 rounded-md border focus:outline-none"
                                id="password"
                                name="password"
                                placeholder="Your password ..."
                                onChange={handleChange}
                                value={formData.password}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-700 font-semibold text-sm text-white py-2 mt-3 px-2 rounded-md hover:bg-blue-900 w-full"
                        >
                            Login
                        </button>
                    </form>
                    <div className="text-sm mt-2">
                        <p>
                            Don't have an account ?{" "}
                            <a className="text-blue-700 hover:underline" href="/signup">
                                Signup
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login