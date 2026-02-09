import { useState } from 'react';
import { FaTimes, FaCamera } from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const EditProfileModal = ({ profile, onClose }) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        username: profile.username || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '',
        age: profile.age || ''
    });
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setFormData({ ...formData, avatar: URL.createObjectURL(selected) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let avatarUrl = formData.avatar;
            
            if (file) {
                 const uploadData = new FormData();
                 uploadData.append('file', file);
                 const { data } = await api.post('/upload', uploadData);
                 avatarUrl = data.url;
            }

            await api.put(`/users/profile`, { 
                username: formData.username,
                bio: formData.bio,
                avatar: avatarUrl,
                age: formData.age
            });

            window.location.reload(); 

        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Update failed");
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-800">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Edit Profile</h3>
                    <button onClick={onClose} className="hover:text-gray-300"><FaTimes /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 mb-4">
                            <img src={formData.avatar} className="w-full h-full rounded-full object-cover border border-gray-700" />
                            <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                                <FaCamera className="text-sm" />
                                <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1">Username</label>
                        <input 
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gray-500 outline-none"
                            placeholder="Username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1">Age</label>
                        <input 
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gray-500 outline-none"
                            placeholder="Age"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1">Bio</label>
                        <textarea 
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gray-500 outline-none h-24 resize-none"
                            placeholder="Write something about yourself..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setShowPasswordModal(true)}
                            className="flex-1 bg-gray-700 text-white font-bold py-2.5 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Change Password
                        </button>
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}
        </div>
    );
};

export default EditProfileModal;
