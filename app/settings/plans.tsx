import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../src/theme/colors';
import { CustomHeader } from '../../src/components/CustomHeader';
import { InputField } from '../../src/components/InputField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { MembershipPlan } from '../../src/types';
import {
  createMembershipPlan,
  getAllPlans,
  updateMembershipPlan,
} from '../../src/services/membershipService';

export default function PlansManagementScreen() {
  const { t } = useTranslation();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  // Form states
  const [planName, setPlanName] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [price, setPrice] = useState('500');
  const [category, setCategory] = useState<'all' | 'student' | 'staff' | 'external'>('all');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadPlans = async () => {
    try {
      const data = await getAllPlans();
      setPlans(data);
    } catch (e) {
      console.error('Failed to load plans', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openAddModal = () => {
    setEditingPlan(null);
    setPlanName('');
    setDurationDays('30');
    setPrice('500');
    setCategory('all');
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.plan_name);
    setDurationDays(String(plan.duration_days));
    setPrice(String(plan.price));
    setCategory((plan.member_category as any) || 'all');
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      setFormError('Plan name is required');
      return;
    }

    const dur = parseInt(durationDays, 10);
    if (isNaN(dur) || dur <= 0) {
      setFormError('Duration must be at least 1 day');
      return;
    }

    const pr = parseFloat(price);
    if (isNaN(pr) || pr < 0) {
      setFormError('Valid price in ETB is required');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingPlan) {
        await updateMembershipPlan(
          editingPlan.id,
          planName,
          dur,
          pr,
          category,
          editingPlan.is_active
        );
      } else {
        await createMembershipPlan(planName, dur, pr, category);
      }

      setModalVisible(false);
      await loadPlans();
      Alert.alert(t('success', 'Success'), 'Membership plan saved successfully!');
    } catch (e: any) {
      setFormError(e.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const togglePlanActive = async (plan: MembershipPlan) => {
    try {
      const newActive = plan.is_active === 1 ? 0 : 1;
      await updateMembershipPlan(
        plan.id,
        plan.plan_name,
        plan.duration_days,
        plan.price,
        plan.member_category || 'all',
        newActive
      );
      await loadPlans();
    } catch (e: any) {
      Alert.alert(t('error', 'Error'), e.message);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={t('plansTitle', 'Membership Plans')}
        subtitle="Manage durations and ETB pricing"
        showBack={true}
        dark={true}
        rightAction={
          <TouchableOpacity style={styles.addHeaderBtn} onPress={openAddModal}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {plans.map((plan) => {
          const isActive = plan.is_active === 1;

          return (
            <View key={plan.id} style={[styles.planCard, !isActive && styles.planCardInactive]}>
              <View style={styles.planHeader}>
                <View style={styles.planLeft}>
                  <Text style={styles.planTitle}>{plan.plan_name}</Text>
                  <Text style={styles.planSubtitle}>
                    {plan.duration_days} Days • Category: {(plan.member_category || 'ALL').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceNumber}>{plan.price} ETB</Text>
                  <Text style={[styles.activeTag, !isActive && styles.inactiveTag]}>
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>

              <View style={styles.planActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditModal(plan)}
                >
                  <Ionicons name="pencil" size={14} color={colors.textPrimary} />
                  <Text style={styles.editBtnText}>{t('edit', 'Edit')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, !isActive && styles.toggleBtnActivate]}
                  onPress={() => togglePlanActive(plan)}
                >
                  <Ionicons
                    name={isActive ? 'eye-off-outline' : 'eye-outline'}
                    size={14}
                    color={isActive ? colors.statRedIcon : colors.primary}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: isActive ? colors.statRedIcon : colors.primary },
                    ]}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add / Edit Plan Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPlan ? 'Edit Membership Plan' : t('addNewPlan', 'Add New Plan')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {formError ? <Text style={styles.modalError}>{formError}</Text> : null}

            <InputField
              label={t('planName', 'Plan Name')}
              value={planName}
              onChangeText={setPlanName}
              placeholder="e.g. Monthly Student"
              required
            />

            <InputField
              label={t('durationDays', 'Duration (Days)')}
              value={durationDays}
              onChangeText={setDurationDays}
              placeholder="30"
              keyboardType="numeric"
              required
            />

            <InputField
              label={t('priceEtb', 'Price (ETB)')}
              value={price}
              onChangeText={setPrice}
              placeholder="500"
              keyboardType="numeric"
              required
            />

            {/* Target Category */}
            <Text style={styles.categoryPickerLabel}>
              {t('targetCategory', 'Target Member Category')}
            </Text>
            <View style={styles.categoryPickerRow}>
              {(['all', 'student', 'staff', 'external'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catPill,
                    category === cat && styles.catPillActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      category === cat && styles.catPillTextActive,
                    ]}
                  >
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              title={t('savePlan', 'Save Plan')}
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  planCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.8,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planLeft: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  activeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  inactiveTag: {
    color: colors.textMuted,
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  toggleBtnActivate: {
    borderColor: '#A7F3D0',
    backgroundColor: colors.primaryUltralight,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalError: {
    color: colors.statRedIcon,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  catPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  catPillActive: {
    backgroundColor: colors.primaryUltralight,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catPillTextActive: {
    color: colors.primary,
  },
});
