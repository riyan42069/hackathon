import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const PRIMARY = "#13ecda";
const IMAGE_SIZE = width * 0.72;

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f8f8" />

      {/* Background blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobMiddle} />
      <View style={styles.blobBottom} />

      {/* Header / Logo */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIconBox}>
            <MaterialCommunityIcons name="flower" size={24} color={PRIMARY} />
          </View>
          <Text style={styles.logoText}>ezCare</Text>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Circular image with floating badges */}
        <View style={styles.imageWrapper}>
          <View style={styles.imageCircle}>
            <Image
              source={require("../assets/images/splash-icon.png")}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          {/* Badge — top left */}
          <View style={[styles.badge, styles.badgeTopLeft]}>
            <View style={[styles.badgeIcon, { backgroundColor: "#dcfce7" }]}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color="#16a34a"
              />
            </View>
            <Text style={styles.badgeText}>Symptoms Tracked</Text>
          </View>

          {/* Badge — bottom right */}
          <View style={[styles.badge, styles.badgeBottomRight]}>
            <View style={[styles.badgeIcon, { backgroundColor: "#dbeafe" }]}>
              <MaterialCommunityIcons name="headset" size={16} color="#2563eb" />
            </View>
            <Text style={styles.badgeText}>24/7 Support</Text>
          </View>
        </View>

        {/* Typography */}
        <View style={styles.textBlock}>
          <Text style={styles.heading}>
            Welcome to <Text style={styles.headingAccent}>ezCare</Text>
          </Text>
          <Text style={styles.subheading}>
            Navigate your journey with confidence. Connect with your care team
            and find the support you need, every step of the way.
          </Text>
        </View>

        {/* Pagination dots */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push("/(tabs)")}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.loginPrompt}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={() => router.push("/(tabs)")}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f8",
  },

  // Background blobs
  blobTop: {
    position: "absolute",
    top: -80,
    left: -(width * 0.2),
    width: width * 1.4,
    height: 380,
    backgroundColor: "rgba(19,236,218,0.08)",
    borderRadius: 9999,
  },
  blobMiddle: {
    position: "absolute",
    top: 200,
    right: -(width * 0.3),
    width: width,
    height: 300,
    backgroundColor: "rgba(219,234,254,0.5)",
    borderRadius: 9999,
  },
  blobBottom: {
    position: "absolute",
    bottom: -60,
    left: width * 0.1,
    width: width * 0.8,
    height: 200,
    backgroundColor: "rgba(19,236,218,0.05)",
    borderRadius: 9999,
  },

  // Header
  header: {
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(19,236,218,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  // Content
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Image
  imageWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginBottom: 32,
  },
  imageCircle: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: PRIMARY,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },

  // Floating badges
  badge: {
    position: "absolute",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  badgeTopLeft: {
    top: IMAGE_SIZE * 0.15,
    left: -8,
  },
  badgeBottomRight: {
    bottom: IMAGE_SIZE * 0.2,
    right: -8,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },

  // Text
  textBlock: {
    alignItems: "center",
    maxWidth: 300,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 36,
  },
  headingAccent: {
    color: PRIMARY,
  },
  subheading: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
    marginTop: 12,
  },

  // Pagination dots
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e2e8f0",
  },
  dotActive: {
    width: 24,
    backgroundColor: PRIMARY,
  },

  // Bottom
  bottom: {
    padding: 24,
    paddingBottom: 40,
  },
  ctaButton: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaText: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700",
  },
  loginPrompt: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    color: "#94a3b8",
  },
  loginLink: {
    color: PRIMARY,
    fontWeight: "600",
  },
});
