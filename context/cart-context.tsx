'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { type Currency } from '@/lib/currency-client'

export interface CartItem {
  id: number | string
  name: string
  price: number
  image: string
  quantity: number
  slug: string
  variantName?: string
  currency?: Currency | string | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: number | string) => void
  updateQuantity: (id: number | string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  total: number
  getItemQuantity: (id: number | string) => number
  isInCart: (id: number | string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const storageKey = 'shopping-cart'
  const [items, setItems] = useState<CartItem[]>([])
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    hasHydratedRef.current = false
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    if (savedCart) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        setItems([])
      }
    } else {
      setItems([])
    }
    hasHydratedRef.current = true
  }, [storageKey])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items, storageKey])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((i) => i.id === item.id)

      if (existingItem) {
        return currentItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }

      return [...currentItems, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (id: number | string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, quantity } : item)),
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const getItemQuantity = (id: number | string) => {
    const item = items.find((i) => i.id === id)
    return item ? item.quantity : 0
  }

  const isInCart = (id: number | string) => {
    return items.some((i) => i.id === id)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        getItemQuantity,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
