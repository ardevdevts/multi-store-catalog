'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

interface WishlistItem {
  id: number | string
  name: string
  price: number
  image: string
  slug: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: number | string) => void
  isInWishlist: (id: number | string) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const storageKey = 'wishlist'
  const [items, setItems] = useState<WishlistItem[]>([])
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    hasHydratedRef.current = false
    const savedWishlist = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    if (savedWishlist) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(savedWishlist))
      } catch (error) {
        console.error('Error loading wishlist:', error)
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

  const addItem = (item: WishlistItem) => {
    setItems((prevItems) => {
      if (prevItems.some((i) => i.id === item.id)) {
        return prevItems
      }
      return [...prevItems, item]
    })
  }

  const removeItem = (id: number | string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const isInWishlist = (id: number | string) => {
    return items.some((item) => item.id === id)
  }

  const clearWishlist = () => {
    setItems([])
  }

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}
