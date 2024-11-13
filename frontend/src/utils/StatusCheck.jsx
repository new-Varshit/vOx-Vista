import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCheckDouble } from '@fortawesome/free-solid-svg-icons';



function StatusCheck({msgStatus}) {
    if (msgStatus === 'read') {
        return (<FontAwesomeIcon icon={faCheckDouble} className='text-cyan-400 text-xs' />)
  
      } else if (msgStatus === 'delivered') {
        return (<FontAwesomeIcon icon={faCheckDouble} className='text-gray-300 text-xs' />)
  
      } else {
        return (<FontAwesomeIcon icon={faCheck} className='text-gray-300 text-xs' />)
      }
}

export default StatusCheck