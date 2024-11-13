import React from 'react';
import { useRef,useState,useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSmile, faPaperPlane, } from '@fortawesome/free-regular-svg-icons';
import { faPaperclip,  } from '@fortawesome/free-solid-svg-icons';
import Picker from '@emoji-mart/react';
import GetFileIcon from '../utils/GetFileIcon';


function InputAreaCS({
    setSelectedFiles,
    sendInputMessage,
    selectedFiles,
    sendMessage,
    setSendMessage,
    handleTyping,
}) {

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const fileInputRef = useRef(null);
    const previewRef = useRef(null);




    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        let validFiles = []
    
        for (let file of files) {
          if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} exceeds the size limit of 5 MB`);
            continue;
          }
          if (validFiles.length >= 5) {
            alert(`You can select up to 5 files`);
            break;
          }
          validFiles.push(file);
        }
    
        const filePreviews = validFiles.map((file) => {
          console.log(file);
          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            return { file, preview: URL.createObjectURL(file) }
          } else {
            return { file, preview: null }
          }
        })
        setSelectedFiles(filePreviews);
        console.log(filePreviews);
      };
    


    const addEmoji = (emoji) => {
        setSendMessage(sendMessage + emoji.native); 
      };

    const handleClipClick = () => {
        fileInputRef.current.click();  
      };


      useEffect(() => {
        const handleClickOutside = (event) => {
          if (previewRef.current && !previewRef.current.contains(event.target)) {
            setSelectedFiles([]);
          }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside)
        }
    
      }, [previewRef]);

    return (
        <div className='w-[97%] ml-3 bottom-2 flex rounded-lg overflow-hidden ' ref={previewRef}>
            <form className='flex w-full' onSubmit={sendInputMessage}>
                <div className='flex bg-gray-300 gap-4 justify-center items-center px-5'>

                    <FontAwesomeIcon icon={faFaceSmile} className='text-white text-2xl' onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                    {showEmojiPicker &&
                        (<div className='absolute bottom-[8%] left-[2%]'>
                            <Picker onEmojiSelect={addEmoji} />
                        </div>)}
                    <FontAwesomeIcon icon={faPaperclip} className='text-white text-2xl' onClick={handleClipClick} />
                    <input type="file" className='hidden' multiple accept='*' ref={fileInputRef} onChange={handleFileChange}
                    />
                    {selectedFiles.length > 0 &&
                        (<div className='absolute flex flex-col p-4  bg-gray-200 border-black border-2 left-[2%] bottom-[8%] ' >
                            <p className='font-medium text-sm'>{selectedFiles.length === 1 ? `Selected item...` : `Selected items(${selectedFiles.length})`}</p>
                            <div className={`grid ${selectedFiles.length === 1
                                ? 'grid-cols-1'
                                : selectedFiles.length === 2
                                    ? 'grid-cols-2'
                                    : selectedFiles.length === 3
                                        ? 'grid-cols-3'
                                        : selectedFiles.length === 4
                                            ? 'grid-cols-4'
                                            : 'grid-cols-5'}  gap-4 mt-4`}>
                                {selectedFiles.map((fileObj, index) => (
                                    <div key={index} className="w-24 h-24 flex flex-col items-center flex-wrap ">

                                        {/* Show preview for images and videos */}
                                        {fileObj.preview && fileObj.file.type.startsWith("image/") && (
                                            <img
                                                src={fileObj.preview}
                                                alt={`Preview ${index}`}
                                                className="w-24 h-24 object-cover rounded-md"
                                            />
                                        )}
                                        {fileObj.preview && fileObj.file.type.startsWith("video/") && (
                                            <video
                                                src={fileObj.preview}
                                                controls
                                                className="w-24 h-24 object-cover rounded-md"
                                            />
                                        )}


                                        {/* Show file name for non-previewable files */}
                                        {!fileObj.preview && (
                                            <div className="w-24 h-24 text-center p-1 rounded-md text-gray-600  text-sm font-medium  bg-gray-50 flex flex-col justify-center items-center">
                                                <GetFileIcon fileType={fileObj.file.type}/>
                                                <p className='text-xs'>{fileObj.file.name}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>)}
                </div>

                <input
                    className='w-full py-4 px-2 focus:outline-none bg-gray-300'
                    type='text'
                    placeholder={selectedFiles.length > 0 ? 'Add caption here (optional)' : 'Type a message...'}
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    onInput={handleTyping}
                />

                <button type='submit' className='px-5 bg-gray-300 flex justify-center items-center'>
                    <FontAwesomeIcon icon={faPaperPlane} className='text-anotherPrimary text-3xl' />
                </button>
            </form>
        </div>
    )
}

export default InputAreaCS