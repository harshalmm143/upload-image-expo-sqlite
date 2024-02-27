import React, { useState, useEffect } from 'react';
import { Text, View, Button, Image, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as SQLite from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';



const db = SQLite.openDatabase('mydatabase.db');

export default function App() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, uri TEXT);'
      );
    });

    fetchImagesFromDatabase();
  }, []);

  const fetchImagesFromDatabase = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM images', [], (_, { rows }) => {
        const data = rows._array;
        setImages(data);
      });
    });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      saveImage(result.assets[0].uri);
    }
  };

  const saveImage = uri => {
    db.transaction(
      tx => {
        tx.executeSql('INSERT INTO images (uri) VALUES (?)', [uri], (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            console.log('Image URI:', uri);
            Alert.alert('Success', 'Image uploaded successfully');
            fetchImagesFromDatabase(); // Fetch images again after upload
          }
        });
      },
      null,
      () => console.log('Image saved successfully')
    );
  };

  const deleteImage = id => {
    db.transaction(
      tx => {
        tx.executeSql('DELETE FROM images WHERE id = ?', [id], (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            console.log('Image deleted successfully');
            Alert.alert('Success', 'Image deleted successfully');
            fetchImagesFromDatabase(); // Fetch images again after delete
          }
        });
      },
      null,
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteImage(item.id)}>
        <MaterialIcons name="cancel" color="white" size={24} style={styles.deleteButtonText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.storeView}>
        <Text style={styles.storeText}>Stored Images ({images.length})</Text>
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={() => (
            <>
              <Feather name="image" size={24} color="black" />
              <Text>No images found</Text>
            </>
          )}

        />
      </View>
      <View style={styles.uploadView}>
        <TouchableOpacity onPress={pickImage} style={styles.button} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Pick an image from camera roll</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="dark" backgroundColor='#fab340' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight,
    // paddingHorizontal: 15,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 250,
    height: 250,
    margin: 4,
    borderRadius: 8
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  uploadView: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  storeView: {
    flex: 0.4,
    paddingLeft: 15,
    marginVertical: 10
  },
  storeText: {
    fontSize: 17,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#fab340',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Constants.systemFonts.Roboto
  }
});
