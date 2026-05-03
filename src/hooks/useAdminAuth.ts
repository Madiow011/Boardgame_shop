import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
    const { data: listener } = supabase.auth.onAuthStateChange(() => checkAdmin());
    return () => listener.subscription.unsubscribe();
  }, []);

  const checkAdmin = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setIsAdmin(false);
      setUserId(null);
      setIsLoading(false);
      return;
    }
    setUserId(session.user.id);
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
    setIsLoading(false);
  };

  return { isAdmin, isLoading, userId };
}
