import { faUser, faCommentDots, faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-30 flex justify-around items-center py-3 px-4 shadow-lg">
      
      <button 
        onClick={() => setActiveTab('chats')}
        className="flex flex-col items-center gap-1"
      >
        <FontAwesomeIcon 
          icon={faCommentDots} 
          className={`${activeTab === 'chats' ? 'text-anotherPrimary' : 'text-gray-500'} text-xl`} 
        />
        <span className={`text-xs ${activeTab === 'chats' ? 'text-anotherPrimary font-semibold' : 'text-gray-600'}`}>
          Chats
        </span>
      </button>
      
      <button 
        onClick={() => setActiveTab('profile')}
        className="flex flex-col items-center gap-1"
      >
        <FontAwesomeIcon 
          icon={faUser} 
          className={`${activeTab === 'profile' ? 'text-anotherPrimary' : 'text-gray-500'} text-xl`} 
        />
        <span className={`text-xs ${activeTab === 'profile' ? 'text-anotherPrimary font-semibold' : 'text-gray-600'}`}>
          Profile
        </span>
      </button>
      
      <button 
        onClick={() => setActiveTab('settings')}
        className="flex flex-col items-center gap-1"
      >
        <FontAwesomeIcon 
          icon={faCog} 
          className={`${activeTab === 'settings' ? 'text-anotherPrimary' : 'text-gray-500'} text-xl`} 
        />
        <span className={`text-xs ${activeTab === 'settings' ? 'text-anotherPrimary font-semibold' : 'text-gray-600'}`}>
          Settings
        </span>
      </button>
    </div>
  );
};

export default MobileBottomNav;