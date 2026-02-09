import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    FaHome, 
    FaSearch, 
    FaCompass, 
    FaFilm, 
    FaHeart, 
    FaPlusSquare, 
    FaUserCircle, 
    FaBars 
} from 'react-icons/fa'; // Using FontAwesome icons as standard
import { IoPaperPlaneOutline } from "react-icons/io5";

const Sidebar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { icon: FaHome, label: 'Home', path: '/' },
        { icon: FaSearch, label: 'Search', path: '/search' },
        { icon: FaCompass, label: 'Explore', path: '/explore' },
        { icon: FaFilm, label: 'Reels', path: '/reels' },
        { icon: IoPaperPlaneOutline, label: 'Messages', path: '/messages' },
        { icon: FaHeart, label: 'Notifications', path: '/notifications' },
        { icon: FaPlusSquare, label: 'Create', path: '/create' },
        { icon: FaUserCircle, label: 'Profile', path: `/profile/${user?.username}` },
    ];

    return (
        <div className="hidden md:flex flex-col w-[244px] h-screen px-3 py-8 border-r border-gray-800 fixed top-0 left-0 bg-black z-50 text-white">
            <Link to="/" className="mb-8 px-3 py-2 mt-2">
                <h1 className="text-2xl font-serif font-medium tracking-wide">Instagram</h1>
            </Link>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors group hover:bg-white/10
                            ${isActive(item.path) ? 'font-bold' : 'font-normal'}
                        `}
                    >
                         {/* Icon Transition */}
                        <div className="group-hover:scale-105 transition-transform duration-200">
                            <item.icon className={`text-2xl ${isActive(item.path) ? 'text-white' : 'text-gray-200'}`} />
                        </div>
                        <span className="text-base tracking-wide">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                <button 
                    onClick={logout}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 w-full text-left group"
                >
                    <FaBars className="text-2xl group-hover:scale-105 transition-transform" />
                    <span className="text-base">More</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
