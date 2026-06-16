import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Sử dụng service role key để có quyền upload ảnh (cẩn thận với key này, không nên dùng trong client)

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ CẢNH BÁO: Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_KEY.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');