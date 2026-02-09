import { IoClose } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const UserListModal = ({ title, users, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-900 text-white rounded-xl w-full max-w-sm max-h-[400px] flex flex-col border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-center p-3 border-b border-gray-800 relative">
                    <h2 className="font-bold text-base">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="absolute right-3 text-2xl hover:text-gray-300"
                    >
                        <IoClose />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
                    {users.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            No users found.
                        </div>
                    ) : (
                        users.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <Link 
                                    to={`/profile/${user.username}`} 
                                    onClick={onClose}
                                    className="flex items-center gap-3"
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
                                </Link>
                                {/* Can add Follow/Remove button here later */}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListModal;
