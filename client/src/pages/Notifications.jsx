import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');
                setNotifications(data);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
            setLoading(false);
        };
        fetchNotifications();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading notifications...</div>;

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Notifications</h2>
            
            <div className="flex flex-col gap-4">
                {notifications.length === 0 && (
                     <div className="text-center text-gray-500 py-10">
                        No notifications yet.
                     </div>
                )}
                {notifications.map(notification => (
                    <div key={notification._id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <Link to={`/profile/${notification.sender.username}`}>
                                <img 
                                    src={notification.sender.avatar} 
                                    alt={notification.sender.username} 
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                            </Link>
                            <div className="text-sm">
                                <Link to={`/profile/${notification.sender.username}`} className="font-bold hover:underline">
                                    {notification.sender.username}
                                </Link>
                                <span className="ml-1">
                                    {notification.type === 'like' && 'liked your photo.'}
                                    {notification.type === 'follow' && 'started following you.'}
                                    {notification.type === 'comment' && `commented: "${notification.text}"`}
                                </span>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>

                        {/* Post Preview (if like or comment) */}
                        {notification.post && (
                            <div className="w-10 h-10 rounded overflow-hidden">
                                {notification.post.media[0].type === 'image' ? (
                                    <img src={notification.post.media[0].url} className="w-full h-full object-cover" alt="post" />
                                ) : (
                                    <video src={notification.post.media[0].url} className="w-full h-full object-cover" />
                                )}
                            </div>
                        )}
                        
                        {/* Follow Button (if follow) - Optional */}
                        {notification.type === 'follow' && (
                             <button className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold">
                                Follow
                             </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
