import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PLANNING_STEPS = [
  {
    id: 1,
    title: 'Take Stock of Your Pantry',
    subtitle: 'Know what you have before you shop',
    icon: 'basket',
    color: ['#22c55e', '#16a34a'],
    description: 'Start by checking what ingredients you already have. This prevents buying duplicates and helps you use items before they expire.',
    tips: [
      'Check expiration dates and use older items first',
      'Note items running low that need restocking',
      'Organize by category: proteins, grains, vegetables',
      'Take photos of your pantry for easy reference while shopping'
    ],
    action: 'Go to Pantry',
    actionRoute: '/(tabs)/pantry',
    timeEstimate: '10-15 minutes',
    savingsEstimate: 'Save $20-40/week by avoiding duplicate purchases'
  },
  {
    id: 2,
    title: 'Plan Your Weekly Menu',
    subtitle: 'Decide what to eat for the week',
    icon: 'calendar',
    color: ['#8b5cf6', '#7c3aed'],
    description: 'Planning meals in advance eliminates the daily "what\'s for dinner?" stress and ensures balanced nutrition throughout the week.',
    tips: [
      'Start with 3-4 main dishes and rotate them',
      'Plan around your schedule - quick meals on busy days',
      'Include one "leftover" day to reduce waste',
      'Try theme nights: Meatless Monday, Taco Tuesday',
      'Use our AI to generate personalized meal plans'
    ],
    action: 'Generate Meal Plan',
    actionRoute: '/(tabs)/meal-plan',
    timeEstimate: '15-20 minutes',
    savingsEstimate: 'Save 5+ hours/week on meal decisions'
  },
  {
    id: 3,
    title: 'Create Your Shopping List',
    subtitle: 'Buy only what you need',
    icon: 'cart',
    color: ['#3b82f6', '#2563eb'],
    description: 'A well-organized shopping list helps you shop faster, avoid impulse buys, and ensures you have everything needed for your planned meals.',
    tips: [
      'Group items by store section for efficient shopping',
      'Check pantry against your list before leaving',
      'Buy in bulk for frequently used items',
      'Choose seasonal produce for better prices',
      'Stick to the perimeter of the store for fresh items'
    ],
    action: 'View Shopping List',
    actionRoute: '/(tabs)/shopping',
    timeEstimate: '10 minutes',
    savingsEstimate: 'Save $50-100/week avoiding impulse purchases'
  },
  {
    id: 4,
    title: 'Prep Day: Batch Cooking',
    subtitle: 'Cook smart, eat well all week',
    icon: 'flame',
    color: ['#f97316', '#ea580c'],
    description: 'Dedicate 2-3 hours on the weekend to prepare ingredients and cook base components. This makes weeknight cooking quick and easy.',
    tips: [
      'Wash and chop all vegetables at once',
      'Cook grains (rice, quinoa) in large batches',
      'Prepare proteins: marinate, portion, or pre-cook',
      'Make sauces and dressings for the week',
      'Store everything in clear containers with labels'
    ],
    action: 'See Prep Tasks',
    actionRoute: '/(tabs)/meal-plan',
    timeEstimate: '2-3 hours (saves 1 hour daily)',
    savingsEstimate: 'Save 5-7 hours/week on weeknight cooking'
  },
  {
    id: 5,
    title: 'Store & Organize',
    subtitle: 'Proper storage extends freshness',
    icon: 'cube',
    color: ['#ec4899', '#db2777'],
    description: 'Proper food storage keeps ingredients fresh longer, reduces waste, and makes cooking easier when everything is organized and visible.',
    tips: [
      'Use clear containers to see contents easily',
      'Label with date and contents',
      'Store cut vegetables in water to keep crisp',
      'Keep prepped ingredients at eye level in fridge',
      'Freeze portions you won\'t use within 3-4 days'
    ],
    action: null,
    actionRoute: null,
    timeEstimate: '15-20 minutes',
    savingsEstimate: 'Reduce food waste by 40-60%'
  },
  {
    id: 6,
    title: 'Cook & Enjoy',
    subtitle: 'Quick assembly, delicious meals',
    icon: 'restaurant',
    color: ['#14b8a6', '#0d9488'],
    description: 'With everything prepped, weeknight cooking becomes simple assembly. Most meals can be ready in 15-20 minutes!',
    tips: [
      'Keep recipes accessible on your phone',
      'Set up your workspace before cooking',
      'Clean as you go to minimize after-dinner work',
      'Involve family members in cooking',
      'Save successful recipes to your favorites'
    ],
    action: 'Browse Recipes',
    actionRoute: '/(tabs)/recipes',
    timeEstimate: '15-20 minutes per meal',
    savingsEstimate: 'Eat healthier, spend less on takeout'
  }
];

