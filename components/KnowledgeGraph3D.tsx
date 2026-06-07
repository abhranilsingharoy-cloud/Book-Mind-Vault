'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d';

interface Node {
  id: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
  val: number;
  x?: number;
  y?: number;
  z?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  similarity: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const colorMap: Record<string, string> = {
  tech: '#6C47FF',
  business: '#FF6B35',
  science: '#00D4FF',
  philosophy: '#FFD700',
  default: '#F0F0FF'
};

const getNodeColor = (tags: string[]) => {
  if (tags.some(t => ['tech', 'programming', 'ai', 'software'].includes(t.toLowerCase()))) return colorMap.tech;
  if (tags.some(t => ['business', 'startup', 'finance'].includes(t.toLowerCase()))) return colorMap.business;
  if (tags.some(t => ['science', 'physics', 'biology'].includes(t.toLowerCase()))) return colorMap.science;
  if (tags.some(t => ['philosophy', 'thinking', 'psychology'].includes(t.toLowerCase()))) return colorMap.philosophy;
  return colorMap.default;
};

const GraphNodes = ({ nodes, links, onNodeClick, onNodeHover }: { nodes: Node[], links: Link[], onNodeClick: (n: Node) => void, onNodeHover: (n: Node | null) => void }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const { camera } = useThree();
  
  // Create color array
  const colorArray = useMemo(() => {
    const arr = new Float32Array(nodes.length * 3);
    const tempColor = new THREE.Color();
    nodes.forEach((node, i) => {
      tempColor.set(getNodeColor(node.tags));
      tempColor.toArray(arr, i * 3);
    });
    return arr;
  }, [nodes]);

  // Run d3-force layout
  useEffect(() => {
    if (!nodes.length) return;

    const simulation = forceSimulation(nodes as any)
      .numDimensions(3)
      .force('link', forceLink(links).id((d: any) => d.id).distance(50))
      .force('charge', forceManyBody().strength(-100))
      .force('center', forceCenter(0, 0, 0))
      .stop();

    // Run simulation synchronously for initial layout
    for (let i = 0; i < 300; ++i) simulation.tick();

    // Update InstancedMesh positions
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      nodes.forEach((node, i) => {
        dummy.position.set(node.x || 0, node.y || 0, node.z || 0);
        // Size inversely proportional to val (recency)
        const scale = Math.max(0.5, 3 / (node.val || 1));
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }

    // Update Lines
    if (linesRef.current) {
      const positions = new Float32Array(links.length * 6);
      links.forEach((link, i) => {
        const source = link.source as Node;
        const target = link.target as Node;
        positions[i * 6] = source.x || 0;
        positions[i * 6 + 1] = source.y || 0;
        positions[i * 6 + 2] = source.z || 0;
        positions[i * 6 + 3] = target.x || 0;
        positions[i * 6 + 4] = target.y || 0;
        positions[i * 6 + 5] = target.z || 0;
      });
      linesRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  }, [nodes, links]);

  // Interaction logic
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && e.instanceId !== hoveredIdx) {
      setHoveredIdx(e.instanceId);
      onNodeHover(nodes[e.instanceId]);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHoveredIdx(null);
    onNodeHover(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      onNodeClick(nodes[e.instanceId]);
      // Animate camera
      const node = nodes[e.instanceId];
      // Basic camera jump (can be enhanced with GSAP)
      camera.position.set((node.x || 0) + 20, (node.y || 0) + 20, (node.z || 0) + 50);
      camera.lookAt(node.x || 0, node.y || 0, node.z || 0);
    }
  };

  useFrame(() => {
    // Slow rotation
    if (meshRef.current && linesRef.current) {
      meshRef.current.rotation.y += 0.0005;
      linesRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial toneMapped={false}>
          <instancedBufferAttribute attach="color" args={[colorArray, 3]} />
        </meshBasicMaterial>
      </instancedMesh>

      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
};

export default function KnowledgeGraph3D() {
  const [data, setData] = useState<GraphData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    fetch('/api/graph')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-background">
      <Canvas camera={{ position: [0, 0, 150], fov: 60 }}>
        <color attach="background" args={['#050510']} />
        <ambientLight intensity={0.5} />
        
        {/* Particle Field Background */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={1000}
              array={new Float32Array(3000).map(() => (Math.random() - 0.5) * 500)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={1} color="#ffffff" transparent opacity={0.3} sizeAttenuation />
        </points>

        <GraphNodes 
          nodes={data.nodes} 
          links={data.links} 
          onNodeClick={setSelectedNode} 
          onNodeHover={setHoveredNode} 
        />
        
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>

      {/* Hover Tooltip */}
      {hoveredNode && !selectedNode && (
        <div className="absolute pointer-events-none z-10 p-4 glass-card text-textPrimary bottom-10 left-1/2 transform -translate-x-1/2 min-w-[250px]">
          <h3 className="font-heading font-bold text-lg mb-1">{hoveredNode.title}</h3>
          <p className="text-sm text-textSecondary line-clamp-2">{hoveredNode.summary}</p>
        </div>
      )}

      {/* Slide-in Side Panel for Selected Node */}
      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-96 glass-panel border-r-0 rounded-l-2xl rounded-r-none p-6 animate-in slide-in-from-right z-20 overflow-y-auto">
          <button 
            onClick={() => setSelectedNode(null)}
            className="absolute top-4 right-4 text-textSecondary hover:text-white"
          >
            ✕
          </button>
          <h2 className="text-2xl font-heading font-bold mb-4 mt-6">{selectedNode.title}</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedNode.tags.map(t => (
              <span key={t} className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-mono">
                #{t}
              </span>
            ))}
          </div>
          <h4 className="text-primary uppercase tracking-wider text-sm mb-2">AI Summary</h4>
          <div className="text-textSecondary mb-6 whitespace-pre-wrap leading-relaxed">
            {selectedNode.summary}
          </div>
          <a 
            href={selectedNode.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full py-3 bg-primary hover:bg-primary/80 text-center rounded-lg font-medium transition-colors"
          >
            Visit Original Link
          </a>
        </div>
      )}
    </div>
  );
}
