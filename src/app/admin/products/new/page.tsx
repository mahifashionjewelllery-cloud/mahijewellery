'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ProductForm, ProductFormData } from '@/components/admin/ProductForm'
import { useToast } from '@/context/ToastContext'

export default function NewProductPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()

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

            // 1. Upload images first to get URLs
            let uploadedImageUrls: string[] = []
            if (images.length > 0) {
                uploadedImageUrls = await uploadImages(images)
            }

            // 2. Create the product with the first image URL if available
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    ...formData,
                    weight: Number(formData.weight),
                    making_charge_value: Number(formData.making_charge_value),
                    stock: Number(formData.stock),
                    collection_id: formData.collection_id || null,
                    image_url: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null
                })
                .select()
                .single()

            if (productError) throw productError

            // 3. Insert rest of the image URLs into product_images table if any
            if (uploadedImageUrls.length > 0) {
                const imageRecords = uploadedImageUrls.map(url => ({
                    product_id: product.id,
                    image_url: url
                }))

                const { error: imagesError } = await supabase
                    .from('product_images')
                    .insert(imageRecords)

                if (imagesError) {
                    console.error('Error inserting images:', imagesError)
                }
            }

            showToast('Product created successfully', 'success')
            router.push('/admin/products')
            router.refresh()
        } catch (error: any) {
            console.error('Error creating product:', error)
            showToast('Failed to create product: ' + error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">Add New Product</h1>
            <ProductForm onSubmit={handleSubmit} loading={loading} />
        </div>
    )
}
