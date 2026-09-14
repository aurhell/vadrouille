-- Extensions
create extension if not exists pgcrypto with schema extensions;

-- Note: helper functions that reference specific tables (e.g. is_friend_of) live in the
-- migration that creates those tables, since `language sql` function bodies are validated
-- against the catalog at creation time.
