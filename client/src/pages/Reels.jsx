import { useState, useEffect } from 'react';
import api from '../services/api';
import { FaHeart, FaComment } from 'react-icons/fa';

const Reels = () => {
    // Placeholder for video-only feed
    // Ideally filter posts by mediaType == 'video'
    const [reels, setReels] = useState([]);

    useEffect(() => {
        const fetchReels = async () => {
             try {
                 const { data } = await api.get('/posts/feed');
                 // Filter for videos (client-side for now)
                 const videos = data.filter(p => p.media && p.media.some(m => m.type === 'video'));
                 setReels(videos);
             } catch (error) {
                 console.error(error);
             }
        };
        fetchReels();
    }, []);

    return (
        <div className="max-w-md mx-auto h-[calc(100vh-80px)] md:h-screen overflow-y-scroll snap-y snap-mandatory bg-black">
            {reels.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white">
                    No Reels yet
                </div>
            ) : (
                reels.map(reel => (
                    <div key={reel._id} className="h-full w-full snap-start relative flex items-center justify-center bg-gray-900 border-b border-gray-800">
                         <video 
                            src={reel.media.find(m => m.type === 'video').url} 
                            className="h-full w-full object-cover"
                            controls={false}
                            autoPlay
                            muted
                            loop
                         />
                         {/* Overlay Info */}
                         <div className="absolute bottom-10 left-4 text-white z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <img src={reel.user.avatar} className="w-8 h-8 rounded-full" />
                                <span className="font-bold">{reel.user.username}</span>
                            </div>
                            <p className="text-sm">{reel.caption}</p>
                         </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Reels;
