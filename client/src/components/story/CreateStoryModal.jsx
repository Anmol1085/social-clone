import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCamera, FaAt } from 'react-icons/fa';
import api from '../../services/api';

const CreateStoryModal = ({ onClose, onStoryCreated }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [mediaType, setMediaType] = useState('image');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef();

    // Mention State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [mentions, setMentions] = useState([]); // Array of { user, x, y }
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                try {
                    const { data } = await api.get(`/users/search?q=${searchQuery}`);
                    setSearchResults(data);
                } catch (error) {
                    console.error("Search failed", error);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(searchTimer);
    }, [searchQuery]);

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        if (selected.size > 25 * 1024 * 1024) {
             alert("File size too large (max 25MB)");
             return;
        }

        setFile(selected);
        setMediaType(selected.type.startsWith('video') ? 'video' : 'image');
        
        const reader = new FileReader();
        reader.onloadend = () => {
             setPreview(reader.result);
        };
        reader.readAsDataURL(selected);
    };

    const handleAddMention = (user) => {
        // Add mention to center for now, could be draggable later
        const newMention = {
            user: user._id,
            username: user.username, // For display
            x: 0.5,
            y: 0.5
        };
        setMentions([...mentions, newMention]);
        setIsSearching(false);
        setSearchQuery('');
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        try {
            // 1. Upload to Cloudinary via backend upload route
            const formData = new FormData();
            formData.append('file', file);
            
            const { data: uploadData } = await api.post('/upload', formData, {
                 headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Create Story
            await api.post('/stories', {
                mediaUrl: uploadData.url,
                mediaType: uploadData.type,
                mentions: mentions.map(m => ({ user: m.user, x: m.x, y: m.y }))
            });

            onStoryCreated(); // Refresh stories
            onClose();

        } catch (error) {
            console.error("Story upload failed", error);
            alert("Failed to create story");
        }
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative w-full max-w-sm h-full md:h-auto bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                 <div className="p-4 flex justify-between items-center text-white border-b border-gray-800">
                     <h3 className="font-bold">Add to Your Story</h3>
                     <button onClick={onClose}><FaTimes className="text-xl" /></button>
                 </div>

                 {/* Content */}
                 <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[400px] bg-black relative overflow-hidden">
                     {preview ? (
                         <>
                            {mediaType === 'video' ? (
                                <video src={preview} controls className="max-h-[60vh] object-contain" />
                            ) : (
                                <img src={preview} alt="preview" className="max-h-[60vh] object-contain" />
                            )}
                            
                            {/* Mentions Overlay */}
                            {mentions.map((m, idx) => (
                                <div 
                                    key={idx}
                                    style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white text-black px-2 py-1 rounded-md text-sm font-bold shadow-lg cursor-move"
                                >
                                    @{m.username}
                                </div>
                            ))}

                            {/* Tools Overlay */}
                            <div className="absolute top-4 right-4 flex flex-col gap-4">
                                <button 
                                    onClick={() => setIsSearching(true)}
                                    className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                                >
                                    <FaAt />
                                </button>
                            </div>
                         </>
                     ) : (
                         <div className="text-center text-gray-400">
                             <div 
                                onClick={() => fileInputRef.current.click()}
                                className="w-20 h-20 rounded-full border-2 border-gray-600 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:border-white transition-colors"
                             >
                                 <FaCamera className="text-3xl" />
                             </div>
                             <p>Click to select photo or video</p>
                         </div>
                     )}

                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        accept="image/*,video/*"
                     />
                 </div>

                 {/* User Search Overlay */}
                 {isSearching && (
                     <div className="absolute inset-x-0 bottom-0 top-16 bg-gray-900/95 z-20 flex flex-col animate-in slide-in-from-bottom">
                         <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                            <FaAt className="text-gray-400" />
                            <input 
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Mention user..."
                                className="bg-transparent text-white outline-none flex-1"
                            />
                            <button onClick={() => setIsSearching(false)} className="text-gray-400">Cancel</button>
                         </div>
                         <div className="flex-1 overflow-y-auto p-4 space-y-2">
                             {searchResults.map(user => (
                                 <div 
                                    key={user._id} 
                                    onClick={() => handleAddMention(user)}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded cursor-pointer text-white"
                                 >
                                    <img src={user.avatar} className="w-8 h-8 rounded-full" />
                                    <span>{user.username}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* Footer */}
                 <div className="p-4 border-t border-gray-800 flex justify-end">
                     {preview && (
                         <button 
                            onClick={handleUpload} 
                            disabled={uploading}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
                         >
                             {uploading ? 'Sharing...' : 'Share to Story'}
                         </button>
                     )}
                 </div>
            </div>
        </div>
    );
};

export default CreateStoryModal;
