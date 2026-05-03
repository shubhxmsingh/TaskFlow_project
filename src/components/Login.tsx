import React, { useState } from 'react';
import { Layout, Lock, User, AtSign, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';
import { Role } from '../types';

export function Login() {
  const { signIn, signInEmail, signUpEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'member' as Role
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpEmail(formData.email, formData.password, formData.name, formData.role);
      } else {
        await signInEmail(formData.email, formData.password);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-brand-bg)] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-black/5"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Layout size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">TaskFlow Pro</h1>
          <p className="text-gray-500">
            {isSignUp ? 'Create your team account' : 'Sign in to management portal'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      name="name"
                      required={isSignUp}
                      className="input-field pl-10" 
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                      name="role"
                      className="input-field pl-10 appearance-none"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="member">Employee (Member)</option>
                      <option value="admin">Manager (Admin)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Email Address</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                name="email"
                required
                className="input-field pl-10" 
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                name="password"
                required
                className="input-field pl-10" 
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-400 font-medium">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={signIn}
          className="w-full btn-secondary py-3 flex items-center justify-center gap-2 mb-6"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Google Authentication
        </button>

        <p className="text-center text-sm text-gray-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-black font-bold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <div className="mt-8 pt-6 border-t border-gray-50 bg-gray-50/50 -mx-8 -mb-8 rounded-b-2xl p-6">
          <p className="text-xs text-center text-gray-400 leading-relaxed italic">
            Managers (Admins) can create projects and assign tasks.<br/>
            Employees (Members) can update their assigned task status.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

