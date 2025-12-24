
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState } from '../types';
import { TREE_CONFIG, COLORS } from '../constants';

interface FoliageProps {
  morphState: TreeMorphState;
  scatterPositions: Float32Array;
  treePositions: Float32Array;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vRotation;
  varying float vSparkle;

  void main() {
    vec3 pos = mix(aScatterPos, aTreePos, uProgress);
    
    // Smooth drifting when scattered
    float id = float(gl_VertexID);
    float freq = 0.4 + fract(id * 0.0005);
    float amplitude = 0.3 * (1.0 - uProgress) + 0.08 * uProgress;
    pos.x += sin(uTime * freq + id) * amplitude;
    pos.z += cos(uTime * freq * 0.7 + id * 1.1) * amplitude;
    pos.y += sin(uTime * 0.3 + id * 0.5) * 0.05 * uProgress;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float sparkle = sin(uTime * 4.0 + id * 0.1) * 0.5 + 0.5;
    vSparkle = sparkle;
    
    // SIZE INCREASE: Making particles larger for "leaf" clusters effect
    gl_PointSize = (65.0 * (0.8 + uProgress * 0.6 + sparkle * 0.4)) / -mvPosition.z;
    
    vRotation = id * 0.77;
    
    // Richer High-Fidelity Colors
    vec3 deepGreen = vec3(0.002, 0.08, 0.04); 
    vec3 brightEmerald = vec3(0.01, 0.5, 0.25); 
    vec3 richGold = vec3(0.95, 0.8, 0.1); 
    
    float randVal = fract(sin(id) * 43758.5453);
    vec3 leafCol = mix(deepGreen, brightEmerald, randVal);
    
    // Highlight tips and outer edges
    float heightFactor = clamp((pos.y + 4.5) / 9.0, 0.0, 1.0);
    float radialFactor = length(pos.xz) / TREE_CONFIG_BASE_RADIUS;
    
    vColor = mix(leafCol, richGold, pow(heightFactor, 4.0) * 0.6 * uProgress + pow(radialFactor, 2.0) * 0.15 * uProgress + sparkle * 0.2 * uProgress);
    
    vOpacity = (0.4 + 0.6 * uProgress);
  }
`.replace('TREE_CONFIG_BASE_RADIUS', TREE_CONFIG.baseRadius.toString());

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  varying float vRotation;
  varying float vSparkle;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    
    float s = sin(vRotation);
    float c = cos(vRotation);
    vec2 rot = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
    
    // Leaf shape: elongated soft blade
    float dist = length(rot * vec2(3.0, 0.75)); 
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.05, dist) * vOpacity;
    
    vec3 finalCol = vColor;
    if (vSparkle > 0.85) {
        finalCol += 0.5;
    }
    
    gl_FragColor = vec4(finalCol, alpha);
  }
`;

const Foliage: React.FC<FoliageProps> = ({ morphState, scatterPositions, treePositions }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 }
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

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={TREE_CONFIG.foliageCount} array={scatterPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={TREE_CONFIG.foliageCount} array={scatterPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={TREE_CONFIG.foliageCount} array={treePositions} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </points>
  );
};

export default Foliage;
