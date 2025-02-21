import React, { useState } from 'react';
import { Button, Image, StyleSheet, View, Text, Alert } from 'react-native';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';

interface ImageAsset {
  uri: string;
  base64?: string;
}

export default function App() {
  const [barcodeImage, setBarcodeImage] = useState<ImageAsset | null>(null);
  const [expirationImage, setExpirationImage] = useState<ImageAsset | null>(null);

  const pickImage = (setImage: (image: ImageAsset) => void) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Unknown error');
        } else {
          const asset: Asset | undefined = response.assets && response.assets[0];
          if (asset && asset.uri && asset.base64) {
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
      const response = await fetch('API endpoint placeholder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      Alert.alert('Success', 'Images submitted successfully!');
      console.log(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit images.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Fridge Inventory</Text>

      <Button title="Pick Barcode Image" onPress={() => pickImage(setBarcodeImage)} />
      {barcodeImage && <Image source={{ uri: barcodeImage.uri }} style={styles.image} />}

      <Button title="Pick Expiration Date Image" onPress={() => pickImage(setExpirationImage)} />
      {expirationImage && <Image source={{ uri: expirationImage.uri }} style={styles.image} />}

      <Button title="Submit Images" onPress={submitImages} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: '#fff',
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
});
