import { useNavigation } from '@react-navigation/native';
import { signOut } from "firebase/auth";
import { onValue, push, ref } from "firebase/database";
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, database } from "./firebase";

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

const ChatbotScreen = () => {
    const navigation = useNavigation();
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [savedConversations, setSavedConversations] = useState([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [introSent, setIntroSent] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showIntro, setShowIntro] = useState(true);
    

    useEffect(() => {
        const fetchChatHistory = async () => {
          try {
            const user = auth.currentUser;
            if (user) {
              const userId = user.uid;
              const chatRef = ref(database, `chatHistory/${userId}`);
      
              // Listen for changes in the chat history
              onValue(chatRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                  const conversations = Object.keys(data).map((key) => ({
                    id: key,
                    messages: data[key]
                  }));
                  setSavedConversations(conversations);
                } else {
                  setSavedConversations([]);
                }
              });
            }
          } catch (error) {
            console.error("Error fetching chat history:", error.message);
          }
        };
      
        fetchChatHistory();
      }, [auth.currentUser]); // Run when auth.currentUser changes

  useEffect(() => {
    if (conversationHistory.length > 0 && !introSent) {
      setIntroSent(true);
    }
  }, [conversationHistory]);

  const saveChatHistory = async (messages) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const userId = user.uid;
        const chatRef = ref(database, `chatHistory/${userId}`);

        // Push new messages to the user's chat history
        await push(chatRef, messages);
        console.log("Chat history saved successfully");
    } catch (error) {
        console.error("Error saving chat history:", error.message);
    }
};

