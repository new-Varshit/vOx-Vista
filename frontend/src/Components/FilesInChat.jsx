import React from 'react'

function filesInChat({ attachments, getFileIcon }) {
    return (
        <div className='flex gap-2'>
                 {attachments?.map((attachment,index) => (
                        <div key={index} className="w-24 h-24 flex flex-col items-center flex-wrap ">

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
                          {/* Show file name for non-previewable files */}
                          {attachment?.mimeType?.startsWith('application/')&& (
                            <div className="w-24 h-24 text-center p-1 rounded-md text-gray-600  text-sm font-medium  bg-gray-50 flex flex-col justify-center items-center">
                              {getFileIcon(attachment.mimeType)}
                              <p className='text-xs'>{attachment?.fileName}</p>
                            </div>
                          )}
                        </div>
                      ))}
        </div>
    )
}

export default filesInChat;