"use client";

import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { STORE_CONFIG } from "@/constants/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CartSheetProps {
  className?: string;
}

export default function CartSheet({ className }: CartSheetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } =
    useCart();

  const canCheckout = subtotal >= STORE_CONFIG.minOrderValue;

  return (
    <div className={cn("relative", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            aria-label="Open cart"
            className="relative h-9 w-9 rounded-full"
            size="icon"
            variant="outline"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]"
                variant="default"
              >
                {itemCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex w-full flex-col p-0 sm:w-[400px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Shopping Cart</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <div className="text-xl font-semibold">Your Cart</div>
                <div className="text-sm text-muted-foreground">
                  {itemCount === 0
                    ? "Your cart is empty"
                    : `You have ${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`}
                </div>
              </div>
              <SheetClose asChild>
                <Button size="icon" variant="ghost">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">
                    Your cart is empty
                  </h3>
                  <p className="mb-6 text-center text-sm text-muted-foreground">
                    Looks like you haven&apos;t added anything to your cart yet.
                  </p>
                  <SheetClose asChild>
                    <Link href="/products">
                      <Button>Browse Products</Button>
                    </Link>
                  </SheetClose>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative flex rounded-lg border bg-card p-2",
                        "shadow-sm transition-colors hover:bg-accent/50"
                      )}
                    >
                      <div className="relative h-20 w-20 overflow-hidden rounded">
                        <Image
                          alt={item.name}
                          className="object-cover"
                          fill
                          src={item.image}
                        />
                      </div>
                      <div className="ml-4 flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <Link
                              className="line-clamp-2 text-sm font-medium group-hover:text-primary"
                              href={`/products/${item.id}`}
                              onClick={() => setIsOpen(false)}
                            >
                              {item.name}
                            </Link>
                            <button
                              className={cn(
                                "-mt-1 -mr-1 ml-2 rounded-full p-1",
                                "text-muted-foreground transition-colors",
                                "hover:bg-muted hover:text-destructive"
                              )}
                              onClick={() => removeItem(item.id)}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove item</span>
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.category}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-md border">
                            <button
                              className={cn(
                                "flex h-7 w-7 items-center justify-center",
                                "rounded-l-md border-r text-muted-foreground",
                                "transition-colors hover:bg-muted hover:text-foreground",
                                "disabled:opacity-50"
                              )}
                              disabled={item.quantity <= 1}
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              type="button"
                            >
                              <Minus className="h-3 w-3" />
                              <span className="sr-only">Decrease quantity</span>
                            </button>
                            <span className="flex h-7 w-7 items-center justify-center text-xs font-medium">
                              {item.quantity}
                            </span>
                            <button
                              className={cn(
                                "flex h-7 w-7 items-center justify-center",
                                "rounded-r-md border-l text-muted-foreground",
                                "transition-colors hover:bg-muted hover:text-foreground"
                              )}
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              type="button"
                            >
                              <Plus className="h-3 w-3" />
                              <span className="sr-only">Increase quantity</span>
                            </button>
                          </div>
                          <div className="text-sm font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t px-6 py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-base font-semibold">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {!canCheckout && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/50 p-3 text-sm text-amber-800 dark:text-amber-200">
                      Minimum order value is ${STORE_CONFIG.minOrderValue}. Add $
                      {(STORE_CONFIG.minOrderValue - subtotal).toFixed(2)} more
                      to checkout.
                    </div>
                  )}

                  <SheetClose asChild>
                    <Link href="/checkout">
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={!canCheckout}
                      >
                        Checkout
                      </Button>
                    </Link>
                  </SheetClose>

                  <div className="flex items-center justify-between">
                    <SheetClose asChild>
                      <Button variant="outline">Continue Shopping</Button>
                    </SheetClose>
                    <Button
                      className="ml-2"
                      onClick={clearCart}
                      variant="outline"
                    >
                      Clear Cart
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
