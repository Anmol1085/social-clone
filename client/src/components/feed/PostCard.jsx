import { useState } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaPaperPlane, FaBookmark, FaRegBookmark, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const PostCard = ({ post }) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.likes.includes(user?._id));
    const [likeCount, setLikeCount] = useState(post.likes.length);
    const [saved, setSaved] = useState(false); // Ideally passed from parent or checked in useEffect
    const [comments, setComments] = useState(post.comments || []);
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false); // Or navigate to details

    const handleLike = async () => {
        try {
            const { data } = await api.put(`/posts/${post._id}/like`);
            setLiked(data.isLiked);
            setLikeCount(data.likes);
        } catch (error) {
            console.error("Failed to like post", error);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const { data } = await api.post(`/posts/${post._id}/comment`, { text: commentText });
            setComments([...comments, data]);
            setCommentText('');
            setShowComments(true); // Auto-open comments
        } catch (error) {
            console.error("Failed to comment", error);
        }
    };

    const handleSave = async () => {
        try {
            const { data } = await api.put(`/posts/${post._id}/save`);
            setSaved(data.isSaved);
        } catch (error) {
            console.error("Failed to save post", error);
        }
    };

    const handleShare = () => {
        // Copy link to clipboard
        const link = `${window.location.origin}/post/${post._id}`; // Needed: Post Details page or similar anchor
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };

    const handleDeletePost = async () => {
        if (!confirm("Delete this post?")) return;
        try {
            await api.delete(`/posts/${post._id}`);
            // Simple refresh for now
            window.location.reload(); 
        } catch (error) {
            console.error("Failed to delete post", error);
        }
    };

    return (
        <div className="bg-black border-b border-gray-800 rounded-sm mb-4 w-full md:max-w-[470px] mx-auto pb-4">
            {/* Header */}
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                    <Link to={`/profile/${post.user.username}`}>
                        <img 
                            src={post.user.avatar} 
                            alt={post.user.username} 
                            className="w-8 h-8 rounded-full object-cover border border-gray-700"
                        />
                    </Link>
                    <div>
                        <Link to={`/profile/${post.user.username}`} className="font-semibold text-sm text-white hover:text-gray-300 transition-colors">
                            {post.user.username}
                        </Link>
                        {post.location && <span className="block text-xs text-gray-400">{post.location}</span>}
                    </div>
                    <span className="text-gray-500 text-xs">• {formatDistanceToNow(new Date(post.createdAt))}</span>
                </div>
                {user?._id === post.user._id ? (
                    <button onClick={handleDeletePost} className="text-gray-400 hover:text-red-500 text-sm">
                        <FaTrash />
                    </button>
                ) : (
                   <button className="text-white font-bold hover:text-gray-400">...</button>
                )}
            </div>

            {/* Media */}
            <div className="w-full bg-black border border-gray-800 rounded-sm overflow-hidden flex items-center justify-center">
                {post.media[0].type === 'image' ? (
                    <img 
                        src={post.media[0].url} 
                        alt="Post content" 
                        className="w-full object-contain max-h-[600px]"
                    />
                ) : (
                    <video 
                        src={post.media[0].url} 
                        controls 
                        className="w-full object-contain max-h-[600px]"
                    />
                )}
            </div>

            {/* Actions */}
            <div className="py-3">
                <div className="flex justify-between mb-2">
                    <div className="flex gap-4 text-2xl">
                        <button onClick={handleLike} className={`${liked ? 'text-red-500' : 'text-white hover:text-gray-400'} transition-colors`}>
                            {liked ? <FaHeart /> : <FaRegHeart />}
                        </button>
                        <button onClick={() => setShowComments(!showComments)} className="text-white hover:text-gray-400">
                            <FaComment />
                        </button>
                        <button onClick={handleShare} className="text-white hover:text-gray-400">
                            <FaPaperPlane />
                        </button>
                    </div>
                    <button onClick={handleSave} className="text-2xl text-white hover:text-gray-400">
                        {saved ? <FaBookmark className="text-white" /> : <FaRegBookmark />}
                    </button>
                </div>

                {/* Likes Count */}
                <div className="font-semibold text-sm mb-1 text-white">{likeCount} likes</div>

                {/* Caption */}
                <div className="text-sm mb-2 text-white">
                    <span className="font-semibold mr-2">{post.user.username}</span>
                    {post.caption}
                </div>

                {/* Comments Link */}
                <button onClick={() => setShowComments(!showComments)} className="text-gray-400 text-sm mb-1">
                    {comments.length > 0 ? `View all ${comments.length} comments` : 'Add a comment...'}
                </button>

                {/* Comments List (Simplified) */}
                {showComments && comments.length > 0 && (
                    <div className="mb-2 space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
                        {comments.map((comment, index) => (
                            <div key={index} className="text-sm text-white">
                                <span className="font-semibold mr-2">{comment.user.username}</span>
                                <span>{comment.text}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Add Comment Input */}
                <form onSubmit={handleComment} className="flex items-center mt-2">
                    <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        className="flex-1 text-sm outline-none bg-transparent text-white placeholder-gray-500"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    {commentText && (
                        <button 
                            type="submit" 
                            className="text-blue-500 font-semibold text-sm ml-2"
                        >
                            Post
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default PostCard;