const handleUserInput = async () => {
    if (!inputText.trim()) return;
  
    if (showIntro) setShowIntro(false); // Hide intro on first message
  
    const newUserMessage = { sender: 'user', text: inputText };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);
  
    let botResponse = 'I am processing your request...';
  
    const match = inputText.toLowerCase().match(/translate\s*['"]([^'"]+)['"] to (\w+)/);
  
    if (match) {
      const wordToTranslate = match[1];
      const targetLanguage = match[2].toLowerCase();
      let endpoint = null;
  
      const languagePairs = {
        'en-fr': ['english', 'french', 'en', 'fr'],
        'en-es': ['english', 'spanish', 'en', 'es'],
        'fr-en': ['french', 'english', 'fr', 'en'],
        'es-en': ['spanish', 'english', 'es', 'en'],
        'fr-es': ['french', 'spanish', 'fr', 'es'],
        'es-fr': ['spanish', 'french', 'es', 'fr']
      };
  
      for (const [pair, validLanguages] of Object.entries(languagePairs)) {
        if (validLanguages.includes(targetLanguage)) {
          endpoint = languageEndpoints[pair];
          break;
        }
      }
  
      if (endpoint) {
        try {
          const data = { inputs: wordToTranslate };
          const result = await query(data, endpoint);
  
          botResponse = result.translation || 
                        result[0]?.translation_text || 
                        'Translation failed';
        } catch (error) {
          botResponse = `Translation error: ${error.message}}`;
        }
      } else {
        botResponse = 'Unsupported language. Try English, French, or Spanish.';
      }
    } else {
      botResponse = 'Please ask like: "Translate \'apple\' to French"';
    }
  
    const newBotMessage = { sender: 'bot', text: botResponse };
    setMessages((prevMessages) => [...prevMessages, newBotMessage]);
    setIsLoading(false);
    setInputText('');
  
    // Update conversation history state
    const updatedHistory = [...conversationHistory, newUserMessage, newBotMessage];
    setConversationHistory(updatedHistory);
  };
  


  const startNewConversation = async () => {
    // Save the current conversation before resetting
    if (conversationHistory.length > 0) {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const chatRef = ref(database, `chatHistory/${userId}`);
        
        // Push new conversation to the user's chat history
        try {
          await push(chatRef, conversationHistory);
          console.log("Chat history saved successfully");
        } catch (error) {
          console.error("Error saving chat history:", error.message);
        }
      } else {
        console.error("User not authenticated");
      }
    }
  
    // Reset state for a new conversation
    setMessages([]);
    setConversationHistory([]);
    setSelectedConversation(null); // Deselect any selected conversation
    setShowIntro(true); // Show intro
    setIsSidebarVisible(false); // Close the sidebar if it's open
  };
  
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // No need to clear saved conversations, so remove the following line if present:
      // setSavedConversations([]); 
      navigation.navigate('Login'); // Navigate to the Login screen
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  };
  
  
  const handleSelectConversation = (savedConvo) => {
    setSelectedConversation(savedConvo);
    setIsSidebarVisible(false); // Close the sidebar
  };
  

  const renderSavedConversation = (savedConvo) => {
    const firstMessage = savedConvo.messages[0]?.text || 'Empty conversation';
    const lastMessage = savedConvo.messages[savedConvo.messages.length - 1]?.text || '';
  
    return (
      <TouchableOpacity
        key={savedConvo.id}
        style={styles.savedConversationContainer}
        onPress={() => {
          setSelectedConversation(savedConvo); // Set the selected conversation
          setIsSidebarVisible(false); // Close the sidebar
          setShowIntro(false); // Remove intro
        }}
      >
        <Text style={styles.savedConversationHeader}>
          {new Date(savedConvo.id).toLocaleString()}
        </Text>
        <Text style={styles.savedConversationPreview} numberOfLines={2}>
          {lastMessage}
        </Text>
        {firstMessage && (
          <Text style={styles.savedConversationFirstMessage} numberOfLines={1}>
            ...{firstMessage}
          </Text>
        )}
      </TouchableOpacity>
    );
  };
  

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      {isSidebarVisible && (
        <View style={styles.sidebar}>
          <TouchableOpacity
            onPress={() => setIsSidebarVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
          
          {/* Start New Conversation Button */}
          <TouchableOpacity
            onPress={startNewConversation}
            style={styles.startConversationButton}
          >
            <Text style={styles.startConversationText}>Start New Conversation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ImageTranslate')}
            style={styles.imageToTextButton}
      >
          <Text style={styles.imageToTextText}>ImageToText</Text>
          </TouchableOpacity>

          <Text style={styles.sidebarTitle}>Chat History</Text>
          <View style={styles.divider} />
          
          <ScrollView>
            {savedConversations.length === 0 ? (
              <Text style={styles.noHistoryText}>No saved conversations.</Text>
            ) : (
                savedConversations
                .slice() // Create a shallow copy of the array to avoid mutating the state
                .sort((a, b) => b.id - a.id) // Sort by descending order of IDs (timestamps)
                .map(renderSavedConversation)
            )}
          </ScrollView>
           {/* Logout Button at the bottom */}
    <TouchableOpacity
      onPress={handleLogout}
      style={styles.logoutButton}
    >
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
        </View>
      )}

      {/* Main Chat Content */}
      <View style={[
        styles.mainContent, 
        isSidebarVisible && styles.shiftedMainContent
      ]}>
        <TouchableOpacity
          onPress={() => setIsSidebarVisible(true)}
          style={styles.openButton}
        >
          {!isSidebarVisible && <Text style={styles.openButtonText}>☰</Text>}
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.chatContainer} keyboardShouldPersistTaps="handled">
  {selectedConversation ? (
    <>
      <Text style={styles.selectedConversationHeader}>
      </Text>
      {selectedConversation.messages.map((message, index) => (
        <View
          key={index}
          style={[
            styles.message,
            message.sender === 'user' ? styles.userMessage : styles.botMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.sender === 'user' && styles.userMessageText,
            ]}
          >
            {message.text}
          </Text>
        </View>
      ))}
    </>
  ) : showIntro ? (
    <View style={styles.introContainer}>
      <Text style={styles.welcomeMessage}>Welcome to the Translation Chatbot!</Text>
      <Text style={styles.instructionText}>To use this app, type a message in the format:</Text>
      <Text style={styles.exampleText}>"Translate 'apple' to French"</Text>
      <Text style={styles.languageInfo}>
        Supported languages: English (en), French (fr), Spanish (es)
      </Text>
      <Text style={styles.instructionText}>
        Start typing and hit "Send" to receive a translation.
      </Text>
    </View>
  ) : (
    messages.map((message, index) => (
      <View
        key={index}
        style={[
          styles.message,
          message.sender === 'user' ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.sender === 'user' && styles.userMessageText,
          ]}
        >
          {message.text}
        </Text>
      </View>
    ))
  )}
