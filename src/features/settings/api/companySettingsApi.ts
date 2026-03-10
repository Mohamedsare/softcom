import { supabase } from '@/lib/supabase'

const KEY_DEFAULT_STOCK_ALERT = 'default_stock_alert_threshold'
const DEFAULT_STOCK_ALERT_VALUE = 5

export const companySettingsApi = {
  /** Seuil d'alerte stock par défaut (utilisé quand product.stock_min vaut 0). Défaut : 5 */
  async getDefaultStockAlertThreshold(companyId: string): Promise<number> {
    const { data, error } = await supabase
      .from('company_settings')
      .select('value')
      .eq('company_id', companyId)
      .eq('key', KEY_DEFAULT_STOCK_ALERT)
      .maybeSingle()
    if (error) throw new Error(error.message)
    const raw = (data as { value?: number | string } | null)?.value
    if (typeof raw === 'number' && !Number.isNaN(raw) && raw >= 0) return raw
    if (typeof raw === 'string') {
      const n = parseInt(raw, 10)
      if (!Number.isNaN(n) && n >= 0) return n
    }
    return DEFAULT_STOCK_ALERT_VALUE
  },

  async setDefaultStockAlertThreshold(companyId: string, value: number): Promise<void> {
    if (value < 0) throw new Error('Le seuil doit être >= 0')
    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .eq('company_id', companyId)
      .eq('key', KEY_DEFAULT_STOCK_ALERT)
      .maybeSingle()
    if (existing) {
      const { error } = await supabase
        .from('company_settings')
        .update({ value })
        .eq('company_id', companyId)
        .eq('key', KEY_DEFAULT_STOCK_ALERT)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('company_settings').insert({
        company_id: companyId,
        key: KEY_DEFAULT_STOCK_ALERT,
        value,
      })
      if (error) throw new Error(error.message)
    }
  },
}
