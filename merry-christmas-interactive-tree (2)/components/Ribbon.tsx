
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState } from '../types';
import { TREE_CONFIG, COLORS } from '../constants';

interface RibbonProps {
  morphState: TreeMorphState;
}

const Ribbon: React.FC<RibbonProps> = ({ morphState }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const { scatter, tree } = useMemo(() => {
    const s = new Float32Array(TREE_CONFIG.ribbonPoints * 3);
    const t = new Float32Array(TREE_CONFIG.ribbonPoints * 3);
    
    for (let i = 0; i < TREE_CONFIG.ribbonPoints; i++) {
      // Scatter: random cloud
      const r = 5 + Math.random() * (TREE_CONFIG.scatterRadius - 5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      s[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      s[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      s[i * 3 + 2] = r * Math.cos(phi);

      // Tree: Dynamic spiral with slight "sag" between branches
      const p = i / TREE_CONFIG.ribbonPoints;
      const angle = p * Math.PI * 20; 
      const y = p * TREE_CONFIG.height - (TREE_CONFIG.height / 2);
      
      const heightRatio = (TREE_CONFIG.height - (y + TREE_CONFIG.height/2)) / TREE_CONFIG.height;
      // Slightly larger radius than foliage
      const radius = heightRatio * TREE_CONFIG.baseRadius * 1.15 + Math.sin(angle * 5) * 0.1; 
      
      t[i * 3] = Math.cos(angle) * radius;
      t[i * 3 + 1] = y;
      t[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return { scatter: s, tree: t };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color(COLORS.ribbonGold) }
  }), []);

  useFrame((state, delta) => {
    materialRef.current.uniforms.uTime.value += delta;
    const target = morphState === TreeMorphState.TREE_SHAPE ? 1 : 0;
    materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uProgress.value,
      target,
      delta * 1.5
    );
  });

  const vertexShader = `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    varying float vGlow;

    void main() {
      vec3 pos = mix(aScatterPos, aTreePos, uProgress);
      
      // Flowing light effect
      float wave = sin(uTime * 1.5 + pos.y * 1.0) * 0.05;
      pos.x += wave;
      pos.z += cos(uTime * 1.2 + pos.y * 0.8) * 0.05;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      gl_PointSize = (22.0 * (1.0 + uProgress * 0.3)) / -mvPosition.z;
      vGlow = sin(uTime * 4.0 - float(gl_VertexID) * 0.02) * 0.5 + 0.5;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    varying float vGlow;
    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.1, dist) * (0.3 + vGlow * 0.7);
      gl_FragColor = vec4(uColor + vGlow * 0.3, alpha);
    }
  `;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={TREE_CONFIG.ribbonPoints} array={scatter} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={TREE_CONFIG.ribbonPoints} array={scatter} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={TREE_CONFIG.ribbonPoints} array={tree} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Ribbon;
