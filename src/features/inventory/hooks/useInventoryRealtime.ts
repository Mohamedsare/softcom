import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Abonnement Realtime sur store_inventory pour la boutique donnée.
 * Invalide les requêtes inventory / stock quand le stock change (vente, achat, ajustement).
 */
export function useInventoryRealtime(storeId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!storeId) return

    const channel = supabase
      .channel(`store_inventory:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_inventory',
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          queryClient.invalidateQueries({ queryKey: ['stock-movements', storeId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, queryClient])
}
