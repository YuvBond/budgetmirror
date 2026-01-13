import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, Text } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@/db/client';
import journal from '@/drizzle/meta/_journal.json';

// Inline migrations to avoid Bundler resolution issues with .sql files
const m0000 = `CREATE TABLE \`assets\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`amount\` real NOT NULL,
	\`type\` text NOT NULL,
	\`date\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`expenses\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`amount\` real NOT NULL,
	\`description\` text,
	\`category\` text NOT NULL,
	\`date\` integer NOT NULL,
	\`type\` text NOT NULL,
	\`installment_group_id\` text,
	\`installment_number\` integer,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL,
	FOREIGN KEY (\`installment_group_id\`) REFERENCES \`installment_groups\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`incomes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`amount\` real NOT NULL,
	\`description\` text,
	\`category\` text NOT NULL,
	\`date\` integer NOT NULL,
	\`is_recurring\` integer DEFAULT false,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`installment_groups\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`total_amount\` real NOT NULL,
	\`total_payments\` integer NOT NULL,
	\`start_date\` integer NOT NULL,
	\`created_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`liabilities\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`amount\` real NOT NULL,
	\`type\` text NOT NULL,
	\`date\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);`;

const migrations = {
  journal,
  migrations: {
    m0000
  }
};

// Force RTL for Hebrew
try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch (e) {
  console.error(e);
}

// Adapt Navigation Theme
const { LightTheme: NavLightTheme, DarkTheme: NavDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
  reactNavigationDark: DarkTheme,
});

const PaperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#006d77',
    secondary: '#83c5be',
  },
};

const PaperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#83c5be',
    secondary: '#006d77',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? PaperDarkTheme : PaperLightTheme;
  const navTheme = colorScheme === 'dark' ? NavDarkTheme : NavLightTheme;

  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (error) {
      console.error('Migration error:', error);
    }
  }, [error]);

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Database...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: paperTheme.colors.surface,
            },
            headerTintColor: paperTheme.colors.onSurface,
            headerTitleAlign: 'center',
            headerBackTitle: 'חזור', // Hebrew for "Back"
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}
