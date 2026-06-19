Build a **premium, luxury perfume e-commerce web application** that is fully functional, production-ready, and designed with a unique, high-end aesthetic inspired by brands such as Chanel, Dior, Tom Ford, and Creed. The experience should feel sophisticated, elegant, modern, and immersive rather than like a generic template.

## Project Goal

Create a complete perfume e-commerce platform with a customer-facing storefront and a powerful admin dashboard. The application must be deployable immediately to production and follow modern development best practices.

---

# Tech Stack

## Frontend

* Next.js (preferred) with React.js
* TypeScript
* Tailwind CSS
* Framer Motion for premium animations and transitions
* Responsive design optimized for:

  * Mobile
  * Tablet
  * Desktop
* SEO-friendly architecture
* Fast-loading pages using Next.js optimization techniques

## Backend

* Node.js
* Express.js
* TypeScript
* REST API architecture
* JWT authentication
* Role-based authorization (Admin and Customer)

## Database & Services

* Supabase
* PostgreSQL via Supabase
* Supabase Storage for image uploads
* Supabase Auth integration where appropriate

---

# Design Requirements

Design a truly unique luxury perfume shopping experience.

### Visual Direction

* Elegant and premium aesthetic
* Dark luxury theme with optional light accents
* Minimal yet sophisticated layouts
* Rich typography
* Cinematic product presentation
* Glassmorphism used subtly where appropriate
* Smooth micro-interactions

### Animation Requirements

Use Framer Motion extensively but tastefully:

* Page transitions
* Fade and reveal animations
* Scroll-triggered animations
* Hover interactions
* Product image transitions
* Animated counters
* Cart interactions
* Animated mobile menu
* Checkout progress indicators

---

# Homepage

Create an immersive homepage including:

### Hero Section

* Full-width premium slider/carousel
* Auto-play with manual navigation
* High-quality perfume imagery
* Elegant overlay text
* CTA buttons:

  * Shop Now
  * Discover Collection

### Featured Sections

* Featured Perfumes
* Best Sellers
* New Arrivals
* Luxury Collections
* Seasonal Recommendations

### Interactive Experiences

* Animated category showcase
* Brand story section
* Why Choose Us section
* Customer testimonials
* Newsletter subscription
* Instagram-inspired gallery

---

# Customer Features

## Authentication

* Register
* Login
* Forgot Password
* Reset Password
* Secure sessions

## Product Catalog

* Product listing pages
* Product detail pages

Each perfume should include:

* Multiple images
* Product name
* Description
* Price
* Discount price
* Category
* Brand
* Volume (30ml, 50ml, 100ml, etc.)
* Stock availability
* Fragrance notes:

  * Top Notes
  * Middle Notes
  * Base Notes
* Ratings and reviews

## Search & Filtering

Advanced search functionality with filters:

* Brand
* Category
* Price range
* Gender
* Fragrance family
* Best sellers
* New arrivals
* Availability
* Sorting options

## Shopping Cart

* Add to cart
* Update quantity
* Remove items
* Persistent cart
* Animated interactions

## Wishlist (Optional)

* Save favorite products
* Move wishlist items to cart

## Checkout

Multi-step checkout process:

* Shipping information
* Billing information
* Order summary
* Payment confirmation

Include:

* Coupon support
* Shipping fee calculations
* Tax calculations

## Customer Accounts

Users can:

* View profile
* Edit profile
* Change password
* View order history
* Track orders
* Reorder products
* Manage addresses

## Order Tracking

Provide visual order statuses:

* Pending
* Confirmed
* Processing
* Shipped
* Delivered
* Cancelled

---

# Admin Dashboard

Build a separate admin panel with secure admin access.

## Dashboard Overview

Display:

* Revenue metrics
* Sales charts
* Orders overview
* Inventory overview
* Recent activities
* Top-selling products
* Low-stock alerts

## Product Management

Admins can:

* Add perfumes
* Edit perfumes
* Delete perfumes
* Upload multiple images
* Manage fragrance notes
* Set featured products
* Configure pricing

## Inventory Management

* Monitor stock levels
* Update inventory
* Receive low-stock notifications

## Category Management

CRUD functionality for:

* Categories
* Brands
* Collections

## Order Management

Admins can:

* View orders
* Update statuses
* Manage fulfilment
* View customer details

## Customer Management

* View customer accounts
* Manage customer information
* Review purchase history

## Coupon Management (Optional)

* Create coupons
* Percentage discounts
* Fixed discounts
* Expiry dates
* Usage limits

---

# Supabase Requirements

Use Supabase for:

* PostgreSQL database
* Storage for perfume images
* Authentication integration
* Row Level Security policies
* Environment variable configuration

Generate:

* Database schema
* Migration scripts
* Seed data for perfumes
* Proper relationships between tables

---

# API Requirements

Develop clean REST APIs for:

* Authentication
* Products
* Categories
* Brands
* Orders
* Customers
* Cart
* Wishlist
* Coupons
* Dashboard analytics

Requirements:

* Validation
* Error handling
* Pagination
* Filtering
* Secure middleware
* Consistent response structure

---

# Performance & SEO

Implement:

* Server-side rendering where beneficial
* Dynamic metadata
* Open Graph tags
* Structured data/schema markup
* Image optimization
* Lazy loading
* Code splitting
* Caching strategies
* Lighthouse optimization targeting scores above 90

---

# Security

Implement:

* JWT authentication
* Password hashing
* Protected routes
* Rate limiting
* Input sanitization
* CORS configuration
* Secure environment variables
* CSRF considerations
* Role-based access control

---

# Deployment

Prepare the application for production deployment.

Requirements:

* Frontend deployment on Vercel
* Backend deployment on Vercel
* Environment variable setup
* Domain integration guidance
* SSL configuration
* Build optimization
* Production scripts

---

# Code Quality

The generated code must be:

* Clean and maintainable
* Modular and scalable
* Fully typed with TypeScript
* Well documented
* Following industry best practices
* Structured using feature-based architecture
* Easy for future developers to extend

---

# Deliverables

Generate a complete, production-ready application including:

* Full source code
* Customer-facing luxury perfume website
* Fully functional admin dashboard
* Supabase database setup
* Database schema and seed data
* REST APIs
* Framer Motion animations
* Responsive design
* Deployment configuration
* Environment variable examples
* README documentation with setup instructions
* Maintenance documentation

The final result should look and feel like a premium international luxury perfume brand rather than a generic e-commerce template, and should be deployable immediately with minimal additional configuration.
