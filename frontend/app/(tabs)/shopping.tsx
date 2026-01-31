import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, Modal, Linking, StatusBar, Dimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Location from 'expo-location';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Common units for shopping items
const UNITS = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'grams' },
  { value: 'lb', label: 'pounds' },
  { value: 'oz', label: 'ounces' },
  { value: 'L', label: 'liters' },
  { value: 'ml', label: 'ml' },
  { value: 'cups', label: 'cups' },
  { value: 'tbsp', label: 'tablespoons' },
  { value: 'tsp', label: 'teaspoons' },
  { value: 'bunch', label: 'bunch' },
  { value: 'pack', label: 'pack' },
  { value: 'can', label: 'can' },
  { value: 'bottle', label: 'bottle' },
  { value: 'box', label: 'box' },
  { value: 'bag', label: 'bag' },
  { value: 'dozen', label: 'dozen' },
];

// Comprehensive grocery apps by region with deep links
const GROCERY_APPS: Record<string, { name: string; logo: string; color: string; searchUrl: string; appScheme?: string }[]> = {
  US: [
    { name: 'Instacart', logo: '🛒', color: '#43b02a', searchUrl: 'https://www.instacart.com/store/search/', appScheme: 'instacart://' },
    { name: 'Walmart', logo: '🏪', color: '#0071ce', searchUrl: 'https://www.walmart.com/search?q=', appScheme: 'walmart://' },
    { name: 'Amazon Fresh', logo: '📦', color: '#ff9900', searchUrl: 'https://www.amazon.com/s?k=', appScheme: 'com.amazon.mobile.shopping://' },
    { name: 'Target', logo: '🎯', color: '#cc0000', searchUrl: 'https://www.target.com/s?searchTerm=' },
    { name: 'Whole Foods', logo: '🥬', color: '#00674b', searchUrl: 'https://www.wholefoodsmarket.com/search?text=' },
    { name: 'Kroger', logo: '🛍️', color: '#e31837', searchUrl: 'https://www.kroger.com/search?query=' },
  ],
  UK: [
    { name: 'Tesco', logo: '🛒', color: '#00539f', searchUrl: 'https://www.tesco.com/groceries/en-GB/search?query=' },
    { name: 'Sainsbury\'s', logo: '🍊', color: '#f06c00', searchUrl: 'https://www.sainsburys.co.uk/gol-ui/SearchResults/' },
    { name: 'ASDA', logo: '🏪', color: '#78be20', searchUrl: 'https://groceries.asda.com/search/' },
    { name: 'Ocado', logo: '📦', color: '#6d2d91', searchUrl: 'https://www.ocado.com/search?entry=' },
    { name: 'Morrisons', logo: '🟢', color: '#006633', searchUrl: 'https://groceries.morrisons.com/search?entry=' },
    { name: 'Waitrose', logo: '🥗', color: '#006400', searchUrl: 'https://www.waitrose.com/ecom/shop/search?searchTerm=' },
  ],
  IN: [
    { name: 'Blinkit', logo: '🟡', color: '#f8cb46', searchUrl: 'https://blinkit.com/s/?q=', appScheme: 'blinkit://' },
    { name: 'Zepto', logo: '⚡', color: '#8025fa', searchUrl: 'https://www.zeptonow.com/search?query=', appScheme: 'zepto://' },
    { name: 'Instamart', logo: '🍅', color: '#fc8019', searchUrl: 'https://www.swiggy.com/instamart/search?query=', appScheme: 'swiggy://' },
    { name: 'BigBasket', logo: '🧺', color: '#84c225', searchUrl: 'https://www.bigbasket.com/ps/?q=', appScheme: 'bigbasket://' },
    { name: 'JioMart', logo: '🛍️', color: '#0078ad', searchUrl: 'https://www.jiomart.com/search/' },
    { name: 'Amazon Fresh', logo: '📦', color: '#ff9900', searchUrl: 'https://www.amazon.in/s?k=' },
  ],
  CA: [
    { name: 'Instacart', logo: '🛒', color: '#43b02a', searchUrl: 'https://www.instacart.ca/store/search/' },
    { name: 'Walmart', logo: '🏪', color: '#0071ce', searchUrl: 'https://www.walmart.ca/search?q=' },
    { name: 'Loblaws', logo: '🍎', color: '#e11b22', searchUrl: 'https://www.loblaws.ca/search?search-bar=' },
    { name: 'No Frills', logo: '💛', color: '#fcd500', searchUrl: 'https://www.nofrills.ca/search?search-bar=' },
  ],
  AU: [
    { name: 'Woolworths', logo: '🥬', color: '#125930', searchUrl: 'https://www.woolworths.com.au/shop/search/products?searchTerm=' },
    { name: 'Coles', logo: '🔴', color: '#ed1c24', searchUrl: 'https://www.coles.com.au/search?q=' },
    { name: 'Amazon AU', logo: '📦', color: '#ff9900', searchUrl: 'https://www.amazon.com.au/s?k=' },
  ],
  DE: [
    { name: 'REWE', logo: '🛒', color: '#cc071e', searchUrl: 'https://shop.rewe.de/productList?search=' },
    { name: 'Edeka', logo: '💛', color: '#fff200', searchUrl: 'https://www.edeka.de/suche.html?query=' },
    { name: 'Amazon DE', logo: '📦', color: '#ff9900', searchUrl: 'https://www.amazon.de/s?k=' },
  ],
  FR: [
    { name: 'Carrefour', logo: '🛒', color: '#004e9f', searchUrl: 'https://www.carrefour.fr/s?q=' },
    { name: 'Amazon FR', logo: '📦', color: '#ff9900', searchUrl: 'https://www.amazon.fr/s?k=' },
  ],
  AE: [
    { name: 'Carrefour UAE', logo: '🛒', color: '#004e9f', searchUrl: 'https://www.carrefouruae.com/mafuae/en/search?keyword=' },
    { name: 'Noon', logo: '💛', color: '#feee00', searchUrl: 'https://www.noon.com/uae-en/search?q=' },
    { name: 'Amazon AE', logo: '📦', color: '#ff9900', searchUrl: 'https://www.amazon.ae/s?k=' },
  ],
  DEFAULT: [
    { name: 'Google Shopping', logo: '🔍', color: '#4285f4', searchUrl: 'https://www.google.com/search?tbm=shop&q=' },
    { name: 'Amazon', logo: '📦', color: '#ff9900', searchUrl: 'https://www.amazon.com/s?k=' },
  ],
};

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  IN: 'India',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  AE: 'UAE',
  DEFAULT: 'Global',
};

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { sessionToken, user } = useAuth();
  const { shoppingLists, fetchShoppingLists, mealPlans, fetchMealPlans, pantryItems } = useAppStore();
  const [selectedList, setSelectedList] = useState<any>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('pieces');
  const [region, setRegion] = useState('DEFAULT');
  const [cityName, setCityName] = useState('');
  const [countryName, setCountryName] = useState('Detecting...');
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => {
    if (sessionToken) {
      loadData();
      detectRegion();
    }
  }, [sessionToken]);

  useEffect(() => {
    if (selectedList?.items) {
      // Deduplicate items by ingredient name (case-insensitive)
      const deduplicatedItems = deduplicateIngredients(selectedList.items);
      setLocalItems(deduplicatedItems);
    }
  }, [selectedList]);

  // Function to deduplicate ingredients and merge quantities
  const deduplicateIngredients = (items: any[]) => {
    const ingredientMap = new Map<string, any>();
    
    items.forEach((item: any) => {
      // Normalize ingredient name (lowercase, trim)
      const normalizedName = item.ingredient?.toLowerCase().trim() || '';
      
      if (!normalizedName) return;
      
      if (ingredientMap.has(normalizedName)) {
        // Merge with existing item
        const existing = ingredientMap.get(normalizedName);
        
        // Add quantities if units match, otherwise keep the larger quantity
        if (existing.unit === item.unit) {
          existing.quantity = (parseFloat(existing.quantity) || 0) + (parseFloat(item.quantity) || 0);
        } else {
          // Keep the larger quantity if units don't match
          existing.quantity = Math.max(parseFloat(existing.quantity) || 0, parseFloat(item.quantity) || 0);
        }
        
        // Merge recipe names
        const existingRecipes = existing.recipe_name || '';
        const newRecipe = item.recipe_name || '';
        if (newRecipe && !existingRecipes.includes(newRecipe)) {
          existing.recipe_name = existingRecipes 
            ? `${existingRecipes}, ${newRecipe}` 
            : newRecipe;
        }
        
        // Keep in_pantry if any item has it
        existing.in_pantry = existing.in_pantry || item.in_pantry;
      } else {
        // Add new item with proper capitalization
        ingredientMap.set(normalizedName, {
          ...item,
          ingredient: item.ingredient?.charAt(0).toUpperCase() + item.ingredient?.slice(1).toLowerCase() || item.ingredient,
          quantity: parseFloat(item.quantity) || 1,
        });
      }
    });
    
    // Convert map back to array and sort alphabetically
    return Array.from(ingredientMap.values()).sort((a, b) => 
      a.ingredient.localeCompare(b.ingredient)
    );
  };

  const loadData = async () => {
    await Promise.all([
      fetchShoppingLists(sessionToken!),
      fetchMealPlans(sessionToken!)
    ]);
  };

  const detectRegion = async () => {
    try {
      setLocationLoading(true);
      
      // Try expo-location first (works on mobile)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const [address] = await Location.reverseGeocodeAsync(location.coords);
          if (address) {
            const code = address.isoCountryCode || 'DEFAULT';
            if (GROCERY_APPS[code]) {
              setRegion(code);
            }
            setCityName(address.city || address.region || '');
            setCountryName(address.country || COUNTRY_NAMES[code] || 'Unknown');
            setLocationLoading(false);
            return;
          }
        }
      } catch (locError) {
        console.log('Location API failed, trying IP-based detection');
      }
      
      // Fallback: IP-based geolocation (works on web)
      try {
        const ipResponse = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
        if (ipResponse.data) {
          const code = ipResponse.data.country_code || 'DEFAULT';
          if (GROCERY_APPS[code]) {
            setRegion(code);
          }
          setCityName(ipResponse.data.city || '');
          setCountryName(ipResponse.data.country_name || COUNTRY_NAMES[code] || 'Unknown');
          setLocationLoading(false);
          return;
        }
      } catch (ipError) {
        console.log('IP detection failed');
      }
      
      // Final fallback
      setCountryName('Location unavailable');
    } catch (error) {
      console.log('Region detection failed completely');
      setCountryName('Location unavailable');
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    if (shoppingLists.length > 0 && !selectedList) {
      setSelectedList(shoppingLists[0]);
    }
  }, [shoppingLists]);

  const generateShoppingList = async () => {
    if (mealPlans.length === 0) {
      Alert.alert('No Meal Plan', 'Create a meal plan first to generate a shopping list!');
      return;
    }
    try {
      setGenerating(true);
      const latestPlan = mealPlans[0];
      const response = await axios.post(
        `${BACKEND_URL}/api/shopping-lists/generate/${latestPlan.plan_id}`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setSelectedList(response.data);
      await fetchShoppingLists(sessionToken!);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate shopping list.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = (itemKey: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemKey)) {
      newChecked.delete(itemKey);
    } else {
      newChecked.add(itemKey);
    }
    setCheckedItems(newChecked);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem = {
      ingredient: newItemName.trim(),
      quantity: parseFloat(newItemQty) || 1,
      unit: newItemUnit,
      recipe_name: 'Manual',
      in_pantry: false,
    };
    // Re-deduplicate after adding to merge with any existing same ingredient
    const updatedItems = deduplicateIngredients([...localItems, newItem]);
    setLocalItems(updatedItems);
    setNewItemName('');
    setNewItemQty('1');
    setShowAddModal(false);
  };

  const deleteItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
  };

  const openGroceryApp = (item: string) => {
    setSelectedItem(item);
    setShowGroceryModal(true);
  };

  const searchInApp = (app: typeof GROCERY_APPS['US'][0]) => {
    Linking.openURL(app.searchUrl + encodeURIComponent(selectedItem));
    setShowGroceryModal(false);
  };

  const getCategoryColor = (ingredient: string) => {
    const lower = ingredient.toLowerCase();
    if (/vegetable|tomato|onion|lettuce|carrot|pepper|spinach|broccoli/.test(lower)) return ['#22c55e', '#16a34a'];
    if (/fruit|apple|orange|banana|berry|mango|grape/.test(lower)) return ['#f97316', '#ea580c'];
    if (/meat|chicken|beef|pork|fish|lamb|salmon/.test(lower)) return ['#ef4444', '#dc2626'];
    if (/dairy|milk|cheese|yogurt|cream|butter/.test(lower)) return ['#3b82f6', '#2563eb'];
    if (/grain|bread|rice|pasta|flour|oat/.test(lower)) return ['#eab308', '#ca8a04'];
    return ['#8b5cf6', '#7c3aed'];
  };

  // Generate HTML for printable list
  const generatePrintableHTML = () => {
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Separate items to buy from items already in pantry
    const itemsToBuyList = localItems.filter((item: any) => !item.in_pantry && !checkedItems.has(item.ingredient));
    const inPantryList = localItems.filter((item: any) => item.in_pantry);
    const checkedList = localItems.filter((item: any) => checkedItems.has(item.ingredient));

    // Categorize items
    const categorizeItem = (ingredient: string) => {
      const lower = ingredient.toLowerCase();
      if (/vegetable|tomato|onion|lettuce|carrot|pepper|spinach|broccoli|garlic|potato/.test(lower)) return 'Vegetables';
      if (/fruit|apple|orange|banana|berry|mango|grape|lemon|lime/.test(lower)) return 'Fruits';
      if (/meat|chicken|beef|pork|fish|lamb|salmon|turkey|bacon/.test(lower)) return 'Meat & Seafood';
      if (/dairy|milk|cheese|yogurt|cream|butter|egg/.test(lower)) return 'Dairy & Eggs';
      if (/grain|bread|rice|pasta|flour|oat|cereal/.test(lower)) return 'Grains & Bread';
      if (/oil|sauce|spice|salt|pepper|vinegar|sugar/.test(lower)) return 'Pantry Staples';
      return 'Other';
    };

    // Group items by category
    const groupedItems: Record<string, any[]> = {};
    itemsToBuyList.forEach((item: any) => {
      const category = categorizeItem(item.ingredient);
      if (!groupedItems[category]) groupedItems[category] = [];
      groupedItems[category].push(item);
    });

    // Generate HTML
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Shopping List</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #1f2937;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #22c55e;
            }
            .header h1 {
              font-size: 28px;
              color: #22c55e;
              margin-bottom: 8px;
            }
            .header .date {
              color: #6b7280;
              font-size: 14px;
            }
            .stats {
              display: flex;
              justify-content: center;
              gap: 30px;
              margin-bottom: 30px;
            }
            .stat {
              text-align: center;
              padding: 15px 25px;
              background: #f9fafb;
              border-radius: 10px;
            }
            .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #22c55e;
            }
            .stat-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
            }
            .category {
              margin-bottom: 25px;
            }
            .category-title {
              font-size: 16px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding: 8px 12px;
              background: #f3f4f6;
              border-radius: 6px;
              border-left: 4px solid #22c55e;
            }
            .items-list {
              list-style: none;
            }
            .item {
              display: flex;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px dashed #e5e7eb;
            }
            .checkbox {
              width: 20px;
              height: 20px;
              border: 2px solid #d1d5db;
              border-radius: 4px;
              margin-right: 12px;
              flex-shrink: 0;
            }
            .item-name {
              flex: 1;
              font-size: 15px;
            }
            .item-quantity {
              font-size: 13px;
              color: #6b7280;
              margin-left: 10px;
            }
            .item-recipe {
              font-size: 11px;
              color: #9ca3af;
              margin-left: 10px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin: 30px 0 15px 0;
              color: #374151;
            }
            .in-pantry-section {
              background: #f0fdf4;
              padding: 15px;
              border-radius: 10px;
              margin-top: 20px;
            }
            .in-pantry-title {
              color: #15803d;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .in-pantry-items {
              color: #166534;
              font-size: 13px;
              line-height: 1.6;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            @media print {
              body { padding: 20px; }
              .header { page-break-after: avoid; }
              .category { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛒 Shopping List</h1>
            <div class="date">${today}</div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-number">${itemsToBuyList.length}</div>
              <div class="stat-label">Items to Buy</div>
            </div>
            <div class="stat">
              <div class="stat-number">${inPantryList.length}</div>
              <div class="stat-label">In Pantry</div>
            </div>
            <div class="stat">
              <div class="stat-number">${checkedList.length}</div>
              <div class="stat-label">Already Got</div>
            </div>
          </div>

          ${Object.entries(groupedItems).map(([category, items]) => `
            <div class="category">
              <div class="category-title">${category}</div>
              <ul class="items-list">
                ${items.map((item: any) => `
                  <li class="item">
                    <div class="checkbox"></div>
                    <span class="item-name">${item.ingredient}</span>
                    <span class="item-quantity">${item.quantity} ${item.unit || ''}</span>
                    ${item.recipe_name ? `<span class="item-recipe">for ${item.recipe_name}</span>` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}

          ${inPantryList.length > 0 ? `
            <div class="in-pantry-section">
              <div class="in-pantry-title">✓ Already in Your Pantry</div>
              <div class="in-pantry-items">
                ${inPantryList.map((item: any) => item.ingredient).join(' • ')}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            Generated by Stock2Table • Your Smart Meal Planning Assistant
          </div>
        </body>
        </html>
      `;

    return html;
  };

  // Print the shopping list
  const handlePrint = async () => {
    try {
      setPrintLoading(true);
      const html = generatePrintableHTML();
      
      if (Platform.OS === 'web') {
        // For web, open print dialog
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        // For native, use expo-print
        await Print.printAsync({ html });
      }
      setShowPrintModal(false);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print. Please try again.');
    } finally {
      setPrintLoading(false);
    }
  };

  // Save as PDF
  const handleSaveAsPDF = async () => {
    try {
      setPrintLoading(true);
      const html = generatePrintableHTML();
      
      if (Platform.OS === 'web') {
        // For web, download as HTML (PDF generation not available)
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopping-list-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Downloaded', 'Shopping list saved! Open it in a browser and print to PDF.');
      } else {
        // For native, generate PDF and share
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Shopping List PDF',
            UTI: 'com.adobe.pdf'
          });
        }
      }
      setShowPrintModal(false);
    } catch (error) {
      console.error('Save PDF error:', error);
      Alert.alert('Error', 'Failed to save PDF. Please try again.');
    } finally {
      setPrintLoading(false);
    }
  };

  // Share shopping list
  const handleShare = async () => {
    try {
      setPrintLoading(true);
      
      // Create simple text version for sharing
      const itemsToBuyList = localItems.filter((item: any) => !item.in_pantry && !checkedItems.has(item.ingredient));
      const textList = `🛒 Shopping List\n${new Date().toLocaleDateString()}\n\n` +
        itemsToBuyList.map((item: any) => `☐ ${item.ingredient} (${item.quantity} ${item.unit || ''})`).join('\n') +
        `\n\n📱 Created with Stock2Table`;
      
      if (Platform.OS === 'web') {
        // For web, use clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(textList);
          Alert.alert('Copied!', 'Shopping list copied to clipboard. You can now paste it anywhere.');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = textList;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          Alert.alert('Copied!', 'Shopping list copied to clipboard.');
        }
      } else {
        // For native, use sharing
        const html = generatePrintableHTML();
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Shopping List'
          });
        }
      }
      setShowPrintModal(false);
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setPrintLoading(false);
    }
  };

  // Copy to clipboard (text version)
  const handleCopyText = async () => {
    try {
      const itemsToBuyList = localItems.filter((item: any) => !item.in_pantry && !checkedItems.has(item.ingredient));
      const textList = `🛒 Shopping List - ${new Date().toLocaleDateString()}\n\n` +
        itemsToBuyList.map((item: any) => `• ${item.ingredient} (${item.quantity} ${item.unit || ''})`).join('\n');
      
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(textList);
      }
      Alert.alert('Copied!', 'Shopping list copied to clipboard.');
      setShowPrintModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  const totalItems = localItems.length;
  const checkedCount = checkedItems.size;
  const inPantryCount = localItems.filter((item: any) => item.in_pantry).length;
  const itemsToBuy = localItems.filter((item: any) => !item.in_pantry && !checkedItems.has(item.ingredient)).length;
  const groceryApps = GROCERY_APPS[region] || GROCERY_APPS.DEFAULT;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' }} 
            style={styles.heroImage} 
          />
          <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Shopping List</Text>
            <Text style={styles.heroSubtitle}>Your smart grocery companion</Text>
            
            {/* Location Info */}
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#22c55e" />
              </View>
              <View style={styles.locationInfo}>
                {locationLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text style={styles.locationCity}>{cityName || 'Your Location'}</Text>
                    <Text style={styles.locationCountry}>{countryName}</Text>
                  </>
                )}
              </View>
              <TouchableOpacity style={styles.refreshLocationBtn} onPress={detectRegion}>
                <Ionicons name="refresh" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.statGradient}>
              <Ionicons name="cart" size={22} color="white" />
              <Text style={styles.statNumber}>{itemsToBuy}</Text>
              <Text style={styles.statLabel}>Items to Buy</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statGradient}>
              <Ionicons name="checkmark-circle" size={22} color="white" />
              <Text style={styles.statNumber}>{inPantryCount}</Text>
              <Text style={styles.statLabel}>In Pantry</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.statGradient}>
              <Ionicons name="bag-check" size={22} color="white" />
              <Text style={styles.statNumber}>{checkedCount}</Text>
              <Text style={styles.statLabel}>Got It</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateShoppingList}
            disabled={generating}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.generateGradient}>
              {generating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="white" />
                  <Text style={styles.generateText}>Generate from Meal Plan</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.printButton}
            onPress={() => setShowPrintModal(true)}
            activeOpacity={0.9}
          >
            <Ionicons name="print" size={22} color="#3b82f6" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={24} color="#22c55e" />
          </TouchableOpacity>
        </View>

        {/* Local Grocery Apps */}
        <View style={styles.groceryAppsSection}>
          <View style={styles.groceryHeader}>
            <Text style={styles.sectionTitle}>Shop in {COUNTRY_NAMES[region] || 'Your Area'}</Text>
            <View style={styles.regionTag}>
              <Ionicons name="location" size={12} color="#22c55e" />
              <Text style={styles.regionTagText}>{region}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {groceryApps.map((app, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.groceryAppCard}
                onPress={() => Linking.openURL(app.searchUrl + 'groceries')}
                activeOpacity={0.8}
              >
                <View style={[styles.groceryAppIcon, { backgroundColor: app.color + '20' }]}>
                  <Text style={styles.groceryAppEmoji}>{app.logo}</Text>
                </View>
                <Text style={styles.groceryAppName}>{app.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Shopping List */}
        {localItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80' }}
              style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>No Items Yet</Text>
            <Text style={styles.emptySubtitle}>Generate from meal plan or add items manually</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Your Items</Text>
            {localItems.map((item: any, index: number) => {
              const itemKey = `${item.ingredient}-${index}`;
              const isChecked = checkedItems.has(itemKey) || item.in_pantry;
              const [color1, color2] = getCategoryColor(item.ingredient);
              
              return (
                <View key={itemKey} style={styles.listItemWrapper}>
                  <TouchableOpacity
                    style={[styles.listItem, isChecked && styles.listItemChecked]}
                    onPress={() => !item.in_pantry && toggleItem(itemKey)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.checkboxContainer}>
                      <LinearGradient
                        colors={isChecked ? [color1, color2] : ['#e5e7eb', '#d1d5db']}
                        style={styles.checkbox}
                      >
                        {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
                        {item.ingredient}
                      </Text>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemQuantity}>{item.quantity} {item.unit}</Text>
                        {item.recipe_name && (
                          <Text style={styles.itemRecipe} numberOfLines={1}>• {item.recipe_name}</Text>
                        )}
                      </View>
                    </View>
                    
                    {item.in_pantry && (
                      <View style={[styles.pantryBadge, { backgroundColor: color1 }]}>
                        <Text style={styles.pantryBadgeText}>Have</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {/* Action Buttons */}
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openGroceryApp(item.ingredient)}
                    >
                      <Ionicons name="cart" size={18} color="#22c55e" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => deleteItem(index)}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Previous Lists */}
        {shoppingLists.length > 1 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Previous Lists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {shoppingLists.slice(1, 5).map((list) => (
                <TouchableOpacity
                  key={list.list_id}
                  style={[styles.historyCard, selectedList?.list_id === list.list_id && styles.historyCardActive]}
                  onPress={() => { setSelectedList(list); setCheckedItems(new Set()); }}
                >
                  <Ionicons name="list" size={24} color="#22c55e" />
                  <Text style={styles.historyItems}>{list.items?.length || 0} items</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Tomatoes"
                placeholderTextColor="#9ca3af"
                value={newItemName}
                onChangeText={setNewItemName}
              />
              
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="1"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={newItemQty}
                    onChangeText={setNewItemQty}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="pieces"
                    placeholderTextColor="#9ca3af"
                    value={newItemUnit}
                    onChangeText={setNewItemUnit}
                  />
                </View>
              </View>
              
              <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.addItemGradient}>
                  <Text style={styles.addItemText}>Add to List</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Grocery App Selector Modal */}
      <Modal visible={showGroceryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order "{selectedItem}"</Text>
                <Text style={styles.modalSubtitle}>from stores in {countryName}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGroceryModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.groceryPrompt}>Choose your preferred store:</Text>
              {groceryApps.map((app, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.groceryOption}
                  onPress={() => searchInApp(app)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.groceryOptionIcon, { backgroundColor: app.color + '20' }]}>
                    <Text style={{ fontSize: 24 }}>{app.logo}</Text>
                  </View>
                  <View style={styles.groceryOptionInfo}>
                    <Text style={styles.groceryOptionName}>{app.name}</Text>
                    <Text style={styles.groceryOptionDesc}>Search & order</Text>
                  </View>
                  <Ionicons name="open-outline" size={20} color="#22c55e" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Print/Save/Share Modal */}
      <Modal visible={showPrintModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.printModalContent}>
            <View style={styles.printModalHeader}>
              <Text style={styles.printModalTitle}>Print or Save List</Text>
              <TouchableOpacity onPress={() => setShowPrintModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.printModalBody}>
              <Text style={styles.printModalSubtitle}>
                {localItems.filter((item: any) => !item.in_pantry && !checkedItems.has(item.ingredient)).length} items to buy
              </Text>

              {/* Print Option */}
              <TouchableOpacity 
                style={styles.printOption} 
                onPress={handlePrint}
                disabled={printLoading}
                activeOpacity={0.8}
              >
                <View style={[styles.printOptionIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="print" size={28} color="#3b82f6" />
                </View>
                <View style={styles.printOptionInfo}>
                  <Text style={styles.printOptionTitle}>Print List</Text>
                  <Text style={styles.printOptionDesc}>Send to connected printer</Text>
                </View>
                {printLoading ? (
                  <ActivityIndicator color="#3b82f6" />
                ) : (
                  <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
                )}
              </TouchableOpacity>

              {/* Save as PDF Option */}
              <TouchableOpacity 
                style={styles.printOption} 
                onPress={handleSaveAsPDF}
                disabled={printLoading}
                activeOpacity={0.8}
              >
                <View style={[styles.printOptionIcon, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="document" size={28} color="#ef4444" />
                </View>
                <View style={styles.printOptionInfo}>
                  <Text style={styles.printOptionTitle}>Save as PDF</Text>
                  <Text style={styles.printOptionDesc}>Download to your device</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
              </TouchableOpacity>

              {/* Share Option */}
              <TouchableOpacity 
                style={styles.printOption} 
                onPress={handleShare}
                disabled={printLoading}
                activeOpacity={0.8}
              >
                <View style={[styles.printOptionIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="share-social" size={28} color="#22c55e" />
                </View>
                <View style={styles.printOptionInfo}>
                  <Text style={styles.printOptionTitle}>Share List</Text>
                  <Text style={styles.printOptionDesc}>Send via message or email</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
              </TouchableOpacity>

              {/* Copy to Clipboard Option */}
              <TouchableOpacity 
                style={styles.printOption} 
                onPress={handleCopyText}
                activeOpacity={0.8}
              >
                <View style={[styles.printOptionIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="copy" size={28} color="#f59e0b" />
                </View>
                <View style={styles.printOptionInfo}>
                  <Text style={styles.printOptionTitle}>Copy to Clipboard</Text>
                  <Text style={styles.printOptionDesc}>Copy as text to paste anywhere</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.printModalCancel} 
              onPress={() => setShowPrintModal(false)}
            >
              <Text style={styles.printModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  
  heroSection: { height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 20, paddingBottom: 24 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: 'white' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12, marginTop: 14, gap: 10 },
  locationIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  locationInfo: { flex: 1 },
  locationCity: { fontSize: 16, fontWeight: '700', color: 'white' },
  locationCountry: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  refreshLocationBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -30, gap: 10 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
  statGradient: { padding: 14, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: 'white', marginTop: 6 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 10 },
  generateButton: { flex: 1, borderRadius: 14, overflow: 'hidden', elevation: 4 },
  generateGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  generateText: { fontSize: 14, fontWeight: '700', color: 'white' },
  printButton: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6' },
  addButton: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#22c55e' },
  
  groceryAppsSection: { padding: 16, paddingTop: 20 },
  groceryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  regionTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  regionTagText: { fontSize: 12, fontWeight: '600', color: '#22c55e' },
  groceryAppCard: { alignItems: 'center', marginRight: 16 },
  groceryAppIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  groceryAppEmoji: { fontSize: 28 },
  groceryAppName: { fontSize: 11, fontWeight: '600', color: '#6b7280', textAlign: 'center', maxWidth: 70 },
  
  emptyState: { alignItems: 'center', padding: 32 },
  emptyImage: { width: width - 80, height: 160, borderRadius: 20, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  
  listContainer: { padding: 16, paddingTop: 0 },
  listItemWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  listItem: { flex: 1, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  listItemChecked: { backgroundColor: '#f0fdf4' },
  checkboxContainer: {},
  checkbox: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' },
  itemNameChecked: { color: '#16a34a', textDecorationLine: 'line-through' },
  itemDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  itemQuantity: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  itemRecipe: { fontSize: 12, color: '#9ca3af', flex: 1 },
  pantryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pantryBadgeText: { fontSize: 10, fontWeight: '700', color: 'white' },
  itemActions: { flexDirection: 'row', marginLeft: 8, gap: 6 },
  actionBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { backgroundColor: '#fef2f2' },
  
  historySection: { padding: 16, paddingTop: 8 },
  historyCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginRight: 12, alignItems: 'center', minWidth: 100, borderWidth: 2, borderColor: 'transparent', elevation: 2 },
  historyCardActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  historyItems: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginTop: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  modalSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textInput: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937', marginBottom: 16 },
  rowInputs: { flexDirection: 'row' },
  addItemBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  addItemGradient: { paddingVertical: 16, alignItems: 'center' },
  addItemText: { fontSize: 16, fontWeight: '700', color: 'white' },
  groceryPrompt: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  groceryOption: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f9fafb', borderRadius: 14, marginBottom: 10 },
  groceryOptionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  groceryOptionInfo: { flex: 1 },
  groceryOptionName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  groceryOptionDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  // Print Modal Styles
  printModalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24, width: '100%' },
  printModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  printModalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  printModalBody: { padding: 20 },
  printModalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  printOption: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 16, marginBottom: 12 },
  printOptionIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  printOptionInfo: { flex: 1 },
  printOptionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  printOptionDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  printModalCancel: { marginHorizontal: 20, paddingVertical: 16, backgroundColor: '#f3f4f6', borderRadius: 14, alignItems: 'center' },
  printModalCancelText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
});
