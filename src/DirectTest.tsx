import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vadnrbkqrukvzjsuglpi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZG5yYmtxcnVrdnpqc3VnbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzM0MzcsImV4cCI6MjA3Mzc0OTQzN30.i3514k6MkzBtkHIVsOh6rFfUwowg6wkDcqhfwKTgsQ8'
);

export default function DirectTest() {
  const [data, setData] = useState('Loading...');

  useEffect(() => {
    const test = async () => {
      try {
        const { data: result, error } = await supabase.from('tickets').select('*');
        setData(JSON.stringify({ result, error }, null, 2));
      } catch (err) {
        setData('Error: ' + err.message);
      }
    };
    test();
  }, []);

  return <pre style={{ padding: '20px', background: '#f0f0f0' }}>{data}</pre>;
}