import { createClient } from '@/lib/supabase/server';
import { parseDeviceInfo } from '@/lib/utils';
import type { UserProfile } from '@/types';

/**
 * Get the current authenticated user's profile from Supabase.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('uid', user.id)
    .single();

  return profile;
}

/**
 * Create or update user profile after Google OAuth login.
 * Also creates a login log entry.
 */
export async function upsertUserProfile(
  userId: string,
  userData: {
    name: string;
    email: string;
    profilePicture?: string;
  },
  requestInfo?: {
    userAgent?: string;
    ip?: string;
  }
): Promise<UserProfile | null> {
  const supabase = await createClient();

  // Upsert profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        uid: userId,
        name: userData.name,
        email: userData.email,
        profile_picture: userData.profilePicture,
        last_active: new Date().toISOString(),
      },
      {
        onConflict: 'uid',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }

  // Create login log
  const deviceInfo = requestInfo?.userAgent
    ? parseDeviceInfo(requestInfo.userAgent)
    : { device: 'Unknown', browser: 'Unknown' };

  await supabase.from('login_logs').insert({
    user_id: profile.id,
    login_time: new Date().toISOString(),
    device: deviceInfo.device,
    browser: deviceInfo.browser,
    ip_address: requestInfo?.ip,
    user_agent: requestInfo?.userAgent,
  });

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: profile.id,
    action: 'user_login',
    entity_type: 'user',
    entity_id: profile.id,
    details: {
      device: deviceInfo.device,
      browser: deviceInfo.browser,
    },
    ip_address: requestInfo?.ip,
  });

  return profile;
}

/**
 * Sign in with Google OAuth.
 * Returns the redirect URL for the OAuth flow.
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback${
        redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''
      }`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { url: data.url };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Check if user has admin role.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('uid', userId)
    .single();

  return data?.role === 'admin' || data?.role === 'super_admin';
}
