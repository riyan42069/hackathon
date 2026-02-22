import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Switch, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MedicineAutocomplete } from '../components/MedicineAutocomplete';
import { generatePatientSummary, translateAndDraftEmail, processConsultationRecording } from '../services/ai';
import { Audio } from 'expo-av';
import Markdown from 'react-native-markdown-display';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const MONTH_ITEMS = MONTHS;
const DAY_ITEMS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const YEAR_ITEMS = Array.from({ length: 105 }, (_, i) => String(1920 + i));
const FT_ITEMS = ['3 ft', '4 ft', '5 ft', '6 ft', '7 ft'];
const IN_ITEMS = Array.from({ length: 12 }, (_, i) => `${i} in`);
const LBS_ITEMS = Array.from({ length: 451 }, (_, i) => `${50 + i} lbs`);
const WHEEL_H = 44;

const PILLS_PER_DAY_OPTIONS = [1, 2, 3, 4, 5, 6];
const DAYS_PER_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const TIME_OPTIONS = [
  '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Medicine {
  name: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  indication?: string;
  classification?: string;
  totalPillsPrescribed: string;
  pillsLeft?: number;
  pillsPerDayToBeTaken: string;
  daysPerWeekToTakeThePrescription: string;
  pillSchedule: string;
  refillOrNot: boolean;
  status?: 'upcoming' | 'done' | 'missed';
}

interface Patient {
  id: string;
  name: string;
  patientId: string;
  dob?: string;
  age?: string | number;
  gender?: string;
  height?: string;
  weight?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
  notes?: string;
  status?: string;
  medicines?: Medicine[];
  consultationLogs?: ConsultationLog[];
}

interface ConsultationLog {
  id: string;
  timestamp: string;
  transcription: string;
  report: string;
}

