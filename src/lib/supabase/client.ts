import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Cliente sem tipagem estrita para tabelas não definidas no schema
export function createUntypedClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton para uso no cliente
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;
let untypedClientInstance: ReturnType<typeof createBrowserClient<any>> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

export function getUntypedSupabaseClient() {
  if (!untypedClientInstance) {
    untypedClientInstance = createUntypedClient();
  }
  return untypedClientInstance;
}
