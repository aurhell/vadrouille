-- Two public-read buckets: avatars/{user_id}/... and dog-photos/{dog_id}/...
-- (see modele-de-donnees.md "Stockage" — public read is a deliberate simplification, no
-- sensitive data in these photos).

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars', 'avatars', true, 5242880),
  ('dog-photos', 'dog-photos', true, 5242880)
on conflict (id) do nothing;

-- Public read on both buckets.

create policy "avatars_read_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "dog_photos_read_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'dog-photos');

-- Avatars: write restricted to the owner of the {user_id}/... path.

create policy "avatars_write_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own_folder"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Dog photos: write restricted to an accepted owner/co-owner of the {dog_id}/... path.

create policy "dog_photos_write_own_dog_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'dog-photos'
    and exists (
      select 1
      from public.dog_owners do_
      where do_.dog_id::text = (storage.foldername(name))[1]
        and do_.user_id = auth.uid()
        and do_.status = 'accepted'
    )
  );

create policy "dog_photos_update_own_dog_folder"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'dog-photos'
    and exists (
      select 1
      from public.dog_owners do_
      where do_.dog_id::text = (storage.foldername(name))[1]
        and do_.user_id = auth.uid()
        and do_.status = 'accepted'
    )
  )
  with check (
    bucket_id = 'dog-photos'
    and exists (
      select 1
      from public.dog_owners do_
      where do_.dog_id::text = (storage.foldername(name))[1]
        and do_.user_id = auth.uid()
        and do_.status = 'accepted'
    )
  );

create policy "dog_photos_delete_own_dog_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'dog-photos'
    and exists (
      select 1
      from public.dog_owners do_
      where do_.dog_id::text = (storage.foldername(name))[1]
        and do_.user_id = auth.uid()
        and do_.status = 'accepted'
    )
  );
