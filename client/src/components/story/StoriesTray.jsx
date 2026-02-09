import { useState, useEffect } from 'react';
import StoryBubble from './StoryBubble';
import StoryViewer from './StoryViewer';
import CreateStoryModal from './CreateStoryModal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaPlus } from 'react-icons/fa';

const StoriesTray = () => {
    const { user } = useAuth();
    const [stories, setStories] = useState([]);
    const [selectedStories, setSelectedStories] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const { data } = await api.get('/stories');
                
                // Grouping logic:
                const userMap = new Map();
                data.forEach(story => {
                     const userId = story.user._id;
                     if (!userMap.has(userId)) {
                         userMap.set(userId, {
                             id: story.user._id,
                             username: story.user.username,
                             image: story.user.avatar,
                             stories: [] 
                         });
                     }
                     userMap.get(userId).stories.push(story);
                });
                
                setStories(Array.from(userMap.values()));

            } catch (error) {
                console.error("Failed to fetch stories", error);
            }
        };
        fetchStories();
    }, [refreshTrigger]);

    const myStories = stories.find(s => s.id === user?._id);
    const otherStories = stories.filter(s => s.id !== user?._id);

    return (
        <>
            <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide bg-black border border-gray-800 rounded-sm mb-4 md:max-w-xl mx-auto w-full items-center">
                {/* Your Story Bubble */}
                {user && (
                    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => myStories ? setSelectedStories(myStories.stories) : setShowCreateModal(true)}>
                        <div className={`relative w-16 h-16 rounded-full p-[2px] ${myStories ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600' : 'bg-transparent border-2 border-gray-700'}`}>
                            <div className="bg-white p-[2px] rounded-full w-full h-full"> 
                                <img 
                                    src={user.avatar || 'https://i.pravatar.cc/150'} 
                                    alt="Your Story" 
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                            {!myStories && (
                                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 border-2 border-white text-xs">
                                    <FaPlus />
                                </div>
                            )}
                        </div>
                        <span className="text-xs w-16 truncate text-center font-semibold text-white">Your Story</span>
                    </div>
                )}

                {/* Other Stories */}
                {otherStories.map(userStories => (
                    <StoryBubble 
                        key={userStories.id} 
                        username={userStories.username} 
                        image={userStories.image} 
                        isSeen={false} // TODO: Implement seen check
                        onClick={() => setSelectedStories(userStories.stories)}
                    />
                ))}
            </div>

            {selectedStories && (
                <StoryViewer 
                    stories={selectedStories} 
                    onClose={() => setSelectedStories(null)} 
                />
            )}

            {showCreateModal && (
                <CreateStoryModal 
                    onClose={() => setShowCreateModal(false)}
                    onStoryCreated={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}
        </>
    );
};

export default StoriesTray;
