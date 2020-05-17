import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { isConstructorTypeNode } from 'typescript';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        const productsCart = await AsyncStorage.getItem(
          '@GoMarktplace_Products',
        );

        setProducts(productsCart !== null ? JSON.parse(productsCart) : []);
      } catch (err) {
        throw new Error('error reading value AsyncStorage');
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const prodFind = products.find(prod => prod.id === product.id);

      setProducts(
        prodFind
          ? [
              ...products.filter(prod => prod.id !== product.id),
              { ...prodFind, quantity: prodFind.quantity + 1 },
            ]
          : [...products, { ...product, quantity: 1 }],
      );

      await AsyncStorage.setItem(
        '@GoMarktplace_Products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(item =>
          item.id === id ? { ...item, quantity: item.quantity += 1 } : item,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarktplace_Products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // const prodFind = products.findIndex(product => product.id === id);
      /*
      setProducts(
        products.map(product =>
          product.id === id
            ? product.quantity > 1
              ? { ...product, quantity: product.quantity - 1 }
              : [...products]
            : [...products],
        ),
      );

      */
      const prodFind = products.find(prod => prod.id === id);

      setProducts(
        prodFind && prodFind.quantity > 1
          ? [
              ...products.filter(prod => prod.id !== id),
              { ...prodFind, quantity: prodFind.quantity - 1 },
            ]
          : [...products.filter(prod => prod.id !== id)],
      );

      await AsyncStorage.setItem(
        '@GoMarktplace_Products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
