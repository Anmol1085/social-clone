import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import api from '../../services/api';

const FeedList = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data } = await api.get('/posts/feed');
                setPosts(data);
            } catch (error) {
                console.error("Error fetching feed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-8 text-white">Loading feed...</div>;
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center py-4 text-center">
                <div className="mt-8 p-4">
                    <p className="text-gray-300 mb-2">No posts yet.</p>
                    <p className="text-sm text-gray-500">Follow more people to see their posts here!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full pb-20 md:pb-4">
            {posts.map(post => (
                <PostCard key={post._id} post={post} />
            ))}
        </div>
    );
};

export default FeedList;
