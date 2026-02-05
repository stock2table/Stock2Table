import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image, ActivityIndicator, Dimensions, Linking, StatusBar, Alert, Modal } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Beautiful food images for categories
const CATEGORY_IMAGES = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  dinner: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  dessert: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
  snack: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400&q=80',
};

// Reliable food images for AI recommendations
const RECIPE_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&q=80',
];

const getRecipeImage = (index: number) => RECIPE_IMAGES[index % RECIPE_IMAGES.length];

// Preference-based fallback suggestions
const PREFERENCE_SUGGESTIONS: Record<string, any> = {
  vegetarian: {
    name: 'Creamy Mushroom Risotto',
    description: 'Rich and creamy Italian risotto with wild mushrooms, parmesan, and fresh herbs. Pure vegetarian comfort food.',
    cuisine: 'Italian',
    prep_time: 10,
    cook_time: 30,
    calories: 380,
    rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80',
    video_url: 'https://www.youtube.com/results?search_query=mushroom+risotto+recipe',
    reason: 'Delicious vegetarian comfort food perfect for you',
  },
  vegan: {
    name: 'Buddha Bowl with Tahini',
    description: 'Colorful bowl with roasted chickpeas, quinoa, fresh vegetables, and creamy tahini dressing. 100% plant-based goodness.',
    cuisine: 'Healthy',
    prep_time: 15,
    cook_time: 25,
    calories: 420,
    rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    video_url: 'https://www.youtube.com/results?search_query=vegan+buddha+bowl+recipe',
    reason: 'Nutritious plant-based meal just for you',
  },
  'gluten-free': {
    name: 'Grilled Salmon & Vegetables',
    description: 'Perfectly grilled salmon with roasted seasonal vegetables and lemon herb sauce. Naturally gluten-free.',
    cuisine: 'Mediterranean',
    prep_time: 10,
    cook_time: 20,
    calories: 380,
    rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    video_url: 'https://www.youtube.com/results?search_query=grilled+salmon+recipe',
    reason: 'Healthy gluten-free option for your diet',
  },
  'dairy-free': {
    name: 'Thai Green Curry',
    description: 'Aromatic Thai curry with coconut milk, fresh vegetables, and fragrant herbs. Naturally dairy-free.',
    cuisine: 'Thai',
    prep_time: 15,
    cook_time: 25,
    calories: 350,
    rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
    video_url: 'https://www.youtube.com/results?search_query=thai+green+curry+recipe',
    reason: 'Creamy and delicious without dairy',
  },
  'low-carb': {
    name: 'Herb Crusted Chicken',
    description: 'Juicy chicken breast with a crispy herb crust, served with roasted vegetables. Low carb and high protein.',
    cuisine: 'American',
    prep_time: 10,
    cook_time: 25,
    calories: 320,
    rating: 4.7,
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
    video_url: 'https://www.youtube.com/results?search_query=herb+crusted+chicken+recipe',
    reason: 'Perfect low-carb option for your goals',
  },
  'keto': {
    name: 'Avocado Stuffed with Tuna',
    description: 'Fresh avocado halves filled with seasoned tuna salad. High fat, low carb, and incredibly satisfying.',
    cuisine: 'Healthy',
    prep_time: 10,
    cook_time: 0,
    calories: 380,
    rating: 4.6,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    video_url: 'https://www.youtube.com/results?search_query=keto+avocado+tuna+recipe',
    reason: 'Keto-friendly meal to keep you in ketosis',
  },
  default: {
    name: 'Honey Garlic Salmon',
    description: 'A perfectly glazed salmon with sweet honey and aromatic garlic. Quick to make, impressive to serve.',
    cuisine: 'American',
    prep_time: 10,
    cook_time: 20,
    calories: 420,
    rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    video_url: 'https://www.youtube.com/results?search_query=honey+garlic+salmon+recipe',
    reason: 'Quick and nutritious - perfect for a busy weeknight',
  },
};

