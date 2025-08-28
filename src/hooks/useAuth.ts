import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
  });
  const { toast } = useToast();

  const checkUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      return !error && data;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        const isAdmin = user ? await checkUserRole(user.id) : false;
        
        setAuthState({
          user,
          session,
          loading: false,
          isAdmin: Boolean(isAdmin),
        });
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      const isAdmin = user ? await checkUserRole(user.id) : false;
      
      setAuthState({
        user,
        session,
        loading: false,
        isAdmin: Boolean(isAdmin),
      });
    });

    return () => subscription.unsubscribe();
  }, [checkUserRole]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome Back",
        description: "Successfully signed in to admin console.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: "Invalid credentials or insufficient permissions.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed Out",
        description: "Successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    ...authState,
    signIn,
    signOut,
  };
};