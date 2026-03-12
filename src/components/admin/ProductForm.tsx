'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Upload, Loader2, Image as ImageIcon, LayoutList, Settings, ShoppingCart, TrendingUp } from 'lucide-react'
import { Product } from '@/types'

interface Collection {
    id: string
    name: string
}

export interface ProductFormData {
    name: string
    description: string
    metal_type: 'gold' | 'silver' | 'diamond' // Adjusted to match select options
    purity: string
    weight: string // form uses string for input
    making_charge_type: 'percentage' | 'fixed'
    making_charge_value: string
    stock: string
    is_featured: boolean
    collection_id: string
}

interface ProductFormProps {
    initialData?: Product
    onSubmit: (data: ProductFormData, newImages: File[]) => Promise<void>
    loading: boolean
    onDeleteImage?: (imageUrl: string) => Promise<void>
}

export function ProductForm({ initialData, onSubmit, loading, onDeleteImage }: ProductFormProps) {
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [existingImages, setExistingImages] = useState<string[]>([])
    const [collections, setCollections] = useState<Collection[]>([])

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        metal_type: 'gold',
        purity: '22K',
        weight: '',
        making_charge_type: 'percentage',
        making_charge_value: '',
        stock: '',
        is_featured: false,
        collection_id: ''
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                // @ts-ignore
                metal_type: initialData.metal_type,
                purity: initialData.purity,
                weight: initialData.weight.toString(),
                making_charge_type: initialData.making_charge_type,
                making_charge_value: initialData.making_charge_value.toString(),
                stock: initialData.stock.toString(),
                is_featured: initialData.is_featured,
                collection_id: initialData.collection_id || ''
            })
            if (initialData.images) {
                setExistingImages(initialData.images)
            }
        }
    }, [initialData])

    useEffect(() => {
        const fetchCollections = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('collections')
                .select('id, name')
                .eq('is_active', true)
                .order('name')
            
            if (data) setCollections(data)
        }
        fetchCollections()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files)
            setImages((prev) => [...prev, ...filesArray])

            const newPreviews = filesArray.map((file) => URL.createObjectURL(file))
            setImagePreviews((prev) => [...prev, ...newPreviews])
        }
    }

    const removeNewImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
        setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    }

    const handleRemoveExistingImage = async (imageUrl: string) => {
        if (confirm('Are you sure you want to remove this image?')) {
            if (onDeleteImage) {
                await onDeleteImage(imageUrl)
                setExistingImages(prev => prev.filter(img => img !== imageUrl))
            }
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData, images)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10 pb-12">
            {/* Image Upload Section */}
            <div className="bg-white shadow-premium border border-emerald-950/5 rounded-2xl p-5 sm:p-8 transition-all hover:shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                    <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                        <ImageIcon className="h-7 w-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif text-emerald-950">Visual Assets</h2>
                        <p className="text-sm text-gray-500 font-light">Manage premium product photography</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Existing Images */}
                    {existingImages.map((url, index) => (
                        <div key={`existing-${index}`} className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-emerald-900/10 group shadow-inner">
                            <img src={url} alt={`Product ${index}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            {onDeleteImage && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(url)}
                                    className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-md backdrop-blur-sm"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* New Image Previews */}
                    {imagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-emerald-900/10 group shadow-inner">
                            <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-md backdrop-blur-sm"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {/* Upload Button */}
                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-emerald-900/20 rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group overflow-hidden">
                        <div className="flex flex-col items-center justify-center p-4">
                            <div className="h-14 w-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent transition-all duration-500">
                                <Upload className="w-7 h-7 text-emerald-600 group-hover:text-emerald-950" />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] text-center">Add Media</p>
                        </div>
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                {/* Basic Info Card */}
                <div className="bg-white shadow-premium border border-emerald-950/5 rounded-2xl p-5 sm:p-8 transition-all hover:shadow-xl flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                            <LayoutList className="h-7 w-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-emerald-950">Identity</h2>
                            <p className="text-sm text-gray-500 font-light italic">Categorization & Story-telling</p>
                        </div>
                    </div>

                    <div className="space-y-6 flex-grow">
                        <Input
                            label="Product Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="h-14 rounded-xl border-gray-200 focus:border-accent transition-all"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Collection</label>
                                <select
                                    name="collection_id"
                                    className="h-14 w-full rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all appearance-none cursor-pointer"
                                    value={formData.collection_id}
                                    onChange={handleChange}
                                >
                                    <option value="">No Collection (General)</option>
                                    {collections.map((collection) => (
                                        <option key={collection.id} value={collection.id}>
                                            {collection.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Metal Type</label>
                                <select
                                    name="metal_type"
                                    className="h-14 w-full rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all appearance-none cursor-pointer"
                                    value={formData.metal_type}
                                    onChange={handleChange}
                                >
                                    <option value="gold">Gold</option>
                                    <option value="silver">Silver</option>
                                    <option value="diamond">Diamond</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Description</label>
                            <textarea
                                name="description"
                                rows={6}
                                required
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-sm text-gray-900 placeholder:text-gray-300 transition-all resize-none shadow-inner"
                                placeholder="Describe the craftsmanship..."
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6 md:space-y-10">
                    {/* Specifications Card */}
                    <div className="bg-white shadow-premium border border-emerald-950/5 rounded-2xl p-5 sm:p-8 transition-all hover:shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <Settings className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif text-emerald-950">Specifications</h2>
                                <p className="text-sm text-gray-500 font-light">Weights & Inventory</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="Purity (e.g. 22K)"
                                name="purity"
                                value={formData.purity}
                                onChange={handleChange}
                                required
                                className="h-14 rounded-xl border-gray-200"
                            />
                            <Input
                                label="Weight (grams)"
                                name="weight"
                                type="number"
                                step="0.01"
                                value={formData.weight}
                                onChange={handleChange}
                                required
                                className="h-14 rounded-xl border-gray-200"
                            />
                            <div className="sm:col-span-2">
                                <Input
                                    label="Stock Quantity"
                                    name="stock"
                                    type="number"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    required
                                    className="h-14 rounded-xl border-gray-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Commercials Card */}
                    <div className="bg-emerald-950 text-white rounded-2xl p-5 sm:p-8 shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-1000">
                            <TrendingUp className="h-48 w-48 text-accent" />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center text-emerald-950 shadow-lg">
                                <ShoppingCart className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif text-white">Commercial Rules</h2>
                                <p className="text-sm text-emerald-400 font-light italic">Pricing algorithms</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-3">Charge Type</label>
                                <select
                                    name="making_charge_type"
                                    className="h-14 w-full rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-white focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all appearance-none cursor-pointer"
                                    value={formData.making_charge_type}
                                    onChange={handleChange}
                                >
                                    <option value="percentage" className="bg-emerald-950">Percentage (%)</option>
                                    <option value="fixed" className="bg-emerald-950">Fixed Amount (₹)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-accent uppercase tracking-widest">Charge Value</label>
                                <input
                                    name="making_charge_value"
                                    type="number"
                                    step="0.01"
                                    value={formData.making_charge_value}
                                    onChange={handleChange}
                                    required
                                    className="h-14 w-full bg-white/5 border border-white/10 rounded-xl px-5 focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all text-white placeholder:text-white/20"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/10 flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer group">
                                    <input
                                        id="is_featured"
                                        name="is_featured"
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={formData.is_featured}
                                        onChange={(e) => {
                                            setFormData({ ...formData, is_featured: e.target.checked })
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-emerald-950 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-emerald-950 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                    <span className="ms-3 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                                        Feature on Homepage
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-10 flex flex-col sm:flex-row justify-end gap-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => window.history.back()} className="px-8 h-14 rounded-xl font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all sm:order-1 order-2">
                    Cancel & Discard
                </Button>
                <Button type="submit" disabled={loading} className="px-12 h-14 rounded-xl font-bold bg-accent text-emerald-950 hover:bg-emerald-950 hover:text-white transition-all shadow-xl shadow-accent/20 sm:order-2 order-1">
                    {loading ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : (initialData ? 'Confirm Specification Changes' : 'Publish to Collection')}
                </Button>
            </div>
        </form>
    )
}
