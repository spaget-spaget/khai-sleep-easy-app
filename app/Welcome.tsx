import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  TextInput,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { loginWithEmailAndPassword } from "../service/Welcome";

export default function Welcome() {
  const { colors: C, fonts: F, isDark } = useTheme();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bannerSource = isDark
    ? require("../assets/sleepeasylogo-banner-darkMode.png")
    : require("../assets/sleepeasylogo-banner.png");

  const canSubmit =
    email.trim().length > 0 && password.length > 0 && !isSubmitting;

  /*
  OLD IMPLEMENTATION:
  const saveLogin = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      const result = await loginWithEmailAndPassword({
        email: email.trim(),
        password,
      });

      const patientId = result?.patient?.patient_id;

      if (!patientId) {
        throw new Error("No patient ID returned from server.");
      }

      await AsyncStorage.setItem("patientID", String(patientId));
      if (result?.patient) {
        await AsyncStorage.setItem(
          "patientData",
          JSON.stringify(result.patient)
        );
      }

      router.replace("/(tabs)/history");
    } catch (error) {
      console.error("Error@Welcome.tsx:", error);
      const message =
        error instanceof Error ? error.message : "Login failed. Try again.";
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  /**
   * MODIFICATION: Updated saveLogin to check both patient_id and id properties in result.patient
   * to handle flexible response structures from backend PHP. Old code preserved in comments above.
   */
  const saveLogin = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      const result = await loginWithEmailAndPassword({
        email: email.trim(),
        password,
      });

      const patientId = result?.patient?.patient_id ?? result?.patient?.id;

      if (!patientId) {
        throw new Error("No patient ID returned from server.");
      }

      await AsyncStorage.setItem("patientID", String(patientId));
      if (result?.patient) {
        await AsyncStorage.setItem(
          "patientData",
          JSON.stringify(result.patient)
        );
      }

      router.replace("/(tabs)/history");
    } catch (error) {
      console.error("Error@Welcome.tsx:", error);
      const message =
        error instanceof Error ? error.message : "Login failed. Try again.";
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: C.bg,
      }}>
      <View style={styles.welcomeContainer}>
        <Image
          source={bannerSource}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={[{ color: C.text, ...F.title, marginBottom: 3 }]}>
          Welcome to Sleep Easy
        </Text>
        <Text style={[{ color: C.text, ...F.sectionLabel }]}>
          Please log in with your email and password to continue.
        </Text>
        <View
          style={[
            styles.formRow,
            {
              backgroundColor: C.bg,
              borderColor: C.border,
            },
          ]}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={"Email"}
            placeholderTextColor={C.sub}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            underlineColorAndroid={"transparent"}
            style={{ color: C.text, flex: 1 }}
          />
        </View>
        <View
          style={[
            styles.formRow,
            {
              backgroundColor: C.bg,
              borderColor: C.border,
            },
          ]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={"Password"}
            placeholderTextColor={C.sub}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="password"
            underlineColorAndroid={"transparent"}
            style={{ color: C.text, flex: 1 }}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: C.tint,
              marginTop: 8,
              opacity: canSubmit ? 1 : 0.5,
            },
            Platform.select({ android: { elevation: 1.5 } }),
          ]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={saveLogin}>
          <Text style={[{ ...F.buttonText }]}>
            {isSubmitting ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.supportContainer}>
        <Text
          style={[{ color: C.text, ...F.sectionLabel, textAlign: "center" }]}>
          Don't have an account?
        </Text>
        <TouchableOpacity
          style={[styles.buttonSecondary, { borderColor: C.border }]}
          activeOpacity={0.85}
          onPress={() => router.push("/CreateAccount")}>
          <Text style={[{ ...F.buttonText, fontSize: 14, color: C.text }]}>
            Create Account
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            {
              color: C.text,
              ...F.sectionLabel,
              textAlign: "center",
              marginTop: 16,
            },
          ]}>
          Want to know more about us?
        </Text>
        <TouchableOpacity
          style={[styles.buttonSecondary, { borderColor: C.border }]}
          activeOpacity={0.85}
          onPress={() => Linking.openURL("https://sleepeasysingapore.com/")}>
          <Text style={[{ ...F.buttonText, fontSize: 14, color: C.text }]}>
            Visit our website
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 300,
    height: 80,
    marginBottom: 16,
  },
  formRow: {
    minHeight: 56,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  supportContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  buttonSecondary: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  button: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});
