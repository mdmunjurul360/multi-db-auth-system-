ALTER TABLE public.books REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;