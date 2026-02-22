import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const PILLS_PER_DAY_OPTIONS = [1, 2, 3, 4, 5, 6];
const DAYS_PER_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const TIME_OPTIONS = [
  '5:00 AM','6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM',
];

// Wheel picker data
const MONTH_ITEMS = MONTHS;
const DAY_ITEMS   = Array.from({ length: 31  }, (_, i) => String(i + 1).padStart(2, '0'));
const YEAR_ITEMS  = Array.from({ length: 105 }, (_, i) => String(1920 + i));
const FT_ITEMS    = ['3 ft', '4 ft', '5 ft', '6 ft', '7 ft'];
const IN_ITEMS    = Array.from({ length: 12  }, (_, i) => `${i} in`);
const LBS_ITEMS   = Array.from({ length: 451 }, (_, i) => `${50 + i} lbs`);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Medicine {
  name: string;
  totalPillsPrescribed: string;
  pillsPerDayToBeTaken: string;
  daysPerWeekToTakeThePrescription: string;
  pillSchedule: string;
  refillOrNot: boolean;
}

interface MedicineForm {
  name: string;
  totalPillsPrescribed: number;
  pillsPerDayToBeTaken: number;
  daysPerWeekToTakeThePrescription: number;
  pillSchedules: string[];
  refillOrNot: boolean;
}

interface Patient {
  id: string;
  name: string;
  patientId: string;
  age?: number | string;
  dob?: string;
  gender?: string;
  status?: string;
  pillsAlert?: boolean;
  medicines?: Medicine[];
}

// ─── Small form components ────────────────────────────────────────────────────
function FieldLabel({ label }: { label: string }) {
  return <Text style={fStyles.label}>{label}</Text>;
}

