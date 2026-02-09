import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="w-full max-w-sm p-8 bg-black border border-gray-800 rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-4 font-serif italic text-white">Instagram</h1>
        <p className="text-center text-gray-400 mb-6 font-semibold">Sign up to see photos and videos from your friends.</p>
        {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 text-xs border border-gray-700 rounded bg-gray-900 text-white focus:outline-none focus:border-gray-500 placeholder-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 text-xs border border-gray-700 rounded bg-gray-900 text-white focus:outline-none focus:border-gray-500 placeholder-gray-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 text-xs border border-gray-700 rounded bg-gray-900 text-white focus:outline-none focus:border-gray-500 placeholder-gray-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="submit"
            className="w-full py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Sign Up
          </button>
        </form>
        <div className="mt-8 text-center bg-black border border-gray-800 p-4 rounded mt-4">
            <p className="text-sm text-gray-400">
                Have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-500">Log in</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
