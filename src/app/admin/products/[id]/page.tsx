'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ProductForm, ProductFormData } from '@/components/admin/ProductForm'
import { Product } from '@/types'
import { useToast } from '@/context/ToastContext'

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [loading, setLoading] = useState(false)
    const [initialData, setInitialData] = useState<Product | undefined>(undefined)
    const [fetching, setFetching] = useState(true)
    const { showToast } = useToast()

    useEffect(() => {
        fetchProduct()
    }, [id])

    const fetchProduct = async () => {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_images(image_url)
                `)
                .eq('id', id)
                .single()

            if (error) throw error

            const productWithImages = {
                ...data,
                images: data.product_images?.map((img: any) => img.image_url) || []
            }

            setInitialData(productWithImages)
        } catch (error) {
            console.error('Error fetching product:', error)
            showToast('Failed to fetch product', 'error')
            router.push('/admin/products')
        } finally {
            setFetching(false)
        }
    }

    const uploadImages = async (images: File[]) => {
        const imageUrls: string[] = []

        for (const file of images) {
            const formData = new FormData()
            formData.append('file', file)

            try {
                const response = await fetch('/api/products/upload', {
                    method: 'POST',
                    body: formData
                })

                const result = await response.json()
                if (!response.ok) throw new Error(result.error || 'Upload failed')
                imageUrls.push(result.url)
            } catch (error) {
                console.error('Error uploading image:', error)
            }
        }
        return imageUrls
    }

    const handleSubmit = async (formData: ProductFormData, images: File[]) => {
        setLoading(true)

        try {
            const supabase = createClient()

            // 1. Upload and insert NEW images
            let allImageUrls = [...(initialData?.images || [])]
            if (images.length > 0) {
                const uploadedImageUrls = await uploadImages(images)
                allImageUrls = [...allImageUrls, ...uploadedImageUrls]

                const imageRecords = uploadedImageUrls.map(url => ({
                    product_id: id,
                    image_url: url
                }))

                const { error: imagesError } = await supabase
                    .from('product_images')
                    .insert(imageRecords)

                if (imagesError) {
                    console.error('Error inserting new images:', imagesError)
                }
            }

            // 2. Update product details including the first image as primary
            const { error: productError } = await supabase
                .from('products')
                .update({
                    ...formData,
                    weight: Number(formData.weight),
                    making_charge_value: Number(formData.making_charge_value),
                    stock: Number(formData.stock),
                    collection_id: formData.collection_id || null,
                    image_url: allImageUrls.length > 0 ? allImageUrls[0] : null
                })
                .eq('id', id)

            if (productError) throw productError

            showToast('Product updated successfully', 'success')
            router.push('/admin/products')
            router.refresh()
        } catch (error: any) {
            console.error('Error updating product:', error)
            showToast('Failed to update product: ' + error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteImage = async (imageUrl: string) => {
        try {
            const supabase = createClient()

            // 1. Delete from Cloudinary
            try {
                const response = await fetch('/api/gallery/upload', {
                    method: 'DELETE',
                    body: JSON.stringify({ url: imageUrl })
                })
                if (!response.ok) {
                    const result = await response.json()
                    console.warn('Cloudinary delete warning:', result.error)
                }
            } catch (err) {
                console.error('Error deleting from Cloudinary:', err)
            }

            // 2. Delete from database
            const { error: dbError } = await supabase
                .from('product_images')
                .delete()
                .match({ product_id: id, image_url: imageUrl })

            if (dbError) throw dbError

            // 3. Update products.image_url if this was the primary image
            if (initialData?.image_url === imageUrl) {
                const remainingImages = (initialData.images || []).filter(img => img !== imageUrl)
                await supabase
                    .from('products')
                    .update({ image_url: remainingImages.length > 0 ? remainingImages[0] : null })
                    .eq('id', id)
            }

            showToast('Image deleted successfully. Update product to save other changes.', 'success')

        } catch (error: any) {
            console.error('Error deleting image:', error)
            showToast('Failed to delete image', 'error')
            throw error
        }
    }

    if (fetching) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-900"></div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">Edit Product</h1>
            <ProductForm
                initialData={initialData}
                onSubmit={handleSubmit}
                loading={loading}
                onDeleteImage={handleDeleteImage}
            />
        </div>
    )
}
