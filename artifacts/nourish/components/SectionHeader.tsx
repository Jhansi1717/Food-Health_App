import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  caption?: string;
  right?: React.ReactNode;
};

export function SectionHeader({ title, caption, right }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {caption ? (
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>{caption}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.4 },
  caption: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 2 },
});
