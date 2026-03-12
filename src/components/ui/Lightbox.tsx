'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getOptimizedImageUrl } from '@/lib/cloudinary-client'

interface LightboxProps {
    images: string[]
    currentIndex: number
    isOpen: boolean
    onClose: () => void
    onNavigate: (index: number) => void
}

export function Lightbox({ images, currentIndex, isOpen, onClose, onNavigate }: LightboxProps) {
    const [zoom, setZoom] = useState(1)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length)
            if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length)
        }

        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'auto'
        }
    }, [isOpen, currentIndex, images.length, onClose, onNavigate])

    const handleDownload = () => {
        const url = images[currentIndex]
        const link = document.createElement('a')
        link.href = url
        link.download = `mahi-gallery-${currentIndex + 1}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center select-none"
                >
                    {/* Header Controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                        <span className="text-white/60 text-sm font-medium ml-4">
                            {currentIndex + 1} / {images.length}
                        </span>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setZoom(z => z === 1 ? 2 : 1)}
                                className="p-2 text-white/80 hover:text-white transition-colors"
                                title="Zoom"
                            >
                                <ZoomIn className="h-6 w-6" />
                            </button>
                            <button 
                                onClick={handleDownload}
                                className="p-2 text-white/80 hover:text-white transition-colors"
                                title="Download"
                            >
                                <Download className="h-6 w-6" />
                            </button>
                            <button 
                                onClick={onClose}
                                className="p-2 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20 ml-2"
                                title="Close (Esc)"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
                                className="absolute left-4 p-4 text-white/50 hover:text-white transition-colors z-10"
                            >
                                <ChevronLeft className="h-10 w-10" />
                            </button>
                            <button
                                onClick={() => onNavigate((currentIndex + 1) % images.length)}
                                className="absolute right-4 p-4 text-white/50 hover:text-white transition-colors z-10"
                            >
                                <ChevronRight className="h-10 w-10" />
                            </button>
                        </>
                    )}

                    {/* Main Image Container */}
                    <div className="w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden">
                        <motion.img
                            key={images[currentIndex]}
                            src={getOptimizedImageUrl(images[currentIndex], 1600)}
                            alt={`Gallery image ${currentIndex + 1}`}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: zoom, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="max-w-full max-h-full object-contain cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Thumbnails (Optional strip at bottom) */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-2 overflow-x-auto no-scrollbar">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => onNavigate(i)}
                                className={`relative w-12 h-12 rounded-sm overflow-hidden flex-shrink-0 transition-all duration-300 ${
                                    i === currentIndex ? 'ring-2 ring-accent scale-110 opacity-100' : 'opacity-40 hover:opacity-70'
                                }`}
                            >
                                <img src={getOptimizedImageUrl(img, 100)} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
