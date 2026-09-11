"use client";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_components/ui/table";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";

import { useGetProducts } from "./query/useGetProducts";
import { useGetCategories } from "../category/query/useGetCategories";
import { useDeleteProduct } from "./mutation/useDeleteProduct";
import { ProductFormDialog } from "./_components/product-form-dialog";
import type { TProduct } from "../order/interface";
import { formatCurrency } from "@/_lib/format-currency";
import { toTitleCase } from "@/_lib/to-title-case";
import Image from "next/image";

export default function ProductPage() {
  const { data: products } = useGetProducts();
  const { data: categories } = useGetCategories();
  const deleteProduct = useDeleteProduct();

  function handleDeleteProduct(productId: number) {
    deleteProduct.mutate(productId);
  }

  return (
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 flex-wrap gap-2">
        <Header title="Produtos" />

        <ProductFormDialog
          categories={categories}
          trigger={
            <Button size="lg">
              <Plus />
              Adicionar produto
            </Button>
          }
        />
      </div>

      <Separator className="h-px w-full" />

      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
        {products?.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products?.map((product: TProduct) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.photoUrl ? (
                      <Image
                        src={product.photoUrl}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover ring-1 ring-foreground/10"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <ImageOff size={16} />
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <p className="font-medium whitespace-normal">{toTitleCase(product.name)}</p>
                    {product.description && (
                      <p className="max-w-60 truncate text-xs text-muted-foreground">{product.description}</p>
                    )}
                  </TableCell>

                  <TableCell className="text-muted-foreground">{toTitleCase(product.category.name)}</TableCell>

                  <TableCell>{formatCurrency(product.price)}</TableCell>

                  <TableCell>
                    {product.trackStock ? (
                      <span className={product.quantity <= 0 ? "font-semibold text-destructive" : ""}>{product.quantity}</span>
                    ) : (
                      <span className="text-muted-foreground">Ilimitado</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <ProductFormDialog
                        categories={categories}
                        product={product}
                        trigger={
                          <Button variant="outline" size="icon-sm">
                            <Pencil />
                          </Button>
                        }
                      />

                      <Button variant="destructive" size="icon-sm" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
