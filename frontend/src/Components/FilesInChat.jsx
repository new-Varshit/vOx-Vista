import React from 'react'
import { useState } from 'react';
import FileModal from './FileModal';
import GetFileIcon from '../utils/GetFileIcon';

function filesInChat({ attachments }) {

  const [fileToShow, setFileToShow] = useState(null);

  return (
    <>
      <div className='flex gap-2 flex-wrap'>
        {attachments?.map((attachment, index) => (
          <div
            key={index}
            className={`${attachment?.mimeType?.startsWith("audio/") ? "w-full" : "w-24 h-24"} flex flex-col items-center`}
            onClick={() => setFileToShow(attachment)}
          >

            {/* Show preview for images and videos */}
            {attachment?.mimeType?.startsWith("image/") && (
              <img
                src={attachment.url}
                alt={`Preview ${index}`}
                className="w-24 h-24 object-cover rounded-md "
              />
            )}
            {attachment?.mimeType?.startsWith("video/") && (
              <video
                src={attachment.url}
                controls
                className="w-24 h-24 object-cover rounded-md"
              />
            )}
            {attachment?.mimeType?.startsWith("audio/") && (
              <div className="w-full max-w-[280px] rounded-xl border border-gray-300 bg-white shadow-sm px-2 py-1">
                <audio
                  src={attachment.url}
                  controls
                  className="w-full h-9"
                />
              </div>
            )}
            {/* Show file name for non-previewable files */}
            {attachment?.mimeType?.startsWith('application/') && (
              <div className="w-24 h-24 text-center p-1 rounded-md text-gray-600  text-sm font-medium  bg-gray-50 flex flex-col justify-center items-center">
                <GetFileIcon fileType={attachment?.mimeType}/>
                <p className='text-xs'>{attachment?.fileName}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {fileToShow && (
        <FileModal fileToShow={fileToShow}   onClose={() => setFileToShow(null)}/>
      )}

    </>
  )
}

export default filesInChat;