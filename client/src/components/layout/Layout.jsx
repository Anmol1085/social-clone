import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomBar from './MobileBottomBar';

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-black text-gray-100 font-sans">
            {/* Sidebar - Desktop */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-[244px] w-full pb-16 md:pb-0">
                <div className="max-w-6xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Bar - Mobile */}
            <MobileBottomBar />
        </div>
    );
};

export default Layout;