const QUICK_TIPS = [
  { icon: '💡', tip: 'Cook proteins on Sunday, use them 3 different ways during the week' },
  { icon: '🥗', tip: 'Prep salad components separately, assemble fresh each day' },
  { icon: '🍲', tip: 'Double recipes and freeze half for busy weeks' },
  { icon: '⏰', tip: 'Use slow cooker or instant pot for hands-off cooking' },
  { icon: '💰', tip: 'Meatless meals 2x/week can save $30-50/month' },
  { icon: '🌿', tip: 'Fresh herbs last longer in water like flowers' },
];

const WEEKLY_BENEFITS = [
  { label: 'Time Saved', value: '7+ hours', icon: 'time', color: '#22c55e' },
  { label: 'Money Saved', value: '$100+', icon: 'cash', color: '#f97316' },
  { label: 'Less Stress', value: '90%', icon: 'happy', color: '#8b5cf6' },
  { label: 'Healthier', value: '3x', icon: 'fitness', color: '#ec4899' },
];

export default function MealPlanGuide() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const toggleStep = (stepId: number) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Planning Guide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <Text style={styles.heroEmoji}>🍽️</Text>
              <Text style={styles.heroTitle}>Plan Once, Eat Well All Week</Text>
              <Text style={styles.heroSubtitle}>
                Follow these 6 simple steps to save time, money, and eat healthier every day
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Weekly Benefits - Compact Row */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitsRow}>
            {WEEKLY_BENEFITS.map((benefit, idx) => (
              <View key={idx} style={styles.benefitPill}>
                <Ionicons name={benefit.icon as any} size={16} color={benefit.color} />
                <Text style={[styles.benefitPillValue, { color: benefit.color }]}>{benefit.value}</Text>
                <Text style={styles.benefitPillLabel}>{benefit.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Steps Section */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>Your 6-Step Guide</Text>
          <Text style={styles.sectionSubtitle}>Tap each step to learn more</Text>

          {PLANNING_STEPS.map((step) => {
            const isExpanded = expandedStep === step.id;
            return (
              <TouchableOpacity
                key={step.id}
                style={[styles.stepCard, isExpanded && styles.stepCardExpanded]}
                onPress={() => toggleStep(step.id)}
                activeOpacity={0.8}
              >
                {/* Step Header */}
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <LinearGradient colors={step.color} style={styles.stepNumberGradient}>
                      <Text style={styles.stepNumberText}>{step.id}</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>
                  <View style={[styles.stepIconBg, { backgroundColor: `${step.color[0]}15` }]}>
                    <Ionicons name={step.icon as any} size={22} color={step.color[0]} />
                  </View>
                </View>

                {/* Expanded Content */}
                {isExpanded && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                    
                    {/* Time & Savings */}
                    <View style={styles.stepMeta}>
                      <View style={styles.stepMetaItem}>
                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                        <Text style={styles.stepMetaText}>{step.timeEstimate}</Text>
                      </View>
                      <View style={styles.stepMetaItem}>
                        <Ionicons name="trending-up" size={16} color="#22c55e" />
                        <Text style={[styles.stepMetaText, { color: '#22c55e' }]}>{step.savingsEstimate}</Text>
                      </View>
                    </View>

                    {/* Tips */}
                    <View style={styles.tipsList}>
                      <Text style={styles.tipsTitle}>Pro Tips:</Text>
                      {step.tips.map((tip, idx) => (
                        <View key={idx} style={styles.tipItem}>
                          <View style={styles.tipBullet}>
                            <Ionicons name="checkmark" size={12} color="white" />
                          </View>
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Action Button */}
                    {step.action && (
                      <TouchableOpacity
                        style={styles.stepActionBtn}
                        onPress={() => router.push(step.actionRoute as any)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient colors={step.color} style={styles.stepActionGradient}>
                          <Text style={styles.stepActionText}>{step.action}</Text>
                          <Ionicons name="arrow-forward" size={18} color="white" />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Collapse Indicator */}
                <View style={styles.expandIndicator}>
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#9ca3af" 
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Tips Section */}
        <View style={styles.quickTipsSection}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          <View style={styles.quickTipsList}>
            {QUICK_TIPS.map((item, idx) => (
              <View key={idx} style={styles.quickTipCard}>
                <Text style={styles.quickTipEmoji}>{item.icon}</Text>
                <Text style={styles.quickTipText}>{item.tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.ctaGradient}>
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>Ready to Start?</Text>
              <Text style={styles.ctaSubtitle}>
                Let our AI create your personalized meal plan based on what's in your pantry
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push('/(tabs)/meal-plan')}
                activeOpacity={0.9}
              >
                <Ionicons name="sparkles" size={20} color="#22c55e" />
                <Text style={styles.ctaButtonText}>Generate My Meal Plan</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },

  scrollView: { flex: 1 },

  // Hero
  heroSection: { margin: 16, borderRadius: 20, overflow: 'hidden' },
  heroGradient: { padding: 24 },
  heroContent: { alignItems: 'center' },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: 'white', textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // Benefits
  benefitsSection: { paddingHorizontal: 16, marginBottom: 8 },
  benefitsTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  benefitCard: { width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center' },
  benefitIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  benefitValue: { fontSize: 24, fontWeight: '800' },
  benefitLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  // Steps
  stepsSection: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  sectionSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 16 },

  stepCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  stepCardExpanded: { borderWidth: 2, borderColor: '#22c55e' },
  
  stepHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  stepNumber: { width: 36, height: 36 },
  stepNumberGradient: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 16, fontWeight: '800', color: 'white' },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  stepSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  stepIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  stepContent: { paddingHorizontal: 16, paddingBottom: 16 },
  stepDescription: { fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 12 },
  
  stepMeta: { flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  stepMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  stepMetaText: { fontSize: 12, color: '#6b7280' },

  tipsList: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14 },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipBullet: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  tipText: { flex: 1, fontSize: 13, color: '#4b5563', lineHeight: 18 },

  stepActionBtn: { marginTop: 14, borderRadius: 12, overflow: 'hidden' },
  stepActionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  stepActionText: { fontSize: 14, fontWeight: '700', color: 'white' },

  expandIndicator: { alignItems: 'center', paddingBottom: 12 },

  // Quick Tips
  quickTipsSection: { padding: 16, paddingTop: 0 },
  quickTipsList: { gap: 10 },
  quickTipCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 14, borderRadius: 12 },
  quickTipEmoji: { fontSize: 24 },
  quickTipText: { flex: 1, fontSize: 13, color: '#4b5563', lineHeight: 18 },

  // CTA
  ctaSection: { margin: 16, borderRadius: 20, overflow: 'hidden' },
  ctaGradient: { padding: 24 },
  ctaContent: { alignItems: 'center' },
  ctaTitle: { fontSize: 22, fontWeight: '800', color: 'white' },
  ctaSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  ctaButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  ctaButtonText: { fontSize: 15, fontWeight: '700', color: '#22c55e' },
});
