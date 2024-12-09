import { Picker } from "@react-native-picker/picker";
import { useNavigation } from '@react-navigation/native';
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const languageEndpoints = {
  "en-fr": "https://dnrhqdf7rxq5x9dv.us-east-1.aws.endpoints.huggingface.cloud",  // English to French
  "en-es": "https://sbyu0cluqvifebsa.us-east4.gcp.endpoints.huggingface.cloud",  // English to Spanish
  "fr-en": "https://mtqndaowbnvvo1yo.us-east-1.aws.endpoints.huggingface.cloud",  // French to English
  "es-en": "https://q5vkvbrjwt9stg31.us-east-1.aws.endpoints.huggingface.cloud",  // Spanish to English
  "fr-es": "https://lqzyycky258tic7q.us-east-1.aws.endpoints.huggingface.cloud",  // French to Spanish
  "es-fr": "https://uipytrqr02bnx75g.us-east-1.aws.endpoints.huggingface.cloud",  // Spanish to French
};

async function query(data, endpoint) {
  const response = await fetch(endpoint, {
    headers: {
      "Accept": "application/json",
      "Authorization": "Bearer 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", // Replace with your Hugging Face API token
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  const result = await response.json();
  return result;
}

export default function ImageTranslate() {
  const [targetLang, setTargetLang] = useState("es");
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoadingOCR, setIsLoadingOCR] = useState(false);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Sorry, we need camera permissions to make this work!",
            [{ text: "OK", onPress: () => console.log("Permission denied") }]
          );
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "You need to enable permission to access the image library",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setExtractedText(""); // Clear extracted text when a new image is selected
        setTranslatedText(""); // Clear previous translation
        processImage(imageUri); // Process image instantly
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image: " + error.message);
    }
  };

  const processImage = async (imageUri) => {
    setIsLoadingOCR(true);
    setLoadingMessage("Extracting text...");
    setExtractedText("");
    setTranslatedText("");
  
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      name: "image.jpg",
      type: "image/jpeg",
    });
  
    try {
      const response = await axios.post(
        "https://js-server-tkk5.onrender.com/upload", // Update to your backend's IP and port
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      if (response.status === 200) {
        const { text } = response.data; // Adjust based on the backend response structure
        setExtractedText(text); // Set extracted text
        setTranslatedText(""); // Clear previous translation
      } else {
        Alert.alert("Error", "Failed to extract text. Please try again.");
      }
    } catch (error) {
      const errorMsg = error.response
        ? error.response.data.error
        : error.message;
      Alert.alert("Error", `Failed to process image: ${errorMsg}`);
    } finally {
      setIsLoadingOCR(false);
    }
  };
  

  const translateText = async () => {
    if (!extractedText) {
      Alert.alert("Error", "No text to translate.");
      return;
    }
  
    const data = {
      inputs: extractedText,
    };
  
    const endpoint = languageEndpoints[`en-${targetLang}`] || languageEndpoints[`fr-${targetLang}`] || languageEndpoints[`es-${targetLang}`];
  
    if (endpoint) {
      setIsLoadingTranslation(true);
      setLoadingMessage("Translating text...");
      try {
        const result = await query(data, endpoint);
        
        // Check if the result contains the expected translation text
        if (result && result[0] && result[0].translation_text) {
          setTranslatedText(result[0].translation_text);
        } else {
          Alert.alert("Error", "Translation result is missing the expected translation text.");
        }
      } catch (error) {
        Alert.alert("Error", `Translation failed: ${error.message}`);
      } finally {
        setIsLoadingTranslation(false);
      }
    } else {
      Alert.alert("Error", "Unsupported translation pair.");
    }
  };
  
  const clearData = () => {
    setSelectedImage(null);
    setExtractedText("");
    setTranslatedText("");
    setIsLoadingOCR(false);
    setIsLoadingTranslation(false);
    setLoadingMessage("");
  };

  return (
    <View style={styles.container}>
      {/* Loading Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isLoadingOCR || isLoadingTranslation}
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.modalText}>{loadingMessage}</Text>
          </View>
        </View>
      </Modal>

      <ScrollView>
        <View style={styles.content}>
          <Text style={styles.header}>Image Text Translator</Text>
          <View style={styles.languageSection}>
            <Text style={styles.label}>Target Language:</Text>
            <Picker
              selectedValue={targetLang}
              onValueChange={setTargetLang}
              style={styles.picker}
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Spanish" value="es" />
              <Picker.Item label="French" value="fr" />
            </Picker>
          </View>

          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            <Text style={styles.imagePickerText}>Select Image</Text>
          </TouchableOpacity>
          <View style={styles.imageSection}>
             
            

          {extractedText ? (
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>Extracted Text:</Text>
              <Text style={styles.resultText}>{extractedText}</Text>
            </View>
          ) : null}
                      <View style={styles.buttonContainer}>
                            <Button
                              title="Translate Text"
                              onPress={translateText}
                              disabled={!extractedText}
                              style={styles.translatebtn}
                            />
                            <Button 
                              title="Clear" 
                              onPress={clearData} 
                              color="#d9534f" 
                              style={styles.clearbtn} 
                            />
                          </View>
                        </View>
          {translatedText ? (
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>Translated Text:</Text>
              <Text style={styles.resultText}>{translatedText}</Text>
            </View>
          ) : null}
          {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()} // Navigate back when pressed
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    backgroundColor: 'white',
    paddingVertical: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalText: {
    marginTop: 15,
    fontSize: 18,
    color: '#3498db',
  },
  content: {
    padding: 25,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 30,
  },
  languageSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 15,
    color: "#34495e",
    marginBottom: 10,
    fontWeight: "600",
  },
  picker: {
    backgroundColor: "#f1f4f8",
    borderRadius: 8,
    marginBottom: 15,
  },
  imagePicker: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#3498db",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 30,
  },
  imagePickerText: {
    fontSize: 18,
    color: "#3498db",
  },
  imageSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  imagePreview: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bdc3c7",
  },
  buttonContainer: {
    width: "100%",
    
    marginTop:20,
  },
  translatebtn: {
    marginBottom: 10,
  },
  clearbtn: {
    marginBottom: 10,
  },
  resultSection: {
    marginTop: 20,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#34495e",
  },
  resultText: {
    fontSize: 16,
    color: "#7f8c8d",
    lineHeight: 24,
    fontWeight: "500",
  },
  backButton: {
    padding: 10,
    backgroundColor: "#3498db",
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  backButtonText: {
    color: "white",
    fontSize: 18,
  },
});