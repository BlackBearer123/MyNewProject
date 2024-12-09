import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { auth } from './firebase'; // Make sure the path to firebase.js is correct

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  const handleRegister = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigation.navigate('Login'); // After registration, navigate to login
      })
      .catch((error) => {
        setError(error.message);
        setVisible(true);
      });
  };

  const hideSnackbar = () => setVisible(false);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Your Account</Text>
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
      <TouchableOpacity onPress={handleRegister} style={styles.buttonContainer}>
        <Button mode="contained" style={styles.button} color="#87CEEB">
          Register
        </Button>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
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
  loginText: {
    marginTop: 16,
    color: '#4682B4',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
