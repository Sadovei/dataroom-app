-- DataRoom App Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Data Rooms Table
create table if not exists data_rooms (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  description text,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Folders Table
create table if not exists folders (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  parent_id uuid references folders(id) on delete cascade,
  data_room_id uuid references data_rooms(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Files Table
create table if not exists files (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  folder_id uuid references folders(id) on delete cascade,
  data_room_id uuid references data_rooms(id) on delete cascade not null,
  size bigint not null,
  mime_type varchar(100) not null,
  storage_key varchar(500) not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table data_rooms enable row level security;
alter table folders enable row level security;
alter table files enable row level security;

-- Data Rooms Policies
create policy "Users can view their own data rooms"
  on data_rooms for select
  using (auth.uid() = owner_id);

create policy "Users can create their own data rooms"
  on data_rooms for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own data rooms"
  on data_rooms for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own data rooms"
  on data_rooms for delete
  using (auth.uid() = owner_id);

-- Folders Policies
create policy "Users can view folders in their data rooms"
  on folders for select
  using (
    exists (
      select 1 from data_rooms
      where data_rooms.id = folders.data_room_id
      and data_rooms.owner_id = auth.uid()
    )
  );

create policy "Users can create folders in their data rooms"
  on folders for insert
  with check (
    exists (
      select 1 from data_rooms
      where data_rooms.id = folders.data_room_id
      and data_rooms.owner_id = auth.uid()
    )
  );

create policy "Users can update folders in their data rooms"
  on folders for update
  using (
    exists (
      select 1 from data_rooms
      where data_rooms.id = folders.data_room_id
      and data_rooms.owner_id = auth.uid()
    )
  );

create policy "Users can delete folders in their data rooms"
  on folders for delete
  using (
    exists (
      select 1 from data_rooms
      where data_rooms.id = folders.data_room_id
      and data_rooms.owner_id = auth.uid()
    )
  );

-- Files Policies
create policy "Users can view files in their data rooms"
  on files for select
  using (
    exists (
      select 1 from data_rooms
      where data_rooms.id = files.data_room_id
      and data_rooms.owner_id = auth.uid()
    )
  );

create policy "Users can upload files to their data rooms"
  on files for insert
  with check (
    exists (
      select 1 from data_rooms
      where data_rooms.id = files.data_room_id
      and data_rooms.owner_id = auth.uid()
    )
  );

create policy "Users can update files in their data rooms"
  on files for update
  using (
    exists (
      select 1 from data_rooms
      where data_rooms.id = files.data_room_id
      and data_rooms.owner_id = auth.uid()
    )
  );

create policy "Users can delete files in their data rooms"
  on files for delete
  using (
    exists (
      select 1 from data_rooms
      where data_rooms.id = files.data_room_id
      and data_rooms.owner_id = auth.uid()
    )
  );

-- Create Storage Bucket for files
insert into storage.buckets (id, name, public)
values ('dataroom-files', 'dataroom-files', false)
on conflict do nothing;

-- Storage Policies
create policy "Users can upload files to their folders"
  on storage.objects for insert
  with check (
    bucket_id = 'dataroom-files' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own files"
  on storage.objects for select
  using (
    bucket_id = 'dataroom-files' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'dataroom-files' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for better performance
create index if not exists idx_data_rooms_owner_id on data_rooms(owner_id);
create index if not exists idx_folders_data_room_id on folders(data_room_id);
create index if not exists idx_folders_parent_id on folders(parent_id);
create index if not exists idx_files_data_room_id on files(data_room_id);
create index if not exists idx_files_folder_id on files(folder_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_data_rooms_updated_at
  before update on data_rooms
  for each row execute function update_updated_at_column();

create trigger update_folders_updated_at
  before update on folders
  for each row execute function update_updated_at_column();

create trigger update_files_updated_at
  before update on files
  for each row execute function update_updated_at_column();
