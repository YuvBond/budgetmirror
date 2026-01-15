import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Modal, Portal, Text, Button, List, useTheme, Searchbar, Surface } from 'react-native-paper';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (category: string) => void;
  categories: string[];
}

const { height } = Dimensions.get('window');

export function CategorySelector({ visible, onDismiss, onSelect, categories }: Props) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  right={props => <List.Icon {...props} icon="chevron-left" />}
                  style={[styles.listItem, { borderBottomColor: theme.colors.outlineVariant }]}
                />
              )}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          </View>

          <Button mode="outlined" onPress={onDismiss} style={styles.closeButton}>
            ביטול
          </Button>
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
