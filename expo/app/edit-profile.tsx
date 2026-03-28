import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Camera,
  Check,
  GraduationCap,
  MapPin,
  UserRound,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';

interface FormField {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  icon: typeof Briefcase;
  multiline?: boolean;
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { profile, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.name ?? '');
  const [role, setRole] = useState(profile?.role ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [industry, setIndustry] = useState(profile?.industry ?? '');
  const [experience, setExperience] = useState(profile?.experience ?? '');

  const fields: FormField[] = [
    {
      id: 'name',
      label: language === 'ar' ? 'الاسم الكامل' : 'Full Name',
      value: name,
      placeholder: language === 'ar' ? 'أدخل اسمك...' : 'Enter your name...',
      icon: UserRound,
    },
    {
      id: 'role',
      label: language === 'ar' ? 'المسمى الوظيفي' : 'Job Title',
      value: role,
      placeholder: language === 'ar' ? 'مثال: مستشار أعمال' : 'e.g. Business Consultant',
      icon: Briefcase,
    },
    {
      id: 'company',
      label: language === 'ar' ? 'الشركة / المنظمة' : 'Company / Organization',
      value: company,
      placeholder: language === 'ar' ? 'اسم الشركة...' : 'Company name...',
      icon: Building2,
    },
    {
      id: 'location',
      label: language === 'ar' ? 'الموقع' : 'Location',
      value: location,
      placeholder: language === 'ar' ? 'المدينة، الدولة' : 'City, Country',
      icon: MapPin,
    },
    {
      id: 'industry',
      label: language === 'ar' ? 'القطاع' : 'Industry',
      value: industry,
      placeholder: language === 'ar' ? 'حدد القطاع...' : 'Select industry...',
      icon: Building2,
    },
    {
      id: 'experience',
      label: language === 'ar' ? 'سنوات الخبرة' : 'Years of Experience',
      value: experience,
      placeholder: language === 'ar' ? 'مثال: 5' : 'e.g. 5',
      icon: GraduationCap,
    },
  ];

  const handleFieldChange = (id: string, text: string) => {
    switch (id) {
      case 'name': setName(text); break;
      case 'role': setRole(text); break;
      case 'company': setCompany(text); break;
      case 'location': setLocation(text); break;
      case 'industry': setIndustry(text); break;
      case 'experience': setExperience(text); break;
    }
  };

  const handleSave = async () => {
    console.log('[EditProfile] saving profile:', { name, role, company, location, bio, industry, experience });
    try {
      const skillNames = selectedSkills.map((i) => skills[i]);
      await updateProfile({ name, role, company, location, bio, industry, experience, skills: skillNames });
      router.back();
    } catch (err) {
      console.log('[EditProfile] save failed', err);
    }
  };

  const skills = language === 'ar'
    ? ['حوكمة الشركات', 'إدارة المخاطر', 'الامتثال التنظيمي', 'التدقيق الداخلي', 'الأمن السيبراني', 'استشارات أعمال']
    : ['Corporate Governance', 'Risk Management', 'Regulatory Compliance', 'Internal Audit', 'Cybersecurity', 'Business Consulting'];

  const initialSkillIndices = (profile?.skills ?? []).map((s) => skills.indexOf(s)).filter((i) => i >= 0);
  const [selectedSkills, setSelectedSkills] = useState<number[]>(initialSkillIndices);

  const toggleSkill = (index: number) => {
    setSelectedSkills((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="edit-profile-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'تعديل الملف' : 'Edit Profile'}
          </Text>
          <Pressable onPress={handleSave} style={styles.saveBtn} testID="edit-profile-save">
            <Check color={colors.white} size={18} />
            <Text style={styles.saveBtnText}>{language === 'ar' ? 'حفظ' : 'Save'}</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} testID="edit-profile-scroll">
            <View style={styles.avatarSection}>
              <View style={styles.avatarLarge}>
                <UserRound color={colors.white} size={32} />
              </View>
              <Pressable style={({ pressed }) => [styles.changePhotoBtn, pressed && styles.pressed]}>
                <Camera color={colors.accent} size={16} />
                <Text style={styles.changePhotoText}>
                  {language === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.formSection}>
              {fields.map((field) => (
                <View key={field.id} style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {field.label}
                  </Text>
                  <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <field.icon color={colors.textMuted} size={18} />
                    <TextInput
                      value={field.value}
                      onChangeText={(text) => handleFieldChange(field.id, text)}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                      testID={`edit-field-${field.id}`}
                    />
                  </View>
                </View>
              ))}

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'نبذة مختصرة' : 'Bio'}
                </Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder={language === 'ar' ? 'اكتب نبذة عنك...' : 'Write about yourself...'}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.bioInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  multiline
                  numberOfLines={4}
                  testID="edit-field-bio"
                />
                <Text style={styles.charCount}>{bio.length}/300</Text>
              </View>
            </View>

            <View style={styles.skillsSection}>
              <Text style={[styles.skillsTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'المهارات والتخصصات' : 'Skills & Expertise'}
              </Text>
              <Text style={[styles.skillsSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'اختر المهارات التي تعكس خبراتك' : 'Select skills that reflect your expertise'}
              </Text>
              <View style={styles.skillsGrid}>
                {skills.map((skill, index) => (
                  <Pressable
                    key={skill}
                    onPress={() => toggleSkill(index)}
                    style={[styles.skillPill, selectedSkills.includes(index) && styles.skillPillActive]}
                  >
                    {selectedSkills.includes(index) ? <Check color={colors.white} size={12} /> : null}
                    <Text style={[styles.skillText, selectedSkills.includes(index) && styles.skillTextActive]}>
                      {skill}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.certSection}>
              <Text style={[styles.skillsTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'الشهادات المهنية' : 'Certifications'}
              </Text>
              <View style={styles.certCard}>
                <View style={styles.certIcon}>
                  <GraduationCap color={colors.gold} size={18} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.certName, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? 'شهادة الحوكمة المهنية (CGP)' : 'Certified Governance Professional (CGP)'}
                  </Text>
                  <Text style={[styles.certIssuer, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? 'معهد الحوكمة الدولي · 2022' : 'International Governance Institute · 2022'}
                  </Text>
                </View>
              </View>
              <Pressable style={({ pressed }) => [styles.addCertBtn, pressed && styles.pressed]}>
                <Text style={styles.addCertText}>
                  {language === 'ar' ? '+ إضافة شهادة' : '+ Add Certification'}
                </Text>
              </Pressable>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors]);
}

const createStyles = (c: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.bg,
  },
  safe: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
    backgroundColor: c.bgCard,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: c.text,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: theme.radius.full,
    backgroundColor: c.accent,
  },
  saveBtnText: {
    color: c.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: c.accentLight,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  formSection: {
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },
  fieldInput: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    paddingVertical: 0,
  },
  bioInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
    fontSize: 15,
    color: c.text,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: c.textMuted,
    textAlign: 'right',
  },
  skillsSection: {
    gap: 10,
  },
  skillsTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: c.text,
  },
  skillsSub: {
    fontSize: 13,
    color: c.textMuted,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.full,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
  },
  skillPillActive: {
    backgroundColor: c.accent,
    borderColor: c.accent,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },
  skillTextActive: {
    color: c.white,
  },
  certSection: {
    gap: 12,
  },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  certIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.text,
  },
  certIssuer: {
    fontSize: 12,
    color: c.textMuted,
  },
  addCertBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: c.border,
    borderStyle: 'dashed',
  },
  addCertText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.accent,
  },
});
