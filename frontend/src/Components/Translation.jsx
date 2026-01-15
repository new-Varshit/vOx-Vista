import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { setTargetLanguage } from '../store/lngSlice';
import api from '../utils/Api';



function Translation() {

    const dispatch = useDispatch();

    const [languages, setLanguages] = useState([])
    const [lngMenu, setLngMenu] = useState(false);
 
    const targetLanguage = useSelector((state) => state.lng.targetLanguage);

    const setPreferLangauge = (code) =>{
        dispatch(setTargetLanguage(code));
        setLngMenu(false);
    }

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await api.get('/api/translate/getTranslateLangs', {
                    withCredentials:true
                });
                if(response.data.success){
                    const langData = response.data.langData;
                    setLanguages(Object.entries(langData));
                    console.log(langData);
                }
            } catch (error) {
                console.error('Error fetching languages:', error);
            }
        };

        fetchLanguages();
    }, []);


    return (

        <div>

        {    lngMenu     && 
            <div className='absolute left-[70%] top-[6%] flex flex-col  h-1/4 bg-gray-200 text-sm font-medium rounded-md gap-1 px-1 text-center'>
                <p className='font-bold text-lg border-b-2 border-black  bg-gray-200'>Select Language</p>
                <div className=' overflow-y-scroll text-center'>
                    {
                        languages.map(([code,language],index) => (
                            <p key={index} className='hover:bg-gray-600 hover:text-white rounded-lg cursor-pointer' onClick={()=>setPreferLangauge(code)}>{language.name}</p>
                        ))
                    }
                </div>
            </div>
}

            <div >

                <FontAwesomeIcon icon={faLanguage} onClick={targetLanguage ? ()=>dispatch(setTargetLanguage(null))  : ()=>setLngMenu(!lngMenu)} className={` ${targetLanguage ? 'text-green-600' : 'text-red-600'} text-2xl `} />

            </div>

        </div>


    )
}

export default Translation