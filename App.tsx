import React, { useState, useEffect } from 'react';
import {
  View,
  Button,
  Image,
  Alert,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

interface ImageAsset {
  uri: string;
  base64?: string;
}

interface FoodItem {
  foodName: string;
  expirationDate: string;
}

function UploadScreen({ refreshInventory }: { refreshInventory: () => void }) {
  const [barcodeImage, setBarcodeImage] = useState<ImageAsset | null>(null);
  const [expirationImage, setExpirationImage] = useState<ImageAsset | null>(null);

  const pickImage = (setImage: (image: ImageAsset) => void) => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true },
      (response: ImagePickerResponse) => {
        const asset = response.assets?.[0];
        if (response.didCancel) return;
        if (response.errorCode || !asset?.uri || !asset?.base64) {
          Alert.alert('Error', response.errorMessage || 'Failed to load image');
        } else {
          setImage({ uri: asset.uri, base64: asset.base64 });
        }
      }
    );
  };

  const submitImages = async () => {
    if (!barcodeImage || !expirationImage) {
      Alert.alert('Missing Images', 'Please select both images before submitting.');
      return;
    }

    const payload = {
      barcodeImage: barcodeImage.base64,
      expirationImage: expirationImage.base64,
    };

    try {
      const response = await fetch(
        'https://s51cpqd426.execute-api.us-east-2.amazonaws.com/FridgeControllerFunction',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      await response.json();
      Alert.alert('Success', 'Images submitted successfully!');
      refreshInventory(); // Reload inventory after upload
    } catch {
      Alert.alert('Error', 'Failed to submit images.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Upload Food Data</Text>

      <Button title="Pick Barcode Image" onPress={() => pickImage(setBarcodeImage)} />
      {barcodeImage && <Image source={{ uri: barcodeImage.uri }} style={styles.image} />}

      <Button title="Pick Expiration Date Image" onPress={() => pickImage(setExpirationImage)} />
      {expirationImage && <Image source={{ uri: expirationImage.uri }} style={styles.image} />}

      <Button title="Submit Images" onPress={submitImages} />
    </ScrollView>
  );
}

function InventoryScreen({
  inventory,
  loading,
  refreshInventory,
}: {
  inventory: FoodItem[];
  loading: boolean;
  refreshInventory: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Inventory</Text>
      <Button
        title={loading ? 'Refreshing…' : 'Refresh Inventory'}
        onPress={refreshInventory}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.headerCell]}>Food Name</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Expiration Date</Text>
      </View>

      {inventory.map((item, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Text style={styles.tableCell}>{item.foodName}</Text>
          <Text style={styles.tableCell}>{item.expirationDate}</Text>
        </View>
      ))}

      {!loading && inventory.length === 0 && (
        <Text style={{ marginTop: 20, color: '#666' }}>No items in inventory</Text>
      )}
    </ScrollView>
  );
}

function RecipesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recipe Recommendations</Text>
      <Text style={{ marginTop: 20, color: '#666' }}>Coming soon!</Text>
    </View>
  );
}

export default function App() {
  const [inventory, setInventory] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://7ptv0t7hh3.execute-api.us-east-2.amazonaws.com/items');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { name: string; expirationDate: string }[] = await res.json();
      const mapped: FoodItem[] = data.map(i => ({
        foodName: i.name,
        expirationDate: i.expirationDate,
      }));
      setInventory(mapped);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName = 'help-circle-outline';
            if (route.name === 'Upload') iconName = 'cloud-upload';
            else if (route.name === 'Inventory') iconName = 'fridge-outline';
            else if (route.name === 'Recipes') iconName = 'chef-hat';

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Upload">
          {() => <UploadScreen refreshInventory={fetchInventory} />}
        </Tab.Screen>
        <Tab.Screen name="Inventory">
          {() => (
            <InventoryScreen
              inventory={inventory}
              loading={loading}
              refreshInventory={fetchInventory}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Recipes" component={RecipesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 100,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 10,
    resizeMode: 'contain',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 6,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
  },
});
