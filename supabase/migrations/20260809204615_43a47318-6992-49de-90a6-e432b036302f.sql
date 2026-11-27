revoke execute on function public.handle_new_user() from anon, authenticated;

create policy "Owners upload to their folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners update their folder" on storage.objects for update to authenticated
  using (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners delete from their folder" on storage.objects for delete to authenticated
  using (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners read their folder" on storage.objects for select to authenticated
  using (bucket_id = 'couple-photos' and (storage.foldername(name))[1] = auth.uid()::text);