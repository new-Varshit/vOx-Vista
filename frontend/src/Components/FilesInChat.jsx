import React from 'react'

function filesInChat({ attachments, getFileIcon }) {
    return (
        <>
                 {attachments.map((attachment,index) => (
                        <div key={index} className="w-24 h-24 flex flex-col items-center flex-wrap ">

                          {/* Show preview for images and videos */}
                          {fileObj.preview && fileObj.file.type.startsWith("image/") && (
                            <img
                              src={attachment.url}
                              alt={`Preview ${index}`}
                              className="w-24 h-24 object-cover rounded-md"
                            />
                          )}
                          {fileObj.preview && fileObj.file.type.startsWith("video/") && (
                            <video
                              src={attachment.url}
                              controls
                              className="w-24 h-24 object-cover rounded-md"
                            />
                          )}


                          {/* Show file name for non-previewable files */}
                          {!fileObj.preview && (
                            <div className="w-24 h-24 text-center p-1 rounded-md text-gray-600  text-sm font-medium  bg-gray-50 flex flex-col justify-center items-center">
                              {getFileIcon(attachment.type)}
                              <p className='text-xs'>{attachment.fileName}</p>
                            </div>
                          )}
                        </div>
                      ))}
        </>
    )
}

export default filesInChat;