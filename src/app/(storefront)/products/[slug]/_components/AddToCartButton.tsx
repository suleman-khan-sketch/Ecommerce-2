"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  };
  inStock: boolean;
}

export default function AddToCartButton({
  product,
  inStock,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => {
      addItem(product, quantity);
      toast.success(`Added ${quantity} ${product.name} to cart`);
      setIsAdding(false);
      setQuantity(1);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* Quantity Selector */}
      <div className="flex items-center rounded-md border">
        <button
          type="button"
          className={cn(
            "flex h-12 w-12 items-center justify-center",
            "border-r text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1 || !inStock}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="flex h-12 w-16 items-center justify-center font-medium">
          {quantity}
        </span>
        <button
          type="button"
          className={cn(
            "flex h-12 w-12 items-center justify-center",
            "border-l text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          onClick={() => setQuantity(quantity + 1)}
          disabled={!inStock}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="flex-1 h-12 gap-2"
        onClick={handleAddToCart}
        disabled={!inStock || isAdding}
      >
        {isAdding ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
        ) : (
          <ShoppingCart className="h-5 w-5" />
        )}
        {inStock ? "Add to Cart" : "Out of Stock"}
      </Button>
    </div>
  );
}