function ChipSelector({ options, selected, onSelect }: {
  options: (string | number)[];
  selected: string | number;
  onSelect: (v: string | number) => void;
}) {
  return (
    <View style={fStyles.chipsRow}>
      {options.map((opt) => {
        const active = String(selected) === String(opt);
        return (
          <TouchableOpacity
            key={String(opt)}
            style={[fStyles.chip, active && fStyles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text style={[fStyles.chipText, active && fStyles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Stepper({ value, min, max, step = 1, unit = '', onChange }: {
  value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={fStyles.stepper}>
      <TouchableOpacity
        style={fStyles.stepBtn}
        onPress={() => onChange(Math.max(min, value - step))}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={20} color={value <= min ? '#C7C7CC' : '#007AFF'} />
      </TouchableOpacity>
      <Text style={fStyles.stepValue}>{value} {unit}</Text>
      <TouchableOpacity
        style={fStyles.stepBtn}
        onPress={() => onChange(Math.min(max, value + step))}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={value >= max ? '#C7C7CC' : '#007AFF'} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Wheel Picker ─────────────────────────────────────────────────────────────
const WHEEL_H = 44;

function WheelPicker({ items, initialIndex, onChange }: {
  items: string[];
  initialIndex: number;
  onChange: (index: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const [selIdx, setSelIdx] = useState(initialIndex);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: initialIndex * WHEEL_H, animated: false });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const onEnd = (e: any) => {
    const idx = Math.max(0, Math.min(items.length - 1,
      Math.round(e.nativeEvent.contentOffset.y / WHEEL_H)));
    setSelIdx(idx);
    onChange(idx);
  };

  return (
    <View style={wStyles.wrap}>
      <View style={wStyles.highlight} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onEnd}
        onScrollEndDrag={onEnd}
        contentContainerStyle={{ paddingVertical: WHEEL_H }}
      >
        {items.map((item, i) => (
          <View key={i} style={wStyles.item}>
            <Text style={[wStyles.text, i === selIdx && wStyles.textSel]}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const wStyles = StyleSheet.create({
  wrap:      { height: WHEEL_H * 3, overflow: 'hidden', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  highlight: { position: 'absolute', top: WHEEL_H, height: WHEEL_H, left: 0, right: 0, backgroundColor: '#EBF4FF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#C5DCFF' },
  item:      { height: WHEEL_H, justifyContent: 'center', alignItems: 'center' },
  text:      { fontSize: 15, color: '#C7C7CC', fontWeight: '500' },
  textSel:   { fontSize: 17, color: '#1C1C1E', fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const userEmail = auth.currentUser?.email || '';

  // Modal visibility
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);

  // Basic info
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dobMonth, setDobMonth] = useState(1);
  const [dobDay, setDobDay] = useState(1);
  const [dobYear, setDobYear] = useState(1990);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(10);
  const [weightLbs, setWeightLbs] = useState(160);
  const [notes, setNotes] = useState('');

  // Contact
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Medicines
  const [medicinesForm, setMedicinesForm] = useState<MedicineForm[]>([]);
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'patients'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList: Patient[] = [];
      snapshot.forEach((doc) => {
        pList.push({ id: doc.id, ...doc.data() } as Patient);
      });
      setPatients(pList);
    });
    return () => unsubscribe();
  }, []);

  // ── Medicine helpers ──
  const addMedicineField = () => {
    setMedicinesForm(prev => [...prev, {
      name: '',
      totalPillsPrescribed: 30,
      pillsPerDayToBeTaken: 1,
      daysPerWeekToTakeThePrescription: 7,
      pillSchedules: [''],
      refillOrNot: false,
    }]);
  };

  const updateMedicineField = (idx: number, field: keyof Omit<MedicineForm, 'pillSchedules' | 'pillsPerDayToBeTaken'>, value: any) => {
    setMedicinesForm(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const updatePillsPerDay = (idx: number, count: number) => {
    setMedicinesForm(prev => {
      const updated = [...prev];
      const existing = updated[idx].pillSchedules;
      const newSchedules = Array.from({ length: count }, (_, i) => existing[i] || '');
      updated[idx] = { ...updated[idx], pillsPerDayToBeTaken: count, pillSchedules: newSchedules };
      return updated;
    });
  };

  const updateScheduleSlot = (medIdx: number, slotIdx: number, time: string) => {
    setMedicinesForm(prev => {
      const updated = [...prev];
      const schedules = [...updated[medIdx].pillSchedules];
      schedules[slotIdx] = schedules[slotIdx] === time ? '' : time; // toggle
      updated[medIdx] = { ...updated[medIdx], pillSchedules: schedules };
      return updated;
    });
  };

  const removeMedicine = (idx: number) => {
    setMedicinesForm(prev => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setName(''); setIdNumber(''); setGender('');
    setDobMonth(1); setDobDay(1); setDobYear(1990);
    setHeightFt(5); setHeightIn(10); setWeightLbs(160); setNotes('');
    setPhone(''); setEmail(''); setEmergencyContact('');
    setMedicinesForm([]);
    setResetCount(c => c + 1);
  };

  const handleSavePatient = async () => {
    if (!name || !idNumber) {
      Alert.alert('Missing Info', 'Name and ID Number are required.');
      return;
    }
    if (!db) {
      Alert.alert('Database Error', 'Firebase database is not connected.');
      return;
    }

    const dob = `${MONTHS[dobMonth - 1]} ${dobDay}, ${dobYear}`;
    const medicines: Medicine[] = medicinesForm.map(m => ({
      name: m.name,
      totalPillsPrescribed: String(m.totalPillsPrescribed),
      pillsPerDayToBeTaken: String(m.pillsPerDayToBeTaken),
      daysPerWeekToTakeThePrescription: String(m.daysPerWeekToTakeThePrescription),
      pillSchedule: m.pillSchedules.filter(Boolean).join(', '),
      refillOrNot: m.refillOrNot,
    }));

    try {
      await addDoc(collection(db, 'patients'), {
        name,
        patientId: idNumber,
        dob,
        gender,
        phone,
        email,
        emergencyContact,
        height: `${heightFt} ft ${heightIn} in`,
        weight: `${weightLbs} lbs`,
        notes,
        medicines,
        status: 'stable',
        pillsAlert: false,
        createdAt: new Date().toISOString(),
      });
      setManualModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error adding patient: ', error);
      Alert.alert('Error', 'Could not save patient data.');
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Welcome back</Text>
          <Text style={styles.headerName}>{userEmail}</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Reminders preview (derived from real patient medicines) */}
        {(() => {
          const reminders = patients.flatMap(p =>
            (p.medicines || []).map(m => ({
              id: `${p.id}-${m.name}`,
              patient: p.name,
              medicine: m.name,
              time: m.pillSchedule || 'N/A',
              urgent: m.refillOrNot,
            }))
          ).slice(0, 5);
          if (reminders.length === 0) return null;
          return (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.remindersRow}>
                {reminders.map((r) => (
                  <View key={r.id} style={[styles.reminderCard, r.urgent && styles.reminderCardUrgent]}>
                    <View style={[styles.reminderIcon, r.urgent && styles.reminderIconUrgent]}>
                      <Ionicons name="alarm-outline" size={18} color={r.urgent ? '#FF9500' : '#007AFF'} />
                    </View>
                    <Text style={styles.reminderTime} numberOfLines={2}>{r.time}</Text>
                    <Text style={styles.reminderMed} numberOfLines={1}>{r.medicine}</Text>
                    <Text style={styles.reminderPatient} numberOfLines={1}>{r.patient}</Text>
                    {r.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>REFILL</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </>
          );
        })()}

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search patients..."
            placeholderTextColor="#C7C7CC"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Patient list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patients</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredPatients.length} Total</Text>
          </View>
        </View>

        <View style={styles.patientsList}>
          {filteredPatients.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.patientCard}
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: '/patient-profile', params: { id: p.id, name: p.name } } as any)}
            >
              <View style={styles.patientLeft}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>{p.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientMeta}>ID #{p.patientId} • {p.dob || p.age || 'N/A'} • {p.gender || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.patientRight}>
                <View style={[styles.statusBadge, p.status === 'stable' ? styles.statusStable : styles.statusAttention]}>
                  <Text style={[styles.statusText, p.status === 'stable' ? styles.statusTextStable : styles.statusTextAttention]}>
                    {p.status === 'stable' ? 'Stable' : 'Attention'}
                  </Text>
                </View>
                {p.pillsAlert && (
                  <View style={styles.pillAlert}>
                    <Ionicons name="warning-outline" size={12} color="#FF9500" />
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setOptionsModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Options modal */}
      <Modal visible={optionsModalVisible} transparent animationType="fade">
        <View style={styles.optionsModalOverlay}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.optionsModalTitle}>Add New Patient</Text>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => { setOptionsModalVisible(false); setManualModalVisible(true); }}
            >
              <Ionicons name="create-outline" size={24} color="#007AFF" />
              <Text style={styles.optionButtonText}>1. Manually Input Patient Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setOptionsModalVisible(false);
                Alert.alert('Coming Soon', 'The Record & Scrape feature is not implemented yet!');
              }}
            >
              <Ionicons name="mic-outline" size={24} color="#FF3B30" />
              <Text style={[styles.optionButtonText, { color: '#FF3B30' }]}>2. Record & Scrape Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelOptionButton} onPress={() => setOptionsModalVisible(false)}>
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Patient modal */}
      <Modal visible={manualModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => { setManualModalVisible(false); resetForm(); }}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Patient</Text>
          <TouchableOpacity onPress={handleSavePatient}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* ── Basic Information ── */}
          <Text style={styles.sectionHeading}>Basic Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Patient Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="ID Number"
            value={idNumber}
            onChangeText={setIdNumber}
            keyboardType="numeric"
          />

          {/* Gender chips */}
          <FieldLabel label="Gender" />
          <ChipSelector options={GENDER_OPTIONS} selected={gender} onSelect={(v) => setGender(String(v))} />

          {/* Date of Birth – wheel pickers */}
          <FieldLabel label="Date of Birth" />
          <View style={fStyles.wheelRow}>
            <View style={fStyles.wheelCol}>
              <Text style={fStyles.wheelLabel}>Month</Text>
              <WheelPicker key={`m-${resetCount}`} items={MONTH_ITEMS} initialIndex={dobMonth - 1} onChange={i => setDobMonth(i + 1)} />
            </View>
            <View style={fStyles.wheelCol}>
              <Text style={fStyles.wheelLabel}>Day</Text>
              <WheelPicker key={`d-${resetCount}`} items={DAY_ITEMS} initialIndex={dobDay - 1} onChange={i => setDobDay(i + 1)} />
            </View>
            <View style={[fStyles.wheelCol, { flex: 1.4 }]}>
              <Text style={fStyles.wheelLabel}>Year</Text>
              <WheelPicker key={`y-${resetCount}`} items={YEAR_ITEMS} initialIndex={dobYear - 1920} onChange={i => setDobYear(1920 + i)} />
            </View>
          </View>

          {/* Height – ft + in wheel pickers */}
          <FieldLabel label="Height" />
          <View style={fStyles.wheelRow}>
            <View style={fStyles.wheelCol}>
              <Text style={fStyles.wheelLabel}>Feet</Text>
              <WheelPicker key={`ft-${resetCount}`} items={FT_ITEMS} initialIndex={heightFt - 3} onChange={i => setHeightFt(3 + i)} />
            </View>
            <View style={fStyles.wheelCol}>
              <Text style={fStyles.wheelLabel}>Inches</Text>
              <WheelPicker key={`in-${resetCount}`} items={IN_ITEMS} initialIndex={heightIn} onChange={i => setHeightIn(i)} />
            </View>
          </View>

          {/* Weight – lbs wheel picker */}
          <FieldLabel label="Weight" />
          <View style={fStyles.wheelRow}>
            <View style={{ flex: 1 }}>
              <Text style={fStyles.wheelLabel}>lbs</Text>
              <WheelPicker key={`lbs-${resetCount}`} items={LBS_ITEMS} initialIndex={weightLbs - 50} onChange={i => setWeightLbs(50 + i)} />
            </View>
          </View>

          <TextInput
            style={[styles.input, { height: 80, marginTop: 4 }]}
            placeholder="Notes / History (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* ── Contact Details ── */}
          <Text style={styles.sectionHeading}>Contact Details</Text>
          <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Emergency Contact (Name / Phone)" value={emergencyContact} onChangeText={setEmergencyContact} />

          {/* ── Medicines ── */}
          <View style={styles.medicineHeader}>
            <Text style={styles.sectionHeading}>Medicines</Text>
            <TouchableOpacity onPress={addMedicineField} style={styles.addMedicineBtn}>
              <Ionicons name="add-circle" size={20} color="#007AFF" />
              <Text style={styles.addMedicineText}>Add Med</Text>
            </TouchableOpacity>
          </View>

          {medicinesForm.map((med, idx) => (
            <View key={idx} style={styles.medicineBox}>
              {/* Medicine header row */}
              <View style={styles.medicineBoxHeader}>
                <Text style={styles.medicineBoxTitle}>Medicine #{idx + 1}</Text>
                <TouchableOpacity onPress={() => removeMedicine(idx)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              {/* Medicine name */}
              <TextInput
                style={styles.input}
                placeholder="Name of medicine"
                value={med.name}
                onChangeText={(v) => updateMedicineField(idx, 'name', v)}
              />

              {/* Total pills prescribed – stepper */}
              <FieldLabel label="Total Pills Prescribed" />
              <Stepper
                value={med.totalPillsPrescribed}
                min={1} max={500} step={5} unit="pills"
                onChange={(v) => updateMedicineField(idx, 'totalPillsPrescribed', v)}
              />

              {/* Pills per day – chips */}
              <FieldLabel label="Pills Per Day" />
              <ChipSelector
                options={PILLS_PER_DAY_OPTIONS}
                selected={med.pillsPerDayToBeTaken}
                onSelect={(v) => updatePillsPerDay(idx, Number(v))}
              />

              {/* Days per week – chips */}
              <FieldLabel label="Days Per Week" />
              <ChipSelector
                options={DAYS_PER_WEEK_OPTIONS}
                selected={med.daysPerWeekToTakeThePrescription}
                onSelect={(v) => updateMedicineField(idx, 'daysPerWeekToTakeThePrescription', Number(v))}
              />

              {/* Schedule – one time picker per dose */}
              <FieldLabel label={`Schedule  (${med.pillsPerDayToBeTaken} dose${med.pillsPerDayToBeTaken > 1 ? 's' : ''}/day)`} />
              {Array.from({ length: med.pillsPerDayToBeTaken }, (_, slotIdx) => (
                <View key={slotIdx} style={fStyles.scheduleSlot}>
                  <Text style={fStyles.doseLabel}>Dose {slotIdx + 1}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fStyles.timeRow}>
                    {TIME_OPTIONS.map((t) => {
                      const active = med.pillSchedules[slotIdx] === t;
                      return (
                        <TouchableOpacity
                          key={t}
                          style={[fStyles.timeChip, active && fStyles.timeChipActive]}
                          onPress={() => updateScheduleSlot(idx, slotIdx, t)}
                          activeOpacity={0.7}
                        >
                          <Text style={[fStyles.timeChipText, active && fStyles.timeChipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}

              {/* Refill toggle */}
              <View style={styles.switchRow}>
                <Text style={{ fontSize: 15, color: '#1C1C1E' }}>Refill Notification</Text>
                <Switch
                  value={med.refillOrNot}
                  onValueChange={(v) => updateMedicineField(idx, 'refillOrNot', v)}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Form-specific styles ─────────────────────────────────────────────────────
const fStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 8, marginTop: 2, textTransform: 'uppercase' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: '#F2F2F7', borderWidth: 1.5, borderColor: '#E5E5EA' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#3C3C43' },
  chipTextActive: { color: '#fff' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', alignSelf: 'flex-start', marginBottom: 14, overflow: 'hidden' },
  stepBtn: { paddingHorizontal: 18, paddingVertical: 12 },
  stepValue: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', minWidth: 90, textAlign: 'center' },
  wheelRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  wheelCol:   { flex: 1 },
  wheelLabel: { fontSize: 9, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.6, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
  scheduleSlot: { marginBottom: 12 },
  doseLabel: { fontSize: 12, fontWeight: '700', color: '#007AFF', marginBottom: 6 },
  timeRow: { gap: 6, paddingVertical: 2 },
  timeChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F2F2F7', borderWidth: 1.5, borderColor: '#E5E5EA' },
  timeChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  timeChipText: { fontSize: 12, fontWeight: '600', color: '#3C3C43' },
  timeChipTextActive: { color: '#fff' },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerGreeting: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  headerName: { fontSize: 20, fontWeight: '800', color: '#0055D4', letterSpacing: -0.3 },
  notifButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  remindersRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  reminderCard: { width: 140, backgroundColor: '#fff', borderRadius: 20, padding: 14, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  reminderCardUrgent: { borderWidth: 1.5, borderColor: '#FF9500' },
  reminderIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  reminderIconUrgent: { backgroundColor: '#FFF3E0' },
  reminderTime: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  reminderMed: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  reminderPatient: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  urgentBadge: { marginTop: 6, backgroundColor: '#FFF3E0', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  urgentBadgeText: { fontSize: 9, fontWeight: '800', color: '#FF9500', letterSpacing: 0.5 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, marginTop: 16, paddingHorizontal: 14, height: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  countBadge: { backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#8E8E93' },
  patientsList: { paddingHorizontal: 20, gap: 10 },
  patientCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  patientLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  patientAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 20, fontWeight: '800', color: '#007AFF' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  patientMeta: { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  patientRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusStable: { backgroundColor: '#E8F5E9' },
  statusAttention: { backgroundColor: '#FFF8E1' },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  statusTextStable: { color: '#2E7D32' },
  statusTextAttention: { color: '#F57F17' },
  pillAlert: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 60, height: 60, borderRadius: 18, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  optionsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  optionsModalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 14, padding: 20, alignItems: 'center' },
  optionsModalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1C1C1E' },
  optionButton: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, backgroundColor: '#F2F2F7', borderRadius: 12, marginBottom: 12 },
  optionButtonText: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 12 },
  cancelOptionButton: { marginTop: 10, padding: 12 },
  cancelOptionText: { fontSize: 17, color: '#8E8E93', fontWeight: '500' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingTop: 60 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  cancelButton: { fontSize: 17, color: '#007AFF' },
  saveButton: { fontSize: 17, fontWeight: '600', color: '#007AFF' },
  formContainer: { padding: 20, backgroundColor: '#F2F2F7' },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: '#8E8E93', marginTop: 10, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: { backgroundColor: '#fff', height: 50, borderRadius: 10, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 12 },
  medicineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  addMedicineBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addMedicineText: { color: '#007AFF', fontWeight: '600', marginLeft: 6 },
  medicineBox: { backgroundColor: '#F8F8F8', padding: 15, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5EA' },
  medicineBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  medicineBoxTitle: { fontWeight: '800', fontSize: 15, color: '#1C1C1E' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
});
