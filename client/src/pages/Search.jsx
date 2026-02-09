import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/users/search?q=${query}`);
                setResults(data);
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
             <div className="relative mb-8">
                 <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                    className="w-full bg-gray-900 border border-gray-800 text-white p-3 pl-12 rounded-xl outline-none focus:border-gray-600 transition-colors"
                    placeholder="Search users..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                 />
             </div>

             <div className="space-y-2">
                 {results.map(user => (
                     <Link to={`/profile/${user.username}`} key={user._id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors">
                         <img src={user.avatar} className="w-12 h-12 rounded-full border border-gray-700" />
                         <div>
                             <p className="font-bold text-white">{user.username}</p>
                             <p className="text-gray-400 text-sm">{user.bio}</p>
                         </div>
                     </Link>
                 ))}
                 {query && !loading && results.length === 0 && (
                     <p className="text-center text-gray-500">No users found</p>
                 )}
             </div>
        </div>
    );
};

export default Search;
