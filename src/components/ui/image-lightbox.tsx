import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ImageLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    imageAlt: string;
}

export function ImageLightbox({ isOpen, onClose, imageUrl, imageAlt }: ImageLightboxProps) {
    const [zoom, setZoom] = React.useState(1);

    // Reset zoom when image changes or modal closes
    useEffect(() => {
        if (!isOpen) {
            setZoom(1);
        }
    }, [isOpen, imageUrl]);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyboard = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === '+' || e.key === '=') {
                setZoom(prev => Math.min(prev + 0.25, 3));
            } else if (e.key === '-' || e.key === '_') {
                setZoom(prev => Math.max(prev - 0.25, 0.5));
            } else if (e.key === '0') {
                setZoom(1);
            }
        };

        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    }, [isOpen, onClose]);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleResetZoom = () => {
        setZoom(1);
    };

    const handleMaxZoom = () => {
        setZoom(3);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 bg-black/95 border-none rounded-none">
                <DialogTitle className="sr-only">{imageAlt}</DialogTitle>
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    {/* Zoom controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 rounded-lg p-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                        >
                            <ZoomOut className="h-5 w-5" />
                        </Button>
                        <span className="text-white text-sm font-medium min-w-[60px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                        >
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleMaxZoom}
                            disabled={zoom >= 3}
                            title="Maximize"
                        >
                            <Maximize2 className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20 ml-2"
                            onClick={handleResetZoom}
                        >
                            Reset
                        </Button>
                    </div>

                    {/* Image container with zoom and scroll */}
                    <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
                        <img
                            src={imageUrl}
                            alt={imageAlt}
                            className="object-contain transition-transform duration-200"
                            onDoubleClick={() => setZoom(prev => (prev >= 2.5 ? 1 : 2.5))}
                            style={{
                                transform: `scale(${zoom})`,
                                maxWidth: '100%',
                                maxHeight: '100%',
                            }}
                        />
                    </div>

                    {/* Keyboard shortcuts hint */}
                    <div className="absolute top-4 left-4 text-white/60 text-xs">
                        <p>Press ESC to close - +/- to zoom - 0 to reset - double click to zoom</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
