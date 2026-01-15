import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCheckDouble } from '@fortawesome/free-solid-svg-icons';



<<<<<<< HEAD
function StatusCheck({ userId, deliveredTo = [], readBy = [], currentChatRoom }) {
  if (!currentChatRoom?.members?.length) return null;

  const norm = (v) => v?.toString?.();

  const otherMembers = currentChatRoom.members
    .map(mem => norm(mem?._id ?? mem))   // supports both object and string
    .filter(id => id && id !== norm(userId));

  const readSet = (readBy || []).map(norm);
  const deliveredSet = (deliveredTo || []).map(norm);

  if (otherMembers.length === 0) return null;

  const allRead = otherMembers.every(id => readSet.includes(id));
  const allDelivered = otherMembers.every(id => deliveredSet.includes(id));

  if (allRead) {
    return <FontAwesomeIcon icon={faCheckDouble} className="text-cyan-400 text-xs" />;
  } else if (allDelivered) {
    return <FontAwesomeIcon icon={faCheckDouble} className="text-gray-300 text-xs" />;
  } else {
    return <FontAwesomeIcon icon={faCheck} className="text-gray-300 text-xs" />;
  }
}


export default StatusCheck 
=======
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
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
