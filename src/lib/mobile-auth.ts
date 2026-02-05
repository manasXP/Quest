import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'quest_auth_token';
const USER_KEY = 'quest_user';

export interface MobileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export const mobileAuth = {
  async setToken(token: string) {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  },

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  },

  async clearToken() {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
  },

  async setUser(user: MobileUser) {
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
  },

  async getUser(): Promise<MobileUser | null> {
    const { value } = await Preferences.get({ key: USER_KEY });
    return value ? JSON.parse(value) : null;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  },

  async logout() {
    await this.clearToken();
  }
};
