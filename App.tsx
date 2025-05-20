import React, { useState, useEffect } from 'react';
import {
  Button,
  Image,
  StyleSheet,
  View,
  Text,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';

interface ImageAsset {
  uri: string;
  base64?: string;
}

interface FoodItem {
  foodName: string;
  expirationDate: string;
}

export default function App() {
  const [barcodeImage, setBarcodeImage] = useState<ImageAsset | null>(null);
  const [expirationImage, setExpirationImage] = useState<ImageAsset | null>(null);

  const [foodData, setFoodData] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch from your GET /items endpoint
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        'https://7ptv0t7hh3.execute-api.us-east-2.amazonaws.com/items'
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { name: string; expirationDate: string }[] = await res.json();

      // Map API response to our FoodItem shape
      const mapped: FoodItem[] = data.map(i => ({
        foodName: i.name,
        expirationDate: i.expirationDate,
      }));
      setFoodData(mapped);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInventory();
  }, []);

  const pickImage = (setImage: (image: ImageAsset) => void) => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Unknown error');
        } else {
          const asset: Asset | undefined = response.assets?.[0];
          if (asset?.uri && asset.base64) {
            setImage({ uri: asset.uri, base64: asset.base64 });
          } else {
            Alert.alert('Error', 'Failed to get image data.');
          }
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
      // Optionally refresh inventory after a successful scan
      fetchInventory();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit images.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Fridge Inventory</Text>

      <Button title="Pick Barcode Image" onPress={() => pickImage(setBarcodeImage)} />
      {barcodeImage && <Image source={{ uri: barcodeImage.uri }} style={styles.image} />}

      <Button
        title="Pick Expiration Date Image"
        onPress={() => pickImage(setExpirationImage)}
      />
      {expirationImage && <Image source={{ uri: expirationImage.uri }} style={styles.image} />}

      <Button title="Submit Images" onPress={submitImages} />

      <Text style={styles.subheader}>Inventory</Text>
      <Button
        title={loading ? 'Refreshing…' : 'Refresh Inventory'}
        onPress={fetchInventory}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}

      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.headerCell]}>Food Name</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Expiration Date</Text>
      </View>

      {foodData.map((item, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Text style={styles.tableCell}>{item.foodName}</Text>
          <Text style={styles.tableCell}>{item.expirationDate}</Text>
        </View>
      ))}
      {!loading && foodData.length === 0 && (
        <Text style={{ marginTop: 20, color: '#666' }}>No items in inventory</Text>
      )}
    </ScrollView>
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
  subheader: {
    fontSize: 20,
    marginTop: 30,
    marginBottom: 10,
    fontWeight: '600',
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
