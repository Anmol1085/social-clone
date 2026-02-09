import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    FaHome, 
    FaSearch, 
    FaPlusSquare, 
    FaFilm, 
    FaUserCircle 
} from 'react-icons/fa';

const MobileBottomBar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const navItems = [
        { icon: FaHome, label: 'Home', path: '/' },
        { icon: FaSearch, label: 'Search', path: '/search' }, // Explore/Search combined on mobile often
        { icon: FaPlusSquare, label: 'Create', path: '/create' },
        { icon: FaFilm, label: 'Reels', path: '/reels' },
        { icon: FaUserCircle, label: 'Profile', path: `/profile/${user?.username}` },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-4 py-3 flex justify-between items-center z-50">
            {navItems.map((item) => (
                <Link
                    key={item.label}
                    to={item.path}
                    className={`flex flex-col items-center justify-center p-2 text-2xl
                        ${isActive(item.path) ? 'text-black' : 'text-gray-500'}
                    `}
                >
                    <item.icon />
                </Link>
            ))}
        </div>
    );
};

export default MobileBottomBar;
