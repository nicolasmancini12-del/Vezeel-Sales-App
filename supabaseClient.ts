import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://maxhlxxfoptwxljzioyt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heGhseHhmb3B0d3hsanppb3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDI1ODAsImV4cCI6MjA4MDgxODU4MH0.9VDBXJ0Zaq2Tz6ySUoK7XgILx9EVaQB82iBgsB2ICAg';

export const supabase = createClient(supabaseUrl, supabaseKey);