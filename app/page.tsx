'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';

const NeuralSphere = () => {
  return (
    <Sphere visible args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial 
        color="#6C47FF" 
        attach="material" 
        distort={0.4} 
        speed={1.5} 
        roughness={0} 
        transparent 
        opacity={0.8}
        wireframe
      />
    </Sphere>
  );
};

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-background">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <NeuralSphere />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-6xl md:text-8xl font-heading font-bold mb-4 drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60" style={{ transform: 'translateZ(50px)' }}>
            Book Mind Vault
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-xl md:text-2xl text-textSecondary tracking-wide mb-12 font-mono"
          >
            Your knowledge. Your cosmos.
          </motion.p>
          
          <Link href="/dashboard" className="pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-primary/20 border border-primary/50 text-white font-medium text-lg backdrop-blur-md hover:bg-primary/40 hover:shadow-[0_0_30px_rgba(108,71,255,0.5)] transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10">Enter Your Universe</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
