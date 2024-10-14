import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate }  from 'react-router-dom';
import signupImage from '../assets/register.jpg';
import api from '../utils/Api';

function Signup() {
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
        console.log(formData);
        try {
            const response = await api.post('/api/auth/signup', formData, {
                headers: {"Content-Type" : "application/json"},
                withCredentials:true
            })
            console.log('bye');
            if (response.data.success) {
                console.log(response.data.message);
                 navigate('/login');
            }
        } catch (err) {
            console.log(err);
            setMessage(err.response?.data?.message || "An error occurred"); }
    }




    return (
        <div className=' h-screen flex justify-center items-center'>
            <div className='bg-white w-2/3 rounded-2xl flex flex-col gap-4 p-4 border border-gray-100 shadow-xl' >
                <div>
                    <p className='text-center font-bold text-2xl'>Create a new Vox-Vista account</p>
                </div>

                <div className='flex'>
                    <div className='w-1/2 flex justify-center items-center '>
                        <img className='w-full ' src={signupImage} alt="error" />
                    </div>

                    <div className='w-1/2 flex flex-col justify-center items-center gap-2 p-2  '>

                        {
                        message && (<p className='font-semibold text-sm text-red-600 text-center'>{message}</p>
                        )}
                        <form className='flex flex-col gap-4  w-3/4' onSubmit={handleSubmit}>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor="userName" className='font-semibold '>Username :</label>
                                <input type="text" className='w-full text-sm px-2 py-2 rounded-md border  focus:outline-none' onChange={handleChange} value={formData.userName} id='userName' name='userName' placeholder=' Your username ...' required/>
                            </div>
                            <div className='flex flex-col gap-1 '>
                                <label htmlFor="email" className='font-semibold '>Email :</label>
                                <input type="email" className='w-full text-sm p-2 rounded-md border  focus:outline-none' onChange={handleChange} value={formData.email} id='email' name='email' placeholder=' Your email ...' required/>
                            </div>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor="password" className='font-semibold '>Password :</label>
                                <input type="password" className='w-full  text-sm p-2  rounded-md border  focus:outline-none' onChange={handleChange} value={formData.password} id='password' name='password' placeholder=' Your password ...' required/>
                            </div>
                            <button type='submit' className='bg-blue-700 font-semibold text-sm text-white py-2 mt-3 px-2 rounded-md hover:bg-blue-900'>Signup</button>
                        </form>
                        <div className='text-sm'>
                            <p>Already have an account ? <a className='text-blue-700 hover:underline' href="/login">Login</a></p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}

export default Signup