import FeedList from '../components/feed/FeedList';
import SuggestedUsers from '../components/common/SuggestedUsers';
import StoriesTray from '../components/story/StoriesTray';

const Home = () => {
    return (
        <div className="flex justify-center max-w-[1000px] mx-auto pt-8">
            <div className="w-full max-w-[630px] flex flex-col gap-4">
                <StoriesTray />
                <FeedList />
            </div>
            <div className="hidden lg:block w-[320px] ml-16">
                 {/* Place holder for spacing, real component is fixed */}
                <SuggestedUsers />
            </div>
        </div>
    );
};

export default Home;
