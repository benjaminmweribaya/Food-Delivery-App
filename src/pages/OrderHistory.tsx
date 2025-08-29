import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Clock, CheckCircle, Star, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  menu_items: {
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  restaurants: {
    id: string;
    name: string;
    image_url?: string;
  };
  order_items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          restaurants (id, name, image_url),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            menu_items (name, image_url)
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching order history:", error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reorderItems = async (order: Order) => {
    setReorderingId(order.id);
    try {
      // Get current cart from localStorage
      const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
      
      // Add order items to cart
      const newCartItems = order.order_items.map(item => ({
        id: crypto.randomUUID(),
        menuItemId: item.id,
        name: item.menu_items.name,
        price: item.unit_price,
        quantity: item.quantity,
        restaurantId: order.restaurants.id,
        image_url: item.menu_items.image_url,
      }));

      const updatedCart = [...existingCart, ...newCartItems];
      localStorage.setItem("cart", JSON.stringify(updatedCart));

      toast({
        title: "Added to Cart",
        description: `${order.order_items.length} items from ${order.restaurants.name} added to your cart`,
      });

      // Navigate to restaurant page or cart
      navigate(`/restaurant/${order.restaurants.id}`);
    } catch (error) {
      console.error("Error reordering:", error);
      toast({
        title: "Error",
        description: "Failed to reorder items",
        variant: "destructive",
      });
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      case "preparing": return "bg-orange-500";
      case "confirmed": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      case "preparing": return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Order History</h1>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                When you place orders, they'll appear here
              </p>
              <Button onClick={() => navigate("/")}>
                Start Ordering
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Order #{order.order_number}
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </CardTitle>
                      <p className="text-muted-foreground">
                        {order.restaurants.name} • {format(new Date(order.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${order.total_amount.toFixed(2)}</p>
                      {order.status === "delivered" && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Delivered {order.actual_delivery_time && format(new Date(order.actual_delivery_time), "h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.menu_items.image_url && (
                          <img
                            src={item.menu_items.image_url}
                            alt={item.menu_items.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.menu_items.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium">${item.total_price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="flex-1"
                    >
                      Track Order
                    </Button>
                    
                    {order.status === "delivered" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => reorderItems(order)}
                          disabled={reorderingId === order.id}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {reorderingId === order.id ? "Adding..." : "Reorder"}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/restaurant/${order.restaurants.id}#reviews`)}
                          className="flex items-center gap-2"
                        >
                          <Star className="h-4 w-4" />
                          Review
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}