import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { auth } from './firebase'; // Ensure the path to firebase.js is correct

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigation.navigate('Chatbot');
      })
      .catch((error) => {
        setError(error.message);
        setVisible(true);
      });
  };

  const hideSnackbar = () => setVisible(false);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/chatbot-logo.png')} // Replace with your chatbot logo path
        style={styles.logo}
      />
      <Text style={styles.header}>Welcome to ChatBot</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin} style={styles.buttonContainer}>
        <Button mode="contained" style={styles.button} color="#E0FFFF">
          Login
        </Button>
      </TouchableOpacity>
      {error ? (
        <Snackbar
          visible={visible}
          onDismiss={hideSnackbar}
          duration={3000}
          style={styles.snackbar}
        >
          {error}
        </Snackbar>
      ) : null}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#4682B4',
  },
  input: {
    width: '100%',
    backgroundColor: '#E0FFFF',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4682B4',
    elevation: 2,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: '#4682B4',
  },
  snackbar: {
    backgroundColor: '#4682B4',
  },
  registerText: {
    marginTop: 16,
    color: '#4682B4',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
