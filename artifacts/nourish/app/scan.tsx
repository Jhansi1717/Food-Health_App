import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { ScannedProduct, lookupBarcode } from "@/lib/openFoodFacts";

type Status = "idle" | "loading" | "found" | "notfound" | "error";

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addMeal } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const isWeb = Platform.OS === "web";

  const [status, setStatus] = useState<Status>("idle");
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string>("");
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const processCode = useCallback(async (code: string) => {
    setStatus("loading");
    setError("");
    setProduct(null);
    setScanned(code);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    try {
      const result = await lookupBarcode(code);
      if (result) {
        setProduct(result);
        setStatus("found");
      } else {
        setStatus("notfound");
      }
    } catch {
      setError("Couldn't reach the food database. Check your connection.");
      setStatus("error");
    }
  }, []);

  const onBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (status === "loading") return;
      const now = Date.now();
      if (
        lastScanRef.current &&
        lastScanRef.current.code === data &&
        now - lastScanRef.current.at < 3000
      ) {
        return;
      }
      lastScanRef.current = { code: data, at: now };
      processCode(data);
    },
    [processCode, status],
  );

  const reset = () => {
    setProduct(null);
    setScanned(null);
    setStatus("idle");
    setError("");
    lastScanRef.current = null;
  };

  const logIt = () => {
    if (!product) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    addMeal({
      name: product.brand ? `${product.brand} · ${product.name}` : product.name,
      serving: product.serving,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
      category: product.category,
      health: product.health,
    });
    router.back();
  };

  const submitManual = () => {
    const code = manual.trim();
    if (!/^\d{6,14}$/.test(code)) {
      setError("Enter an 8–14 digit barcode.");
      return;
    }
    processCode(code);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera or web fallback */}
      <View style={styles.cameraWrap}>
        {isWeb ? (
          <View style={[styles.webNotice, { backgroundColor: colors.foreground }]}>
            <Feather name="smartphone" size={28} color="#fff" />
            <Text style={styles.webTitle}>Camera scanning works on mobile</Text>
            <Text style={styles.webBody}>
              Open Nourish on your phone to scan barcodes with the camera. Or enter a barcode below to test.
            </Text>
          </View>
        ) : !permission ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Feather name="camera-off" size={32} color="#fff" />
            <Text style={styles.permTitle}>Camera access needed</Text>
            <Text style={styles.permBody}>
              Nourish uses your camera to read barcodes on packaged foods. We never store images.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={({ pressed }) => [
                styles.permBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.permBtnLabel}>Enable camera</Text>
            </Pressable>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                "ean13",
                "ean8",
                "upc_a",
                "upc_e",
                "code128",
                "code39",
                "qr",
              ],
            }}
            onBarcodeScanned={status === "loading" ? undefined : onBarCodeScanned}
          />
        )}

        {/* Overlay reticle */}
        {!isWeb && permission?.granted ? (
          <View style={styles.reticleWrap} pointerEvents="none">
            <View style={[styles.reticle, { borderColor: "#ffffffcc" }]} />
            <Text style={styles.reticleHint}>Center the barcode in the frame</Text>
          </View>
        ) : null}

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.topBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.topTitle}>Scan barcode</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      {/* Bottom sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {status === "idle" ? (
            <>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                Point and scan
              </Text>
              <Text style={[styles.sheetBody, { color: colors.mutedForeground }]}>
                Hold a packaged food's barcode in the frame above. We'll look it up in the Open Food Facts database.
              </Text>
              <ManualInput
                value={manual}
                onChange={setManual}
                onSubmit={submitManual}
                error={error}
              />
            </>
          ) : null}

          {status === "loading" ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Looking up {scanned}…
                </Text>
                <Text style={[styles.sheetBody, { color: colors.mutedForeground }]}>
                  Checking the Open Food Facts database.
                </Text>
              </View>
            </View>
          ) : null}

          {status === "found" && product ? (
            <View style={{ gap: 14 }}>
              <View style={styles.productCard}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.productImg} />
                ) : (
                  <View
                    style={[
                      styles.productImg,
                      { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
                    ]}
                  >
                    <Feather name="package" size={24} color={colors.primaryDark} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  {product.brand ? (
                    <Text style={[styles.brand, { color: colors.mutedForeground }]}>
                      {product.brand}
                    </Text>
                  ) : null}
                  <Text style={[styles.productName, { color: colors.foreground }]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
                    {product.serving}
                  </Text>
                </View>
              </View>
              <View style={styles.macroRow}>
                <MacroBadge label="kcal" value={product.calories} color={colors.foreground} />
                <MacroBadge label="P" value={`${product.protein}g`} color={colors.protein} />
                <MacroBadge label="C" value={`${product.carbs}g`} color={colors.carbs} />
                <MacroBadge label="F" value={`${product.fat}g`} color={colors.fat} />
              </View>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={reset}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      borderColor: colors.border,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Feather name="refresh-ccw" size={16} color={colors.foreground} />
                  <Text style={[styles.secondaryLabel, { color: colors.foreground }]}>
                    Scan again
                  </Text>
                </Pressable>
                <Pressable
                  onPress={logIt}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.primaryLabel}>Log this</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {status === "notfound" ? (
            <View style={{ gap: 12 }}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIcon,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Feather name="search" size={18} color={colors.foreground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                    Not in the database
                  </Text>
                  <Text style={[styles.sheetBody, { color: colors.mutedForeground }]}>
                    {scanned} isn't catalogued yet. You can add it as a custom meal.
                  </Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={reset}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Feather name="refresh-ccw" size={16} color={colors.foreground} />
                  <Text style={[styles.secondaryLabel, { color: colors.foreground }]}>
                    Try again
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    router.back();
                    setTimeout(() => router.push("/add-meal"), 50);
                  }}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="edit-3" size={16} color="#fff" />
                  <Text style={styles.primaryLabel}>Custom meal</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {status === "error" ? (
            <View style={{ gap: 12 }}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIcon,
                    { backgroundColor: "#fbe6d8" },
                  ]}
                >
                  <Feather name="wifi-off" size={18} color={colors.warn} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                    Lookup failed
                  </Text>
                  <Text style={[styles.sheetBody, { color: colors.mutedForeground }]}>
                    {error || "Try again in a moment."}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={reset}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, alignSelf: "stretch" },
                ]}
              >
                <Feather name="refresh-ccw" size={16} color="#fff" />
                <Text style={styles.primaryLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function MacroBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: colors.card }]}>
      <Text style={[styles.badgeValue, { color }]}>{value}</Text>
      <Text style={[styles.badgeLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function ManualInput({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  error: string;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.manualLabel, { color: colors.mutedForeground }]}>
        Or enter a barcode
      </Text>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.card, borderRadius: colors.radius },
        ]}
      >
        <Feather name="hash" size={16} color={colors.mutedForeground} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="e.g. 3017620422003"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          style={[
            styles.input,
            { color: colors.foreground, fontFamily: "Inter_500Medium" },
          ]}
        />
        <Pressable
          onPress={onSubmit}
          hitSlop={8}
          style={({ pressed }) => [
            styles.goBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="arrow-right" size={16} color="#fff" />
        </Pressable>
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrap: { flex: 1, position: "relative" },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 12,
  },
  permTitle: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginTop: 8,
    textAlign: "center",
  },
  permBody: {
    color: "#ffffffaa",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  permBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  permBtnLabel: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  webNotice: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 10,
  },
  webTitle: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  webBody: {
    color: "#ffffffaa",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  reticleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  reticle: {
    width: 240,
    height: 140,
    borderWidth: 3,
    borderRadius: 20,
  },
  reticleHint: {
    color: "#ffffffcc",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00000055",
  },
  topTitle: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  sheet: {
    maxHeight: "55%",
  },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  sheetBody: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18, marginTop: 4 },
  manualLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  goBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { fontFamily: "Inter_500Medium", fontSize: 12, marginLeft: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  productCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  productImg: { width: 64, height: 64, borderRadius: 14 },
  brand: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  productName: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 2 },
  productMeta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  macroRow: { flexDirection: "row", gap: 8 },
  badge: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    gap: 2,
  },
  badgeValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
  badgeLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  actionRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    flex: 1,
  },
  secondaryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 6,
    flex: 1.2,
  },
  primaryLabel: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
});
