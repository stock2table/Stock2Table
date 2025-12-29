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

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'lactose-free', 'nut-free'];
const ALLERGY_OPTIONS = ['peanuts', 'tree nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish'];

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const { addFamilyMember } = useAppStore();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      setSaving(true);
      await addFamilyMember(sessionToken!, {
        name: name.trim(),
        age: age ? parseInt(age) : undefined,
        dietary_restrictions: selectedDietary,
        allergies: selectedAllergies,
        preferences: [],
      });
      
      Alert.alert('Success', 'Family member added!', [
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
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Family Member</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !name.trim()}
        >
          <Text
            style={[
              styles.saveText,
              (!name.trim() || saving) && styles.saveTextDisabled,
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter age"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Dietary Restrictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <Text style={styles.sectionSubtitle}>
            Select any dietary preferences or restrictions
          </Text>
          
          <View style={styles.chipsContainer}>
            {DIETARY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  selectedDietary.includes(option) && styles.chipSelected,
                ]}
                onPress={() => toggleDietary(option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDietary.includes(option) && styles.chipTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {selectedDietary.includes(option) && (
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <Text style={styles.sectionSubtitle}>
            Select any known food allergies
          </Text>
          
          <View style={styles.chipsContainer}>
            {ALLERGY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  styles.chipAllergy,
                  selectedAllergies.includes(option) && styles.chipAllergySelected,
                ]}
                onPress={() => toggleAllergy(option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedAllergies.includes(option) && styles.chipTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {selectedAllergies.includes(option) && (
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!name.trim() || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || !name.trim()}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Add Family Member'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  saveTextDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  chipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  chipAllergy: {
    borderColor: '#FF9800',
  },
  chipAllergySelected: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
