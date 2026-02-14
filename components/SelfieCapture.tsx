
import React, { useRef, useState, useEffect } from 'react';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

interface SelfieCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  ctaLabel?: string;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({ onCapture, onCancel, ctaLabel = "Confirmar Biometria" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VANTA_VALIDATION States
  const [detector, setDetector] = useState<FaceDetector | null>(null);
  const [validationStatus, setValidationStatus] = useState<'IDLE' | 'CHECKING' | 'VALID' | 'INVALID'>('IDLE');
  const [instruction, setInstruction] = useState<string>("Iniciando sensor biométrico...");
  const analysisLoopRef = useRef<number | null>(null);

  // 1. Inicializa o Modelo de IA (MediaPipe)
  useEffect(() => {
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });
        setDetector(faceDetector);
        setInstruction("Aguardando câmera...");
      } catch (err) {
        console.error("Erro ao carregar IA:", err);
        // Fallback: Permite uso sem IA se falhar o carregamento (graceful degradation)
        setValidationStatus('VALID');
        setInstruction("");
      }
    };
    loadModel();
  }, []);

  // 2. Inicializa Câmera
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (analysisLoopRef.current) cancelAnimationFrame(analysisLoopRef.current);
    };
  }, []);

  // 3. Loop de Validação (Brilho + Rosto)
  useEffect(() => {
    if (isCameraReady && detector && !capturedUrl) {
      startValidationLoop();
    }
  }, [isCameraReady, detector, capturedUrl]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadeddata = () => setIsCameraReady(true);
      }
    } catch (err: any) {
      console.error("Erro câmera:", err);
      setError("Permissão de câmera necessária para biometria.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const calculateBrightness = (video: HTMLVideoElement): number => {
    const canvas = document.createElement('canvas');
    canvas.width = 50; // Baixa resolução para performance
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 100;
    
    ctx.drawImage(video, 0, 0, 50, 50);
    const imageData = ctx.getImageData(0, 0, 50, 50);
    const data = imageData.data;
    let r, g, b, avg;
    let colorSum = 0;

    for (let x = 0, len = data.length; x < len; x += 4) {
      r = data[x];
      g = data[x + 1];
      b = data[x + 2];
      avg = Math.floor((r + g + b) / 3);
      colorSum += avg;
    }

    return Math.floor(colorSum / (50 * 50));
  };

  const startValidationLoop = () => {
    const analyze = async () => {
      if (!videoRef.current || !detector) return;
      
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        analysisLoopRef.current = requestAnimationFrame(analyze);
        return;
      }

      const startTimeMs = performance.now();
      
      // A. Check de Iluminação
      const brightness = calculateBrightness(video);
      if (brightness < 40) {
        setInstruction("Ambiente muito escuro. Melhore a luz.");
        setValidationStatus('INVALID');
        analysisLoopRef.current = requestAnimationFrame(analyze);
        return;
      }

      // B. Check de Rosto (IA)
      try {
        const detections = detector.detectForVideo(video, startTimeMs);
        
        if (detections.detections.length === 0) {
          setInstruction("Rosto não detectado.");
          setValidationStatus('INVALID');
        } else if (detections.detections.length > 1) {
          setInstruction("Apenas uma pessoa permitida.");
          setValidationStatus('INVALID');
        } else {
          // Análise Geométrica
          const face = detections.detections[0];
          const box = face.boundingBox;
          const faceWidthRatio = box.width / video.videoWidth;
          const centerX = box.originX + (box.width / 2);
          const centerDev = Math.abs((video.videoWidth / 2) - centerX) / video.videoWidth;

          if (faceWidthRatio < 0.20) {
            setInstruction("Aproxime o rosto.");
            setValidationStatus('INVALID');
          } else if (faceWidthRatio > 0.75) {
            setInstruction("Afaste-se um pouco.");
            setValidationStatus('INVALID');
          } else if (centerDev > 0.15) {
            setInstruction("Centralize o rosto.");
            setValidationStatus('INVALID');
          } else if ((face.categories[0]?.score ?? 0) < 0.7) {
             setInstruction("Mantenha o rosto firme.");
             setValidationStatus('INVALID');
          } else {
            setInstruction("Perfeito. Toque para capturar.");
            setValidationStatus('VALID');
          }
        }
      } catch (e) {
        console.warn("MediaPipe error:", e);
      }

      analysisLoopRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  const takePhoto = () => {
    // Só permite foto se estiver validado ou se não houver câmera (fallback lógico)
    if (validationStatus !== 'VALID' && isCameraReady) return;

    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Configura canvas para o tamanho do vídeo para manter proporção
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Espelha a imagem
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // VANTA_OPTIMIZATION: Qualidade 0.8
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedUrl(URL.createObjectURL(blob));
        stopCamera();
        if (analysisLoopRef.current) cancelAnimationFrame(analysisLoopRef.current);
      }
    }, 'image/jpeg', 0.8);
  };

  const retake = () => {
    setCapturedBlob(null);
    setCapturedUrl(null);
    setValidationStatus('IDLE');
    setInstruction("Reiniciando sensores...");
    startCamera();
  };

  // Cores de Feedback
  const getBorderColor = () => {
    if (capturedUrl) return 'border-white/20';
    if (validationStatus === 'VALID') return 'border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.5)]';
    if (validationStatus === 'INVALID') return 'border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]';
    return 'border-white/10';
  };

  return (
    <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h3 className="text-white text-sm font-black uppercase tracking-widest">Biometria Facial</h3>
        <p className={`text-[8px] font-black uppercase tracking-[0.3em] leading-relaxed transition-colors duration-300 ${
          validationStatus === 'INVALID' ? 'text-red-400' : 
          validationStatus === 'VALID' ? 'text-[#d4af37]' : 'text-zinc-500'
        }`}>
          {capturedBlob ? 'VERIFIQUE SUA FOTO' : instruction}
        </p>
      </div>

      <div className={`relative w-72 h-72 rounded-full border-4 overflow-hidden bg-zinc-900 transition-all duration-300 ${getBorderColor()}`}>
        {!capturedUrl ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {(!isCameraReady || !detector) && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-8 h-8 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-900">
                <span className="text-red-500 text-[9px] font-black uppercase leading-relaxed">{error}</span>
              </div>
            )}
            
            {/* Overlay de Guia (HUD) */}
            <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none rounded-full"></div>
            
            {/* Indicador de Centralização */}
            {validationStatus === 'VALID' && (
              <div className="absolute inset-4 border-2 border-[#d4af37]/30 rounded-full animate-pulse pointer-events-none"></div>
            )}
          </>
        ) : (
          <img src={capturedUrl} className="w-full h-full object-cover scale-x-[-1]" alt="Selfie" />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full flex flex-col gap-3">
        {!capturedUrl ? (
          <>
            <button 
              onClick={takePhoto} 
              disabled={!isCameraReady || validationStatus !== 'VALID'}
              className={`w-full py-5 font-black rounded-full uppercase text-[10px] tracking-widest transition-all shadow-xl ${
                validationStatus === 'VALID' 
                  ? 'bg-white text-black active:scale-95' 
                  : 'bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
              }`}
            >
              {validationStatus === 'VALID' ? 'Capturar' : 'Ajuste o Rosto...'}
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => onCapture(capturedBlob!)} 
              className="w-full py-5 bg-[#d4af37] text-black font-black rounded-full uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {ctaLabel}
            </button>
            <button 
              onClick={retake} 
              className="w-full py-4 text-zinc-600 text-[8px] font-black uppercase tracking-widest"
            >
              Refazer Captura
            </button>
          </>
        )}
      </div>
    </div>
  );
};
