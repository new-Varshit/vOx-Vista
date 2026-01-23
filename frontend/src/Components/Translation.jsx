import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTargetLanguage } from '../store/lngSlice';
import api from '../utils/Api';

function Translation() {

    const dispatch = useDispatch();
    const menuRef = useRef(null);

    const [languages, setLanguages] = useState([])
    const [lngMenu, setLngMenu] = useState(false);

    const targetLanguage = useSelector((state) => state.lng.targetLanguage);

    const setPreferLangauge = (code) => {
        dispatch(setTargetLanguage(code));
        setLngMenu(false);
    }

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await api.get('/api/translate/getTranslateLangs', {
                    withCredentials: true
                });
                if (response.data.success) {
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

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setLngMenu(false);
            }
        };

        if (lngMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [lngMenu]);

    return (
        <div className='relative inline-block' ref={menuRef}>
            
            {/* Language Dropdown Menu - Using fixed positioning */}
            {lngMenu && (
                <>
                    {/* Backdrop for mobile */}
                    <div className='md:hidden fixed inset-0 bg-black/20 z-40' onClick={() => setLngMenu(false)} />
                    
                    {/* The actual dropdown */}
                    <div className='fixed md:absolute left-1/2 top-1/2 md:left-auto md:top-full -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:right-0 md:mt-2 w-72 md:w-64 max-h-96 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden'>
                        <p className='font-bold text-base py-3 border-b-2 border-gray-300 bg-gray-100 text-center sticky top-0'>
                            Select Language
                        </p>
                        <div className='overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100'>
                            {
                                languages.map(([code, language], index) => (
                                    <p
                                        key={index}
                                        className='px-4 py-2.5 text-sm hover:bg-anotherPrimary hover:text-white cursor-pointer transition'
                                        onClick={() => setPreferLangauge(code)}
                                    >
                                        {language.name}
                                    </p>
                                ))
                            }
                        </div>
                    </div>
                </>
            )}

            {/* Language Icon Button */}
            <button 
                onClick={targetLanguage ? () => dispatch(setTargetLanguage(null)) : () => setLngMenu(!lngMenu)}
                className='flex items-center justify-center'
                type='button'
            >
                <FontAwesomeIcon
                    icon={faLanguage}
                    className={`${targetLanguage ? 'text-green-600' : 'text-gray-400 md:text-red-600'} text-xl md:text-2xl hover:opacity-80 transition`}
                />
            </button>
        </div>
    )
}

export default Translation