import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const slug = params.slug
    const collectionName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    return {
        title: `${collectionName} Collection | Mahi Fashion Jewellery`,
        description: `Explore our beautiful ${collectionName.toLowerCase()} jewellery collection.`
    }
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
