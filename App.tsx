import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  Keyboard, Dimensions, Animated, ActivityIndicator
} from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const genAI = new GoogleGenerativeAI("KEY_HERE_FROM_GCP_AI");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Ionicons name={icon as any} size={24} color="#fff" />
    <Text style={styles.actionButtonText}>{label}</Text>
  </TouchableOpacity>
);

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const generatedAIResponse = async (userMessage: string) => {
    setLoading(true);
    try {
      // Fixed: used backticks for template literal
      const prompt = `Respond in single English with a witty and slightly sarcastic tone for message: ${userMessage}`;
      const result = await model.generateContent(prompt);
      const response = result.response;
      console.log(response)
      return response.text() // Fixed: response.text() is a function
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "Oops! Something went wrong."
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (input.trim() === "") return;
    const userMessage = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    const aiResponse = await generatedAIResponse(input);
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      text: aiResponse,
      isUser: false,
    };
    setMessages((prev) => [...prev, aiMessage]);
    setLoading(false);
  };

  const renderResponseText = (text: string) => {
    const parts = []
    const regex = /\{\{\s*([\s\S]*?)\s*\}\}/g;
    let match;
    let lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) parts.push(<Text key={lastIndex}>{before}</Text>);
      const boldText = match[1];
      parts.push(
        <Text key={match.index} style={styles.boldText}>
          {boldText}
        </Text>
      );
      lastIndex = regex.lastIndex; // Fixed: removed const to update outer variable
    }
    const after = text.slice(lastIndex);
    if (after) parts.push(<Text key={lastIndex}>{after}</Text>);
    return parts;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userMessageBubble : styles.aiMessageBubble
      ]}>
        {item.isUser ? (
          <Text style={styles.messageText}>{item.text}</Text>
        ) : (
          <Text style={styles.aiText}>
            {renderResponseText(item.text)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Enhanced Top Bar  */}
      <Animated.View style={[
        styles.topBar,
        { opacity: fadeAnim }
      ]}>
        <View style={styles.topBarContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chatbubbles" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.topBarTitle}>Chat</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#e5e5ea" />
          </TouchableOpacity>
        </View>
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.mainContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        {/* Fixed: keyboardVerticalOffset logic might need tuning but simplified here */}

        {messages.length === 0 ? ( // Fixed: Logic inverted (0 messages = show welcome)
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.greetingText}>Welcome to Chat!</Text>
              <Text style={styles.greetingSubText}>How can I help you today?</Text>
            </View>
            <View style={styles.actionsContainer}>
              <View style={styles.actionRow}>
                <ActionButton icon="document-text-outline" label="Research" onPress={() => {
                  setMessages([...messages, {
                    id: Date.now().toString(),
                    text: "Let's do some research!",
                    isUser: true,
                  }])
                }}
                />
                <ActionButton icon="bulb-outline" label="Brainstorm" onPress={() => {
                  setMessages([...messages, {
                    id: Date.now().toString(),
                    text: "Let's brainstorm ideas!",
                    isUser: true,
                  }])
                }}
                />
              </View>
              <View style={styles.actionRow}>
                <ActionButton icon="analytics-outline" label="Analyze Data" onPress={() => {
                  setMessages([...messages, {
                    id: Date.now().toString(),
                    text: "Let's analyze some data!",
                    isUser: true,
                  }])
                }}
                />
                <ActionButton icon="image-outline" label="Create Image" onPress={() => {
                  setMessages([...messages, {
                    id: Date.now().toString(),
                    text: "Let's create an image!",
                    isUser: true,
                  }])
                }}
                />
              </View>
              <View style={styles.actionRow}>
                <ActionButton icon="code-slash-outline" label="Code" onPress={() => {
                  setMessages([...messages, {
                    id: Date.now().toString(),
                    text: "Let's write some code!",
                    isUser: true,
                  }])
                }}
                />
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            ref={scrollViewRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatContainer}
            contentContainerStyle={[styles.chatContentContainer, styles.messagesContainer]}
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#0A84FF" />
                </View>
              ) : null
            }
          />
        )}
        {/* Input Area*/}
        <View style={styles.inputAreaContainer}>
          <View style={styles.inputArea}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={24} color="#8E8E93" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message AI Assistant..."
              value={input}
              onChangeText={setInput}
              multiline={true}
              maxLength={100} // This is quite short? keeping it as user had it
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={[
              styles.sendButton,
              (!input.trim() || loading) && styles.sendButtonDisabled
            ]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="send" size={24} color={input.trim() ? '#0A84FF' : '#666'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
  mainContainer: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  greetingSubText: {
    fontSize: 16,
    color: '#666',
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF', // Button BG
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
  },
  chatContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  messagesContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  inputAreaContainer: {
    backgroundColor: '#fff',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10, // Safe area
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f5', // input bubble bg
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachButton: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    elevation: 1,
  },
  userMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  aiText: {
    fontSize: 16,
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000',
  },
});
