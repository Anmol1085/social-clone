import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SuggestedUsers = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchSuggested = async () => {
            try {
                const { data } = await api.get('/users/suggested');
                setUsers(data.slice(0, 5)); // Limit to 5
            } catch (error) {
                console.error("Failed to fetch suggestions", error);
            }
        };
        fetchSuggested();
    }, []);

    if (!currentUser) return null;

    return (
        <div className="hidden lg:block w-[320px] pl-8 py-8 fixed right-0 h-screen overflow-y-auto">
            {/* Current User Profile Switcher */}
            <div className="flex items-center justify-between mb-6">
                <Link to={`/profile/${currentUser.username}`} className="flex items-center gap-4 group">
                    <img 
                        src={currentUser.avatar} 
                        alt={currentUser.username} 
                        className="w-11 h-11 rounded-full object-cover"
                    />
                    <div className="text-sm">
                        <p className="font-semibold text-white group-hover:text-gray-300 transition-colors">{currentUser.username}</p>
                        <p className="text-gray-500">{currentUser.fullName || currentUser.username}</p>
                    </div>
                </Link>
                <button className="text-xs font-bold text-blue-500 hover:text-white">Switch</button>
            </div>

            {/* Suggestions Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 font-bold text-sm">Suggested for you</h3>
                <Link to="/explore/people" className="text-xs font-bold text-white hover:text-gray-300">See All</Link>
            </div>

            {/* Suggestions List */}
            <div className="space-y-4 mb-8">
                {users.map(user => (
                    <div key={user._id} className="flex items-center justify-between">
                        <Link to={`/profile/${user.username}`} className="flex items-center gap-3 group">
                            <img 
                                src={user.avatar} 
                                alt={user.username} 
                                className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="text-xs">
                                <p className="font-semibold text-white group-hover:text-gray-300 transition-colors">{user.username}</p>
                                <p className="text-gray-400 truncate w-32">Suggested for you</p>
                            </div>
                        </Link>
                        <button className="text-xs font-bold text-blue-500 hover:text-white">
                            Follow
                        </button>
                    </div>
                ))}
            </div>
            
            {/* Footer */}
            <div className="text-xs text-gray-300 space-y-4">
                <nav className="flex flex-wrap gap-x-1 gap-y-0">
                    {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'].map((item, index) => (
                        <span key={item} className="cursor-pointer hover:underline">
                            {item}{index < 9 && <span className="mx-1">·</span>}
                        </span>
                    ))}
                </nav>
                <p>© 2026 INSTAGRAM FROM META</p>
            </div>
        </div>
    );
};

export default SuggestedUsers;
