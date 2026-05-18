import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hjjzcrxylqlzvvclklkc.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanpjcnh5bHFsenZ2Y2xrbGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTI5MTEsImV4cCI6MjA5NDY4ODkxMX0.8uZDN4C8VRiduQofbgkTYf7yC5sbkuKur_tW8UH0hKU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)