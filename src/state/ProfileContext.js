import React, { createContext, useContext, useState, useCallback } from 'react';
import { getMe, updateMe as apiUpdateMe } from '../api/users';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);

  const refresh = useCallback(async () => {
    const data = await getMe();
    setProfile(data);
    return data;
  }, []);

  const update = useCallback(async (fields) => {
    const data = await apiUpdateMe(fields);
    setProfile(data);
    return data;
  }, []);

  const clear = useCallback(() => setProfile(null), []);

  return (
    <ProfileContext.Provider value={{ profile, refresh, update, clear }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
