import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useShareCodes } from '../lib/state/shareCodes';
import { useVotes } from '../lib/state/useStore';

interface ShareCodePanelProps {
  profileId: string;
}

export default function ShareCodePanel({ profileId }: ShareCodePanelProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  const { generateCode, decodeCode, saveScannedCode, getCompatibility } = useShareCodes();
  const { getProfileVotes } = useVotes();

  const handleGenerate = () => {
    const votes = getProfileVotes(profileId);
    const code = generateCode(profileId, votes);
    setGeneratedCode(code);
  };

  const handleShare = async () => {
    if (!generatedCode) return;
    
    const displayCode = generatedCode.split(':')[0];
    try {
      await Share.share({
        message: `Take my SpiceSync quiz! Enter this code to see our compatibility: ${displayCode}\n\nOr use the full code: ${generatedCode}`,
        title: 'SpiceSync Compatibility',
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    await Clipboard.setStringAsync(generatedCode);
    Alert.alert('Copied', 'Full code copied to clipboard');
  };

  const handleScan = () => {
    if (!scannedCode.trim()) {
      Alert.alert('Error', 'Please enter a code');
      return;
    }
    
    const match = decodeCode(scannedCode.trim());
    if (!match) {
      Alert.alert('Invalid Code', 'Could not decode this code. Please check and try again.');
      return;
    }
    
    saveScannedCode(match);
    
    const myVotes = getProfileVotes(profileId);
    const compat = getCompatibility(myVotes, match.votes);
    
    Alert.alert(
      'Match Found!',
      `Compatibility: ${compat.percentage}%\n\n` +
      `Mutual Yes: ${compat.mutualYes.length}\n` +
      `Mutual Maybe: ${compat.mutualMaybe.length}\n\n` +
      'Go to Matches tab to see full details!',
      [{ text: 'OK', onPress: () => setShowScanner(false) }]
    );
    
    setScannedCode('');
  };

  const displayCode = generatedCode?.split(':')[0] || '';
  const encodedData = generatedCode?.split(':')[1] || '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share with Partner</Text>
      
      {!showScanner ? (
        <>
          <Text style={styles.description}>
            Generate a code to share with your partner or someone on a dating app. 
            They can enter it to see your compatibility!
          </Text>
          
          {!generatedCode ? (
            <Pressable style={styles.button} onPress={handleGenerate}>
              <Text style={styles.buttonText}>Generate Share Code</Text>
            </Pressable>
          ) : (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Your Code:</Text>
              <Text style={styles.code}>{displayCode}</Text>
              
              {encodedData && (
                <View style={styles.qrContainer}>
                  <QRCode
                    value={generatedCode}
                    size={200}
                    backgroundColor="white"
                    color="black"
                  />
                </View>
              )}
              
              <View style={styles.buttonRow}>
                <Pressable style={[styles.button, styles.secondary]} onPress={handleShare}>
                  <Text style={[styles.buttonText, styles.secondaryText]}>Share</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.secondary]} onPress={handleCopy}>
                  <Text style={[styles.buttonText, styles.secondaryText]}>Copy</Text>
                </Pressable>
              </View>
              
              <Pressable style={[styles.button, styles.tertiary]} onPress={() => setGeneratedCode(null)}>
                <Text style={styles.tertiaryText}>Generate New Code</Text>
              </Pressable>
            </View>
          )}
          
          <Pressable style={[styles.button, styles.scanButton]} onPress={() => setShowScanner(true)}>
            <Text style={styles.buttonText}>Enter Partner's Code</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.scanContainer}>
          <Text style={styles.description}>
            Enter the code your partner shared with you:
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="XXXX-XXXX:encoded-data"
            placeholderTextColor="#666"
            value={scannedCode}
            onChangeText={setScannedCode}
            autoCapitalize="characters"
          />
          
          <Pressable style={styles.button} onPress={handleScan}>
            <Text style={styles.buttonText}>Check Compatibility</Text>
          </Pressable>
          
          <Pressable style={[styles.button, styles.tertiary]} onPress={() => setShowScanner(false)}>
            <Text style={styles.tertiaryText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#e94560',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: '#533483',
    flex: 1,
    marginHorizontal: 4,
  },
  secondaryText: {
    color: '#fff',
  },
  tertiary: {
    backgroundColor: 'transparent',
  },
  tertiaryText: {
    color: '#e94560',
    fontSize: 14,
  },
  scanButton: {
    backgroundColor: '#0f3460',
    marginTop: 8,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e94560',
    letterSpacing: 2,
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  scanContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#533483',
  },
});
