import { Link } from 'react-router-dom';

const StoryBubble = ({ username, image, isSeen, onClick }) => {
    return (
        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onClick}>
            <div className={`
                w-16 h-16 rounded-full p-[2px] 
                ${isSeen ? 'bg-gray-300' : 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600'}
            `}>
                <div className="bg-white p-[2px] rounded-full w-full h-full">
                    <img 
                        src={image} 
                        alt={username} 
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>
            </div>
            <span className="text-xs w-16 truncate text-center text-white">{username}</span>
        </div>
    );
};

export default StoryBubble;
