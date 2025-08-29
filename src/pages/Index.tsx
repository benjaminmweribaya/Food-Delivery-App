import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Star, ShoppingCart, Heart, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-food-delivery.jpg";
import burgerImage from "@/assets/burger-sample.jpg";
import pizzaImage from "@/assets/pizza-sample.jpg";
import saladImage from "@/assets/salad-sample.jpg";

// Mock data for restaurants and food items
const restaurants = [
  {
    id: 1,
    name: "Burger Palace",
    cuisine: "American",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: "$2.99",
    image: burgerImage,
    featured: true,
  },
  {
    id: 2,
    name: "Pizza Corner",
    cuisine: "Italian",
    rating: 4.6,
    deliveryTime: "30-40 min",
    deliveryFee: "$1.99",
    image: pizzaImage,
    featured: false,
  },
  {
    id: 3,
    name: "Fresh Greens",
    cuisine: "Healthy",
    rating: 4.9,
    deliveryTime: "20-30 min",
    deliveryFee: "$3.49",
    image: saladImage,
    featured: true,
  },
];

const foodCategories = [
  { name: "Burgers", emoji: "🍔", count: 45 },
  { name: "Pizza", emoji: "🍕", count: 32 },
  { name: "Healthy", emoji: "🥗", count: 28 },
  { name: "Asian", emoji: "🍜", count: 56 },
  { name: "Desserts", emoji: "🍰", count: 23 },
  { name: "Coffee", emoji: "☕", count: 18 },
];

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    // Check auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    // Fetch real restaurants
    fetchRestaurants();

    return () => subscription.unsubscribe();
  }, []);

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .limit(6);
    
    if (data) {
      setRestaurants(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GrubHub Flow
              </h1>
              <div className="hidden md:flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Deliver to Downtown</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </Button>
                  <Button variant="cart" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4" />
                    {cartItems > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                        {cartItems}
                      </Badge>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 hero-gradient opacity-80" />
        </div>
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Delicious food,
              <br />
              <span className="text-primary-glow">delivered fast</span>
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Order from your favorite restaurants and get fresh, hot meals delivered to your door in minutes.
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search for restaurants or cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white/95 backdrop-blur"
                />
              </div>
              <Button variant="hero" size="lg" className="h-12">
                Find Food
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Food Categories */}
      <section className="container mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold mb-6">Browse by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {foodCategories.map((category) => (
            <Card 
              key={category.name}
              className={`restaurant-card cursor-pointer ${selectedCategory === category.name ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedCategory(category.name === selectedCategory ? null : category.name)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{category.emoji}</div>
                <h4 className="font-semibold text-sm">{category.name}</h4>
                <p className="text-xs text-muted-foreground">{category.count} places</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Featured Restaurants</h3>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="restaurant-card group" onClick={() => navigate(`/restaurant/${restaurant.id}`)}>
              <div className="relative">
                <img 
                  src={restaurant.image_url || "/placeholder.svg"} 
                  alt={restaurant.name}
                  className="w-full h-48 object-cover"
                />
                {restaurant.is_featured && (
                  <Badge className="absolute top-3 left-3 bg-accent">
                    Featured
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur hover:bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-semibold">{restaurant.rating}</span>
                  </div>
                </div>
                <CardDescription>{restaurant.cuisine_type}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</span>
                  </div>
                  <span>${restaurant.delivery_fee} delivery</span>
                </div>
                
                <Button className="w-full mt-4" variant="food" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/restaurant/${restaurant.id}`);
                }}>
                  View Menu
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="hero-gradient">
        <div className="container mx-auto px-4 py-16 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to start ordering?
          </h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust GrubHub Flow for their daily meals. 
            Fast delivery, great food, unbeatable prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg">
              Download Mobile App
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              Browse Restaurants
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 GrubHub Flow. Delicious food, delivered with care.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;