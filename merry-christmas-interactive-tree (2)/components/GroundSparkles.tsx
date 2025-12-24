
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState } from '../types';
import { TREE_CONFIG, COLORS } from '../constants';

interface GroundSparklesProps {
  morphState: TreeMorphState;
}

const GroundSparkles: React.FC<GroundSparklesProps> = ({ morphState }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const { scatter, tree } = useMemo(() => {
    const s = new Float32Array(TREE_CONFIG.groundSparkleCount * 3);
    const t = new Float32Array(TREE_CONFIG.groundSparkleCount * 3);
    
    for (let i = 0; i < TREE_CONFIG.groundSparkleCount; i++) {
      // Scatter: Random sphere with more spread
      const rS = Math.random() * TREE_CONFIG.scatterRadius * 1.2;
      const thetaS = Math.random() * Math.PI * 2;
      const phiS = Math.random() * Math.PI;
      s[i * 3] = rS * Math.sin(phiS) * Math.cos(thetaS);
      s[i * 3 + 1] = rS * Math.sin(phiS) * Math.sin(thetaS);
      s[i * 3 + 2] = rS * Math.cos(phiS);

      // Tree: Localized golden disk at base with concentration near center
      const angleT = Math.random() * Math.PI * 2;
      // Use square root for uniform disk, but power of 1.5 for center weighting
      const radiusT = Math.pow(Math.random(), 1.5) * TREE_CONFIG.baseRadius * 1.8;
      t[i * 3] = Math.cos(angleT) * radiusT;
      t[i * 3 + 1] = -TREE_CONFIG.height / 2 + 0.08; 
      t[i * 3 + 2] = Math.sin(angleT) * radiusT;
    }
    return { scatter: s, tree: t };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColor: { value: new THREE.Color(COLORS.groundGold) }
  }), []);

  useFrame((state, delta) => {
    materialRef.current.uniforms.uTime.value += delta;
    const target = morphState === TreeMorphState.TREE_SHAPE ? 1 : 0;
    materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uProgress.value,
      target,
      delta * 1.0
    );
  });

  const vertexShader = `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    varying float vOpacity;
    varying float vDistance;

    void main() {
      vec3 pos = mix(aScatterPos, aTreePos, uProgress);
      
      // Magical drifting movement
      float drift = sin(uTime * 1.2 + float(gl_VertexID) * 0.1) * 0.15;
      pos.x += drift * (1.0 - uProgress * 0.5);
      pos.z += cos(uTime * 1.0 + float(gl_VertexID) * 0.05) * 0.15 * (1.0 - uProgress * 0.5);
      
      // Twinkle effect
      float twinkle = sin(uTime * 4.0 + float(gl_VertexID)) * 0.5 + 0.5;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      gl_PointSize = (10.0 * (0.4 + twinkle * 0.8)) / -mvPosition.z;
      
      // Fade based on distance from center when in tree shape
      vDistance = length(pos.xz) / (TREE_CONFIG_BASE_RADIUS * 1.8);
      vOpacity = (0.2 + twinkle * 0.8) * uProgress * smoothstep(1.0, 0.3, vDistance);
    }
  `.replace('TREE_CONFIG_BASE_RADIUS', TREE_CONFIG.baseRadius.toString());

  const fragmentShader = `
    uniform vec3 uColor;
    varying float vOpacity;
    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      // High intensity golden core
      vec3 color = uColor + 0.3 * (1.0 - dist * 2.0);
      gl_FragColor = vec4(color, vOpacity * smoothstep(0.5, 0.0, dist));
    }
  `;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={TREE_CONFIG.groundSparkleCount} array={scatter} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={TREE_CONFIG.groundSparkleCount} array={scatter} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={TREE_CONFIG.groundSparkleCount} array={tree} itemSize={3} />
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

export default GroundSparkles;
