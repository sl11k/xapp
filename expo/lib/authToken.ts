import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "bh_auth_token";

let cachedToken: string | null = null;

export async function getAuthToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return cachedToken;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  cachedToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (err) {
    console.log("[authToken] failed to persist token", err);
  }
}
