import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import {
  useCustomActivitiesStore,
  CustomActivity,
} from '../../src/stores/customActivities';

const CATEGORIES = [
  'Romance',
  'Adventure',
  'Sensual',
  'Fantasy',
  'Playful',
  'Kink',
  'Public',
  'Other',
];

const INTENSITY_LABELS = ['Beginner', 'Easy', 'Moderate', 'Advanced', 'Expert'];

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onShare,
}: {
  activity: CustomActivity;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityCategory}>{activity.category}</Text>
        </View>
        {activity.isShared && (
          <View style={styles.sharedBadge}>
            <Text style={styles.sharedText}>🔗 Shared</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.activityDescription} numberOfLines={2}>
        {activity.description}
      </Text>
      
      <View style={styles.activityMeta}>
        <Text style={styles.intensityText}>
          Intensity: {INTENSITY_LABELS[activity.intensityScale - 1]}
        </Text>
        {activity.estimatedTime && (
          <Text style={styles.timeText}>⏱️ {activity.estimatedTime}</Text>
        )}
      </View>
      
      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={onEdit}>
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onShare}>
          <Text style={styles.actionText}>
            {activity.isShared ? 'Copy Code' : 'Share'}
          </Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </Pressable>
      </View>
      
      {activity.isShared && activity.shareCode && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Share Code:</Text>
          <Text style={styles.codeValue}>{activity.shareCode}</Text>
        </View>
      )}
    </View>
  );
}

export default function CustomActivitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activities, create, update, delete: deleteActivity, share } = useCustomActivitiesStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [intensity, setIntensity] = useState(3);
  const [estimatedTime, setEstimatedTime] = useState('');
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setIntensity(3);
    setEstimatedTime('');
    setEditingId(null);
  };
  
  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Info', 'Please fill in title and description');
      return;
    }
    
    if (editingId) {
      update(editingId, {
        title: title.trim(),
        description: description.trim(),
        category,
        intensityScale: intensity,
        estimatedTime: estimatedTime.trim() || undefined,
      });
    } else {
      create({
        title: title.trim(),
        description: description.trim(),
        category,
        intensityScale: intensity,
        estimatedTime: estimatedTime.trim() || undefined,
        tags: [],
        createdBy: 'user',
        isShared: false,
      });
    }
    
    resetForm();
    setShowForm(false);
  };
  
  const handleEdit = (activity: CustomActivity) => {
    setTitle(activity.title);
    setDescription(activity.description);
    setCategory(activity.category);
    setIntensity(activity.intensityScale);
    setEstimatedTime(activity.estimatedTime || '');
    setEditingId(activity.id);
    setShowForm(true);
  };
  
  const handleDelete = (id: string) => {
    Alert.alert('Delete Activity', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteActivity(id) },
    ]);
  };
  
  const handleShare = (activity: CustomActivity) => {
    if (activity.isShared && activity.shareCode) {
      Alert.alert('Share Code', `Code: ${activity.shareCode}\n\nShare this code with your partner to let them import this activity.`);
    } else {
      const code = share(activity.id);
      Alert.alert('Activity Shared!', `Share this code with your partner:\n\n${code}`);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Custom Activities</Text>
        <Text style={styles.subtitle}>Create your own activities</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Create Button */}
        <Pressable 
          style={styles.createButton}
          onPress={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Text style={styles.createButtonText}>+ Create New Activity</Text>
        </Pressable>
        
        {/* Activities List */}
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No Custom Activities</Text>
            <Text style={styles.emptyText}>
              Create your own activities to add to the deck
            </Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={() => handleEdit(activity)}
                onDelete={() => handleDelete(activity.id)}
                onShare={() => handleShare(activity)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Create/Edit Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowForm(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Activity' : 'New Activity'}
            </Text>
            <Pressable onPress={handleSubmit}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
          
          <ScrollView style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Romantic Dinner at Home"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the activity..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextSelected,
                    ]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Intensity: {INTENSITY_LABELS[intensity - 1]}</Text>
              <View style={styles.intensityRow}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      styles.intensityDot,
                      intensity >= level && styles.intensityDotFilled,
                    ]}
                    onPress={() => setIntensity(level)}
                  />
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimated Time (optional)</Text>
              <TextInput
                style={styles.input}
                value={estimatedTime}
                onChangeText={setEstimatedTime}
                placeholder="e.g., 30 minutes, 1 hour"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    margin: SIZES.padding * 1.5,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  createButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.padding * 4,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SIZES.padding,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  activitiesList: {
    padding: SIZES.padding * 1.5,
    gap: SIZES.padding,
  },
  activityCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding,
  },
  activityTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 4,
  },
  activityCategory: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  sharedBadge: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sharedText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.caption,
    color: COLORS.success,
  },
  activityDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  intensityText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  timeText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.cardElevated,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  deleteButton: {
    borderColor: COLORS.danger,
  },
  deleteText: {
    color: COLORS.danger,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SIZES.padding,
    paddingTop: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  codeLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  codeValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },
  saveText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.primary,
  },
  form: {
    padding: SIZES.padding * 1.5,
  },
  formGroup: {
    marginBottom: SIZES.padding * 2,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  intensityDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
  },
  intensityDotFilled: {
    backgroundColor: COLORS.primary,
  },
});
