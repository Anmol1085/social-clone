import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaImage, FaVideo, FaTimes } from 'react-icons/fa';
import api from '../services/api';

const CreatePost = () => {
    const navigate = useNavigate();
    const [caption, setCaption] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
    const [postType, setPostType] = useState('post'); // 'post' or 'story'
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setMediaType(selectedFile.type.startsWith('video') ? 'video' : 'image');
        }
    };

    const handleUpload = async () => {
        if (!file) return alert('Please select a file');
        setLoading(true);

        try {
            // Upload Strategy: Try Local Server Upload
            // This ensures the REAL file is uploaded without needing Cloudinary keys
            
            const formData = new FormData();
            formData.append('file', file);

            // Use the generic /upload endpoint which now handles local files
            const { data: uploadData } = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            const secure_url = uploadData.url;
            const finalMediaType = uploadData.type;

            // 3. Create Post or Story in Backend
            if (postType === 'story') {
                const storyData = {
                    mediaUrl: secure_url,
                    mediaType: finalMediaType
                };
                await api.post('/stories', storyData);
                alert('Story added!');
            } else {
                const postData = {
                    caption,
                    media: [{
                        url: secure_url,
                        type: finalMediaType
                    }],
                    location: '', 
                    visibility: 'public'
                };
                await api.post('/posts', postData);
            }

            setLoading(false);
            navigate('/'); // Redirect to Home/Feed
        } catch (error) {
            console.error(error);
            alert('Upload failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-4 md:p-8 bg-white md:border border-gray-200 rounded-lg md:mt-4 shadow-sm h-[calc(100vh-80px)] md:h-auto overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-center border-b pb-4">Create new content</h2>
            
            {/* Type Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                    onClick={() => setPostType('post')}
                    className={`flex-1 py-1 text-sm font-semibold rounded-md transition-all ${postType === 'post' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                >
                    Post
                </button>
                <button 
                    onClick={() => setPostType('story')}
                    className={`flex-1 py-1 text-sm font-semibold rounded-md transition-all ${postType === 'story' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                >
                    Story
                </button>
            </div>
            
            {/* File Selection */}
            {!preview ? (
                <div 
                    className="flex flex-col items-center justify-center aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => fileInputRef.current.click()}
                >
                    <div className="text-5xl mb-4 text-gray-400 opacity-50">
                        <FaImage className="inline mr-4" />
                        <FaVideo className="inline" />
                    </div>
                    <p className="font-semibold text-lg mb-2">Drag photos and videos here</p>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                        Select from computer
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*,video/*"
                    />
                </div>
            ) : (
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4 group ring-1 ring-gray-200">
                    {mediaType === 'image' ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                        <video src={preview} controls className="w-full h-full object-contain" />
                    )}
                    <button 
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Caption & Metadata (Only for Posts) */}
            {preview && (
                <div className="mt-4 space-y-4">
                    {postType === 'post' && (
                        <>
                            <div className="flex items-start gap-3">
                                <textarea 
                                    className="w-full p-2 text-sm outline-none resize-none"
                                    rows="4"
                                    placeholder="Write a caption..."
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    autoFocus
                                ></textarea>
                            </div>
                            <div className="border-t border-gray-100"></div>
                            
                            <div className="flex justify-between items-center text-gray-700 text-sm cursor-pointer py-3 hover:bg-gray-50 rounded px-2 transition">
                                <span>Add Location</span>
                                <span>📍</span>
                            </div>
                             <div className="border-t border-gray-100"></div>
                        </>
                    )}
                    
                    <div className="pt-2">
                         <button 
                            onClick={handleUpload}
                            disabled={loading}
                            className={`
                                w-full py-3 rounded-lg font-bold transition-all
                                ${loading 
                                    ? 'bg-blue-300 cursor-not-allowed' 
                                    : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'}
                                text-white
                            `}
                        >
                            {loading ? `Sharing ${postType}...` : `Share ${postType === 'story' ? 'Story' : ''}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatePost;
