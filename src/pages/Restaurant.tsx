import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Star, 
  Clock, 
  MapPin, 
  Heart,
  Plus,
  Minus,
  ShoppingCart,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  is_featured: boolean;
  preparation_time: number;
  allergens: string[];
  ingredients: string[];
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  address: string;
  phone: string;
  image_url: string;
  rating: number;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  minimum_order: number;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
  special_instructions?: string;
}

const Restaurant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
      checkIfFavorite();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch menu categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;
      setMenuCategories(categoriesData);
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_available', true);

      if (itemsError) throw itemsError;
      setMenuItems(itemsData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading restaurant",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('restaurant_id', id)
      .single();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        variant: "destructive",
        title: "Please sign in",
        description: "You need to be signed in to add favorites.",
      });
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('restaurant_id', id);
        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
        });
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: session.user.id,
            restaurant_id: id,
          });
        setIsFavorite(true);
        toast({
          title: "Added to favorites",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.item.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { item, quantity: 1 }];
      }
    });

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
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

  const getCartTotal = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  const filteredMenuItems = menuItems.filter(item => 
    selectedCategory ? item.category_id === selectedCategory : true
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Restaurant not found</h2>
          <p className="text-muted-foreground mb-4">The restaurant you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">{restaurant.name}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFavorite}
                className={isFavorite ? "text-accent" : ""}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "Favorited" : "Favorite"}
              </Button>
              {cart.length > 0 && (
                <Button 
                  onClick={() => navigate("/checkout", { state: { cart, restaurant } })}
                  className="relative"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart ({getCartItemCount()})
                  <Badge className="ml-2">${getCartTotal().toFixed(2)}</Badge>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Restaurant Info */}
      <div className="relative">
        <div 
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${restaurant.image_url || "/placeholder.svg"})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
                  <CardDescription className="text-lg">{restaurant.description}</CardDescription>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span>{restaurant.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{restaurant.address}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm">
                <span>Delivery fee: ${restaurant.delivery_fee}</span>
                <span>•</span>
                <span>Minimum order: ${restaurant.minimum_order}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Menu */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu Categories Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="font-semibold mb-4">Menu Categories</h3>
              <div className="space-y-2">
                {menuCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1">
            <div className="space-y-6">
              {filteredMenuItems.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <h4 className="text-lg font-semibold mb-2">No items available</h4>
                    <p className="text-muted-foreground">
                      This category doesn't have any available items right now.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredMenuItems.map((item) => {
                  const cartItem = cart.find(c => c.item.id === item.id);
                  const quantity = cartItem?.quantity || 0;

                  return (
                    <Card key={item.id} className="group">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-lg">{item.name}</h4>
                              {item.is_featured && (
                                <Badge variant="secondary">Featured</Badge>
                              )}
                            </div>
                            
                            <p className="text-muted-foreground mb-3">{item.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                              <span>${item.price.toFixed(2)}</span>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{item.preparation_time} min</span>
                              </div>
                            </div>

                            {item.allergens && item.allergens.length > 0 && (
                              <div className="flex items-center space-x-2 mb-3">
                                <Info className="h-4 w-4 text-warning" />
                                <span className="text-xs text-muted-foreground">
                                  Contains: {item.allergens.join(", ")}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              {quantity > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, quantity - 1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-semibold">{quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, quantity + 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button onClick={() => addToCart(item)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add to Cart
                                </Button>
                              )}
                            </div>
                          </div>

                          {item.image_url && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="lg"
            onClick={() => navigate("/checkout", { state: { cart, restaurant } })}
            className="shadow-lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {getCartItemCount()} items • ${getCartTotal().toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Restaurant;