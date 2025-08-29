import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  CreditCard,
  MapPin,
  Clock,
  Plus,
  Minus,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  item: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  special_instructions?: string;
}

interface Restaurant {
  id: string;
  name: string;
  delivery_fee: number;
  minimum_order: number;
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { cart: initialCart, restaurant } = location.state || {};
  const [cart, setCart] = useState<CartItem[]>(initialCart || []);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  useEffect(() => {
    if (!initialCart || !restaurant) {
      navigate("/");
      return;
    }

    checkAuth();
  }, [initialCart, restaurant, navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        variant: "destructive",
        title: "Please sign in",
        description: "You need to be signed in to place an order.",
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(cartItem => cartItem.item.id !== itemId));
    } else {
      setCart(prev =>
        prev.map(cartItem =>
          cartItem.item.id === itemId
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        )
      );
    }
  };

  const removeItem = (itemId: string) => {
    setCart(prev => prev.filter(cartItem => cartItem.item.id !== itemId));
  };

  const getSubtotal = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  const getTaxAmount = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getTotal = () => {
    return getSubtotal() + restaurant.delivery_fee + getTaxAmount();
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to place an order.",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty cart",
        description: "Please add items to your cart before placing an order.",
      });
      return;
    }

    if (getSubtotal() < restaurant.minimum_order) {
      toast({
        variant: "destructive",
        title: "Minimum order not met",
        description: `Minimum order amount is $${restaurant.minimum_order}.`,
      });
      return;
    }

    const addressString = `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}`;
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) {
      toast({
        variant: "destructive",
        title: "Missing delivery address",
        description: "Please provide a complete delivery address.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          restaurant_id: restaurant.id,
          order_number: `ORD-${Date.now()}`, // Temporary until trigger generates it
          subtotal: getSubtotal(),
          delivery_fee: restaurant.delivery_fee,
          tax_amount: getTaxAmount(),
          total_amount: getTotal(),
          delivery_address: {
            street: deliveryAddress.street,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            zipCode: deliveryAddress.zipCode,
          },
          delivery_instructions: deliveryInstructions,
          payment_method: paymentMethod,
          status: 'pending',
          payment_status: 'pending',
          estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(cartItem => ({
        order_id: orderData.id,
        menu_item_id: cartItem.item.id,
        quantity: cartItem.quantity,
        unit_price: cartItem.item.price,
        total_price: cartItem.item.price * cartItem.quantity,
        special_instructions: cartItem.special_instructions,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order placed successfully!",
        description: `Your order #${orderData.order_number} has been placed.`,
      });

      // Navigate to order tracking
      navigate(`/orders/${orderData.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error placing order",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!restaurant || cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cart is empty</h2>
          <p className="text-muted-foreground mb-4">Add some items to your cart to continue.</p>
          <Button onClick={() => navigate("/")}>Browse Restaurants</Button>
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
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">Checkout</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Order</CardTitle>
                <CardDescription>From {restaurant.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((cartItem) => (
                  <div key={cartItem.item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{cartItem.item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${cartItem.item.price.toFixed(2)} each
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold w-8 text-center">{cartItem.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(cartItem.item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    placeholder="123 Main St"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="12345"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    placeholder="e.g., Leave at front door, ring doorbell twice"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Payment */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span>${restaurant.delivery_fee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${getTaxAmount().toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>

                {getSubtotal() < restaurant.minimum_order && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Minimum order: ${restaurant.minimum_order.toFixed(2)}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">
                      Secure payment processing with Stripe
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Estimated delivery: 30-45 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handlePlaceOrder} 
              disabled={isLoading || getSubtotal() < restaurant.minimum_order}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Placing Order..." : `Place Order • $${getTotal().toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;