import { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaEye } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const StoryViewer = ({ stories, onClose }) => {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [viewers, setViewers] = useState([]);
    const [showViewers, setShowViewers] = useState(false);
    const timerRef = useRef(null);
    const PROGRESS_DURATION = 5000; // 5 seconds per story

    const currentStory = stories[currentIndex];
    const isOwner = user?._id === currentStory.user._id;

    // Record View and Fetch Viewers
    useEffect(() => {
        if (!currentStory) return;

        const recordView = async () => {
            try {
                // If not owner, record view
                if (!isOwner) {
                     await api.post(`/stories/${currentStory._id}/view`);
                } 
                // If owner, fetch viewers (or simply use the updated story object if returned)
                // For simplicity, let's assume we want to see viewers if we are the owner
                if (isOwner) {
                    // Ideally we'd have a separate endpoint or reuse getStories logic, 
                    // but since stories prop might not have populated viewers, let's just use what we have
                    // or fetch if needed. 
                    // simpler: just show currentStory.viewers if populated, or specific endpoint
                    // Let's rely on the populate from getStories for now, or fetch fresh if needed.
                    // The getStories update populated viewers.
                    setViewers(currentStory.viewers || []);
                }
            } catch (error) {
                console.error("Failed to record view", error);
            }
        };

        recordView();
    }, [currentStory, isOwner]);

    const handleNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose(); // Close if last story
        }
    }, [currentIndex, stories, onClose]);

    // Auto-advance logic
    useEffect(() => {
        if (showViewers) return; // Pause if viewing viewers list

        const startTime = Date.now();
        
        const updateProgress = () => {
             const elapsed = Date.now() - startTime;
             const newProgress = (elapsed / PROGRESS_DURATION) * 100;
             
             if (newProgress >= 100) {
                 handleNext();
             } else {
                 setProgress(newProgress);
                 timerRef.current = requestAnimationFrame(updateProgress);
             }
        };

        timerRef.current = requestAnimationFrame(updateProgress);

        return () => {
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
        };
    }, [currentIndex, handleNext, showViewers]);


    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
             setProgress(0);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this story?")) return;
        try {
            await api.delete(`/stories/${currentStory._id}`);
            // If only one story, close. Else remove from list?
            // Simpler: Just close and let parent refresh
            onClose(); 
            // In a real app we'd update the local list or refetch
            window.location.reload(); // Quick fix to refresh state
        } catch (error) {
            console.error("Failed to delete story", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
             {/* Mobile-like Container */}
             <div className="relative w-full h-full md:w-[400px] md:h-[80vh] bg-gray-900 md:rounded-xl overflow-hidden shadow-2xl">
                 
                 {/* Progress Bars */}
                 <div className="absolute top-4 left-0 right-0 flex px-2 gap-1 z-20">
                     {stories.map((story, idx) => (
                         <div key={story._id} className="h-1 flex-1 bg-white/30 rounded overflow-hidden">
                             <div 
                                className="h-full bg-white transition-all ease-linear"
                                style={{ 
                                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                                }}
                             />
                         </div>
                     ))}
                 </div>

                 {/* Header */}
                 <div className="absolute top-8 left-0 right-0 px-4 flex items-center justify-between z-20 text-white">
                     <div className="flex items-center gap-2">
                         <img 
                            src={currentStory.user.avatar} 
                            alt={currentStory.user.username} 
                            className="w-8 h-8 rounded-full border border-white/50"
                         />
                         <span className="font-semibold text-sm">{currentStory.user.username}</span>
                         <span className="text-white/60 text-xs">
                             {formatDistanceToNow(new Date(currentStory.createdAt))}
                         </span>
                     </div>
                     <div className="flex items-center gap-4">
                        {isOwner && (
                            <button onClick={handleDelete} className="text-xl hover:text-red-500">
                                <MdDelete />
                            </button>
                        )}
                        <button onClick={onClose} className="text-2xl">
                            <FaTimes />
                        </button>
                     </div>
                 </div>

                 {/* Media */}
                 <div className="w-full h-full flex items-center justify-center bg-black relative">
                     {currentStory.mediaType === 'video' ? (
                         <video 
                            src={currentStory.mediaUrl} 
                            autoPlay 
                            className="w-full h-full object-cover"
                            muted // Muted for autoplay policy, maybe add toggle
                         />
                     ) : (
                         <img 
                            src={currentStory.mediaUrl} 
                            alt="story" 
                            className="w-full h-full object-cover"
                         />
                     )}
                     
                     {/* Mentions */}
                     {currentStory.mentions?.map((mention, idx) => (
                         <Link
                            key={idx}
                            to={`/profile/${mention.user?.username}`}
                            onClick={(e) => e.stopPropagation()} // Prevent auto-advance/pause when clicking mention
                            style={{ 
                                left: `${mention.x * 100}%`, 
                                top: `${mention.y * 100}%` 
                            }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white/90 text-black px-2 py-1 rounded-md text-sm font-bold shadow-lg hover:scale-105 transition-transform z-30"
                         >
                            @{mention.user?.username || 'user'}
                         </Link>
                     ))}
                 </div>

                 {/* Tap Navigation Overlays */}
                 <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev}></div>
                 <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext}></div>
                 
                 {/* Navigation Buttons (Desktop Helper) */}
                 <button 
                    onClick={handlePrev} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 z-20 hidden md:block"
                 >
                     <FaChevronLeft />
                 </button>
                 <button 
                    onClick={handleNext} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 z-20 hidden md:block"
                 >
                     <FaChevronRight />
                 </button>

                {/* Viewers Footer (Owner Only) */}
                {isOwner && (
                    <div 
                        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30 cursor-pointer"
                        onClick={() => setShowViewers(true)}
                    >
                        <div className="flex items-center gap-2 text-white">
                            <FaEye />
                            <span className="font-semibold text-sm">{viewers.length} viewers</span>
                        </div>
                    </div>
                )}

                {/* Viewers Modal Overlay */}
                {showViewers && (
                     <div className="absolute inset-0 z-50 bg-black/90 flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center text-white">
                            <h3 className="font-bold">Viewers</h3>
                            <button onClick={(e) => { e.stopPropagation(); setShowViewers(false); }}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {viewers.length === 0 ? (
                                <p className="text-gray-500 text-center mt-10">No viewers yet</p>
                            ) : (
                                viewers.map(v => (
                                    <div key={v.user._id || v.user} className="flex items-center gap-3 text-white">
                                        <img 
                                            src={v.user.avatar || 'https://i.pravatar.cc/150'} 
                                            alt={v.user.username} 
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <span className="font-semibold">{v.user.username}</span>
                                    </div>
                                ))
                            )}
                        </div>
                     </div>
                )}
             </div>
        </div>
    );
};

export default StoryViewer;