// Fallback trending dishes with beautiful images
const FALLBACK_TRENDING = [
  { id: '1', name: 'Korean Fried Chicken', cuisine: 'Korean', time: 45, calories: 580, rating: 4.9, image_url: 'https://images.unsplash.com/photo-1575932444877-5106bee2a599?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=korean+fried+chicken+recipe' },
  { id: '2', name: 'Butter Chicken', cuisine: 'Indian', time: 40, calories: 490, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=butter+chicken+recipe' },
  { id: '3', name: 'Tacos Al Pastor', cuisine: 'Mexican', time: 35, calories: 420, rating: 4.7, image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=tacos+al+pastor+recipe' },
  { id: '4', name: 'Sushi Bowl', cuisine: 'Japanese', time: 30, calories: 380, rating: 4.9, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=sushi+bowl+recipe' },
  { id: '5', name: 'Margherita Pizza', cuisine: 'Italian', time: 25, calories: 450, rating: 4.6, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=margherita+pizza+recipe' },
  { id: '6', name: 'Pad Thai', cuisine: 'Thai', time: 30, calories: 520, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=pad+thai+recipe' },
];

const FALLBACK_VIDEOS = [
  { id: '1', title: 'Knife Skills Masterclass', duration: '12:45', thumbnail_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=knife+skills+cooking', estimated_views: '2.1M' },
  { id: '2', title: 'Perfect Eggs 5 Ways', duration: '8:30', thumbnail_url: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=how+to+cook+eggs', estimated_views: '1.8M' },
  { id: '3', title: 'Homemade Pasta', duration: '15:20', thumbnail_url: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=homemade+pasta+recipe', estimated_views: '950K' },
  { id: '4', title: 'Sushi at Home', duration: '18:45', thumbnail_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=how+to+make+sushi', estimated_views: '3.2M' },
];

// Cuisine Essential Items - Top 20 for each cuisine
const CUISINE_ESSENTIALS: Record<string, { emoji: string; color: [string, string]; items: { name: string; emoji: string; unit: string }[] }> = {
  indian: {
    emoji: '🇮🇳',
    color: ['#f97316', '#ea580c'],
    items: [
      { name: 'Basmati Rice', emoji: '🍚', unit: 'kg' },
      { name: 'Turmeric', emoji: '🌾', unit: 'g' },
      { name: 'Cumin Seeds', emoji: '🫘', unit: 'g' },
      { name: 'Coriander Powder', emoji: '🌿', unit: 'g' },
      { name: 'Garam Masala', emoji: '✨', unit: 'g' },
      { name: 'Red Chili Powder', emoji: '🌶️', unit: 'g' },
      { name: 'Ginger', emoji: '🫚', unit: 'g' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'Onions', emoji: '🧅', unit: 'kg' },
      { name: 'Tomatoes', emoji: '🍅', unit: 'kg' },
      { name: 'Green Chilies', emoji: '🌶️', unit: 'pcs' },
      { name: 'Mustard Seeds', emoji: '🫛', unit: 'g' },
      { name: 'Curry Leaves', emoji: '🍃', unit: 'bunch' },
      { name: 'Ghee', emoji: '🧈', unit: 'g' },
      { name: 'Chickpeas', emoji: '🫘', unit: 'g' },
      { name: 'Lentils (Dal)', emoji: '🥣', unit: 'g' },
      { name: 'Yogurt', emoji: '🥛', unit: 'g' },
      { name: 'Cilantro', emoji: '🌿', unit: 'bunch' },
      { name: 'Cardamom', emoji: '🌰', unit: 'g' },
      { name: 'Paneer', emoji: '🧀', unit: 'g' },
    ]
  },
  italian: {
    emoji: '🇮🇹',
    color: ['#22c55e', '#16a34a'],
    items: [
      { name: 'Pasta', emoji: '🍝', unit: 'g' },
      { name: 'Olive Oil', emoji: '🫒', unit: 'ml' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'San Marzano Tomatoes', emoji: '🍅', unit: 'cans' },
      { name: 'Parmesan', emoji: '🧀', unit: 'g' },
      { name: 'Basil', emoji: '🌿', unit: 'bunch' },
      { name: 'Oregano', emoji: '🌿', unit: 'g' },
      { name: 'Mozzarella', emoji: '🧀', unit: 'g' },
      { name: 'Prosciutto', emoji: '🥓', unit: 'g' },
      { name: 'Arborio Rice', emoji: '🍚', unit: 'g' },
      { name: 'White Wine', emoji: '🍷', unit: 'ml' },
      { name: 'Balsamic Vinegar', emoji: '🫙', unit: 'ml' },
      { name: 'Pine Nuts', emoji: '🥜', unit: 'g' },
      { name: 'Capers', emoji: '🫒', unit: 'g' },
      { name: 'Anchovies', emoji: '🐟', unit: 'g' },
      { name: 'Ricotta', emoji: '🧀', unit: 'g' },
      { name: 'Pecorino Romano', emoji: '🧀', unit: 'g' },
      { name: 'Italian Sausage', emoji: '🌭', unit: 'g' },
      { name: 'Red Pepper Flakes', emoji: '🌶️', unit: 'g' },
      { name: 'Fresh Rosemary', emoji: '🌿', unit: 'bunch' },
    ]
  },
  mexican: {
    emoji: '🇲🇽',
    color: ['#ef4444', '#dc2626'],
    items: [
      { name: 'Corn Tortillas', emoji: '🫓', unit: 'pack' },
      { name: 'Black Beans', emoji: '🫘', unit: 'cans' },
      { name: 'Jalapeños', emoji: '🌶️', unit: 'pcs' },
      { name: 'Cilantro', emoji: '🌿', unit: 'bunch' },
      { name: 'Lime', emoji: '🍋', unit: 'pcs' },
      { name: 'Avocado', emoji: '🥑', unit: 'pcs' },
      { name: 'Cumin', emoji: '🌾', unit: 'g' },
      { name: 'Chipotle in Adobo', emoji: '🌶️', unit: 'can' },
      { name: 'Queso Fresco', emoji: '🧀', unit: 'g' },
      { name: 'Sour Cream', emoji: '🥛', unit: 'g' },
      { name: 'Onions', emoji: '🧅', unit: 'kg' },
      { name: 'Tomatoes', emoji: '🍅', unit: 'kg' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'Mexican Oregano', emoji: '🌿', unit: 'g' },
      { name: 'Cheddar Cheese', emoji: '🧀', unit: 'g' },
      { name: 'Corn', emoji: '🌽', unit: 'cans' },
      { name: 'Rice', emoji: '🍚', unit: 'g' },
      { name: 'Chili Powder', emoji: '🌶️', unit: 'g' },
      { name: 'Cotija Cheese', emoji: '🧀', unit: 'g' },
      { name: 'Tomatillos', emoji: '🍅', unit: 'g' },
    ]
  },
  chinese: {
    emoji: '🇨🇳',
    color: ['#dc2626', '#b91c1c'],
    items: [
      { name: 'Soy Sauce', emoji: '🥢', unit: 'ml' },
      { name: 'Sesame Oil', emoji: '🫙', unit: 'ml' },
      { name: 'Rice Vinegar', emoji: '🫙', unit: 'ml' },
      { name: 'Ginger', emoji: '🫚', unit: 'g' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'Green Onions', emoji: '🧅', unit: 'bunch' },
      { name: 'Oyster Sauce', emoji: '🦪', unit: 'ml' },
      { name: 'Rice', emoji: '🍚', unit: 'kg' },
      { name: 'Hoisin Sauce', emoji: '🫙', unit: 'ml' },
      { name: 'Five Spice', emoji: '✨', unit: 'g' },
      { name: 'Shaoxing Wine', emoji: '🍶', unit: 'ml' },
      { name: 'Tofu', emoji: '🧈', unit: 'g' },
      { name: 'Bok Choy', emoji: '🥬', unit: 'bunch' },
      { name: 'Noodles', emoji: '🍜', unit: 'g' },
      { name: 'Corn Starch', emoji: '🌾', unit: 'g' },
      { name: 'Chili Oil', emoji: '🌶️', unit: 'ml' },
      { name: 'Black Bean Sauce', emoji: '🫘', unit: 'ml' },
      { name: 'Bean Sprouts', emoji: '🌱', unit: 'g' },
      { name: 'Shiitake Mushrooms', emoji: '🍄', unit: 'g' },
      { name: 'Star Anise', emoji: '⭐', unit: 'pcs' },
    ]
  },
  thai: {
    emoji: '🇹🇭',
    color: ['#8b5cf6', '#7c3aed'],
    items: [
      { name: 'Fish Sauce', emoji: '🐟', unit: 'ml' },
      { name: 'Thai Basil', emoji: '🌿', unit: 'bunch' },
      { name: 'Coconut Milk', emoji: '🥥', unit: 'cans' },
      { name: 'Lemongrass', emoji: '🌿', unit: 'stalks' },
      { name: 'Galangal', emoji: '🫚', unit: 'g' },
      { name: 'Kaffir Lime Leaves', emoji: '🍃', unit: 'pcs' },
      { name: 'Thai Chilies', emoji: '🌶️', unit: 'g' },
      { name: 'Palm Sugar', emoji: '🍬', unit: 'g' },
      { name: 'Tamarind Paste', emoji: '🫙', unit: 'g' },
      { name: 'Jasmine Rice', emoji: '🍚', unit: 'kg' },
      { name: 'Shrimp Paste', emoji: '🦐', unit: 'g' },
      { name: 'Rice Noodles', emoji: '🍜', unit: 'g' },
      { name: 'Green Curry Paste', emoji: '🌶️', unit: 'g' },
      { name: 'Red Curry Paste', emoji: '🌶️', unit: 'g' },
      { name: 'Cilantro', emoji: '🌿', unit: 'bunch' },
      { name: 'Bean Sprouts', emoji: '🌱', unit: 'g' },
      { name: 'Lime', emoji: '🍋', unit: 'pcs' },
      { name: 'Peanuts', emoji: '🥜', unit: 'g' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'Shallots', emoji: '🧅', unit: 'g' },
    ]
  },
  japanese: {
    emoji: '🇯🇵',
    color: ['#ec4899', '#db2777'],
    items: [
      { name: 'Soy Sauce', emoji: '🥢', unit: 'ml' },
      { name: 'Mirin', emoji: '🍶', unit: 'ml' },
      { name: 'Sake', emoji: '🍶', unit: 'ml' },
      { name: 'Rice Vinegar', emoji: '🫙', unit: 'ml' },
      { name: 'Dashi Stock', emoji: '🥣', unit: 'g' },
      { name: 'Sushi Rice', emoji: '🍚', unit: 'kg' },
      { name: 'Nori Sheets', emoji: '🍙', unit: 'sheets' },
      { name: 'Miso Paste', emoji: '🫙', unit: 'g' },
      { name: 'Wasabi', emoji: '🌿', unit: 'g' },
      { name: 'Pickled Ginger', emoji: '🫚', unit: 'g' },
      { name: 'Sesame Seeds', emoji: '🌾', unit: 'g' },
      { name: 'Panko Breadcrumbs', emoji: '🍞', unit: 'g' },
      { name: 'Tofu', emoji: '🧈', unit: 'g' },
      { name: 'Shiitake Mushrooms', emoji: '🍄', unit: 'g' },
      { name: 'Green Onions', emoji: '🧅', unit: 'bunch' },
      { name: 'Sesame Oil', emoji: '🫙', unit: 'ml' },
      { name: 'Bonito Flakes', emoji: '🐟', unit: 'g' },
      { name: 'Kombu Seaweed', emoji: '🍃', unit: 'g' },
      { name: 'Udon Noodles', emoji: '🍜', unit: 'g' },
      { name: 'Teriyaki Sauce', emoji: '🫙', unit: 'ml' },
    ]
  },
  korean: {
    emoji: '🇰🇷',
    color: ['#3b82f6', '#2563eb'],
    items: [
      { name: 'Gochujang', emoji: '🌶️', unit: 'g' },
      { name: 'Gochugaru', emoji: '🌶️', unit: 'g' },
      { name: 'Soy Sauce', emoji: '🥢', unit: 'ml' },
      { name: 'Sesame Oil', emoji: '🫙', unit: 'ml' },
      { name: 'Rice', emoji: '🍚', unit: 'kg' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'Ginger', emoji: '🫚', unit: 'g' },
      { name: 'Green Onions', emoji: '🧅', unit: 'bunch' },
      { name: 'Kimchi', emoji: '🥬', unit: 'g' },
      { name: 'Doenjang', emoji: '🫙', unit: 'g' },
      { name: 'Sesame Seeds', emoji: '🌾', unit: 'g' },
      { name: 'Korean Radish', emoji: '🥕', unit: 'g' },
      { name: 'Tofu', emoji: '🧈', unit: 'g' },
      { name: 'Rice Cakes', emoji: '🍡', unit: 'g' },
      { name: 'Fish Sauce', emoji: '🐟', unit: 'ml' },
      { name: 'Mirin', emoji: '🍶', unit: 'ml' },
      { name: 'Napa Cabbage', emoji: '🥬', unit: 'head' },
      { name: 'Pear', emoji: '🍐', unit: 'pcs' },
      { name: 'Perilla Leaves', emoji: '🍃', unit: 'bunch' },
      { name: 'Sweet Potato Starch', emoji: '🌾', unit: 'g' },
    ]
  },
  french: {
    emoji: '🇫🇷',
    color: ['#6366f1', '#4f46e5'],
    items: [
      { name: 'Butter', emoji: '🧈', unit: 'g' },
      { name: 'Heavy Cream', emoji: '🥛', unit: 'ml' },
      { name: 'Shallots', emoji: '🧅', unit: 'g' },
      { name: 'Dijon Mustard', emoji: '🫙', unit: 'g' },
      { name: 'Herbes de Provence', emoji: '🌿', unit: 'g' },
      { name: 'White Wine', emoji: '🍷', unit: 'ml' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'Thyme', emoji: '🌿', unit: 'bunch' },
      { name: 'Bay Leaves', emoji: '🍃', unit: 'pcs' },
      { name: 'Gruyère Cheese', emoji: '🧀', unit: 'g' },
      { name: 'Brie', emoji: '🧀', unit: 'g' },
      { name: 'Tarragon', emoji: '🌿', unit: 'bunch' },
      { name: 'Capers', emoji: '🫒', unit: 'g' },
      { name: 'Cornichons', emoji: '🥒', unit: 'g' },
      { name: 'Duck Fat', emoji: '🍗', unit: 'g' },
      { name: 'Cognac', emoji: '🥃', unit: 'ml' },
      { name: 'Pearl Onions', emoji: '🧅', unit: 'g' },
      { name: 'Mushrooms', emoji: '🍄', unit: 'g' },
      { name: 'Leeks', emoji: '🥬', unit: 'pcs' },
      { name: 'French Bread', emoji: '🥖', unit: 'loaf' },
    ]
  },
  mediterranean: {
    emoji: '🫒',
    color: ['#14b8a6', '#0d9488'],
    items: [
      { name: 'Olive Oil', emoji: '🫒', unit: 'ml' },
      { name: 'Feta Cheese', emoji: '🧀', unit: 'g' },
      { name: 'Olives', emoji: '🫒', unit: 'g' },
      { name: 'Chickpeas', emoji: '🫘', unit: 'cans' },
      { name: 'Tahini', emoji: '🫙', unit: 'g' },
      { name: 'Lemon', emoji: '🍋', unit: 'pcs' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'Cucumber', emoji: '🥒', unit: 'pcs' },
      { name: 'Tomatoes', emoji: '🍅', unit: 'kg' },
      { name: 'Red Onion', emoji: '🧅', unit: 'pcs' },
      { name: 'Pita Bread', emoji: '🫓', unit: 'pack' },
      { name: 'Hummus', emoji: '🥣', unit: 'g' },
      { name: 'Oregano', emoji: '🌿', unit: 'g' },
      { name: 'Mint', emoji: '🌿', unit: 'bunch' },
      { name: 'Parsley', emoji: '🌿', unit: 'bunch' },
      { name: 'Sumac', emoji: '✨', unit: 'g' },
      { name: 'Za\'atar', emoji: '🌿', unit: 'g' },
      { name: 'Pomegranate', emoji: '🍎', unit: 'pcs' },
      { name: 'Couscous', emoji: '🍚', unit: 'g' },
      { name: 'Pine Nuts', emoji: '🥜', unit: 'g' },
    ]
  },
  vietnamese: {
    emoji: '🇻🇳',
    color: ['#f59e0b', '#d97706'],
    items: [
      { name: 'Fish Sauce', emoji: '🐟', unit: 'ml' },
      { name: 'Rice Noodles', emoji: '🍜', unit: 'g' },
      { name: 'Fresh Herbs', emoji: '🌿', unit: 'bunch' },
      { name: 'Bean Sprouts', emoji: '🌱', unit: 'g' },
      { name: 'Lime', emoji: '🍋', unit: 'pcs' },
      { name: 'Hoisin Sauce', emoji: '🫙', unit: 'ml' },
      { name: 'Sriracha', emoji: '🌶️', unit: 'ml' },
      { name: 'Rice Paper', emoji: '🫓', unit: 'pack' },
      { name: 'Lemongrass', emoji: '🌿', unit: 'stalks' },
      { name: 'Thai Basil', emoji: '🌿', unit: 'bunch' },
      { name: 'Mint', emoji: '🌿', unit: 'bunch' },
      { name: 'Cilantro', emoji: '🌿', unit: 'bunch' },
      { name: 'Jasmine Rice', emoji: '🍚', unit: 'kg' },
      { name: 'Garlic', emoji: '🧄', unit: 'bulbs' },
      { name: 'Shallots', emoji: '🧅', unit: 'g' },
      { name: 'Pho Spices', emoji: '✨', unit: 'g' },
      { name: 'Star Anise', emoji: '⭐', unit: 'pcs' },
      { name: 'Peanuts', emoji: '🥜', unit: 'g' },
      { name: 'Scallions', emoji: '🧅', unit: 'bunch' },
      { name: 'Chili Peppers', emoji: '🌶️', unit: 'pcs' },
    ]
  },
  american: {
    emoji: '🇺🇸',
    color: ['#ef4444', '#b91c1c'],
    items: [
      { name: 'Ground Beef', emoji: '🥩', unit: 'g' },
      { name: 'Cheddar Cheese', emoji: '🧀', unit: 'g' },
      { name: 'Burger Buns', emoji: '🍔', unit: 'pack' },
      { name: 'Bacon', emoji: '🥓', unit: 'g' },
      { name: 'Ketchup', emoji: '🫙', unit: 'ml' },
      { name: 'Mustard', emoji: '🫙', unit: 'ml' },
      { name: 'Mayo', emoji: '🫙', unit: 'g' },
      { name: 'Pickles', emoji: '🥒', unit: 'g' },
      { name: 'Lettuce', emoji: '🥬', unit: 'head' },
      { name: 'Tomatoes', emoji: '🍅', unit: 'kg' },
      { name: 'Onions', emoji: '🧅', unit: 'kg' },
      { name: 'BBQ Sauce', emoji: '🫙', unit: 'ml' },
      { name: 'Hot Dogs', emoji: '🌭', unit: 'pack' },
      { name: 'Chicken Wings', emoji: '🍗', unit: 'kg' },
      { name: 'Ranch Dressing', emoji: '🫙', unit: 'ml' },
      { name: 'Hot Sauce', emoji: '🌶️', unit: 'ml' },
      { name: 'Potatoes', emoji: '🥔', unit: 'kg' },
      { name: 'Corn on Cob', emoji: '🌽', unit: 'pcs' },
      { name: 'Butter', emoji: '🧈', unit: 'g' },
      { name: 'Garlic Powder', emoji: '🧄', unit: 'g' },
    ]
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionToken, user } = useAuth();
  const { pantryItems, fetchPantry, recipes, fetchRecipes } = useAppStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [todaySuggestion, setTodaySuggestion] = useState<any>(null);
  const [trendingDishes, setTrendingDishes] = useState<any[]>([]);
  const [videoTutorials, setVideoTutorials] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [userDietaryPrefs, setUserDietaryPrefs] = useState<string[]>([]);
  
  // Cuisine essentials state
  const [selectedCuisine, setSelectedCuisine] = useState('indian');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [addingToPantry, setAddingToPantry] = useState(false);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [enabledCuisines, setEnabledCuisines] = useState<Set<string>>(new Set(['indian', 'italian', 'mexican', 'chinese']));

  const allCuisines = Object.keys(CUISINE_ESSENTIALS);
  const cuisineList = allCuisines.filter(c => enabledCuisines.has(c));

  // Welcome modal for new users
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const toggleCuisineEnabled = (cuisine: string) => {
    setEnabledCuisines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cuisine)) {
        if (newSet.size > 1) { // Keep at least one cuisine
          newSet.delete(cuisine);
          // If we're disabling the currently selected cuisine, switch to another one
          if (selectedCuisine === cuisine) {
            const remaining = Array.from(newSet);
            setSelectedCuisine(remaining[0]);
          }
        }
      } else {
        newSet.add(cuisine);
      }
      return newSet;
    });
  };

  const toggleEssentialItem = (itemName: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const addSelectedToPantry = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Items Selected', 'Please select items to add to your pantry.');
      return;
    }

    try {
      setAddingToPantry(true);
      const cuisine = CUISINE_ESSENTIALS[selectedCuisine];
      const itemsToAdd = cuisine.items.filter(item => selectedItems.has(item.name));
      
      // Add each item to pantry
      for (const item of itemsToAdd) {
        await axios.post(`${BACKEND_URL}/api/pantry`, {
          name: item.name,
          quantity: 1,
          unit: item.unit,
          category: 'Cuisine Essentials'
        }, { headers: { Authorization: `Bearer ${sessionToken}` } });
      }
      
      // Refresh pantry
      await fetchPantry(sessionToken!);
      
      Alert.alert(
        '✅ Added to Pantry!', 
        `${selectedItems.size} ${selectedCuisine.charAt(0).toUpperCase() + selectedCuisine.slice(1)} essentials added to your pantry.`,
        [{ text: 'Great!' }]
      );
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error adding to pantry:', error);
      Alert.alert('Error', 'Failed to add items to pantry. Please try again.');
    } finally {
      setAddingToPantry(false);
    }
  };

  const selectAllCuisineItems = () => {
    const cuisine = CUISINE_ESSENTIALS[selectedCuisine];
    if (selectedItems.size === cuisine.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cuisine.items.map(item => item.name)));
    }
  };

  // Check if user is new (first time)
  const checkNewUser = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        // Small delay to let the home screen load first
        setTimeout(() => {
          setShowWelcomeModal(true);
        }, 1500);
      }
    } catch (error) {
      console.log('Error checking new user status');
    }
  };

  const dismissWelcome = async (openGuide: boolean = false) => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      setShowWelcomeModal(false);
      if (openGuide) {
        router.push('/meal-guide');
      }
    } catch (error) {
      console.log('Error saving welcome status');
    }
  };

  useEffect(() => {
    if (sessionToken) {
      loadAllContent();
      checkNewUser();
    }
  }, [sessionToken]);

  const loadAllContent = async () => {
    setLoadingContent(true);
    try {
      await Promise.all([
        fetchPantry(sessionToken!),
        fetchRecipes(),
        loadDailySuggestion(),
        loadTrendingDishes(),
        loadVideoTutorials(),
      ]);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  // Get preference-based fallback suggestion
  const getPreferenceBasedSuggestion = (prefs: string[]) => {
    // Priority order for dietary preferences
    const priorityPrefs = ['vegan', 'vegetarian', 'keto', 'gluten-free', 'dairy-free', 'low-carb'];
    
    for (const pref of priorityPrefs) {
      if (prefs.includes(pref) && PREFERENCE_SUGGESTIONS[pref]) {
        return PREFERENCE_SUGGESTIONS[pref];
      }
    }
    return null; // Return null if no dietary preference matches
  };

  const loadDailySuggestion = async () => {
    try {
      // First check if user has dietary preferences
      let dietaryPrefs: string[] = [];
      try {
        const prefsResponse = await axios.get(`${BACKEND_URL}/api/preferences`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
          timeout: 10000
        });
        if (prefsResponse.data.dietary_restrictions) {
          dietaryPrefs = prefsResponse.data.dietary_restrictions;
          setUserDietaryPrefs(dietaryPrefs);
        }
      } catch (e) {
        console.log('Could not load preferences');
      }

      // If user has dietary preferences, use preference-based suggestion
      const preferenceSuggestion = getPreferenceBasedSuggestion(dietaryPrefs);
      if (preferenceSuggestion) {
        setTodaySuggestion(preferenceSuggestion);
        return;
      }

      // Otherwise, get suggestion from API
      const response = await axios.get(`${BACKEND_URL}/api/discover/suggestion`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 15000
      });
      if (response.data.suggestion) {
        setTodaySuggestion(response.data.suggestion);
      } else {
        setTodaySuggestion(PREFERENCE_SUGGESTIONS.default);
      }
    } catch (error) {
      console.error('Error loading suggestion:', error);
      setTodaySuggestion(PREFERENCE_SUGGESTIONS.default);
    }
  };

  const loadTrendingDishes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discover/trending`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 15000
      });
      if (response.data.trending && response.data.trending.length > 0) {
        setTrendingDishes(response.data.trending);
      } else {
        setTrendingDishes(FALLBACK_TRENDING);
      }
    } catch (error) {
      console.error('Error loading trending:', error);
      setTrendingDishes(FALLBACK_TRENDING);
    }
  };

  const loadVideoTutorials = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discover/videos`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 15000
      });
      if (response.data.videos && response.data.videos.length > 0) {
        setVideoTutorials(response.data.videos);
      } else {
        setVideoTutorials(FALLBACK_VIDEOS);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideoTutorials(FALLBACK_VIDEOS);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllContent();
    setRefreshing(false);
  }, [sessionToken]);

  const getAIRecommendations = async () => {
    if (pantryItems.length === 0) {
      router.push('/(tabs)/pantry');
      return;
    }
    try {
      setLoadingRecs(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/recipes/recommend`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 30000 }
      );
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const trackActivity = async (type: string, itemId?: string, itemName?: string) => {
    try {
      await axios.post(`${BACKEND_URL}/api/activity`, {
        activity_type: type,
        item_id: itemId,
        item_name: itemName
      }, { headers: { Authorization: `Bearer ${sessionToken}` } });
    } catch (error) {
      // Silent fail
    }
  };

  const openVideo = (url: string, title: string) => {
    trackActivity('video_view', undefined, title);
    Linking.openURL(url);
  };

  const navigateToRecipe = (recipe: any) => {
    trackActivity('recipe_view', recipe.recipe_id || recipe.id, recipe.name);
    router.push({
      pathname: '/ai-recipe',
      params: { recipe: JSON.stringify(recipe) }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Chef'}</Text>
            <Text style={styles.subGreeting}>What's cooking today?</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.profileImage} />
            ) : (
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.profileImage}>
                <Ionicons name="person" size={20} color="white" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Today's AI Suggestion - HERO CARD */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Ionicons name="sparkles" size={14} color="white" />
              <Text style={styles.sectionBadgeText}>AI Picked for You</Text>
            </View>
          </View>
          
          {loadingContent && !todaySuggestion ? (
            <View style={styles.loadingHero}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Creating personalized suggestion...</Text>
            </View>
          ) : todaySuggestion && (
            <TouchableOpacity 
              style={styles.heroCard}
              onPress={() => navigateToRecipe(todaySuggestion)}
              activeOpacity={0.95}
            >
              <Image source={{ uri: todaySuggestion.image_url }} style={styles.heroImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.heroOverlay}>
                {/* Why suggested badge */}
                <View style={styles.whyBadge}>
                  <Ionicons name="bulb" size={12} color="#fbbf24" />
                  <Text style={styles.whyText} numberOfLines={1}>
                    {todaySuggestion.reason || 'Based on your pantry & preferences'}
                  </Text>
                </View>
                
                <Text style={styles.heroTitle}>{todaySuggestion.name}</Text>
                <Text style={styles.heroDesc} numberOfLines={2}>{todaySuggestion.description || todaySuggestion.reason}</Text>
                
                <View style={styles.heroMeta}>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="time-outline" size={14} color="white" />
                    <Text style={styles.heroMetaText}>{(todaySuggestion.prep_time || 15) + (todaySuggestion.cook_time || 30)} min</Text>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="flame-outline" size={14} color="white" />
                    <Text style={styles.heroMetaText}>{todaySuggestion.calories || 400} cal</Text>
                  </View>
                  {todaySuggestion.missing_ingredients && (
                    <View style={[styles.heroMetaItem, { backgroundColor: todaySuggestion.can_make ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)', paddingHorizontal: 8, borderRadius: 8 }]}>
                      <Ionicons name={todaySuggestion.can_make ? 'checkmark-circle' : 'cart'} size={14} color={todaySuggestion.can_make ? '#22c55e' : '#f97316'} />
                      <Text style={[styles.heroMetaText, { color: todaySuggestion.can_make ? '#22c55e' : '#f97316' }]}>
                        {todaySuggestion.can_make ? 'Ready!' : `Need ${todaySuggestion.missing_ingredients.length}`}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Missing Ingredients List */}
                {todaySuggestion.missing_ingredients && todaySuggestion.missing_ingredients.length > 0 && (
                  <View style={styles.missingIngredientsRow}>
                    <Text style={styles.missingLabel}>Missing: </Text>
                    <Text style={styles.missingList} numberOfLines={1}>
                      {todaySuggestion.missing_ingredients.slice(0, 3).join(', ')}
                      {todaySuggestion.missing_ingredients.length > 3 ? ` +${todaySuggestion.missing_ingredients.length - 3} more` : ''}
                    </Text>
                  </View>
                )}
                
                <View style={styles.heroActions}>
                  <TouchableOpacity style={styles.cookNowBtn}>
                    <Text style={styles.cookNowText}>Start Cooking</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.videoBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      openVideo(todaySuggestion.video_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(todaySuggestion.name + ' recipe')}`, todaySuggestion.name);
                    }}
                  >
                    <Ionicons name="logo-youtube" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/scan')} activeOpacity={0.9}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.quickActionGradient}>
              <Ionicons name="camera" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Scan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/pantry')} activeOpacity={0.9}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.quickActionGradient}>
              <Ionicons name="basket" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Pantry</Text>
            {pantryItems.length > 0 && (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>{pantryItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/meal-plan')} activeOpacity={0.9}>
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.quickActionGradient}>
              <Ionicons name="calendar" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/shopping')} activeOpacity={0.9}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.quickActionGradient}>
              <Ionicons name="cart" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Shop</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/meal-guide')} activeOpacity={0.9}>
            <LinearGradient colors={['#ec4899', '#db2777']} style={styles.quickActionGradient}>
              <Ionicons name="book" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Guide</Text>
          </TouchableOpacity>
        </View>

        {/* Cuisine Essentials - Quick Stock */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="restaurant" size={22} color="#22c55e" />
              <Text style={styles.sectionTitle}>Quick Stock</Text>
            </View>
            <TouchableOpacity onPress={selectAllCuisineItems}>
              <Text style={styles.seeAllText}>
                {selectedItems.size === CUISINE_ESSENTIALS[selectedCuisine].items.length ? 'Clear All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cuisineSubtitle}>Top 20 essentials for your favorite cuisine</Text>
          
          {/* Cuisine Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.cuisineTabs}
          >
            {cuisineList.map((cuisine) => {
              const data = CUISINE_ESSENTIALS[cuisine];
              const isSelected = selectedCuisine === cuisine;
              return (
                <TouchableOpacity
                  key={cuisine}
                  style={[styles.cuisineTab, isSelected && { backgroundColor: data.color[0] }]}
                  onPress={() => {
                    setSelectedCuisine(cuisine);
                    setSelectedItems(new Set());
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cuisineTabEmoji}>{data.emoji}</Text>
                  <Text style={[styles.cuisineTabText, isSelected && styles.cuisineTabTextActive]}>
                    {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Add More Cuisines Button */}
            <TouchableOpacity
              style={styles.addCuisineTab}
              onPress={() => setShowCuisineModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={20} color="#22c55e" />
              <Text style={styles.addCuisineText}>More</Text>
            </TouchableOpacity>
          </ScrollView>
          
          {/* Items Grid - Compact Pills */}
          <View style={styles.essentialsGrid}>
            {CUISINE_ESSENTIALS[selectedCuisine].items.map((item, idx) => {
              const isItemSelected = selectedItems.has(item.name);
              const inPantry = pantryItems.some((p: any) => p.name.toLowerCase() === item.name.toLowerCase());
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.essentialPill,
                    isItemSelected && styles.essentialPillSelected,
                    inPantry && styles.essentialPillInPantry,
                  ]}
                  onPress={() => !inPantry && toggleEssentialItem(item.name)}
                  activeOpacity={inPantry ? 1 : 0.7}
                  disabled={inPantry}
                >
                  <Text style={styles.essentialPillEmoji}>{item.emoji}</Text>
                  <Text style={[
                    styles.essentialPillName,
                    isItemSelected && styles.essentialPillNameSelected,
                    inPantry && styles.essentialPillNameInPantry,
                  ]} numberOfLines={1}>
                    {item.name.split(' ')[0]}
                  </Text>
                  {(isItemSelected || inPantry) && (
                    <View style={[styles.essentialPillCheck, inPantry && styles.essentialPillCheckInPantry]}>
                      <Ionicons name="checkmark" size={10} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Add to Pantry Button */}
          {selectedItems.size > 0 && (
            <TouchableOpacity
              style={styles.addToPantryBtn}
              onPress={addSelectedToPantry}
              disabled={addingToPantry}
              activeOpacity={0.9}
            >
              <LinearGradient 
                colors={CUISINE_ESSENTIALS[selectedCuisine].color} 
                style={styles.addToPantryGradient}
              >
                {addingToPantry ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.addToPantryText}>
                      Add {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} to Pantry
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Trending Worldwide */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trending-up" size={22} color="#f97316" />
              <Text style={styles.sectionTitle}>Trending Worldwide</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {trendingDishes.map((dish, idx) => (
              <TouchableOpacity
                key={dish.id || idx}
                style={styles.trendingCard}
                onPress={() => navigateToRecipe(dish)}
                activeOpacity={0.95}
              >
                <Image source={{ uri: dish.image_url }} style={styles.trendingImage} />
                
                <TouchableOpacity
                  style={styles.trendingYoutube}
                  onPress={(e) => {
                    e.stopPropagation();
                    openVideo(dish.video_url, dish.name);
                  }}
                >
                  <Ionicons name="logo-youtube" size={18} color="#ef4444" />
                </TouchableOpacity>
                
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.trendingOverlay}>
                  <View style={styles.trendingRating}>
                    <Ionicons name="star" size={10} color="#fbbf24" />
                    <Text style={styles.trendingRatingText}>{dish.rating || 4.8}</Text>
                  </View>
                  <Text style={styles.trendingName} numberOfLines={2}>{dish.name}</Text>
                  <Text style={styles.trendingCuisine}>{dish.cuisine}</Text>
                  <View style={styles.trendingMeta}>
                    <Ionicons name="time" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.trendingMetaText}>{dish.time || 30}m</Text>
                    <Ionicons name="flame" size={10} color="rgba(255,255,255,0.8)" style={{ marginLeft: 6 }} />
                    <Text style={styles.trendingMetaText}>{dish.calories || 400}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Video Tutorials */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="play-circle" size={22} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Video Tutorials</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/results?search_query=cooking+tutorials')}>
              <Text style={styles.seeAllText}>More</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {videoTutorials.map((video, idx) => (
              <TouchableOpacity
                key={video.id || idx}
                style={styles.videoCard}
                onPress={() => openVideo(video.video_url, video.title)}
                activeOpacity={0.95}
              >
                <Image source={{ uri: video.thumbnail_url }} style={styles.videoThumbnail} />
                <View style={styles.playOverlay}>
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={24} color="white" />
                  </View>
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{video.duration}</Text>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                  <Text style={styles.videoViews}>{video.estimated_views} views</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AI Recipe Assistant */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.aiCard}
            onPress={getAIRecommendations}
            disabled={loadingRecs}
            activeOpacity={0.95}
          >
            <LinearGradient colors={['#ec4899', '#db2777']} style={styles.aiGradient}>
              <View style={styles.aiContent}>
                <View style={styles.aiIconContainer}>
                  <Ionicons name="sparkles" size={28} color="white" />
                </View>
                <View style={styles.aiTextContent}>
                  <Text style={styles.aiTitle}>AI Recipe Assistant</Text>
                  <Text style={styles.aiSubtitle}>
                    {pantryItems.length > 0 
                      ? `Get recipes from your ${pantryItems.length} pantry items`
                      : 'Add items to pantry to get started'}
                  </Text>
                </View>
                {loadingRecs ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.aiArrow}>
                    <Ionicons name="arrow-forward" size={22} color="white" />
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionBadge}>
              <Ionicons name="sparkles" size={14} color="white" />
              <Text style={styles.sectionBadgeText}>AI Generated</Text>
            </View>
            <Text style={styles.sectionTitle2}>Recipes You Can Make</Text>
            
            {recommendations.map((rec, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.recCard}
                onPress={() => navigateToRecipe(rec)}
                activeOpacity={0.9}
              >
                <Image 
                  source={{ uri: getRecipeImage(idx) }} 
                  style={styles.recImage} 
                />
                <View style={styles.recContent}>
                  <Text style={styles.recName}>{rec.name}</Text>
                  <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
                  {rec.missing_ingredients?.length > 0 && (
                    <View style={styles.missingBadge}>
                      <Ionicons name="cart" size={12} color="#f97316" />
                      <Text style={styles.missingText}>Need {rec.missing_ingredients.length} items</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={22} color="#22c55e" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Nutrition Tracker Card */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.nutritionCard}
            onPress={() => router.push('/(tabs)/meal-plan')}
            activeOpacity={0.95}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80' }} 
              style={styles.nutritionBg}
            />
            <LinearGradient colors={['rgba(34,197,94,0.85)', 'rgba(22,163,74,0.95)']} style={styles.nutritionOverlay}>
              <View style={styles.nutritionContent}>
                <View style={styles.nutritionIcon}>
                  <Ionicons name="fitness" size={28} color="white" />
                </View>
                <View style={styles.nutritionText}>
                  <Text style={styles.nutritionTitle}>Track Your Nutrition</Text>
                  <Text style={styles.nutritionDesc}>Monitor calories, protein & more</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cuisine Selection Modal */}
      <Modal
        visible={showCuisineModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCuisineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cuisineModalContent}>
            <View style={styles.cuisineModalHeader}>
              <Text style={styles.cuisineModalTitle}>Choose Your Cuisines</Text>
              <TouchableOpacity onPress={() => setShowCuisineModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.cuisineModalSubtitle}>
              Select the cuisines you want to see in Quick Stock. You can enable or disable anytime.
            </Text>
            
            <ScrollView style={styles.cuisineModalScroll} showsVerticalScrollIndicator={false}>
              {allCuisines.map((cuisine) => {
                const data = CUISINE_ESSENTIALS[cuisine];
                const isEnabled = enabledCuisines.has(cuisine);
                return (
                  <TouchableOpacity
                    key={cuisine}
                    style={[styles.cuisineOption, isEnabled && styles.cuisineOptionEnabled]}
                    onPress={() => toggleCuisineEnabled(cuisine)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.cuisineOptionIcon, { backgroundColor: data.color[0] }]}>
                      <Text style={styles.cuisineOptionEmoji}>{data.emoji}</Text>
                    </View>
                    <View style={styles.cuisineOptionInfo}>
                      <Text style={styles.cuisineOptionName}>
                        {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                      </Text>
                      <Text style={styles.cuisineOptionCount}>
                        {data.items.length} essential items
                      </Text>
                    </View>
                    <View style={[styles.cuisineCheckbox, isEnabled && styles.cuisineCheckboxEnabled]}>
                      {isEnabled && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <View style={styles.cuisineModalFooter}>
              <Text style={styles.cuisineModalHint}>
                {enabledCuisines.size} of {allCuisines.length} cuisines selected
              </Text>
              <TouchableOpacity
                style={styles.cuisineModalDoneBtn}
                onPress={() => setShowCuisineModal(false)}
                activeOpacity={0.9}
              >
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.cuisineModalDoneBtnGradient}>
                  <Text style={styles.cuisineModalDoneBtnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#1f2937' },
  subGreeting: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  profileBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
  profileImage: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { marginBottom: 12 },
  sectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ec4899', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  sectionBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  sectionTitle2: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginTop: 10, marginBottom: 14 },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#22c55e' },
  
  loadingHero: { height: 240, borderRadius: 24, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#22c55e', marginTop: 12, fontWeight: '600' },
  
  heroCard: { borderRadius: 24, overflow: 'hidden', height: 280, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', justifyContent: 'flex-end', padding: 18 },
  whyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginBottom: 8, maxWidth: '90%' },
  whyText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 4 },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12, lineHeight: 18 },
  heroMeta: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText: { fontSize: 13, color: 'white', fontWeight: '500' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cookNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22c55e', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  cookNowText: { fontSize: 14, fontWeight: '700', color: 'white' },
  videoBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  quickAction: { flex: 1, alignItems: 'center', position: 'relative' },
  quickActionGradient: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
  quickActionText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  quickActionBadge: { position: 'absolute', top: -2, right: 6, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickActionBadgeText: { fontSize: 10, fontWeight: '700', color: 'white' },
  
  horizontalScroll: { paddingRight: 20 },
  
  trendingCard: { width: 160, height: 210, borderRadius: 18, overflow: 'hidden', marginRight: 12, backgroundColor: '#e5e7eb' },
  trendingImage: { width: '100%', height: '100%' },
  trendingYoutube: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, height: '55%', justifyContent: 'flex-end' },
  trendingRating: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6 },
  trendingRatingText: { fontSize: 11, fontWeight: '700', color: 'white' },
  trendingName: { fontSize: 14, fontWeight: '700', color: 'white', marginBottom: 2 },
  trendingCuisine: { fontSize: 11, color: '#22c55e', fontWeight: '600', marginBottom: 4 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center' },
  trendingMetaText: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginLeft: 3 },
  
  videoCard: { width: 200, borderRadius: 16, overflow: 'hidden', marginRight: 12, backgroundColor: 'white', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  videoThumbnail: { width: '100%', height: 115 },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 115, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  durationBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  durationText: { fontSize: 11, fontWeight: '600', color: 'white' },
  videoInfo: { padding: 12 },
  videoTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  videoViews: { fontSize: 11, color: '#6b7280' },
  
  aiCard: { borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  aiGradient: { padding: 18 },
  aiContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  aiIconContainer: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  aiTextContent: { flex: 1 },
  aiTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  aiSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  aiArrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  // Guide Card
  guideCard: { borderRadius: 18, overflow: 'hidden' },
  guideGradient: { padding: 18 },
  guideContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  guideIconContainer: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  guideTextContent: { flex: 1 },
  guideTitle: { fontSize: 17, fontWeight: '700', color: 'white' },
  guideSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 3 },
  guideArrow: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  recCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  recImage: { width: 70, height: 70, borderRadius: 12, marginRight: 12, backgroundColor: '#f3f4f6' },
  recContent: { flex: 1 },
  recName: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  recReason: { fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
  missingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  missingText: { fontSize: 11, color: '#f97316', fontWeight: '600' },
  
  nutritionCard: { borderRadius: 18, overflow: 'hidden', height: 100, elevation: 4, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
  nutritionBg: { width: '100%', height: '100%' },
  nutritionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' },
  nutritionContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 14 },
  nutritionIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  nutritionText: { flex: 1 },
  nutritionTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  nutritionDesc: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  // Cuisine Essentials Styles
  cuisineSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 12, marginTop: -6 },
  cuisineTabs: { paddingBottom: 12, gap: 8 },
  cuisineTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f3f4f6' },
  cuisineTabEmoji: { fontSize: 16 },
  cuisineTabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  cuisineTabTextActive: { color: 'white' },
  
  // Compact Pill Style Items
  essentialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  essentialPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f9fafb', borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb', gap: 6 },
  essentialPillSelected: { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
  essentialPillInPantry: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', opacity: 0.6 },
  essentialPillEmoji: { fontSize: 16 },
  essentialPillName: { fontSize: 12, fontWeight: '500', color: '#4b5563', maxWidth: 70 },
  essentialPillNameSelected: { color: '#15803d', fontWeight: '600' },
  essentialPillNameInPantry: { color: '#9ca3af', textDecorationLine: 'line-through' },
  essentialPillCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  essentialPillCheckInPantry: { backgroundColor: '#9ca3af' },
  
  addToPantryBtn: { marginTop: 14, borderRadius: 14, overflow: 'hidden' },
  addToPantryGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  addToPantryText: { fontSize: 15, fontWeight: '700', color: 'white' },

  // Add More Cuisines Tab
  addCuisineTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#22c55e', borderStyle: 'dashed' },
  addCuisineText: { fontSize: 13, fontWeight: '600', color: '#22c55e' },

  // Cuisine Selection Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  cuisineModalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 20 },
  cuisineModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cuisineModalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  cuisineModalSubtitle: { fontSize: 13, color: '#6b7280', paddingHorizontal: 20, paddingVertical: 12 },
  cuisineModalScroll: { maxHeight: 400 },
  cuisineOption: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16, marginVertical: 6, borderRadius: 16, backgroundColor: '#f9fafb', borderWidth: 2, borderColor: 'transparent' },
  cuisineOptionEnabled: { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
  cuisineOptionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cuisineOptionEmoji: { fontSize: 24 },
  cuisineOptionInfo: { flex: 1, marginLeft: 14 },
  cuisineOptionName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  cuisineOptionCount: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cuisineCheckbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  cuisineCheckboxEnabled: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  cuisineModalFooter: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cuisineModalHint: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
  cuisineModalDoneBtn: { borderRadius: 14, overflow: 'hidden' },
  cuisineModalDoneBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  cuisineModalDoneBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },

  // Missing ingredients styles
  missingIngredientsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  missingLabel: { fontSize: 11, color: '#f97316', fontWeight: '600' },
  missingList: { fontSize: 11, color: 'rgba(255,255,255,0.8)', flex: 1 },
});
