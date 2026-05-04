import React, { useEffect, useRef, useState } from 'react';
import { Layout, Lock, User, AtSign, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { useAuth } from './AuthProvider';
import { Role } from '../types';

export function Login() {
  const { signIn, signInEmail, signUpEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee' as Role,
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

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const sphereGeo = new THREE.IcosahedronGeometry(1.5, 24);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.25,
      metalness: 0.55,
      emissive: 0x1e1b4b,
      emissiveIntensity: 0.45,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(-1.5, 0.3, 0);
    scene.add(sphere);

    const ringGeo = new THREE.TorusKnotGeometry(1.05, 0.25, 220, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0x0e7490,
      emissiveIntensity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(2, -0.2, -0.5);
    scene.add(ring);

    const particleCount = 1800;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.03,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    const lightA = new THREE.DirectionalLight(0xffffff, 1.35);
    lightA.position.set(4, 4, 5);
    scene.add(lightA);

    const lightB = new THREE.PointLight(0xa5b4fc, 1.75);
    lightB.position.set(-3, -2, 3);
    scene.add(lightB);

    const lightC = new THREE.PointLight(0x22d3ee, 1.25);
    lightC.position.set(3, 1, 2);
    scene.add(lightC);

    let animationFrameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      sphere.rotation.x += 0.0055;
      sphere.rotation.y += 0.008;
      ring.rotation.x -= 0.007;
      ring.rotation.y += 0.006;
      sphere.position.y = Math.sin(elapsed * 1.4) * 0.22;
      ring.position.y = Math.cos(elapsed * 1.2) * 0.28 - 0.2;
      particles.rotation.y = elapsed * 0.035;
      particles.rotation.x = Math.sin(elapsed * 0.2) * 0.08;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div ref={canvasContainerRef} className="absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.30),transparent_35%),radial-gradient(circle_at_80%_25%,rgba(34,211,238,0.24),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.22),transparent_40%)]" />
      <div className="relative z-10 min-h-screen p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel relative w-full max-w-xl p-8 rounded-3xl shadow-[0_30px_100px_rgba(8,12,30,0.45)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/25 to-white/15 pointer-events-none" />
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/35 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-white/30 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/10">
              <Layout size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">TaskFlow</h1>
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
                        className="glass-input pl-10"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Account Type</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        name="role"
                        className="glass-input pl-10 appearance-none"
                        value={formData.role}
                        onChange={handleChange}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
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
                  className="glass-input pl-10"
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
                  className="glass-input pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl border border-white/35 bg-black/85 text-white font-semibold flex items-center justify-center gap-2 mt-2 transition-all hover:bg-black/90 hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)] disabled:opacity-60"
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
              <span className="bg-white/35 backdrop-blur-md border border-white/45 rounded-md px-4 text-gray-700/90 font-medium">Or continue with</span>
            </div>
          </div>

          <button
            onClick={signIn}
            className="w-full py-3 rounded-xl border border-white/50 bg-white/35 backdrop-blur-lg text-slate-900 font-semibold flex items-center justify-center gap-2 mb-6 transition-all hover:bg-white/45"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-5 h-5"
              alt="Google"
            />
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

          <div className="mt-8 pt-6 border-t border-white/45 bg-white/20 -mx-8 -mb-8 rounded-b-3xl p-6 backdrop-blur-md">
            <p className="text-xs text-center text-gray-500 leading-relaxed">
              Light, focused workspace for projects, tasks, and team collaboration.
            </p>
          </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

