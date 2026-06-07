'use client';

import React from 'react';
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

export default function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <NeuralSphere />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
