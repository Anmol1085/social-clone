import { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import api from '../../services/api';

const NewMessageModal = ({ onClose, onSelectUser }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [following, setFollowing] = useState([]);

    useEffect(() => {
        const fetchFollowing = async () => {
            try {
                const { data } = await api.get(`/users/${JSON.parse(localStorage.getItem('user')).username}`);
                setFollowing(data.following || []);
            } catch (error) {
                console.error("Failed to fetch following", error);
            }
        };
        fetchFollowing();
    }, []);

    useEffect(() => {
        const search = async () => {
            if (query.trim()) {
                try {
                    const { data } = await api.get(`/users/search?q=${query}`);
                    setResults(data);
                } catch (error) {
                    console.error("Search failed", error);
                }
            } else {
                setResults([]);
            }
        };
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [query]);

    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-900 text-white rounded-xl w-full max-w-sm h-[400px] flex flex-col border border-gray-800">
                <div className="flex items-center justify-between p-3 border-b border-gray-800">
                    <button onClick={onClose} className="text-2xl hover:text-gray-300"><IoClose /></button>
                    <h2 className="font-bold">New Message</h2>
                    <div className="w-6"></div> {/* Spacer */}
                </div>
                
                <div className="p-3 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">To:</span>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="flex-1 outline-none bg-transparent text-white placeholder-gray-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1">
                    {query && results.length === 0 && (
                        <p className="text-center text-gray-500 mt-4">No account found.</p>
                    )}
                    {results.map(user => (
                        <div 
                            key={user._id} 
                            onClick={() => onSelectUser(user)}
                            className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer"
                        >
                            <img 
                                src={user.avatar} 
                                alt={user.username} 
                                className="w-10 h-10 rounded-full object-cover border border-gray-700"
                            />
                            <div>
                                <p className="font-semibold text-sm">{user.username}</p>
                                <p className="text-gray-400 text-xs">{user.fullName}</p>
                            </div>
                        </div>
                    ))}
                    {!query && following.length > 0 && (
                        <>
                            <p className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Suggested</p>
                            {following.map(user => (
                                <div 
                                    key={user._id} 
                                    onClick={() => onSelectUser(user)}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer"
                                >
                                    <img 
                                        src={user.avatar} 
                                        alt={user.username} 
                                        className="w-10 h-10 rounded-full object-cover border border-gray-700"
                                    />
                                    <div>
                                        <p className="font-semibold text-sm">{user.username}</p>
                                        <p className="text-gray-400 text-xs">{user.fullName || user.username}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    {!query && following.length === 0 && (
                         <div className="p-4 text-center text-gray-400 text-sm">
                            Search for a user to message.
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewMessageModal;
