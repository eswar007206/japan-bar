/**
 * Order Add Page
 * Cast adds items to a table's bill
 * Includes 3-extension → designation automatic conversion
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useProducts,
  useTableBill,
  useAddOrder,
  useBillOrders,
  useBillDesignation,
  useCurrentShift
} from '@/hooks/useCastData';
import { useRealtimeFloorTables } from '@/hooks/useRealtimeFloorTables';
import { useCastAuth } from '@/contexts/CastAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Check, AlertCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { formatJPY } from '@/types/billing';
import type { Product, ProductCategory } from '@/types/cast';
import { CATEGORY_LABELS, CATEGORY_ORDER, isInHouseExtension, isDesignatedExtension, getBackForSeatingType } from '@/types/cast';

// Check if product is any extension type
function isExtensionProduct(product: Product): boolean {
  return isInHouseExtension(product) || isDesignatedExtension(product);
}

function ProductCard({
  product,
  onAdd,
  isAdding,
  isDesignated,
  seatingType,
}: {
  product: Product;
  onAdd: () => void;
  isAdding: boolean;
  isDesignated: boolean;
  seatingType: 'free' | 'designated' | 'inhouse';
}) {
  // Check if this is a designation extension product
  const isDesignationExtension = isExtensionProduct(product);
  const backAmount = getBackForSeatingType(product, seatingType);
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:border-primary ${isAdding ? 'opacity-50' : ''}`}
      onClick={onAdd}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{product.name_jp}</h3>
              {isDesignationExtension && isDesignated && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                  本指名適用
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatJPY(product.price)}
              {product.tax_applicable && ' (税込)'}
            </p>
          </div>
          {backAmount > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">バック</p>
              <p className="text-sm font-medium text-primary">
                {formatJPY(backAmount)}
              </p>
            </div>
          )}
          {product.points > 0 && (
            <div className="ml-2 text-right">
              <p className="text-xs text-muted-foreground">pt</p>
              <p className="text-sm font-medium text-secondary">
                {product.points}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CastOrderAddPage() {
  const { storeId, tableId } = useParams<{ storeId: string; tableId: string }>();
  const navigate = useNavigate();
  const { castMember } = useCastAuth();

  const storeIdNum = storeId ? parseInt(storeId, 10) : null;
  const { data: tables } = useRealtimeFloorTables(storeIdNum);
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: bill, isLoading: billLoading } = useTableBill(tableId || null);
  const { data: orders } = useBillOrders(bill?.id || null);
  const { data: designation } = useBillDesignation(bill?.id || null, castMember?.id || null);
  const { data: currentShift } = useCurrentShift(castMember?.id || null);
  const addOrder = useAddOrder();

  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('set');

  // Redirect if not approved
  useEffect(() => {
    if (currentShift && currentShift.clock_in_status !== 'approved') {
      toast.error('出勤が承認されていません。承認をお待ちください。');
      navigate('/cast');
    }
  }, [currentShift, navigate]);

  const table = tables?.find(t => t.id === tableId);
  const isDesignated = designation?.is_designated || false;
  const extensionCount = designation?.extension_count || 0;

  const seatingType = (bill?.seating_type || 'free') as 'free' | 'designated' | 'inhouse';

  const handleAddProduct = async (product: Product) => {
    if (!bill || !castMember) {
      toast.error('会計が開始されていません');
      return;
    }

    setAddingProductId(product.id);

    const backAmount = getBackForSeatingType(product, seatingType);

    try {
      await addOrder.mutateAsync({
        billId: bill.id,
        productId: product.id,
        castId: castMember.id,
        unitPrice: product.price,
        backAmount: backAmount,
        pointsAmount: product.points,
        product: product,
      });

      // Show special message if this was the 3rd extension (designation trigger)
      if (isExtensionProduct(product) && extensionCount === 2) {
        toast.success('3回目の延長！本指名に昇格しました', {
          icon: <Star className="h-4 w-4 text-primary" />,
        });
      } else {
        toast.success(`${product.name_jp} を追加しました`, {
          icon: <Check className="h-4 w-4" />,
        });
      }
    } catch (error) {
      console.error('Add order error:', error);
      toast.error('追加に失敗しました');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleBack = () => {
    navigate(`/cast/store/${storeId}`);
  };

  // Filter products by category
  const productsByCategory = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = products?.filter(p => p.category === category) || [];
    return acc;
  }, {} as Record<ProductCategory, Product[]>);

  // Calculate current bill total with tax
  const currentTotal = orders?.reduce((sum, order) => {
    const price = order.unit_price * order.quantity;
    const product = order.product;
    if (product?.tax_applicable) {
      return sum + Math.floor(price * 1.2);
    }
    return sum + price;
  }, 0) || 0;

  // Floor to nearest 10
  const displayTotal = Math.floor(currentTotal / 10) * 10;

  // Calculate remaining time
  const remainingMinutes = bill ? (() => {
    const startTime = new Date(bill.start_time);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
    return Math.max(0, bill.base_minutes - elapsedMinutes);
  })() : 0;

  if (productsLoading || billLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Page Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-foreground">
                  テーブル {table?.label}
                </h1>
                {isDesignated && (
                  <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    <Star className="h-3 w-3" />
                    本指名
                  </span>
                )}
              </div>
              {bill ? (
                <p className="text-xs text-muted-foreground">
                  合計: {formatJPY(displayTotal)} ｜ 残{remainingMinutes}分
                </p>
              ) : (
                <p className="text-xs text-destructive">
                  会計が開始されていません
                </p>
              )}
            </div>
          </div>
          {extensionCount > 0 && !isDesignated && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">延長回数</p>
              <p className="text-lg font-bold text-primary">{extensionCount}/3</p>
            </div>
          )}
        </div>
      </header>

      {/* No Bill Warning */}
      {!bill && (
        <div className="m-4 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">会計未開始</p>
            <p className="text-sm text-muted-foreground">
              スタッフに会計開始を依頼してください
            </p>
          </div>
        </div>
      )}

      {/* Product Categories */}
      {bill && (
        <Tabs 
          value={activeCategory} 
          onValueChange={(v) => setActiveCategory(v as ProductCategory)}
          className="flex-1 flex flex-col"
        >
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-3 gap-1 sm:grid-cols-6">
            {CATEGORY_ORDER.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="text-xs"
                disabled={productsByCategory[category].length === 0}
              >
                {CATEGORY_LABELS[category]}
                {productsByCategory[category].length > 0 && (
                  <span className="ml-1 text-[10px] opacity-60">
                    ({productsByCategory[category].length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORY_ORDER.map((category) => (
            <TabsContent key={category} value={category} className="flex-1 p-4 overflow-auto">
              <div className="grid gap-3 sm:grid-cols-2">
                {productsByCategory[category].map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => handleAddProduct(product)}
                    isAdding={addingProductId === product.id}
                    isDesignated={isDesignated}
                    seatingType={seatingType}
                  />
                ))}
              </div>
              {productsByCategory[category].length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  このカテゴリには商品がありません
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Recent Orders */}
      {bill && orders && orders.length > 0 && (
        <div className="border-t border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            最近の追加 ({orders.length}件)
          </h3>
          <div className="flex flex-wrap gap-2">
            {orders.slice(0, 8).map((order) => (
              <span
                key={order.id}
                className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
              >
                {order.product?.name_jp}
              </span>
            ))}
            {orders.length > 8 && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                +{orders.length - 8}件
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
