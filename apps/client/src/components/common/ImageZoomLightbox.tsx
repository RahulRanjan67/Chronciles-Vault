import * as React from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ExternalLink,
  Play,
} from "lucide-react";

export interface ImageZoomLightboxProps {
  src: string;
  title: string;
  caption?: string;
  routePath?: string;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export function ImageZoomLightbox({
  src,
  title,
  caption,
  routePath,
  onClose,
  onNavigate,
}: ImageZoomLightboxProps) {
  const [zoom, setZoom] = React.useState<number>(1);
  const [pan, setPan] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom & pan when image changes
  React.useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [src]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))));
      } else if (e.key === "-" || e.key === "_") {
        setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
      } else if (e.key === "0") {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4, Number((z + 0.15).toFixed(2))));
    } else {
      setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
    }
  };

  // Drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleToggleZoom = () => {
    if (zoom === 1) {
      setZoom(1.75);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Lightbox Top Header */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 z-10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm sm:text-base truncate">
              {title}
            </h3>
            {routePath && (
              <span className="text-[11px] font-mono text-white/60">
                Route: {routePath}
              </span>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-white min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))))}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            title="Reset Zoom (0)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleZoom}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            title={zoom === 1 ? "Zoom 175%" : "Fit to View"}
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {routePath && onNavigate && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate(routePath);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gm-accent-strong,#4f46e5)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <Play className="h-3 w-3 fill-current" />
              <span className="hidden sm:inline">Try Feature</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/20 mx-1" />

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Close Lightbox (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center p-4 relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) handleToggleZoom();
          }}
        >
          <img
            src={src}
            alt={title}
            className="max-w-[90vw] max-h-[78vh] object-contain rounded-md shadow-2xl pointer-events-none select-none border border-white/10"
          />
        </div>
      </div>

      {/* Lightbox Bottom Footer / Caption */}
      <div
        className="px-6 py-3 border-t border-white/10 bg-black/60 text-center z-10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {caption && (
          <p className="text-white/90 text-xs sm:text-sm font-medium max-w-3xl mx-auto leading-relaxed">
            {caption}
          </p>
        )}
        <p className="text-[11px] font-mono text-white/50 mt-1">
          Double-click or scroll wheel to zoom • Drag to pan when zoomed • Press Esc to close
        </p>
      </div>
    </div>
  );
}
