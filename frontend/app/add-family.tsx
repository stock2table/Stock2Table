import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'lactose-free', label: 'Lactose-Free', icon: '🥛' },
  { id: 'nut-free', label: 'Nut-Free', icon: '🥜' },
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'kosher', label: 'Kosher', icon: '✡️' },
  { id: 'low-carb', label: 'Low-Carb', icon: '🍞' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'paleo', label: 'Paleo', icon: '🍖' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
];

const ALLERGY_OPTIONS = [
  { id: 'peanuts', label: 'Peanuts', icon: '🥜' },
  { id: 'tree-nuts', label: 'Tree Nuts', icon: '🌰' },
  { id: 'dairy', label: 'Dairy', icon: '🧀' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'soy', label: 'Soy', icon: '🫘' },
  { id: 'wheat', label: 'Wheat', icon: '🌾' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'sesame', label: 'Sesame', icon: '🌿' },
];

const RELATIONSHIP_OPTIONS = [
  { id: 'spouse', label: 'Spouse/Partner', icon: '💑' },
  { id: 'child', label: 'Child', icon: '👶' },
  { id: 'parent', label: 'Parent', icon: '👨‍👩‍👦' },
  { id: 'sibling', label: 'Sibling', icon: '👫' },
  { id: 'other', label: 'Other', icon: '👤' },
];

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const { addFamilyMember } = useAppStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [relationship, setRelationship] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleDietary = (option: string) => {
    setSelectedDietary(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const toggleAllergy = (option: string) => {
    setSelectedAllergies(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email === '' || emailRegex.test(email);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (email && !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      await addFamilyMember(sessionToken!, {
        name: name.trim(),
        email: email.trim() || undefined,
        age: age ? parseInt(age) : undefined,
        relationship: relationship || undefined,
        dietary_restrictions: selectedDietary,
        allergies: selectedAllergies,
        preferences: [],
      });
      
      Alert.alert('Success', 'Family member added! They can now be included in meal planning.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add family member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Family Member</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#22c55e" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (for sharing meal plans)</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIconText}
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.inputHint}>
              📧 We'll send weekly meal plans to this email
            </Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                placeholderTextColor="#9ca3af"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Relationship</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relationshipScroll}>
                {RELATIONSHIP_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.relationshipChip,
                      relationship === option.id && styles.relationshipChipSelected,
                    ]}
                    onPress={() => setRelationship(option.id)}
                  >
                    <Text style={styles.relationshipIcon}>{option.icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Dietary Restrictions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf" size={20} color="#22c55e" />
            <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select dietary preferences specific to this family member
          </Text>
          
          <View style={styles.chipsContainer}>
            {DIETARY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.chip,
                  selectedDietary.includes(option.id) && styles.chipSelected,
                ]}
                onPress={() => toggleDietary(option.id)}
              >
                <Text style={styles.chipIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.chipText,
                    selectedDietary.includes(option.id) && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedDietary.includes(option.id) && (
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text style={styles.sectionTitle}>Food Allergies</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            ⚠️ Important: Select any known food allergies for safety
          </Text>
          
          <View style={styles.chipsContainer}>
            {ALLERGY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.chip,
                  styles.chipAllergy,
                  selectedAllergies.includes(option.id) && styles.chipAllergySelected,
                ]}
                onPress={() => toggleAllergy(option.id)}
              >
                <Text style={styles.chipIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.chipText,
                    selectedAllergies.includes(option.id) && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedAllergies.includes(option.id) && (
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            This family member's dietary restrictions and allergies will be considered when generating meal plans.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving || !name.trim()}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={name.trim() && !saving ? ['#22c55e', '#16a34a'] : ['#d1d5db', '#9ca3af']} 
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={styles.saveButtonText}>Add Family Member</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    paddingLeft: 14,
  },
  inputWithIconText: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  relationshipScroll: {
    marginTop: 8,
  },
  relationshipChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  relationshipChipSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  relationshipIcon: {
    fontSize: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  chipAllergy: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  chipAllergySelected: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
