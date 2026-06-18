import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerModalProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScannerModal({ onScan, onClose }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "html5qrcode-scanner-viewport";

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(elementId);
    scannerRef.current = html5Qrcode;

    let isMounted = true;

    const startScanner = async () => {
      try {
        if (!isMounted) return;
        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              // Wider window designed specifically for 1D barcodes
              const w = Math.min(width * 0.85, 260);
              const h = Math.min(height * 0.35, 100);
              return { width: w, height: h };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              onScan(decodedText);
              handleStop();
            }
          },
          () => {
            // Suppress verbose frame-by-frame scanner errors
          }
        );
      } catch (err) {
        console.error("Error starting camera scanner:", err);
      }
    };

    // Slight delay to ensure element is mounted in DOM
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(err => console.error("Error stopping scanner in cleanup:", err));
      }
    };
  }, [onScan]);

  const handleStop = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner manually:", err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Lector de Cámara Web</span>
          </div>
          <button type="button" onClick={handleStop} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="p-5 bg-slate-950 flex flex-col items-center justify-center relative min-h-[260px]">
          <div id={elementId} className="w-full max-w-[280px] aspect-square rounded-lg overflow-hidden bg-black border border-slate-800"></div>
          <p className="text-[10.5px] text-slate-400 mt-3.5 text-center px-4 leading-normal">
            Apunta la cámara del dispositivo al código de barras del producto. Manténlo centrado y dentro del cuadro de enfoque.
          </p>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-50 border-t flex justify-end">
          <button
            type="button"
            onClick={handleStop}
            className="px-4 py-1.5 border border-slate-250 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-650 transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
