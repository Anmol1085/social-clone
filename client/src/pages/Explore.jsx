import { useState, useEffect } from 'react';
import api from '../services/api';
import PostCard from '../components/feed/PostCard';

const Explore = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        // For now, just fetch feed posts randomly or all posts
        // Ideally we need a /api/posts/explore endpoint
        const fetchPosts = async () => {
            try {
                // Determine if we have explore endpoint or reuse feed with randomization
                const { data } = await api.get('/posts/feed'); 
                setPosts(data.sort(() => 0.5 - Math.random())); // Shuffle
            } catch (error) {
                console.error("Explore fetch failed", error);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6">Explore</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(post => (
                    <PostCard key={post._id} post={post} />
                ))}
            </div>
        </div>
    );
};

export default Explore;