// ─── Wheel Picker ─────────────────────────────────────────────────────────────
function WheelPicker({ items, initialIndex, onChange }: {
  items: string[]; initialIndex: number; onChange: (index: number) => void;
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
  wrap: { height: WHEEL_H * 3, overflow: 'hidden', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  highlight: { position: 'absolute', top: WHEEL_H, height: WHEEL_H, left: 0, right: 0, backgroundColor: '#EBF4FF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#C5DCFF' },
  item: { height: WHEEL_H, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 15, color: '#C7C7CC', fontWeight: '500' },
  textSel: { fontSize: 17, color: '#1C1C1E', fontWeight: '700' },
});

// ─── Small helpers ────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}><Ionicons name={icon} size={16} color="#007AFF" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function ChipSelector({ options, selected, onSelect }: {
  options: (string | number)[];
  selected: string | number;
  onSelect: (v: string | number) => void;
}) {
  return (
    <View style={mStyles.chipsRow}>
      {options.map((opt) => {
        const active = String(selected) === String(opt);
        return (
          <TouchableOpacity
            key={String(opt)}
            style={[mStyles.chip, active && mStyles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text style={[mStyles.chipText, active && mStyles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PatientProfileScreen() {
  const [activeTab, setActiveTab] = useState<'profile' | 'medicine'>('profile');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Medicine modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [medName, setMedName] = useState('');
  const [medCategory, setMedCategory] = useState('');
  const [medDosageForm, setMedDosageForm] = useState('');
  const [medStrength, setMedStrength] = useState('');
  const [medManufacturer, setMedManufacturer] = useState('');
  const [medIndication, setMedIndication] = useState('');
  const [medClassification, setMedClassification] = useState('');
  const [totalPills, setTotalPills] = useState('30');
  const [pillsPerDay, setPillsPerDay] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const [pillSchedules, setPillSchedules] = useState<string[]>(['']);
  const [refillOrNot, setRefillOrNot] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Profile modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPatientId, setEditPatientId] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDobMonth, setEditDobMonth] = useState(1);
  const [editDobDay, setEditDobDay] = useState(1);
  const [editDobYear, setEditDobYear] = useState(1990);
  const [editHeightFt, setEditHeightFt] = useState(5);
  const [editHeightIn, setEditHeightIn] = useState(10);
  const [editWeightLbs, setEditWeightLbs] = useState(160);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editResetCount, setEditResetCount] = useState(0);
  const [editSaving, setEditSaving] = useState(false);

  // Consultation Recording State
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingConsultation, setIsProcessingConsultation] = useState(false);
  const [consultLogModalVisible, setConsultLogModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ConsultationLog | null>(null);

  // AI Report State
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportText, setReportText] = useState('');
  const [originalReport, setOriginalReport] = useState('');
  const [reportLanguage, setReportLanguage] = useState('English');
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (!id || !db) return;
    const unsub = onSnapshot(doc(db, 'patients', id), (snap) => {
      if (snap.exists()) {
        setPatient({ id: snap.id, ...snap.data() } as Patient);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const updatePillsPerDay = (count: number) => {
    setPillsPerDay(count);
    setPillSchedules(Array.from({ length: count }, (_, i) => pillSchedules[i] || ''));
  };

  const toggleScheduleSlot = (slotIdx: number, time: string) => {
    setPillSchedules(prev => {
      const updated = [...prev];
      updated[slotIdx] = updated[slotIdx] === time ? '' : time;
      return updated;
    });
  };

  const resetMedForm = () => {
    setMedName(''); setMedCategory(''); setMedDosageForm(''); setMedStrength('');
    setMedManufacturer(''); setMedIndication(''); setMedClassification('');
    setTotalPills('30'); setPillsPerDay(1);
    setDaysPerWeek(7); setPillSchedules(['']); setRefillOrNot(false);
  };

  const handleAddMedicine = async () => {
    if (!medName.trim()) {
      Alert.alert('Missing Info', 'Please enter a medicine name.');
      return;
    }
    const newMed: Medicine = {
      name: medName.trim(),
      category: medCategory, dosageForm: medDosageForm, strength: medStrength,
      manufacturer: medManufacturer, indication: medIndication, classification: medClassification,
      totalPillsPrescribed: totalPills,
      pillsLeft: parseInt(totalPills, 10) || 0,
      pillsPerDayToBeTaken: String(pillsPerDay),
      daysPerWeekToTakeThePrescription: String(daysPerWeek),
      pillSchedule: pillSchedules.filter(Boolean).join(', '),
      refillOrNot,
    };
    setSaving(true);
    try {
      await updateDoc(doc(db, 'patients', id as string), {
        medicines: arrayUnion(newMed),
      });
      setModalVisible(false);
      resetMedForm();
    } catch (e) {
      Alert.alert('Error', 'Could not save medicine.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    if (!patient) return;
    setEditName(patient.name || '');
    setEditPatientId(patient.patientId || '');
    setEditGender(patient.gender || '');

    // Parse dob: "Jan 1, 1990"
    const dobParts = (patient.dob || '').split(' ');
    const mIdx = MONTHS.indexOf(dobParts[0]);
    setEditDobMonth(mIdx >= 0 ? mIdx + 1 : 1);
    setEditDobDay(parseInt(dobParts[1]) || 1);
    setEditDobYear(parseInt(dobParts[2]) || 1990);

    // Parse height: "5 ft 10 in"
    const htMatch = (patient.height || '').match(/(\d+)\s*ft\s*(\d+)\s*in/);
    setEditHeightFt(htMatch ? parseInt(htMatch[1]) : 5);
    setEditHeightIn(htMatch ? parseInt(htMatch[2]) : 10);

    // Parse weight: "160 lbs"
    const wtMatch = (patient.weight || '').match(/(\d+)/);
    setEditWeightLbs(wtMatch ? parseInt(wtMatch[1]) : 160);

    setEditPhone(patient.phone || '');
    setEditEmail(patient.email || '');
    setEditEmergencyContact(patient.emergencyContact || '');
    setEditNotes(patient.notes || '');
    setEditResetCount(c => c + 1);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Missing Info', 'Patient name is required.');
      return;
    }
    setEditSaving(true);
    try {
      await updateDoc(doc(db, 'patients', id as string), {
        name: editName.trim(),
        patientId: editPatientId.trim(),
        dob: `${MONTHS[editDobMonth - 1]} ${editDobDay}, ${editDobYear}`,
        gender: editGender,
        height: `${editHeightFt} ft ${editHeightIn} in`,
        weight: `${editWeightLbs} lbs`,
        phone: editPhone.trim(),
        email: editEmail.trim(),
        emergencyContact: editEmergencyContact.trim(),
        notes: editNotes.trim(),
      });
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save patient info.');
    } finally {
      setEditSaving(false);
    }
  };

  const startRecording = async () => {
    try {
      const perms = await Audio.requestPermissionsAsync();
      if (perms.status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone permissions.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopAndProcessConsultation = async () => {
    if (!recording || !patient) return;
    setIsRecording(false);
    setIsProcessingConsultation(true);
    try {
      try { await recording.stopAndUnloadAsync(); } catch (_) {}
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI found');
      setRecording(undefined);

      const { transcription, report } = await processConsultationRecording(uri, patient.name);

      const newLog: ConsultationLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        transcription,
        report,
      };

      await updateDoc(doc(db, 'patients', id as string), {
        consultationLogs: arrayUnion(newLog),
      });

      setSelectedLog(newLog);
      setConsultLogModalVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not process recording.');
    } finally {
      setIsProcessingConsultation(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!patient) return;
    setReportModalVisible(true);
    setGeneratingReport(true);
    setReportText('');
    setOriginalReport('');
    setReportLanguage('English');

    try {
      const summary = await generatePatientSummary(patient);
      setReportText(summary);
      setOriginalReport(summary);
    } catch (err: any) {
      console.error(err);
      setReportText("Failed to generate report: " + err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    if (lang === 'English') {
      setReportText(originalReport);
      setReportLanguage('English');
      return;
    }

    setGeneratingReport(true);
    setReportLanguage(lang);
    try {
      const translated = await translateAndDraftEmail(originalReport, lang);
      setReportText(translated);
    } catch (err: any) {
      Alert.alert("Translation Error", err.message);
      setReportLanguage('English');
      setReportText(originalReport);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleEmailReport = async () => {
    try {
      await Share.share({
        title: `Clinical Summary Report - ${patient?.name || 'Patient'}`,
        message: reportText,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not open share sheet.');
    }
  };

  const handleTakePill = async (medIdx: number) => {
    if (!patient) return;
    const meds = [...(patient.medicines || [])];
    const med = meds[medIdx];
    const currentLeft = med.pillsLeft ?? (parseInt(med.totalPillsPrescribed, 10) || 0);
    if (currentLeft <= 0) {
      Alert.alert('No Pills Left', `${med.name} has no pills remaining.`);
      return;
    }
    const newPillsLeft = currentLeft - 1;
    const totalPrescribed = parseInt(med.totalPillsPrescribed, 10) || 0;
    // Auto-enable refill when pills drop to 20% or below
    const needsRefill = totalPrescribed > 0 && newPillsLeft <= totalPrescribed * 0.2;
    meds[medIdx] = {
      ...med,
      pillsLeft: newPillsLeft,
      status: 'done' as const,
      refillOrNot: needsRefill || med.refillOrNot,
    };
    try {
      await updateDoc(doc(db, 'patients', id as string), { medicines: meds });
    } catch (e) {
      Alert.alert('Error', 'Could not update pill count.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#8E8E93', fontSize: 16 }}>Patient not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const medicines: Medicine[] = patient.medicines || [];
  const refillCount = medicines.filter(m => m.refillOrNot).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {activeTab === 'profile' && (
          <TouchableOpacity onPress={openEditModal} style={styles.editHeaderBtn}>
            <Ionicons name="pencil-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.patientBanner}>
        <View style={styles.patientAvatarWrapper}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{patient.name.charAt(0)}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientMeta}>
            ID #{patient.patientId}
            {patient.dob || patient.age ? ` · ${patient.dob || patient.age}` : ''}
            {patient.gender ? ` · ${patient.gender}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['profile', 'medicine'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'profile' ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}>

          <TouchableOpacity
            style={styles.generateReportBtn}
            activeOpacity={0.8}
            onPress={handleGenerateReport}
          >
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.generateReportText}>Generate AI Summary Report</Text>
          </TouchableOpacity>

          {/* Record Consultation Button */}
          {isProcessingConsultation ? (
            <View style={styles.recordingBtn}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.generateReportText}>Analyzing consultation...</Text>
            </View>
          ) : isRecording ? (
            <TouchableOpacity style={styles.recordingActiveBtn} activeOpacity={0.8} onPress={stopAndProcessConsultation}>
              <Ionicons name="stop-circle-outline" size={20} color="#fff" />
              <Text style={styles.generateReportText}>Stop Recording</Text>
              <View style={styles.recordingDot} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.recordBtn} activeOpacity={0.8} onPress={startRecording}>
              <Ionicons name="mic-outline" size={20} color="#fff" />
              <Text style={styles.generateReportText}>Record Consultation</Text>
            </TouchableOpacity>
          )}

          <View style={styles.infoCard}>
            <InfoRow icon="calendar-outline" label="Date of Birth" value={patient.dob || ''} />
            <View style={styles.divider} />
            <InfoRow icon="person-outline" label="Gender" value={patient.gender || ''} />
            <View style={styles.divider} />
            <InfoRow icon="resize-outline" label="Height" value={patient.height || ''} />
            <View style={styles.divider} />
            <InfoRow icon="barbell-outline" label="Weight" value={patient.weight || ''} />
            <View style={styles.divider} />
            <InfoRow icon="call-outline" label="Phone" value={patient.phone || ''} />
            <View style={styles.divider} />
            <InfoRow icon="mail-outline" label="Email" value={patient.email || ''} />
            <View style={styles.divider} />
            <InfoRow icon="alert-circle-outline" label="Emergency Contact" value={patient.emergencyContact || ''} />
          </View>
          {patient.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>NOTES / HISTORY</Text>
              <Text style={styles.notesText}>{patient.notes}</Text>
            </View>
          ) : null}

          {/* Consultation Logs */}
          {(patient.consultationLogs?.length ?? 0) > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={styles.consultLogsHeader}>Consultation Logs</Text>
              {[...(patient.consultationLogs ?? [])].reverse().map((log) => (
                <TouchableOpacity
                  key={log.id}
                  style={styles.consultLogCard}
                  activeOpacity={0.7}
                  onPress={() => { setSelectedLog(log); setConsultLogModalVisible(true); }}
                >
                  <Text style={styles.consultLogDate}>
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                  <Text style={styles.consultLogPreview} numberOfLines={2}>
                    {log.report.replace(/#+\s*/g, '').replace(/\*+/g, '')}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#C7C7CC" style={{ alignSelf: 'flex-end' }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}>
            <View style={styles.statsRow}>
              {([
                [String(medicines.length), '#1C1C1E', 'Total'],
                [String(refillCount), '#FF9500', 'Refill'],
              ] as [string, string, string][]).map(([n, c, l]) => (
                <View key={l} style={styles.statCard}>
                  <Text style={[styles.statNumber, { color: c }]}>{n}</Text>
                  <Text style={styles.statLabel}>{l}</Text>
                </View>
              ))}
            </View>

            {medicines.length === 0 ? (
              <View style={styles.emptyMeds}>
                <Ionicons name="medical-outline" size={40} color="#C7C7CC" />
                <Text style={styles.emptyMedsText}>No medicines added yet</Text>
              </View>
            ) : (
              medicines.map((med, idx) => {
                const pillsLeft = med.pillsLeft ?? (parseInt(med.totalPillsPrescribed, 10) || 0);
                const totalPills = parseInt(med.totalPillsPrescribed, 10) || 0;
                const pct = totalPills > 0 ? (pillsLeft / totalPills) * 100 : 0;
                const barColor = pct > 30 ? '#34C759' : pct > 10 ? '#FF9500' : '#FF3B30';

                return (
                  <View key={idx} style={[styles.medCard, med.refillOrNot && styles.medCardRefill]}>
                    <View style={styles.medHeader}>
                      <View style={styles.medIconBox}>
                        <Ionicons name="medical-outline" size={22} color="#007AFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        <Text style={styles.medDosage}>{med.pillsPerDayToBeTaken} pill(s)/day</Text>
                      </View>
                      {med.refillOrNot && (
                        <View style={styles.refillBadge}>
                          <Text style={styles.refillBadgeText}>REFILL</Text>
                        </View>
                      )}
                    </View>

                    {/* Pills left progress */}
                    <View style={styles.pillsLeftSection}>
                      <View style={styles.pillsLeftHeader}>
                        <Text style={styles.pillsLeftLabel}>Pills Remaining</Text>
                        <Text style={[styles.pillsLeftCount, { color: barColor }]}>{pillsLeft} / {totalPills}</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>

                    {/* Take pill button */}
                    <TouchableOpacity
                      style={[styles.takePillButton, pillsLeft <= 0 && styles.takePillButtonDisabled]}
                      activeOpacity={0.7}
                      onPress={() => handleTakePill(idx)}
                      disabled={pillsLeft <= 0}
                    >
                      <Ionicons name="remove-circle-outline" size={18} color={pillsLeft > 0 ? '#fff' : '#C7C7CC'} />
                      <Text style={[styles.takePillText, pillsLeft <= 0 && styles.takePillTextDisabled]}>
                        {pillsLeft > 0 ? 'Take Pill' : 'No Pills Left'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.medDetails}>
                      {med.pillSchedule ? (
                        <View style={styles.detailRow}>
                          <Ionicons name="time-outline" size={14} color="#8E8E93" />
                          <Text style={styles.detailText}>{med.pillSchedule}</Text>
                        </View>
                      ) : null}
                      {med.daysPerWeekToTakeThePrescription ? (
                        <View style={styles.detailRow}>
                          <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                          <Text style={styles.detailText}>{med.daysPerWeekToTakeThePrescription} day(s) per week</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Add Medicine FAB */}
          <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Add Medicine Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => { setModalVisible(false); resetMedForm(); }}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Medicine</Text>
          <TouchableOpacity onPress={handleAddMedicine} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#007AFF" />
              : <Text style={styles.saveButton}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={mStyles.form} contentContainerStyle={{ paddingBottom: 60 }}>

          <Text style={mStyles.sectionHeading}>Medicine Name</Text>
          <MedicineAutocomplete
            value={medName}
            onSelect={setMedName}
            onSelectFull={(info) => {
              setMedName(info.name); setMedCategory(info.category);
              setMedDosageForm(info.dosageForm); setMedStrength(info.strength);
              setMedManufacturer(info.manufacturer); setMedIndication(info.indication);
              setMedClassification(info.classification);
            }}
            inputStyle={mStyles.input}
          />

          <Text style={mStyles.sectionHeading}>Total Pills Prescribed</Text>
          <TextInput
            style={mStyles.input}
            placeholder="e.g. 30"
            value={totalPills}
            onChangeText={setTotalPills}
            keyboardType="numeric"
          />

          <Text style={mStyles.sectionHeading}>Pills Per Day</Text>
          <ChipSelector options={PILLS_PER_DAY_OPTIONS} selected={pillsPerDay} onSelect={(v) => updatePillsPerDay(Number(v))} />

          <Text style={mStyles.sectionHeading}>Days Per Week</Text>
          <ChipSelector options={DAYS_PER_WEEK_OPTIONS} selected={daysPerWeek} onSelect={(v) => setDaysPerWeek(Number(v))} />

          <Text style={mStyles.sectionHeading}>
            Schedule ({pillsPerDay} dose{pillsPerDay > 1 ? 's' : ''}/day)
          </Text>
          {Array.from({ length: pillsPerDay }, (_, slotIdx) => (
            <View key={slotIdx} style={{ marginBottom: 12 }}>
              <Text style={mStyles.doseLabel}>Dose {slotIdx + 1}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mStyles.timeRow}>
                {TIME_OPTIONS.map((t) => {
                  const active = pillSchedules[slotIdx] === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[mStyles.timeChip, active && mStyles.timeChipActive]}
                      onPress={() => toggleScheduleSlot(slotIdx, t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[mStyles.timeChipText, active && mStyles.timeChipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}

          <View style={mStyles.switchRow}>
            <Text style={mStyles.switchLabel}>Refill Notification</Text>
            <Switch value={refillOrNot} onValueChange={setRefillOrNot} />
          </View>

        </ScrollView>
      </Modal>

      {/* Consultation Log Viewer Modal */}
      <Modal visible={consultLogModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setConsultLogModalVisible(false)} style={{ flex: 1 }}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { flex: 2, textAlign: 'center' }]}>Consultation Note</Text>
          <View style={{ flex: 1 }} />
        </View>
        {selectedLog && (
          <>
            <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F2F2F7', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}>
              <Text style={styles.consultLogDate}>{new Date(selectedLog.timestamp).toLocaleString()}</Text>
              <Text style={[styles.consultLogDate, { marginTop: 4, color: '#3C3C43' }]}>
                Transcription: "{selectedLog.transcription.slice(0, 120)}{selectedLog.transcription.length > 120 ? '…' : ''}"
              </Text>
            </View>
            <ScrollView style={styles.reportContainer} contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}>
              <Markdown style={markdownStyles}>{selectedLog.report}</Markdown>
            </ScrollView>
          </>
        )}
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditModalVisible(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSaveProfile} disabled={editSaving}>
            {editSaving
              ? <ActivityIndicator color="#007AFF" />
              : <Text style={styles.saveButton}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={mStyles.form} contentContainerStyle={{ paddingBottom: 60 }}>

          <Text style={mStyles.sectionHeading}>Basic Information</Text>
          <TextInput style={mStyles.input} value={editName} onChangeText={setEditName} placeholder="Patient Name" />
          <TextInput style={mStyles.input} value={editPatientId} onChangeText={setEditPatientId} placeholder="ID Number" keyboardType="numeric" />

          <Text style={eStyles.label}>Gender</Text>
          <View style={eStyles.chipsRow}>
            {GENDER_OPTIONS.map(opt => {
              const active = editGender === opt;
              return (
                <TouchableOpacity key={opt} style={[eStyles.chip, active && eStyles.chipActive]} onPress={() => setEditGender(opt)} activeOpacity={0.7}>
                  <Text style={[eStyles.chipText, active && eStyles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={eStyles.label}>Date of Birth</Text>
          <View style={eStyles.wheelRow}>
            <View style={eStyles.wheelCol}>
              <Text style={eStyles.wheelLabel}>Month</Text>
              <WheelPicker key={`em-${editResetCount}`} items={MONTH_ITEMS} initialIndex={editDobMonth - 1} onChange={i => setEditDobMonth(i + 1)} />
            </View>
            <View style={eStyles.wheelCol}>
              <Text style={eStyles.wheelLabel}>Day</Text>
              <WheelPicker key={`ed-${editResetCount}`} items={DAY_ITEMS} initialIndex={editDobDay - 1} onChange={i => setEditDobDay(i + 1)} />
            </View>
            <View style={[eStyles.wheelCol, { flex: 1.4 }]}>
              <Text style={eStyles.wheelLabel}>Year</Text>
              <WheelPicker key={`ey-${editResetCount}`} items={YEAR_ITEMS} initialIndex={editDobYear - 1920} onChange={i => setEditDobYear(1920 + i)} />
            </View>
          </View>

          <Text style={eStyles.label}>Height</Text>
          <View style={eStyles.wheelRow}>
            <View style={eStyles.wheelCol}>
              <Text style={eStyles.wheelLabel}>Feet</Text>
              <WheelPicker key={`eft-${editResetCount}`} items={FT_ITEMS} initialIndex={editHeightFt - 3} onChange={i => setEditHeightFt(3 + i)} />
            </View>
            <View style={eStyles.wheelCol}>
              <Text style={eStyles.wheelLabel}>Inches</Text>
              <WheelPicker key={`ein-${editResetCount}`} items={IN_ITEMS} initialIndex={editHeightIn} onChange={i => setEditHeightIn(i)} />
            </View>
          </View>

          <Text style={eStyles.label}>Weight</Text>
          <View style={eStyles.wheelRow}>
            <View style={{ flex: 1 }}>
              <Text style={eStyles.wheelLabel}>lbs</Text>
              <WheelPicker key={`elbs-${editResetCount}`} items={LBS_ITEMS} initialIndex={editWeightLbs - 50} onChange={i => setEditWeightLbs(50 + i)} />
            </View>
          </View>

          <TextInput
            style={[mStyles.input, { height: 80, marginTop: 4 }]}
            placeholder="Notes / History (optional)"
            value={editNotes}
            onChangeText={setEditNotes}
            multiline
          />

          <Text style={mStyles.sectionHeading}>Contact Details</Text>
          <TextInput style={mStyles.input} value={editPhone} onChangeText={setEditPhone} placeholder="Phone Number" keyboardType="phone-pad" />
          <TextInput style={mStyles.input} value={editEmail} onChangeText={setEditEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={mStyles.input} value={editEmergencyContact} onChangeText={setEditEmergencyContact} placeholder="Emergency Contact (Name / Phone)" />

        </ScrollView>
      </Modal>

      {/* AI Report Modal */}
      <Modal visible={reportModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setReportModalVisible(false)} style={{ flex: 1 }}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { flex: 2, textAlign: 'center' }]}>Clinical Summary</Text>
          <TouchableOpacity onPress={handleEmailReport} style={{ flex: 1, alignItems: 'flex-end', opacity: reportText && !generatingReport ? 1 : 0.5 }} disabled={!reportText || generatingReport}>
            <Ionicons name="paper-plane-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {reportText && originalReport ? (
          <View style={styles.langSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
              {['English', 'Spanish', 'French', 'Hindi', 'Arabic'].map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[mStyles.chip, reportLanguage === lang && mStyles.chipActive]}
                  onPress={() => handleTranslate(lang)}
                  disabled={generatingReport}
                >
                  <Text style={[mStyles.chipText, reportLanguage === lang && mStyles.chipTextActive]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <ScrollView style={styles.reportContainer} contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}>
          {generatingReport ? (
            <View style={{ alignItems: 'center', marginTop: 40, gap: 16 }}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{ color: '#8E8E93', fontSize: 16, fontWeight: '500' }}>
                Analyzing patient profile...
              </Text>
            </View>
          ) : (
            <Markdown style={markdownStyles}>
              {reportText}
            </Markdown>
          )}
        </ScrollView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Modal form styles ────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  form: { padding: 20, backgroundColor: '#F2F2F7' },
  sectionHeading: { fontSize: 11, fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 8 },
  input: { backgroundColor: '#fff', height: 50, borderRadius: 10, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: '#F2F2F7', borderWidth: 1.5, borderColor: '#E5E5EA' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#3C3C43' },
  chipTextActive: { color: '#fff' },
  doseLabel: { fontSize: 12, fontWeight: '700', color: '#007AFF', marginBottom: 6 },
  timeRow: { gap: 6, paddingVertical: 2 },
  timeChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F2F2F7', borderWidth: 1.5, borderColor: '#E5E5EA' },
  timeChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  timeChipText: { fontSize: 12, fontWeight: '600', color: '#3C3C43' },
  timeChipTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  switchLabel: { fontSize: 15, color: '#1C1C1E', fontWeight: '500' },
});

// ─── Edit Profile form styles ─────────────────────────────────────────────────
const eStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 8, marginTop: 2, textTransform: 'uppercase' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: '#F2F2F7', borderWidth: 1.5, borderColor: '#E5E5EA' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#3C3C43' },
  chipTextActive: { color: '#fff' },
  wheelRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  wheelCol: { flex: 1 },
  wheelLabel: { fontSize: 9, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.6, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  editHeaderBtn: { padding: 4 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  patientBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  patientAvatarWrapper: { position: 'relative' },
  patientAvatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 22, fontWeight: '800', color: '#007AFF' },
  patientName: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  patientMeta: { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  infoCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  infoIconBox: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, color: '#1C1C1E', fontWeight: '700', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 60 },
  notesCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  notesLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.6 },
  notesText: { fontSize: 14, color: '#3C3C43', fontWeight: '500', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginTop: 2 },
  emptyMeds: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyMedsText: { fontSize: 16, color: '#8E8E93', fontWeight: '600' },
  medCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  medCardRefill: { borderWidth: 1.5, borderColor: '#FF9500' },
  medHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medIconBox: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  medName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  medDosage: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  refillBadge: { backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  refillBadgeText: { fontSize: 10, fontWeight: '800', color: '#FF9500', letterSpacing: 0.4 },
  medDetails: { gap: 6, paddingLeft: 58 },
  pillsLeftSection: { gap: 6 },
  pillsLeftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pillsLeftLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  pillsLeftCount: { fontSize: 14, fontWeight: '800' },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: '#F2F2F7', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  takePillButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 10 },
  takePillButtonDisabled: { backgroundColor: '#F2F2F7' },
  takePillText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  takePillTextDisabled: { color: '#C7C7CC' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#3C3C43', fontWeight: '500' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 16, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingTop: 60 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  cancelButton: { fontSize: 17, color: '#007AFF' },
  saveButton: { fontSize: 17, fontWeight: '600', color: '#007AFF' },
  generateReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 14, gap: 8, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  generateReportText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  recordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 14, gap: 8, shadowColor: '#34C759', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  recordingActiveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF3B30', paddingVertical: 14, borderRadius: 14, gap: 8, shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  recordingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8E8E93', paddingVertical: 14, borderRadius: 14, gap: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', opacity: 0.8 },
  consultLogCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  consultLogDate: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.3 },
  consultLogPreview: { fontSize: 14, color: '#1C1C1E', fontWeight: '500', lineHeight: 20 },
  consultLogsHeader: { fontSize: 11, fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.6 },
  reportContainer: { flex: 1, backgroundColor: '#FAFAFC', padding: 20 },
  langSelector: { paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
});

// ─── Markdown Styles ──────────────────────────────────────────────────────────
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 24,
    fontFamily: 'System',
  },
  heading1: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginTop: 16, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingBottom: 6 },
  heading2: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginTop: 16, marginBottom: 8 },
  heading3: { fontSize: 18, fontWeight: '700', color: '#007AFF', marginTop: 12, marginBottom: 6 },
  strong: { fontWeight: '700', color: '#1C1C1E' },
  em: { fontStyle: 'italic', color: '#8E8E93' },
  bullet_list: { marginTop: 6, marginBottom: 16 },
  list_item: { marginBottom: 6 },
  bullet_list_icon: { color: '#007AFF', fontSize: 20, marginTop: 2 },
  paragraph: { marginBottom: 14 },
  code_inline: { backgroundColor: '#F2F2F7', color: '#FF3B30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontFamily: 'System' },
});
