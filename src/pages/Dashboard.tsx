import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  MapPin, 
  Clock, 
  Star, 
  Heart, 
  ShoppingBag, 
  CreditCard,
  Settings,
  LogOut,
  Plus,
  Truck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await Promise.all([
        fetchProfile(session.user.id),
        fetchOrders(session.user.id),
        fetchFavorites(session.user.id)
      ]);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurants(name, image_url, cuisine_type),
        order_items(*, menu_items(name, price))
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setOrders(data);
  };

  const fetchFavorites = async (userId: string) => {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        restaurants(name, image_url, cuisine_type, rating, delivery_time_min, delivery_time_max)
      `)
      .eq('user_id', userId);
    
    if (data) setFavorites(data);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "Come back soon!",
      });
      navigate("/");
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      confirmed: { label: "Confirmed", variant: "default" as const },
      preparing: { label: "Preparing", variant: "secondary" as const },
      ready: { label: "Ready", variant: "default" as const },
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
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
              <h1 
                className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent cursor-pointer"
                onClick={() => navigate("/")}
              >
                GrubHub Flow
              </h1>
              <Badge variant="outline">Dashboard</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                Browse Restaurants
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
          </h2>
          <p className="text-muted-foreground">
            Manage your orders, favorites, and account settings
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Your Orders</h3>
              <Button onClick={() => navigate("/")}>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </div>
            
            {orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No orders yet</h4>
                  <p className="text-muted-foreground mb-4">
                    Start by browsing restaurants and placing your first order
                  </p>
                  <Button onClick={() => navigate("/")}>Browse Restaurants</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {order.restaurants?.name}
                          </CardTitle>
                          <CardDescription>
                            Order #{order.order_number} • {new Date(order.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          {getOrderStatusBadge(order.status)}
                          <p className="text-lg font-semibold mt-1">
                            ${order.total_amount}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          <span>
                            {order.status === 'delivered' 
                              ? 'Delivered' 
                              : order.estimated_delivery_time 
                                ? `Est. ${new Date(order.estimated_delivery_time).toLocaleTimeString()}`
                                : 'Processing'
                            }
                          </span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <h3 className="text-2xl font-bold">Favorite Restaurants</h3>
            
            {favorites.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No favorites yet</h4>
                  <p className="text-muted-foreground mb-4">
                    Start adding restaurants to your favorites for quick access
                  </p>
                  <Button onClick={() => navigate("/")}>Browse Restaurants</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <Card key={favorite.id} className="restaurant-card group">
                    <div className="relative">
                      <img 
                        src={favorite.restaurants?.image_url || "/placeholder.svg"} 
                        alt={favorite.restaurants?.name}
                        className="w-full h-48 object-cover"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur hover:bg-white"
                      >
                        <Heart className="h-4 w-4 fill-accent text-accent" />
                      </Button>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{favorite.restaurants?.name}</CardTitle>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="text-sm font-semibold">{favorite.restaurants?.rating}</span>
                        </div>
                      </div>
                      <CardDescription>{favorite.restaurants?.cuisine_type}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{favorite.restaurants?.delivery_time_min}-{favorite.restaurants?.delivery_time_max} min</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/restaurant/${favorite.restaurant_id}`)}
                      >
                        Order Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <h3 className="text-2xl font-bold">Payment Methods</h3>
            
            <Card>
              <CardContent className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Payment Integration</h4>
                <p className="text-muted-foreground mb-4">
                  Stripe payment integration will be configured during checkout
                </p>
                <Button variant="outline">Learn More</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <h3 className="text-2xl font-bold">Profile Settings</h3>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="font-semibold">{profile?.full_name || "Not set"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-semibold">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="font-semibold">{profile?.phone || "Not set"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="font-semibold">{profile?.address || "Not set"}</p>
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    Manage Addresses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;