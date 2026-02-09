import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext'; // Use global socket
import { FaPaperPlane, FaEdit, FaImage } from 'react-icons/fa';
import NewMessageModal from '../components/messages/NewMessageModal';
import { useLocation, Link } from 'react-router-dom';
import { importKey, deriveSharedKey, encryptMessage, decryptMessage } from '../utils/e2ee';

// Decrypted Message Component
const DecryptedMessage = ({ text, iv, sharedKey, isSender }) => {
    const [content, setContent] = useState('');
    const [decrypted, setDecrypted] = useState(false);

    useEffect(() => {
        if (!iv || !sharedKey) {
            setContent(text);
            setDecrypted(true);
            return;
        }
        
        const decrypt = async () => {
             try {
                 const decrypted = await decryptMessage(sharedKey, text, iv);
                 setContent(decrypted);
             } catch (e) {
                 setContent("**Failed to decrypt**");
             }
             setDecrypted(true);
        };
        decrypt();
    }, [text, iv, sharedKey]);

    if (!decrypted) return <span className="text-xs opacity-50">Decrypting...</span>;
    return <p>{content}</p>;
};

const Messages = () => {
    const { user } = useAuth();
    const { socket, callUser } = useSocket(); // Get callUser
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [arrivalMessage, setArrivalMessage] = useState(null);
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    
    // E2EE State
    const [sharedKey, setSharedKey] = useState(null);

    // Remove local socket ref
    const scrollRef = useRef();

    // Check if we were redirected with a specific user to chat with
    useEffect(() => {
        if (location.state?.startChatWith) {
             const initChat = async () => {
                 try {
                     const { data } = await api.post('/messages/conversation', { userId: location.state.startChatWith._id });
                     // Add to conversations if not present
                     setConversations(prev => {
                         if (!prev.find(c => c._id === data._id)) {
                             return [data, ...prev];
                         }
                         return prev;
                     });
                     setCurrentChat(data);
                     // Clear state
                     window.history.replaceState({}, document.title);
                 } catch (error) {
                     console.error("Failed to start chat", error);
                 }
             };
             initChat();
        }
    }, [location.state]);

    useEffect(() => {
        if (!socket) return;
        socket.on("getMessage", (data) => {
            setArrivalMessage({
                sender: data.senderId,
                text: data.text,
                media: data.media,
                type: data.type,
                iv: data.iv,
                createdAt: Date.now(),
            });
        });
    }, [socket]);

    useEffect(() => {
        arrivalMessage &&
            currentChat?.members.some(m => m._id === arrivalMessage.sender) &&
            setMessages((prev) => [...prev, arrivalMessage]);
    }, [arrivalMessage, currentChat]);

    // Derive Shared Key when Chat Changes
    useEffect(() => {
         const prepareEncryption = async () => {
             if (!currentChat || !user) return;
             
             // Find other user
             const otherUser = currentChat.members.find(m => m._id !== user._id);
             if (!otherUser || !otherUser.publicKey) {
                 console.warn("No public key for recipient, encryption disabled or degraded.");
                 setSharedKey(null);
                 return;
             }

             try {
                 // Get my private key
                 const privateKeyJwkStr = localStorage.getItem('privateKey');
                 if (!privateKeyJwkStr) {
                     console.error("My private key not found");
                     return;
                 }
                 const privateKey = await importKey(JSON.parse(privateKeyJwkStr), 'private');
                 const publicKey = await importKey(JSON.parse(otherUser.publicKey), 'public');
                 const derived = await deriveSharedKey(privateKey, publicKey);
                 setSharedKey(derived);
             } catch (error) {
                 console.error("Failed to derive shared key", error);
             }
         };
         prepareEncryption();
    }, [currentChat, user]);


    useEffect(() => {
        const getConversations = async () => {
            try {
                const { data } = await api.get("/messages/conversations");
                setConversations(data);
            } catch (err) {
                console.log(err);
            }
        };
        if (user?._id) getConversations();
    }, [user._id]);

    useEffect(() => {
        const getMessages = async () => {
             if (currentChat) {
                try {
                    const { data } = await api.get(`/messages/${currentChat._id}`);
                    setMessages(data);
                } catch (err) {
                    console.log(err);
                }
            }
        };
        getMessages();
    }, [currentChat]);

    // State for media upload
    const [file, setFile] = useState(null);
    const fileInputRef = useRef();
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        
        // Size validation (25MB = 25 * 1024 * 1024)
        if (selected.size > 25 * 1024 * 1024) {
            alert("File size too large! Please select a file under 25MB.");
            return;
        }
        setFile(selected);
    };

    const handleUploadAndSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !file) return;
        
        let mediaUrl = '';
        let mediaType = 'text';

        if (file) {
            setUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const { data } = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                mediaUrl = data.url;
                mediaType = data.type; // 'image' or 'video'
            } catch (error) {
                console.error("Upload failed", error);
                alert("Failed to upload file.");
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        // Encrypt Text if Key Available
        let textToSend = newMessage;
        let ivToSend = null;

        if (newMessage && sharedKey) {
             try {
                 const encrypted = await encryptMessage(sharedKey, newMessage);
                 textToSend = encrypted.ciphertext;
                 ivToSend = encrypted.iv;
             } catch (error) {
                 console.error("Encryption failed", error);
                 alert("Failed to encrypt message.");
                 return;
             }
        }

        const messageData = {
            sender: user._id,
            text: textToSend,
            conversationId: currentChat._id,
            media: mediaUrl,
            type: mediaType,
            iv: ivToSend
        };

        const receiverId = currentChat.members.find(member => member._id !== user._id)._id;

        // Emit through socket
        socket.emit("sendMessage", {
            senderId: user._id,
            receiverId,
            text: textToSend,
            media: mediaUrl,
            type: mediaType,
            iv: ivToSend
        });

        // Save to DB
        try {
            const { data } = await api.post("/messages", messageData);
            setMessages([...messages, data]);
            setNewMessage("");
            setFile(null);
        } catch (err) {
            console.log(err);
        }
    };

    const handleNewChat = async (selectedUser) => {
        setShowNewMessageModal(false);
        try {
             const { data } = await api.post('/messages/conversation', { userId: selectedUser._id });
             
             // Check if conversation already exists in list
             const exists = conversations.find(c => c._id === data._id);
             if (!exists) {
                 setConversations([data, ...conversations]);
             }
             setCurrentChat(data);
        } catch (error) {
            console.error("Failed to create conversation", error);
        }
    };

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-screen w-full max-w-5xl mx-auto border border-gray-800 bg-black text-white shadow-sm md:my-4 rounded-lg overflow-hidden relative">
            {/* Sidebar / Conversation List */}
            <div className={`w-full md:w-1/3 border-r border-gray-800 flex flex-col ${currentChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                    <span className="font-bold text-lg">{user?.username} <span className="text-sm font-normal text-gray-500">▼</span></span>
                    <button onClick={() => setShowNewMessageModal(true)} className="text-2xl">
                        <FaEdit />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversations.map((c) => {
                         const friend = c.members.find((m) => m._id !== user._id);
                         return (
                            <div 
                                key={c._id} 
                                onClick={() => setCurrentChat(c)}
                                className={`flex items-center gap-3 p-3 hover:bg-gray-900 cursor-pointer ${currentChat?._id === c._id ? 'bg-gray-800' : ''}`}
                            >
                                <img 
                                    className="w-12 h-12 rounded-full object-cover border border-gray-700" 
                                    src={friend?.avatar || "https://i.pravatar.cc/150"} 
                                    alt="" 
                                />
                                <div>
                                    <span className="font-semibold block">{friend?.username}</span>
                                    <span className="text-sm text-gray-500">Active now</span>
                                </div>
                            </div>
                         )
                    })}
                </div>
            </div>

            {/* Chat Box */}
            <div className={`w-full md:w-2/3 flex flex-col ${!currentChat ? 'hidden md:flex' : 'flex'}`}>
                {currentChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-gray-900">
                            <button onClick={() => setCurrentChat(null)} className="md:hidden text-2xl">←</button>
                            <Link to={`/profile/${currentChat.members.find(m => m._id !== user._id)?.username}`} className="flex items-center gap-3 hover:opacity-80">
                                <img 
                                    className="w-8 h-8 rounded-full object-cover border border-gray-100" 
                                    src={currentChat.members.find(m => m._id !== user._id)?.avatar} 
                                    alt="" 
                                />
                                <span className="font-bold">{currentChat.members.find(m => m._id !== user._id)?.username}</span>
                            </Link>
                            {sharedKey ? (
                                <span className="text-green-500 text-xs border border-green-500 px-2 py-0.5 rounded-full">E2EE Encrypted</span>
                            ) : (
                                <span className="text-gray-400 text-xs border border-gray-400 px-2 py-0.5 rounded-full">Unencrypted</span>
                            )}
                            <div className="ml-auto flex items-center gap-4">
                                <button onClick={() => callUser(currentChat.members.find(m => m._id !== user._id)?._id)} className="text-2xl text-blue-500 hover:text-blue-600">
                                    📹
                                </button>
                                <Link to={`/profile/${currentChat.members.find(m => m._id !== user._id)?.username}`} className="text-2xl text-gray-400 hover:text-gray-600">
                                    ℹ️
                                </Link>
                            </div>
                        </div>
                        
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-black">
                            {messages.map((m, index) => (
                                <div key={index} ref={scrollRef} className={`flex ${m.sender === user._id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[70%] px-4 py-2 rounded-2xl text-sm
                                        ${m.sender === user._id 
                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                            : 'bg-gray-800 text-white rounded-bl-none'}
                                    `}>
                                        {m.media && (
                                           <div className={`mb-2 rounded-lg overflow-hidden ${m.type === 'video' ? 'w-64 aspect-video' : 'w-48'}`}>
                                               {m.type === 'video' ? (
                                                   <video src={m.media} controls className="w-full h-full object-cover" />
                                               ) : (
                                                   <img src={m.media} alt="attachment" className="w-full object-cover" />
                                               )}
                                           </div> 
                                        )}
                                        {m.text && (
                                            <DecryptedMessage 
                                                text={m.text} 
                                                iv={m.iv} 
                                                sharedKey={sharedKey}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-800 bg-gray-900">
                            <form className="flex items-center gap-2 border border-gray-700 rounded-full px-4 py-2 bg-black" onSubmit={handleUploadAndSend}>
                                <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-blue-500 text-xl" disabled={uploading}>
                                    <FaImage />
                                </button>
                                <input 
                                    className="flex-1 outline-none bg-transparent text-white placeholder-gray-500"  
                                    placeholder="Message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={uploading}
                                />
                                {(newMessage || file) && (
                                    <button type="submit" className="text-blue-500 text-lg font-semibold" disabled={uploading}>
                                        {uploading ? '...' : 'Send'}
                                    </button>
                                )}
                            </form>
                            
                            {/* File Preview */}
                            {file && (
                                <div className="absolute bottom-20 left-4 bg-gray-100 p-2 rounded-lg flex items-center gap-2 border border-blue-200">
                                    <span className="text-xs font-bold truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => setFile(null)} className="text-red-500 font-bold">×</button>
                                </div>
                            )}

                             {/* Hidden Input */}
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileSelect} 
                                className="hidden" 
                                accept="image/*,video/*"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="text-6xl mb-4">📨</div>
                        <h2 className="text-xl font-light mb-2">Your Messages</h2>
                        <p className="text-gray-500 mb-4">Send private photos and messages to a friend.</p>
                        <button 
                            onClick={() => setShowNewMessageModal(true)}
                            className="bg-blue-500 text-white px-4 py-1.5 rounded font-semibold text-sm hover:bg-blue-600 transition-colors"
                        >
                            Send Message
                        </button>
                    </div>
                )}
            </div>

            {/* New Message Modal */}
            {showNewMessageModal && (
                <NewMessageModal 
                    onClose={() => setShowNewMessageModal(false)}
                    onSelectUser={handleNewChat}
                />
            )}
        </div>
    );
};

export default Messages;
