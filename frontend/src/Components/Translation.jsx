import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useState, useEffect } from 'react';


function Translation() {

    const [languages, setLanguages] = useState([]);
    const [translationMode, setTranslationMode] = useState(false);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await axios.get('https://api.cognitive.microsofttranslator.com/languages?api-version=3.0', {
                    headers: {
                        'Ocp-Apim-Subscription-Key': '56IpbygM7vdSeYPK2Rm7KtQ6XQGRrgL0TXMB4FC903FwgyCQ1FWKJQQJ99AKACGhslBXJ3w3AAAbACOGwRVX',
                    },
                });
                const langData = response.data.translation;
                setLanguages(Object.entries(langData));
                console.log(langData);
            } catch (error) {
                console.error('Error fetching languages:', error);
            }
        };

        fetchLanguages();
    }, []);


    return (

        <div>
            <div className='absolute left-0 top-0 w-1/6 h-1/5 overflow-y-scroll'>
                {
                    languages.map((language)=>(
                         <p>{language[1].name}</p>
                    ))
                }
            </div>

            <div onClick={() => setTranslationMode(!translationMode)}>

                <FontAwesomeIcon icon={faLanguage} className={` ${translationMode ? 'text-green-600' : 'text-red-600'} text-2xl `} />

            </div>

        </div>


    )
}

export default Translation