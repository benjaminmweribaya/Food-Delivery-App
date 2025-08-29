import { useState, useEffect } from "react";
import { CheckCircle, Clock, ChefHat, Truck, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  estimated_delivery_time: string;
  actual_delivery_time?: string;
  delivery_address: any;
  restaurants: {
    name: string;
    phone?: string;
  };
}

interface RealTimeOrderTrackingProps {
  orderId: string;
}

const orderStatuses = [
  { key: "pending", label: "Order Placed", icon: CheckCircle },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready for Pickup", icon: Clock },
  { key: "picked_up", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export function RealTimeOrderTracking({ orderId }: RealTimeOrderTrackingProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchOrder();
    
    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Real-time order update:', payload);
          setOrder(prev => prev ? { ...prev, ...payload.new } : null);
          updateProgress(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          restaurants (name, phone)
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
      updateProgress(data.status);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = (status: string) => {
    const statusIndex = orderStatuses.findIndex(s => s.key === status);
    const progressValue = statusIndex >= 0 ? ((statusIndex + 1) / orderStatuses.length) * 100 : 0;
    setProgress(progressValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "confirmed": return "bg-blue-500";
      case "preparing": return "bg-orange-500";
      case "ready": return "bg-purple-500";
      case "picked_up": return "bg-indigo-500";
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getCurrentStatusIndex = () => {
    return orderStatuses.findIndex(s => s.key === order?.status);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Order not found</p>
        </CardContent>
      </Card>
    );
  }

  const currentStatusIndex = getCurrentStatusIndex();
  const estimatedTime = order.estimated_delivery_time 
    ? new Date(order.estimated_delivery_time) 
    : null;
  const actualTime = order.actual_delivery_time 
    ? new Date(order.actual_delivery_time) 
    : null;

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order #{order.order_number}</CardTitle>
              <p className="text-muted-foreground">{order.restaurants.name}</p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {orderStatuses.find(s => s.key === order.status)?.label || order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Order Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Estimated Delivery Time */}
            {estimatedTime && !actualTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Estimated delivery: {format(estimatedTime, "h:mm a")}</span>
              </div>
            )}

            {/* Actual Delivery Time */}
            {actualTime && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Delivered at: {format(actualTime, "h:mm a")}</span>
              </div>
            )}

            {/* Delivery Address */}
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium">Delivery Address:</p>
                <p className="text-muted-foreground">
                  {order.delivery_address.street}<br />
                  {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zipCode}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderStatuses.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const Icon = status.icon;

              return (
                <div key={status.key} className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-muted-foreground text-muted-foreground"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                      {status.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-primary">Current status</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isCompleted && index < currentStatusIndex && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {isCurrent && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-primary text-xs">In progress</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      {order.restaurants.phone && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Need help with your order?</p>
                <p className="text-sm text-muted-foreground">Contact the restaurant directly</p>
              </div>
              <a 
                href={`tel:${order.restaurants.phone}`}
                className="text-primary hover:underline"
              >
                {order.restaurants.phone}
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}