'use client'


import { useState, useEffect } from 'react'
import { Order } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Trash2 } from 'lucide-react'

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/admin/orders')
            const data = await response.json()
            if (data.orders) {
                setOrders(data.orders)
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm(`Are you sure you want to permanently delete order #${orderId.slice(0, 8)}?`)) return
        
        try {
            const res = await fetch(`/api/admin/orders?id=${orderId}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete order')
            
            setOrders(prev => prev.filter(o => o.id !== orderId))
        } catch (error) {
            console.error('Error deleting order:', error)
            alert('Failed to delete order. Check console for details.')
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdating(orderId)
        try {
            const response = await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status')
            }

            setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o))
        } catch (error: any) {
            console.error('Error updating status:', error)
            alert('Failed to update status: ' + error.message)
        } finally {
            setUpdating(null)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">Order Management</h1>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer / Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                                        <div className="text-xs">{order.customer_email}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{order.shipping_address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatCurrency(order.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full uppercase
                                ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                order.payment_status === 'cod' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <select
                                            value={order.order_status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            disabled={updating === order.id}
                                            className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        {updating === order.id && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-md hover:bg-red-100 transition-colors inline-flex"
                                            title="Delete Order"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
