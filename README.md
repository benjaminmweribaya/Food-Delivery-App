# Food Delivery App

## Introduction
The Food Delivery App is a multi-user mobile application that allows customers to browse restaurants, order food, and track deliveries in real time. Restaurants can manage their menus, receive orders, and track deliveries, while delivery riders can navigate routes and update order statuses. The platform integrates Firebase for authentication and database management, Google Maps for route tracking, and various payment options.

---

## Tech Stack
- **Frontend:** React Native
- **Backend:** Firebase Firestore (NoSQL database)
- **Authentication:** Firebase Authentication
- **Maps & Navigation:** Google Maps API
- **Notifications:** Firebase Cloud Messaging
- **Payments:** PayPal, Mobile Money, Credit/Debit Cards
- **Chat & Support:** In-app chat, AI chatbot

---

## Features
### **1. User Roles**
- **Customers:** Browse restaurants, order food, track orders, make payments.
- **Restaurants:** Manage menu, accept/reject orders, update food status.
- **Delivery Riders:** Accept delivery requests, navigate via Google Maps, update delivery status.
- **Admin:** Manage users, orders, restaurants, and delivery riders.

### **2. User Authentication**
- Sign up/Login using Firebase Authentication
- Social Login (Google, Facebook)
- Profile management (Name, Address, Payment Methods)

### **3. Restaurant Management**
- Restaurant registration & verification
- Add, edit, delete food items
- Set opening/closing hours
- Manage discounts & offers

### **4. Customer Features**
- Browse restaurants and food categories
- Search food & filter by price, rating, and cuisine
- Add food to cart and place orders
- Real-time order tracking
- Save favorite restaurants & orders

### **5. Order Management**
- Order placement & confirmation
- Live order status updates (Preparing, Out for Delivery, Delivered)
- Notifications (Push, SMS, Email)

### **6. Delivery System**
- Assign delivery riders automatically or manually
- Real-time route tracking with Google Maps
- Estimated delivery time

### **7. Payments & Wallet**
- Multiple payment options (Credit/Debit Card, Mobile Money, PayPal)
- Promo codes & discounts
- Refund & order cancellation system

### **8. Ratings & Reviews**
- Customers rate restaurants & delivery experience
- Restaurants rate delivery riders

### **9. Chat & Support**
- In-app chat between customer, restaurant, and rider
- AI chatbot for FAQs
- Contact customer support

### **10. Admin Dashboard**
- Manage restaurants, customers, and delivery riders
- View order statistics & analytics
- Handle disputes & complaints

---

## Database Structure (Firebase Firestore)
Since Firebase Firestore is a NoSQL database, data is stored as collections and documents.

### **Collections & Relationships**
1. **Users (customers, restaurants, riders, admin)**
   - `users/{userId}`
   - Fields: name, email, phone, role, address, profilePic, paymentMethods

2. **Restaurants**
   - `restaurants/{restaurantId}`
   - Fields: name, location, openingHours, menu (subcollection)

3. **Menu (Subcollection in Restaurants)**
   - `restaurants/{restaurantId}/menu/{menuItemId}`
   - Fields: name, price, image, category, available

4. **Orders**
   - `orders/{orderId}`
   - Fields: userId, restaurantId, items (array), totalPrice, status, paymentStatus, deliveryId

5. **Delivery (Subcollection in Orders)**
   - `orders/{orderId}/delivery/{deliveryId}`
   - Fields: riderId, pickupTime, deliveryTime, status, locationTracking

6. **Payments**
   - `payments/{paymentId}`
   - Fields: orderId, userId, amount, method, status, timestamp

7. **Reviews**
   - `reviews/{reviewId}`
   - Fields: userId, restaurantId, rating, comment, timestamp

8. **Chats (Optional)**
   - `chats/{chatId}`
   - Fields: users (array), messages (subcollection)

---

## Installation & Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/benjaminmweribaya/food-delivery-app.git
   ```
2. Navigate to the project folder:
   ```sh
   cd food-delivery-app
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Set up Firebase:
   - Create a Firebase project in the Firebase Console.
   - Enable Authentication (Email/Password, Google, Facebook, etc.).
   - Enable Firestore Database.
   - Enable Cloud Messaging for notifications.
5. Create a `.env` file and add Firebase credentials:
   ```sh
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```
6. Run the project:
   ```sh
   npm start
   ```

---

## API Integration
- **Google Maps API:** For location services and navigation.
- **Payment API (PayPal, Stripe, Mobile Money):** For secure transactions.
- **Firebase Cloud Messaging:** For push notifications.
- **Chat API (optional):** For in-app messaging.

---

## Contribution Guidelines
1. Fork the repository.
2. Create a feature branch:
   ```sh
   git checkout -b feature-name
   ```
3. Commit changes:
   ```sh
   git commit -m "Added new feature"
   ```
4. Push to GitHub:
   ```sh
   git push origin feature-name
   ```
5. Create a Pull Request for review.

---

## License
This project is licensed under the MIT License.

---

## Contact
For any inquiries or contributions, reach out via:
- Email: b3njaminbaya@gmail.com
- GitHub: [benjaminmweribaya](https://github.com/benjaminmweribaya)

Happy Coding!

