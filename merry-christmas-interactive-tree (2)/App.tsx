
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { TreeMorphState } from './types';
import Scene from './components/Scene';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleState = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setState(prev => prev === TreeMorphState.SCATTERED ? TreeMorphState.TREE_SHAPE : TreeMorphState.SCATTERED);
    setTimeout(() => setIsTransitioning(false), 2000);
  };

  return (
    <div className="relative w-full h-screen bg-[#011a11]">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col items-center justify-between py-16 px-6">
        <header className="text-center flex flex-col items-center gap-4">
          <h1 className="text-5xl md:text-8xl font-serif text-[#D4AF37] tracking-widest drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] animate-fade-in uppercase">
            Merry Christmas
          </h1>
          
          <div className={`transition-all duration-1000 ease-out transform ${state === TreeMorphState.TREE_SHAPE ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}>
            <p className="text-3xl md:text-5xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF9E3] to-[#D4AF37] drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              愿珠珠姐新的一年事事顺遂
            </p>
          </div>
        </header>

        <footer className="pointer-events-auto flex flex-col items-center gap-4">
          <button
            onClick={toggleState}
            className={`group relative px-12 py-5 rounded-full border border-[#D4AF37]/40 transition-all duration-700 uppercase tracking-[0.3em] text-xs font-bold overflow-hidden
              ${state === TreeMorphState.TREE_SHAPE 
                ? 'bg-[#D4AF37] text-[#011a11] shadow-[0_0_50px_rgba(212,175,55,0.5)] scale-110' 
                : 'bg-transparent text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}
          >
            <span className="relative z-10">{state === TreeMorphState.TREE_SHAPE ? 'Release Magic' : 'Summon Tree'}</span>
            {state === TreeMorphState.SCATTERED && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            )}
          </button>
          <p className="text-[#D4AF37]/40 text-[10px] tracking-widest">INTERACTIVE 3D EXPERIENCE</p>
        </footer>
      </div>

      {/* 3D Canvas */}
      <Canvas shadows gl={{ antialias: true, stencil: false, powerPreference: 'high-performance' }}>
        <PerspectiveCamera makeDefault position={[0, 4, 22]} fov={40} />
        <color attach="background" args={[COLORS.deepEmerald]} />
        <fog attach="fog" args={[COLORS.deepEmerald, 15, 45]} />
        
        <Suspense fallback={null}>
          <Scene morphState={state} />
          <Environment preset="night" />
          <Stars radius={120} depth={60} count={7000} factor={6} saturation={0.5} fade speed={1.5} />
        </Suspense>

        <OrbitControls 
          enablePan={false} 
          minDistance={12} 
          maxDistance={35} 
          autoRotate={state === TreeMorphState.TREE_SHAPE} 
          autoRotateSpeed={0.4} 
        />

        <EffectComposer multisampling={4}>
          <Bloom 
            luminanceThreshold={0.6} 
            mipmapBlur 
            intensity={1.8} 
            radius={0.5} 
          />
          <ChromaticAberration offset={[0.0005, 0.0005]} />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.1} darkness={1.0} />
        </EffectComposer>
      </Canvas>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-fade-in { animation: fade-in 2s cubic-bezier(0.2, 0, 0.2, 1) forwards; }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}</style>
    </div>
  );
};

export default App;
