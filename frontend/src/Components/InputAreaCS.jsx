import React from 'react';
import { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSmile, faPaperPlane, } from '@fortawesome/free-regular-svg-icons';
import { faPaperclip, faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
import Picker from '@emoji-mart/react';
import GetFileIcon from '../utils/GetFileIcon';
import { useSelector } from 'react-redux';
import { current } from '@reduxjs/toolkit';

function InputAreaCS({
    setSelectedFiles,
    sendInputMessage,
    selectedFiles,
    sendMessage,
    setSendMessage,
    handleTyping,
    disableAttachments = false,
}) {


    const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const fileInputRef = useRef(null);
    const previewRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const speechRecognitionRef = useRef(null);
    const transcriptRef = useRef("");




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

    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            recordedChunksRef.current = [];
            transcriptRef.current = "";

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onresult = (event) => {
                    let finalText = "";
                    for (let i = 0; i < event.results.length; i += 1) {
                        finalText += event.results[i][0].transcript;
                    }
                    transcriptRef.current = finalText.trim();
                };

                recognition.onerror = () => {};
                recognition.onend = () => {};
                recognition.start();
                speechRecognitionRef.current = recognition;
            }

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
                const audioFile = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
                const preview = URL.createObjectURL(blob);
                setSelectedFiles((prev) => [...prev, { file: audioFile, preview }].slice(0, 5));
                // Use auto-captured transcript as default caption for voice notes.
                setSendMessage((prev) => (prev?.trim() ? prev : transcriptRef.current || ""));
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.log("audio recording permission error", err);
            alert("Microphone permission is required to record audio.");
        }
    };

    const stopAudioRecording = () => {
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
            speechRecognitionRef.current = null;
        }
        setIsRecording(false);
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
        <div className='w-full p-2 md:p-3'>
            <form className='flex w-full rounded-lg overflow-hidden shadow-sm' onSubmit={sendInputMessage}>

                {/* Left side - Icons */}
                <div className='flex bg-gray-300 gap-2 md:gap-4 justify-center items-center px-3 md:px-5'>
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                        <FontAwesomeIcon icon={faFaceSmile} className='text-white text-xl md:text-2xl' />
                    </button>

                    {showEmojiPicker && (
                        <div className='fixed bottom-16 left-2 right-2 md:bottom-20 md:left-4 md:right-auto z-50 max-w-xs md:max-w-sm'>
                            <Picker
                                onEmojiSelect={addEmoji}
                                width="100%"
                                height={window.innerWidth < 768 ? "300px" : "400px"}
                                previewConfig={{ showPreview: false }}
                                skinTonesDisabled={window.innerWidth < 768}
                                searchDisabled={window.innerWidth < 768}
                                theme="light"
                            />
                        </div>
                    )}

                    {!disableAttachments && (
                        <button type="button" onClick={handleClipClick}>
                            <FontAwesomeIcon icon={faPaperclip} className='text-white text-xl md:text-2xl' />
                        </button>
                    )}

                    {!disableAttachments && (
                        <button
                            type="button"
                            onClick={isRecording ? stopAudioRecording : startAudioRecording}
                            title={isRecording ? "Stop recording" : "Record audio message"}
                        >
                            <FontAwesomeIcon
                                icon={isRecording ? faStop : faMicrophone}
                                className={`text-xl md:text-2xl ${isRecording ? 'text-red-500' : 'text-white'}`}
                            />
                        </button>
                    )}

                    <input
                        type="file"
                        className='hidden'
                        multiple
                        accept='*'
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    {selectedFiles.length > 0 && (
                        <div className='fixed bottom-16 left-2 right-2 md:bottom-20 md:left-4 md:right-auto md:max-w-lg bg-gray-200 border-2 border-black rounded-lg p-3 md:p-4 z-50 max-h-[60vh] overflow-y-auto'>
                            <div className='flex justify-between items-center mb-3'>
                                <p className='font-medium text-sm'>
                                    {selectedFiles.length === 1 ? 'Selected item' : `Selected items (${selectedFiles.length})`}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFiles([])}
                                    className='text-red-500 text-sm font-medium'
                                >
                                    Clear
                                </button>
                            </div>

                            <div className={`grid gap-3 ${selectedFiles.length === 1 ? 'grid-cols-2' :
                                selectedFiles.length === 2 ? 'grid-cols-2' :
                                    'grid-cols-3'
                                }`}>
                                {selectedFiles.map((fileObj, index) => (
                                    <div key={index} className="w-full aspect-square flex flex-col items-center">
                                        {fileObj.preview && fileObj.file.type.startsWith("image/") && (
                                            <img
                                                src={fileObj.preview}
                                                alt={`Preview ${index}`}
                                                className="w-full h-full object-cover rounded-md"
                                            />
                                        )}
                                        {fileObj.preview && fileObj.file.type.startsWith("video/") && (
                                            <video
                                                src={fileObj.preview}
                                                controls
                                                className="w-full h-full object-cover rounded-md"
                                            />
                                        )}
                                        {fileObj.preview && fileObj.file.type.startsWith("audio/") && (
                                            <audio src={fileObj.preview} controls className="w-full mt-2" />
                                        )}
                                        {!fileObj.preview && (
                                            <div className="w-full h-full text-center p-2 rounded-md text-gray-600 text-xs font-medium bg-gray-50 flex flex-col justify-center items-center">
                                                <GetFileIcon fileType={fileObj.file.type} />
                                                <p className='text-xs truncate w-full'>{fileObj.file.name}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input field */}
                <input
                    disabled={currentChatRoom?.isAllowed === false}
                    className='flex-1 py-3 md:py-4 px-2 md:px-3 focus:outline-none bg-gray-300 text-sm'
                    type='text'
                    placeholder={selectedFiles.length > 0 ? 'Caption (optional)' : 'Type a message...'}
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    onInput={handleTyping}
                />

                {/* Send button */}
                <button type='submit' className='px-3 md:px-5 bg-gray-300 flex justify-center items-center'>
                    <FontAwesomeIcon icon={faPaperPlane} className='text-anotherPrimary text-xl md:text-3xl' />
                </button>
            </form>
        </div>
    )
}

export default InputAreaCS