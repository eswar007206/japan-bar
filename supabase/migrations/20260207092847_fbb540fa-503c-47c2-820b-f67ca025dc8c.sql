-- Enable realtime for bills table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;

-- Enable realtime for orders table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;