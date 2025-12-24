
import React, { useMemo } from 'react';
import { TreeMorphState } from '../types';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import Ribbon from './Ribbon';
import GroundSparkles from './GroundSparkles';
import { TREE_CONFIG, COLORS } from '../constants';

interface SceneProps {
  morphState: TreeMorphState;
}

const Scene: React.FC<SceneProps> = ({ morphState }) => {
  // Enhanced tree shape logic: true random volume distribution within a conical envelope
  const getTreePos = (index: number, total: number) => {
    // vertical position t (0 bottom, 1 top)
    // We use square root to bias more particles towards the bottom for a fuller base
    const t = 1.0 - Math.sqrt(Math.random());
    const y = t * TREE_CONFIG.height;
    
    const heightRatio = (TREE_CONFIG.height - y) / TREE_CONFIG.height;
    
    // Add tiers/branches effect by modulating the radius based on height
    const tiers = 7;
    const tierShape = 0.8 + 0.2 * Math.pow(Math.sin(heightRatio * tiers * Math.PI), 2.0);
    
    // Base radius at this height
    const radiusBase = heightRatio * TREE_CONFIG.baseRadius * tierShape;
    
    // Completely random angle to avoid any "lines" or "spirals" appearing as patterns
    const angle = Math.random() * Math.PI * 2;
    
    // Volume distribution: use sqrt(random) for uniform distribution across area of cross-section
    const volumeDensity = Math.sqrt(Math.random());
    const radius = radiusBase * volumeDensity;
    
    // Small jitter
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    return [x, y - TREE_CONFIG.height / 2, z] as [number, number, number];
  };

  const getScatterPos = () => {
    // Shell scatter effect
    const r = 12 + Math.random() * (TREE_CONFIG.scatterRadius - 12);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ] as [number, number, number];
  };

  const foliagePositions = useMemo(() => {
    const scatter = new Float32Array(TREE_CONFIG.foliageCount * 3);
    const tree = new Float32Array(TREE_CONFIG.foliageCount * 3);
    for (let i = 0; i < TREE_CONFIG.foliageCount; i++) {
      const s = getScatterPos();
      const t = getTreePos(i, TREE_CONFIG.foliageCount);
      scatter.set(s, i * 3);
      tree.set(t, i * 3);
    }
    return { scatter, tree };
  }, []);

  return (
    <group>
      <ambientLight intensity={0.6} />
      <spotLight position={[25, 40, 25]} angle={0.4} penumbra={1} intensity={5} color={COLORS.brightGold} castShadow />
      <pointLight position={[-15, 10, -15]} intensity={2.5} color={COLORS.emerald} />
      <pointLight position={[0, -2, 0]} intensity={4} color={COLORS.groundGold} distance={20} />
      
      <Foliage 
        morphState={morphState} 
        scatterPositions={foliagePositions.scatter} 
        treePositions={foliagePositions.tree} 
      />
      
      <Ornaments 
        morphState={morphState} 
        getTreePos={getTreePos} 
        getScatterPos={getScatterPos} 
      />

      <Ribbon morphState={morphState} />
      
      <GroundSparkles morphState={morphState} />

      {/* Luxury Reflection Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -TREE_CONFIG.height / 2 - 0.05, 0]} receiveShadow>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial 
            color={COLORS.deepEmerald}
            transparent 
            opacity={0.9} 
            metalness={1.0} 
            roughness={0.02} 
        />
      </mesh>
    </group>
  );
};

export default Scene;
