import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Modal, Portal, Text, Button, List, useTheme, Searchbar, Surface } from 'react-native-paper';
import { CategoryGroup } from '@/constants/categories';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (category: string) => void;
  categories?: string[];
  groupedCategories?: CategoryGroup[];
}

const { height } = Dimensions.get('window');

export function CategorySelector({
  visible,
  onDismiss,
  onSelect,
  categories = [],
  groupedCategories,
}: Props) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroup | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedGroup(null);
    }
  }, [visible]);

  const filteredGroups = useMemo(() => {
    if (!groupedCategories?.length) return [];
    return groupedCategories
      .map((group) => ({
        title: group.title,
        data: group.items.filter((item) =>
          item.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((group) => group.data.length > 0);
  }, [groupedCategories, searchQuery]);

  const filteredCategories = useMemo(() => {
    if (groupedCategories?.length) return [];
    return categories.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, groupedCategories, searchQuery]);

  const searchableLeaves = useMemo(() => {
    if (!groupedCategories?.length) return [];
    return groupedCategories.flatMap((group) =>
      group.items.map((item) => ({ groupTitle: group.title, item }))
    );
  }, [groupedCategories]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchableLeaves.filter(({ item }) =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, searchableLeaves]);

  const isSearching = searchQuery.trim().length > 0;

  const listData = useMemo(() => {
    if (!groupedCategories?.length) return [];
    if (isSearching) return searchResults.map((r) => ({ mode: 'leaf', ...r }));
    if (selectedGroup)
      return selectedGroup.items.map((item) => ({
        mode: 'leaf',
        groupTitle: selectedGroup.title,
        item,
      }));
    return filteredGroups.map((group) => ({ mode: 'group', groupTitle: group.title, item: group.title }));
  }, [groupedCategories, isSearching, searchResults, selectedGroup, filteredGroups]);

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss} 
        contentContainerStyle={styles.modalContent}
      >
        <Surface
          style={[
            styles.surface,
            {
              backgroundColor: theme.colors.elevation.level3,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
          elevation={4}
        >
          <Text variant="titleMedium" style={styles.title}>בחר קטגוריה</Text>
          
          <Searchbar
            placeholder="חיפוש..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: theme.colors.elevation.level2 }]}
          />
          
          <View style={[styles.listWrapper, { borderColor: theme.colors.outlineVariant }]}>
            {groupedCategories?.length ? (
              <FlatList
                data={listData}
                keyExtractor={(entry, index) => `${entry.groupTitle}-${entry.item}-${index}`}
                renderItem={({ item }) => (
                  <View>
                    {item.mode === 'group' ? (
                      <List.Item
                        title={item.item}
                        onPress={() => {
                          const group = groupedCategories?.find((g) => g.title === item.item) || null;
                          setSelectedGroup(group);
                        }}
                        right={(props) => <List.Icon {...props} icon="chevron-left" />}
                        style={[styles.listItem, { borderBottomColor: theme.colors.outlineVariant }]}
                      />
                    ) : (
                      <List.Item
                        title={item.item}
                        description={isSearching ? item.groupTitle : undefined}
                        onPress={() => {
                          onSelect(item.item);
                          onDismiss();
                        }}
                        right={(props) => <List.Icon {...props} icon="chevron-left" />}
                        style={[styles.listItem, { borderBottomColor: theme.colors.outlineVariant }]}
                      />
                    )}
                  </View>
                )}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1 }}
              />
            ) : (
              <FlatList
                data={filteredCategories}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <List.Item
                    title={item}
                    onPress={() => {
                      onSelect(item);
                      onDismiss();
                    }}
                    right={(props) => <List.Icon {...props} icon="chevron-left" />}
                    style={[styles.listItem, { borderBottomColor: theme.colors.outlineVariant }]}
                  />
                )}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1 }}
              />
            )}
          </View>

          {selectedGroup && !isSearching ? (
            <Button
              mode="outlined"
              onPress={() => setSelectedGroup(null)}
              style={styles.closeButton}
            >
              חזרה
            </Button>
          ) : (
            <Button mode="outlined" onPress={onDismiss} style={styles.closeButton}>
              ביטול
            </Button>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
  },
  surface: {
    padding: 20,
    borderRadius: 12,
    height: height * 0.7, // Fixed height: 70% of screen
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  searchbar: {
    marginBottom: 10,
  },
  listWrapper: {
    flex: 1, // Take all available space between searchbar and button
    marginVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  listItem: {
    paddingVertical: 8, // More touch area
    borderBottomWidth: 0.5,
  },
  closeButton: {
    marginTop: 'auto', // Push to bottom if needed, but flex:1 on listWrapper should handle it
  },
});
