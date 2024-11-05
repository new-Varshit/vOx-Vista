import React from 'react';

function FileModal({ fileToShow, onClose }) {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50' onClick={onClose}>
      <div className="relative w-auto h-auto max-w-full max-h-full" onClick={e => e.stopPropagation()}>
        {fileToShow?.mimeType?.startsWith("image/") && (
          <img
            src={fileToShow.url}
            alt="Image Preview"
            className="w-auto h-auto max-w-full max-h-full object-contain"
          />
        )}
        {fileToShow?.mimeType?.startsWith("video/") && (
          <video
            src={fileToShow.url}
            controls
            className="w-auto h-auto max-w-full max-h-full object-contain"
          />
        )}
        {fileToShow?.mimeType?.startsWith('application/') && (
          <div className="w-full h-full bg-white rounded">
            <iframe
              src={fileToShow.url}
              frameborder="0"
              className="w-full h-full"
              style={{ height: "100vh", width: "100vw" }}
              title="Document Preview"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileModal;
