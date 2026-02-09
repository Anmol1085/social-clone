import { useSocket } from '../../context/SocketContext';
import { FaPhoneSlash, FaVideo } from 'react-icons/fa';

const VideoCallModal = () => {
    const { 
        name, 
        callAccepted, 
        myVideo, 
        userVideo, 
        callEnded, 
        leaveCall, 
        call,
        answerCall,
        isCalling
    } = useSocket();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
            <div className="relative w-full max-w-4xl h-full md:h-[80vh] flex flex-col md:flex-row gap-4 p-4">
                
                {/* Main Video Area */}
                <div className="flex-1 relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
                    {/* My Video (Picture in Picture) */}
                    <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video bg-black rounded-lg border-2 border-white/20 overflow-hidden z-10 shadow-lg">
                        <video 
                            playsInline 
                            muted 
                            ref={myVideo} 
                            autoPlay 
                            className="w-full h-full object-cover transform scale-x-[-1]" 
                        />
                        <div className="absolute bottom-1 left-2 text-xs text-white font-bold drop-shadow-md">You</div>
                    </div>

                    {/* Remote Video */}
                    {callAccepted && !callEnded ? (
                         <video 
                            playsInline 
                            ref={userVideo} 
                            autoPlay 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="text-white text-center">
                            <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 animate-pulse"></div>
                            <h3 className="text-2xl font-bold mb-2">
                                {isCalling ? "Calling..." : "Incoming Call..."}
                            </h3>
                            <p className="text-gray-400">{call.name || name}</p>
                        </div>
                    )}
                </div>

                {/* Controls Overlay (Bottom) */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-gray-800/80 backdrop-blur-md px-8 py-4 rounded-full border border-white/10">
                   {/* Call Actions */}
                   {call.isReceivingCall && !callAccepted ? (
                       <div className="flex gap-4">
                            <button 
                                onClick={answerCall}
                                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110"
                            >
                                <FaVideo className="text-xl" />
                            </button>
                            <button 
                                onClick={leaveCall}
                                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110"
                            >
                                <FaPhoneSlash className="text-xl" />
                            </button>
                       </div>
                   ) : (
                       <button 
                            onClick={leaveCall}
                            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110"
                        >
                            <FaPhoneSlash className="text-xl" />
                       </button>
                   )}
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;
