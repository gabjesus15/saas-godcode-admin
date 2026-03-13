import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseBrowserClient } from '../../utils/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const phone = req.query.phone as string;
  if (!phone) {
    return res.status(400).json({ error: 'Phone is required' });
  }

  // Normalizar el teléfono
  const normalizedPhone = phone.replace(/\D/g, '');

  // Buscar el último pedido con ese teléfono
  const supabase = createSupabaseBrowserClient('tenant');
  const { data, error } = await supabase
    .from('orders')
    .select('client_name, client_rut')
    .eq('client_phone', normalizedPhone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'DB error' });
  }

  if (!data) {
    return res.status(404).json({});
  }

  return res.status(200).json({
    name: data.client_name || '',
    rut: data.client_rut || ''
  });
}
