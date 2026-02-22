import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MEDICINES, MedicineInfo } from '../constants/medicines';

interface Props {
  value: string;
  onSelect: (name: string) => void;
  onSelectFull: (info: MedicineInfo) => void;
  inputStyle?: any;
}

export function MedicineAutocomplete({ value, onSelect, onSelectFull, inputStyle }: Props) {
  const [focused, setFocused] = useState(false);
  const didSelectRef = useRef(false);

  const suggestions = focused && value.length >= 1
    ? MEDICINES.filter(m => m.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  const handleBlur = () => {
    setTimeout(() => {
      setFocused(false);
      if (!didSelectRef.current) {
        const valid = MEDICINES.some(m => m.name.toLowerCase() === value.toLowerCase());
        if (!valid) onSelect('');
      }
      didSelectRef.current = false;
    }, 200);
  };

  const handleSelect = (info: MedicineInfo) => {
    didSelectRef.current = true;
    onSelect(info.name);
    onSelectFull(info);
    setFocused(false);
  };

  return (
    <View>
      <TextInput
        style={inputStyle}
        placeholder="Name of medicine"
        value={value}
        onChangeText={(v) => { didSelectRef.current = false; onSelect(v); }}
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
              onPressIn={() => handleSelect(info)}
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
