import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaCog, FaCamera, FaTimes } from 'react-icons/fa';
import UserListModal from '../components/common/UserListModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import PostCard from '../components/feed/PostCard';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]); // Store posts
    const [savedPosts, setSavedPosts] = useState([]); // NEW: Store saved posts
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    
    // Modal State
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');

    const filteredPosts = activeTab === 'saved' ? savedPosts : posts.filter(post => {
        if (activeTab === 'reels') {
            return post.media[0].type === 'video';
        }
        return true; 
    });

    useEffect(() => {
        const fetchProfileAndPosts = async () => {
            setLoading(true);
            try {
                // Fetch Profile
                const { data: profileData } = await api.get(`/users/${username}`);
                setProfile(profileData);
                const isFollowing = profileData.followers.some(f => f._id === currentUser?._id);
                setIsFollowing(isFollowing);

                // Fetch Posts
                const { data: postsData } = await api.get(`/posts/user/${username}`);
                setPosts(postsData);

                // Fetch Saved Posts (Only if viewing own profile)
                if (currentUser?.username === username) {
                     const { data: savedData } = await api.get('/users/saved');
                     setSavedPosts(savedData);
                }

                // Fetch Saved Posts (Only if viewing own profile)
                if (currentUser?.username === username) {
                     const { data: savedData } = await api.get('/users/saved');
                     setSavedPosts(savedData);
                }

            } catch (error) {
                console.error("Fetch profile failed", error);
            }
            setLoading(false);
        };
        if(username) fetchProfileAndPosts();
    }, [username, currentUser]);

    const handleFollow = async () => {
        try {
            await api.post(`/users/follow/${profile._id}`);
            setIsFollowing(!isFollowing);
            // Optimistic update of follower count
            setProfile(prev => ({
                ...prev,
                followers: isFollowing 
                    ? prev.followers.filter(f => f._id !== currentUser._id)
                    : [...prev.followers, { _id: currentUser._id, username: currentUser.username, avatar: currentUser.avatar }]
            }));
        } catch (error) {
            console.error("Follow failed", error);
        }
    };

    if (loading) return <div className="flex justify-center p-8">Loading profile...</div>;
    if (!profile) return <div className="text-center p-8">User not found</div>;

    const isOwnProfile = currentUser?.username === profile.username;

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                <img 
                    src={profile.avatar} 
                    alt={profile.username} 
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border border-gray-200"
                />
                
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                        <h2 className="text-2xl font-light">{profile.username}</h2>
                        {isOwnProfile ? (
                            <button 
                                onClick={() => setShowEditProfile(true)}
                                className="px-4 py-1.5 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-50"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleFollow}
                                    className={`px-6 py-1.5 rounded font-semibold text-sm text-white 
                                        ${isFollowing ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}
                                    `}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button onClick={() => {
                                    navigate('/messages', { state: { startChatWith: profile } });
                                }} className="px-4 py-1.5 border border-gray-300 rounded font-semibold text-sm">
                                    Message
                                </button>
                            </div>
                        )}
                        {/* Settings / Block - Simplified for now as a direct button for testing, later move to modal */}
                        {!isOwnProfile && (
                            <button 
                                onClick={async () => {
                                    if(window.confirm(`Are you sure you want to block ${profile.username}?`)) {
                                        try {
                                            await api.post(`/users/block/${profile._id}`);
                                            alert('User blocked');
                                            window.location.href = '/'; // Redirect home
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }
                                }}
                                className="text-red-500 text-xs font-semibold hover:bg-gray-100 p-2 rounded"
                            >
                                Block
                            </button>
                        )}
                        <FaCog className="text-xl cursor-pointer" />
                    </div>

                    <div className="flex justify-center md:justify-start gap-8 mb-4">
                        <span><span className="font-bold">{posts.length}</span> posts</span>
                        <button onClick={() => setShowFollowers(true)} className="hover:opacity-70">
                            <span className="font-bold">{profile.followers.length}</span> followers
                        </button>
                        <button onClick={() => setShowFollowing(true)} className="hover:opacity-70">
                            <span className="font-bold">{profile.following.length}</span> following
                        </button>
                    </div>

                    <div className="text-sm">
                        <p className="font-bold">{profile.username}</p>
                        <p>{profile.bio || 'No bio yet.'}</p>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            <hr className="border-gray-200 mb-0" />
            
            <div className="flex justify-center gap-12 text-xs font-bold uppercase tracking-widest text-gray-500 mb-0 border-t border-gray-200">
                <button 
                    onClick={() => setActiveTab('posts')}
                    className={`h-[52px] flex items-center gap-2 ${activeTab === 'posts' ? 'text-black border-t border-black -mt-[1px]' : ''}`}
                >
                    <FaCamera /> Posts
                </button>
                <button 
                    onClick={() => setActiveTab('reels')}
                    className={`h-[52px] flex items-center gap-2 ${activeTab === 'reels' ? 'text-black border-t border-black -mt-[1px]' : ''}`}
                >
                    <span className="text-lg">▶</span> Reels
                </button>
                {isOwnProfile && (
                    <button 
                        onClick={() => setActiveTab('saved')}
                        className={`h-[52px] flex items-center gap-2 ${activeTab === 'saved' ? 'text-black border-t border-black -mt-[1px]' : ''}`}
                    >
                        <span>🏷️</span> Saved
                    </button>
                )}
            </div>

            {/* Posts Content */}
            {filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center mb-4">
                        <FaCamera className="text-3xl" />
                    </div>
                    <h2 className="text-3xl font-extrabold mb-2">No {activeTab} yet</h2>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-8">
                    {filteredPosts.map((post) => (
                        <div 
                            key={post._id} 
                            onClick={() => setSelectedPost(post)}
                            className="relative aspect-[4/5] bg-gray-100 hover:opacity-90 cursor-pointer group"
                        >
                            {post.media[0].type === 'image' ? (
                                <img 
                                    src={post.media[0].url} 
                                    alt={post.caption} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <video 
                                    src={post.media[0].url} 
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white font-bold gap-4">
                                <span>❤️ {post.likes.length}</span>
                                <span>💬 {post.comments.length}</span>
                            </div>
                            {post.media[0].type === 'video' && (
                                <div className="absolute top-2 right-2 text-white drop-shadow-md">
                                    ▶
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showFollowers && (
                <UserListModal 
                    title="Followers" 
                    users={profile.followers} 
                    onClose={() => setShowFollowers(false)} 
                />
            )}
            {showFollowing && (
                <UserListModal 
                    title="Following" 
                    users={profile.following} 
                    onClose={() => setShowFollowing(false)} 
                />
            )}
            {showEditProfile && (
                <EditProfileModal 
                    profile={profile} 
                    onClose={() => setShowEditProfile(false)} 
                />
            )}
            
            {/* Post Details Modal */}
            {selectedPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedPost(null)}>
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedPost(null)}
                            className="absolute -top-10 right-0 text-white text-3xl font-bold"
                        >
                            <FaTimes />
                        </button>
                        <PostCard post={selectedPost} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
