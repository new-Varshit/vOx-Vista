import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePowerpoint } from '@fortawesome/free-regular-svg-icons';
import { faFilePdf, faFileWord, faFileExcel, faFileAlt } from '@fortawesome/free-solid-svg-icons';

function GetFileIcon({ fileType }) {
    if (fileType.includes("pdf")) return (<FontAwesomeIcon icon={faFilePdf} className='text-3xl ' style={{ color: '#FF0000' }} />)
    if (fileType.includes("word")) return (<FontAwesomeIcon icon={faFileWord} className='text-3xl ' style={{ color: '#2B579A' }} />)
    if (fileType.includes("excel")) return (<FontAwesomeIcon icon={faFileExcel} className='text-3xl ' style={{ color: '#217346' }} />)
    if (fileType.includes("ppt") || fileType.endsWith(".pptx")) retrun(<FontAwesomeIcon icon={faFilePowerpoint} className='text-3xl ' style={{ color: '#217346' }} />)
    return (<FontAwesomeIcon icon={faFileAlt} className='text-3xl' style={{ color: '#6B7280' }} />)
}

export default GetFileIcon;