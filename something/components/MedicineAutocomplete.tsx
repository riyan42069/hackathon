import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MEDICINES, MedicineInfo } from '../constants/medicines';

interface Props {
  value: string;
  onSelect: (name: string) => void;
  onSelectFull: (info: MedicineInfo) => void;
  inputStyle?: any;
  onChangeText?: (text: string) => void;
}

export function MedicineAutocomplete({ 
  value, 
  onSelect, 
  onSelectFull, 
  inputStyle, 
  onChangeText // 1. Destructure the missing prop
}: Props) {
  const [focused, setFocused] = useState(false);
  const didSelectRef = useRef(false);

  const suggestions = focused && value.length >= 1
    ? MEDICINES.filter(m => m.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  const handleBlur = () => {
    // 2. Increased delay slightly for slower devices
    setTimeout(() => {
      setFocused(false);
      // Removed the logic that clears the input on blur (onSelect(''))
      // because it prevents users from entering custom/new meds.
      didSelectRef.current = false;
    }, 300);
  };

  const handleSelect = (info: MedicineInfo) => {
    didSelectRef.current = true;
    onSelect(info.name);
    onSelectFull(info);
    // 3. Trigger onChangeText if provided to sync parent state
    if (onChangeText) onChangeText(info.name); 
    setFocused(false);
  };

  return (
    <View style={{ zIndex: 1000 }}>
      <TextInput
        style={inputStyle}
        placeholder="Name of medicine"
        value={value}
        // 4. Use both local onSelect and the passed onChangeText
        onChangeText={(v) => { 
          didSelectRef.current = false; 
          onSelect(v); 
          if (onChangeText) onChangeText(v); 
        }}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        autoCorrect={false}
        autoCapitalize="words"
      />
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((info) => (
            <TouchableOpacity
              key={info.name}
              style={styles.item}
              // 5. Use onPress instead of onPressIn for better reliability inside Modals
              onPress={() => handleSelect(info)} 
              activeOpacity={0.7}
            >
              <Text style={styles.itemName}>{info.name}</Text>
              <Text style={styles.itemSub}>{info.category} · {info.dosageForm} · {info.strength}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    marginTop: -8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  itemName: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  itemSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