</ScrollView>



        {/* Input Container */}
        {!selectedConversation && (
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder="Type a message..."
      value={inputText}
      onChangeText={setInputText}
    />
    <TouchableOpacity onPress={handleUserInput} style={styles.sendButton}>
      <Text style={styles.sendButtonText}>Send</Text>
    </TouchableOpacity>
  </View>
)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0,
        justifyContent: 'flex-end',
        backgroundColor: '#fff',
    },
    sidebar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: "75%",
      backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent sidebar
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      padding: 20,
      zIndex: 2, // Ensure it is above other elements
    },
    
    closeButton: {
      alignSelf: "flex-end",
      padding: 10,
    },
    closeButtonText: {
      fontSize: 16,
      color: "#6c757d",
    },
    startConversationButton: {
      backgroundColor: "#007bff",
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 5,
      marginBottom: 20,
      alignItems: "center",
    },
    imageToTextButton: {
      backgroundColor: "#007bff",
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 5,
      marginBottom: 20,
      alignItems: "center",
    },
    imageToTextButtonText:{
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    startConversationText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    sidebarTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#343a40",
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: "#dee2e6",
      marginVertical: 10,
    },
    noHistoryText: {
      color: "#6c757d",
      fontStyle: "italic",
    },
    savedConversationContainer: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#e9ecef",
    },
    savedConversationHeader: {
      fontSize: 14,
      color: "#495057",
      marginBottom: 5,
    },
    savedConversationPreview: {
      fontSize: 16,
      color: "#212529",
    },
    savedConversationLastMessage: {
      fontSize: 14,
      color: "#868e96",
    },
    mainContent: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f8f9fa",
      zIndex: 1, // Positioned below the sidebar
    },
    shiftedMainContent: {
      marginLeft: "75%",
    },
    openButton: {
      position: "absolute",
      top: 50,
      left: 20,
      zIndex: 3, // Ensure it's above both the sidebar and main content
    },
    openButtonText: {
      fontSize: 24,
      color: "#007bff",
    },
    chatContainer: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    introContainer: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      padding: 20,
    },
    welcomeMessage: {
      fontSize: 24,
      fontWeight: "700",
      color: "#343a40",
      marginBottom: 10,
    },
    instructionText: {
      fontSize: 16,
      color: "#495057",
      marginVertical: 5,
      textAlign: "center",
    },
    exampleText: {
      fontSize: 16,
      fontStyle: "italic",
      color: "#007bff",
      marginVertical: 10,
    },
    languageInfo: {
      fontSize: 14,
      color: "#6c757d",
      marginVertical: 5,
    },
    message: {
      marginVertical: 5,
      padding: 10,
      borderRadius: 8,
      marginTop: 10,
    },
    userMessage: {
      alignSelf: "flex-end",
      backgroundColor: "#007bff",
      marginTop: 50,
    },
    userMessageText: {
      color: "#ffffff",
    },
    botMessage: {
      alignSelf: "flex-start",
      backgroundColor: "#e9ecef",
    },
    messageText: {
      fontSize: 16,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: "#dee2e6",
      backgroundColor: "#ffffff",
    },
    input: {
      flex: 1,
      height: 40,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: "#ced4da",
      borderRadius: 20,
      backgroundColor: "#ffffff",
      marginRight: 10,
    },
    sendButton: {
      backgroundColor: "#007bff",
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    sendButtonText: {
      color: "#ffffff",
      fontSize: 16,
    },
    selectedConversationHeader: {
      fontSize: 16,
      fontWeight: "600",
      color: "#495057",
      marginBottom: 10,
      marginTop: 70,
    },
    logoutButton: {
        backgroundColor: "#dc3545", // Bootstrap-like danger color
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginTop: 10,
        alignItems: "center",
      },
      logoutButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
      },
  });

export default ChatbotScreen;