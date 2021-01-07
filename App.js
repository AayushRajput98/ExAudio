import { StatusBar } from 'expo-status-bar';
import React, {useState} from 'react';
import {Audio} from "expo-av";
import * as Permissions from "expo-permissions";
import * as FileSystem from "expo-file-system";
import { StyleSheet, Text, View, TouchableOpacity, ToastAndroid, Dimensions } from 'react-native';

const recordingOptions = {
  android: {
    extension: ".wav",
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".wav",
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export default function App() {

  const [recording, setRecording] = useState();

  const useURI = async () => {
    try {
      const { uri } = await FileSystem.getInfoAsync(recording.getURI());  
      const formData = new FormData();
        formData.append(
          "upl",
          {
            uri: uri,
            name: Platform.OS === "ios" ? `${Date.now()}.wav` : `${Date.now()}.m4a`,
            type: Platform.OS === "ios" ? "audio/x-wav" : "audio/m4a",
          },
          `${Date.now()}.wav`
        );
        fetch("https://xxxx:port", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.text())
          .then((data) => {
            data = data.trim();
            console.log('Trancription from deepSpeech API:', data);
            ToastAndroid.show(data.trim(), ToastAndroid.SHORT);
          })
          .catch((error) => {
            console.log("Error: ", error);
            })
      }
      catch (error) {
        console.log("Error getTranscription: ", error);
    }   
  }

  const startRecording = async () => {
    const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    if (status !== "granted") return;
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: true,
    });
    try {
      console.log("Recording Started ...")
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();
      setRecording(recording)
    } 
    catch (error) {
      console.log("Error in startRecording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      console.log("Recording Stopped ...")
      await recording.stopAndUnloadAsync();
      setRecording(undefined);
    } 
    catch (error) {
      if (error.code === "E_AUDIO_NODATA") {
        console.log(
          `Stop was called too quickly, no data has yet been received (${error.message})`
        );
      } else {
        console.log("STOP ERROR: ", error.code, error.name, error.message);
      }
    }
  };
  return (
    <View style={styles.container}>
      <Text style={{fontSize: 20, textAlign: 'center', marginBottom: 40}}> Sample Recording Application </Text>
      <View style={{width: 250, flexDirection: 'row', justifyContent: 'space-around'}}>
        <TouchableOpacity style={styles.button} onPress={() => {startRecording()}}>
          <Text style={{color: 'white'}}> Record </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => {
          stopRecording()
          useURI()
          }}>
          <Text style={{color: 'white'}}> Stop </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 100,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'blue',
    borderRadius: 10,
  }
});
