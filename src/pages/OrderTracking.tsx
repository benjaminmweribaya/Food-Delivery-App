import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  Truck,
  ChefHat,
  Receipt,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  created_at: string;
  estimated_delivery_time: string;
  actual_delivery_time?: string;
  delivery_address: any;
  delivery_instructions?: string;
  restaurants: {
    name: string;
    phone: string;
    address: string;
    image_url: string;
  };
  order_items: Array<{
    quantity: number;
    unit_price: number;
    total_price: number;
    special_instructions?: string;
    menu_items: {
      name: string;
      description: string;
    };
  }>;
}

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrder();
      
      // Set up real-time updates for order status
      const channel = supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${id}`
          },
          (payload) => {
            setOrder(prev => prev ? { ...prev, ...payload.new } : null);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants(name, phone, address, image_url),
          order_items(
            *,
            menu_items(name, description)
          )
        `)
        .eq('id', id)
        .eq('customer_id', session.user.id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading order",
        description: error.message,
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getOrderProgress = (status: string) => {
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(status);
    return Math.max(0, (currentIndex + 1) / statuses.length * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Receipt className="h-5 w-5" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'preparing':
        return <ChefHat className="h-5 w-5" />;
      case 'ready':
      case 'out_for_delivery':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order received and being processed';
      case 'confirmed':
        return 'Restaurant confirmed your order';
      case 'preparing':
        return 'Your food is being prepared';
      case 'ready':
        return 'Order is ready for pickup/delivery';
      case 'out_for_delivery':
        return 'Your order is on the way';
      case 'delivered':
        return 'Order has been delivered';
      case 'cancelled':
        return 'Order has been cancelled';
      default:
        return 'Processing your order';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      confirmed: { label: "Confirmed", variant: "default" as const },
      preparing: { label: "Preparing", variant: "secondary" as const },
      ready: { label: "Ready", variant: "default" as const },
      out_for_delivery: { label: "Out for Delivery", variant: "default" as const },
      delivered: { label: "Delivered", variant: "secondary" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Order not found</h2>
          <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold">Order #{order.order_number}</h1>
              {getStatusBadge(order.status)}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span>Order Status</span>
                </CardTitle>
                <CardDescription>{getStatusMessage(order.status)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={getOrderProgress(order.status)} className="w-full" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Order placed</span>
                    <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                  </div>
                  
                  {order.estimated_delivery_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Estimated delivery</span>
                      <span>{new Date(order.estimated_delivery_time).toLocaleTimeString()}</span>
                    </div>
                  )}
                  
                  {order.actual_delivery_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Delivered at</span>
                      <span>{new Date(order.actual_delivery_time).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Restaurant Info */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={order.restaurants.image_url || "/placeholder.svg"} 
                    alt={order.restaurants.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{order.restaurants.name}</h4>
                    <p className="text-sm text-muted-foreground">{order.restaurants.address}</p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Restaurant
                </Button>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Delivery Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>{order.delivery_address.street}</p>
                  <p>{order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zipCode}</p>
                  
                  {order.delivery_instructions && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Delivery Instructions:</p>
                      <p className="text-sm text-muted-foreground">{order.delivery_instructions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items & Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.menu_items.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.menu_items.description}</p>
                      {item.special_instructions && (
                        <p className="text-xs text-muted-foreground italic">
                          Note: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${item.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span>${order.delivery_fee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${order.tax_amount.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
                
                <div className="pt-2">
                  <Badge variant="outline">
                    Payment: {order.payment_status === 'paid' ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {order.status === 'delivered' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Rate Your Experience</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    How was your experience with {order.restaurants.name}?
                  </p>
                  <Button className="w-full">Leave a Review</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;