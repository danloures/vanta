import React, { useState, useRef, useEffect } from 'react';
import { generateCroppedImage } from './profileUtils';

interface VantaImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // Largura / Altura (Ex: 16/9, 1, 4/5)
  maskShape?: 'circle' | 'rect';
}

export const VantaImageCropper: React.FC<VantaImageCropperProps> = ({ 
  imageSrc, 
  onConfirm, 
  onCancel,
  aspectRatio = 1,
  maskShape = 'circle'
}) => {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Dimensões do Visor (Calculadas no mount)
  const [visorDim, setVisorDim] = useState({ width: 280, height: 280 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calcula o tamanho do visor baseado no AspectRatio e na tela
  useEffect(() => {
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.5;
    
    let w = 280;
    let h = 280;

    if (maskShape === 'circle') {
      // Círculo é sempre 1:1, fixo em 280px para consistência
      w = 280;
      h = 280;
    } else {
      // Retângulo: Tenta preencher a largura máxima permitida respeitando a altura
      const baseWidth = Math.min(340, maxWidth); 
      w = baseWidth;
      h = baseWidth / aspectRatio;
      
      // Se ficar muito alto, restringe pela altura
      if (h > maxHeight) {
        h = maxHeight;
        w = h * aspectRatio;
      }
    }
    setVisorDim({ width: w, height: h });
  }, [aspectRatio, maskShape]);

  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    
    // VANTA_LOGIC: Calcula a escala para PREENCHER (Cover) o visor completamente
    const currentWidth = img.naturalWidth;
    const currentHeight = img.naturalHeight;
    
    // A escala mínima é aquela que faz a imagem cobrir o visor em ambas as dimensões
    const scaleW = visorDim.width / currentWidth;
    const scaleH = visorDim.height / currentHeight;
    const scaleToFit = Math.max(scaleW, scaleH); // Use Max para 'cover' (preencher tudo)
    
    setMinZoom(scaleToFit);
    setZoom(scaleToFit);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !imageRef.current) return;
    const img = imageRef.current;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const nextX = clientX - dragStart.x;
    const nextY = clientY - dragStart.y;

    // VANTA_BOUNDARY_LOCK: Impede que a imagem descole das bordas do visor
    const scaledWidth = img.naturalWidth * zoom;
    const scaledHeight = img.naturalHeight * zoom;
    
    // Limite calculado para manter a imagem cobrindo todo o visor
    const limitX = Math.max(0, (scaledWidth - visorDim.width) / 2);
    const limitY = Math.max(0, (scaledHeight - visorDim.height) / 2);

    setPosition({
      x: Math.max(-limitX, Math.min(limitX, nextX)),
      y: Math.max(-limitY, Math.min(limitY, nextY))
    });
  };

  const handleConfirm = async () => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;

    // Fator de conversão entre visual e original
    const scale = img.naturalWidth / (img.naturalWidth * zoom);
    
    // Coordenadas precisas para recorte
    const cropX = ((img.naturalWidth * zoom / 2) - (visorDim.width / 2) - position.x) * scale;
    const cropY = ((img.naturalHeight * zoom / 2) - (visorDim.height / 2) - position.y) * scale;
    const cropWidth = visorDim.width * scale;
    const cropHeight = visorDim.height * scale;

    // Define a resolução de saída. Para logos (1:1), 800x800. Para Banners, maior.
    const outputWidth = maskShape === 'rect' ? 1280 : 800;
    const outputHeight = outputWidth / aspectRatio;

    const cropped = await generateCroppedImage(
      imageSrc, 
      { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
      outputWidth,
      outputHeight
    );

    onConfirm(cropped);
  };

  return (
    <div className="fixed inset-0 z-[12000] bg-black flex flex-col animate-in fade-in duration-300 overflow-hidden touch-none">
      <header className="px-8 pt-16 pb-6 flex justify-between items-center shrink-0">
        <button onClick={onCancel} className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Abortar</button>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Enquadramento</span>
          <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-widest mt-1 italic">
            {maskShape === 'circle' ? 'Centralize no Círculo' : 'Ajuste o Banner'}
          </span>
        </div>
        <button onClick={handleConfirm} className="text-white text-[10px] font-black uppercase tracking-widest bg-zinc-900 px-4 py-2 rounded-full border border-white/10">Confirmar</button>
      </header>

      <div 
        ref={containerRef}
        className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={() => setIsDragging(false)}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          onLoad={handleImageLoad}
          alt="Cropper"
          className="max-w-none select-none pointer-events-none transition-transform duration-75"
          style={{
            width: `${imageRef.current?.naturalWidth}px`,
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        />

        {/* Máscara VANTA Dinâmica */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-full h-full bg-black/70 flex items-center justify-center">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <mask id="visor-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {maskShape === 'circle' ? (
                    <circle cx="50%" cy="50%" r={visorDim.width / 2} fill="black" />
                  ) : (
                    <rect 
                      x="50%" 
                      y="50%" 
                      width={visorDim.width} 
                      height={visorDim.height} 
                      fill="black" 
                      transform={`translate(-${visorDim.width/2}, -${visorDim.height/2})`} 
                    />
                  )}
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.8)" mask="url(#visor-mask)" />
              
              {/* Bordas Douradas */}
              {maskShape === 'circle' ? (
                <circle cx="50%" cy="50%" r={visorDim.width / 2} fill="transparent" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4" />
              ) : (
                <rect 
                  x="50%" y="50%" 
                  width={visorDim.width} height={visorDim.height} 
                  fill="transparent" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4"
                  transform={`translate(-${visorDim.width/2}, -${visorDim.height/2})`} 
                />
              )}
            </svg>
            
            {/* Crosshair Central */}
            <div className="absolute w-4 h-[1px] bg-white/20"></div>
            <div className="absolute h-4 w-[1px] bg-white/20"></div>
          </div>
        </div>
      </div>

      <footer className="p-10 bg-black space-y-8 shrink-0">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Escala de Aproximação</span>
            <span className="text-[10px] text-white font-black">{Math.round((zoom / minZoom) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min={minZoom} 
            max={minZoom * 4} 
            step="0.0001" 
            value={zoom} 
            onChange={(e) => {
              const newZoom = parseFloat(e.target.value);
              setZoom(newZoom);
              // Reposicionamento automático para manter Boundary Lock ao dar zoom out
              setPosition(prev => {
                if (!imageRef.current) return prev;
                const scaledW = imageRef.current.naturalWidth * newZoom;
                const scaledH = imageRef.current.naturalHeight * newZoom;
                const limX = Math.max(0, (scaledW - visorDim.width) / 2);
                const limY = Math.max(0, (scaledH - visorDim.height) / 2);
                return {
                  x: Math.max(-limX, Math.min(limX, prev.x)),
                  y: Math.max(-limY, Math.min(limY, prev.y))
                };
              });
            }}
            className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
          />
        </div>
      </footer>
    </div>
  );
};