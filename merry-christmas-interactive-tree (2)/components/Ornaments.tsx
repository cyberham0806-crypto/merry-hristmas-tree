
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, OrnamentData } from '../types';
import { TREE_CONFIG, COLORS } from '../constants';

interface OrnamentsProps {
  morphState: TreeMorphState;
  getTreePos: (index: number, total: number) => [number, number, number];
  getScatterPos: () => [number, number, number];
}

const Ornaments: React.FC<OrnamentsProps> = ({ morphState, getTreePos, getScatterPos }) => {
  const ballMeshRef = useRef<THREE.InstancedMesh>(null!);
  const boxMeshRef = useRef<THREE.InstancedMesh>(null!);
  const starMeshRef = useRef<THREE.InstancedMesh>(null!);
  const lightMeshRef = useRef<THREE.InstancedMesh>(null!);
  const topStarRef = useRef<THREE.Group>(null!);

  const ornamentData = useMemo(() => {
    const data: OrnamentData[] = [];
    for (let i = 0; i < TREE_CONFIG.ornamentCount; i++) {
      const types: ('ball' | 'box' | 'star' | 'light')[] = ['ball', 'ball', 'box', 'box', 'star', 'light', 'light'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      // For ornaments, we want them slightly more towards the "surface" of the tree
      // but still scattered throughout. We generate a fresh tree pos for each.
      const tPos = getTreePos(i, TREE_CONFIG.ornamentCount);
      // Nudge towards surface:
      const v = new THREE.Vector3(...tPos);
      const centerLineY = v.y;
      const distFromY = Math.sqrt(v.x * v.x + v.z * v.z);
      // Multiplier to push items outward slightly
      const push = 1.0 + Math.random() * 0.15;
      v.x *= push;
      v.z *= push;

      data.push({
        scatterPos: getScatterPos(),
        treePos: [v.x, v.y, v.z],
        type,
        scale: type === 'box' ? Math.random() * 0.5 + 0.5 : Math.random() * 0.4 + 0.3,
        weight: Math.random() * 2.5 + 1.5
      });
    }
    return data;
  }, [getTreePos, getScatterPos]);

  const progressRef = useRef(0);
  const tempObject = new THREE.Object3D();

  useFrame((state, delta) => {
    const target = morphState === TreeMorphState.TREE_SHAPE ? 1 : 0;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * 1.5);

    let ballIdx = 0, boxIdx = 0, starIdx = 0, lightIdx = 0;
    const time = state.clock.getElapsedTime();

    ornamentData.forEach((d, i) => {
      const pos = new THREE.Vector3().fromArray(d.scatterPos);
      const tree = new THREE.Vector3().fromArray(d.treePos);
      pos.lerp(tree, progressRef.current);

      // Subtle organic drift when scattered, breathing when gathered
      const drift = (1.0 - progressRef.current) * d.weight * 0.4 + progressRef.current * 0.05;
      pos.y += Math.sin(time * 0.6 + i) * drift;
      pos.x += Math.cos(time * 0.4 + i) * drift;

      tempObject.position.copy(pos);
      tempObject.scale.setScalar(d.scale * (0.8 + 0.2 * Math.sin(time * 1.5 + i)));
      tempObject.rotation.set(time * 0.2 + i, time * 0.3 + i, time * 0.1);
      tempObject.updateMatrix();

      if (d.type === 'ball') {
        ballMeshRef.current.setMatrixAt(ballIdx++, tempObject.matrix);
      } else if (d.type === 'box') {
        boxMeshRef.current.setMatrixAt(boxIdx++, tempObject.matrix);
      } else if (d.type === 'star') {
        starMeshRef.current.setMatrixAt(starIdx++, tempObject.matrix);
      } else {
        lightMeshRef.current.setMatrixAt(lightIdx++, tempObject.matrix);
      }
    });

    ballMeshRef.current.instanceMatrix.needsUpdate = true;
    boxMeshRef.current.instanceMatrix.needsUpdate = true;
    starMeshRef.current.instanceMatrix.needsUpdate = true;
    lightMeshRef.current.instanceMatrix.needsUpdate = true;

    if (topStarRef.current) {
        const topScatter = new THREE.Vector3(0, 15, 0);
        const topTree = new THREE.Vector3(0, TREE_CONFIG.height / 2 + 0.6, 0);
        topStarRef.current.position.lerpVectors(topScatter, topTree, progressRef.current);
        topStarRef.current.rotation.y = time * 0.8;
        topStarRef.current.scale.setScalar(1.5 * progressRef.current + 0.001);
    }
  });

  const counts = useMemo(() => ({
    ball: ornamentData.filter(d => d.type === 'ball').length,
    box: ornamentData.filter(d => d.type === 'box').length,
    star: ornamentData.filter(d => d.type === 'star').length,
    light: ornamentData.filter(d => d.type === 'light').length,
  }), [ornamentData]);

  return (
    <>
      {/* Heavy Element: Gift Boxes */}
      <instancedMesh ref={boxMeshRef} args={[undefined, undefined, counts.box]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshPhysicalMaterial 
            color={COLORS.festiveRed} 
            metalness={0.4} 
            roughness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.1}
            emissive={COLORS.festiveRed}
            emissiveIntensity={0.1}
        />
      </instancedMesh>

      {/* Light Element: Metallic Balls */}
      <instancedMesh ref={ballMeshRef} args={[undefined, undefined, counts.ball]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial 
            color={COLORS.gold} 
            metalness={1.0} 
            roughness={0.01} 
            envMapIntensity={2.5}
        />
      </instancedMesh>

      {/* Light Element: Small Stars */}
      <instancedMesh ref={starMeshRef} args={[undefined, undefined, counts.star]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial 
            color={COLORS.warmWhite} 
            emissive={COLORS.warmWhite} 
            emissiveIntensity={5} 
        />
      </instancedMesh>

      {/* Extremely Light Element: Glow Lights */}
      <instancedMesh ref={lightMeshRef} args={[undefined, undefined, counts.light]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial 
            color={COLORS.lightPoint} 
            emissive={COLORS.lightPoint} 
            emissiveIntensity={10} 
        />
      </instancedMesh>

      {/* Majestic Top Star */}
      <group ref={topStarRef}>
          <mesh>
              <octahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial 
                color={COLORS.brightGold} 
                emissive={COLORS.brightGold} 
                emissiveIntensity={12} 
              />
          </mesh>
          <pointLight intensity={8} distance={12} color={COLORS.brightGold} />
      </group>
    </>
  );
};

export default Ornaments;
