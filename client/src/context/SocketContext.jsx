import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    
    // Call State
    const [stream, setStream] = useState(null);
    const [me, setMe] = useState('');
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [isCalling, setIsCalling] = useState(false);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        if (user) {
            // Connect to check if env var is present, otherwise relative
            const socketUrl = import.meta.env.VITE_API_URL || undefined;
            const newSocket = io(socketUrl, { path: '/socket.io' });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                setMe(newSocket.id);
                newSocket.emit('addUser', user._id);
            });

            newSocket.on('getUsers', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('callUser', ({ from, signal, name: callerName, isVideo }) => {
                setCall({ isReceivingCall: true, from, name: callerName, signal, isVideo });
            });

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]); // Logic relies on user change to init socket

    // Media Logic
    const enableMedia = async (video = true) => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            return currentStream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
        }
    };

    const answerCall = async () => {
        setCallAccepted(true);
        const currentStream = await enableMedia(call.isVideo);

        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        currentStream.getTracks().forEach((track) => {
            peer.addTrack(track, currentStream);
        });

        peer.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    to: call.from,
                    candidate: event.candidate
                });
            }
        };

        // Handle incoming candidates
        socket.on('ice-candidate', async ({ candidate }) => {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        });

        // Set remote description
        await peer.setRemoteDescription(new RTCSessionDescription(call.signal));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit('answerCall', { 
            to: call.from, 
            signal: answer 
        });

        connectionRef.current = peer;
    };

    const callUser = async (id, isVideo = true) => {
        setIsCalling(true);
        const currentStream = await enableMedia(isVideo);

        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        currentStream.getTracks().forEach((track) => {
            peer.addTrack(track, currentStream);
        });

        peer.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                // Ideally send to specific user ID mapped from socket
                // But here we need the socket ID of the user. 
                // We'll need to update backend to map userId -> socketId and handle 'callUser' with userId.
            }
        };
        
        // Need to refactor backend to allow calling by UserID, not just SocketID
        // For now, let's assume we pass the User ID and backend finds the socket
        
        connectionRef.current = peer;
        
        // This flow is complex for raw WebRTC without a signaling helper. 
        // I'll implement the "simple" signaling flow: Offer -> Answer
        
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        
        socket.emit('callUser', {
            userToCall: id, // User ID
            signalData: offer,
            from: user._id, // My User ID
            name: user.username,
            isVideo
        });

        socket.on('callAccepted', async (signal) => {
            setCallAccepted(true);
            await peer.setRemoteDescription(new RTCSessionDescription(signal));
        });
        
        socket.on('ice-candidate', async ({ candidate }) => {
             try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        });
        
        // Listen for local candidates after offer (Trickle ICE)
         peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    to: id, // We need to send to the other user's socket
                    candidate: event.candidate,
                    isUserId: true 
                });
            }
        };
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.close();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setCallAccepted(false);
        setIsCalling(false);
        setCall({});
        
        // Notify other user?
        // socket.emit("endCall", { to: ... })
        window.location.reload(); // Quick reset for peer connection state
    };

    return (
        <SocketContext.Provider value={{
            socket,
            onlineUsers,
            stream,
            call,
            callAccepted,
            callEnded,
            me,
            myVideo,
            userVideo,
            name,
            setName,
            callUser,
            answerCall,
            leaveCall,
            isCalling
        }}>
            {children}
        </SocketContext.Provider>
    );
};
