-- 00044_story_duplicate_flag.sql
-- Dubletten-Behandlung ohne Datenverlust: eine als Dublette markierte Story
-- verweist auf die behaltene (duplicate_of) und wird aus allen öffentlichen
-- Listen (Archiv/Feed/Auswahl) ausgeblendet — die Zeile bleibt aber bestehen,
-- damit Foreign Keys (social_posts, newsletter_sends) und die Post-Historie
-- intakt sind. Hartes Löschen ist wegen dieser FKs nicht möglich.

alter table nureine_stories
  add column if not exists duplicate_of uuid references nureine_stories(id);

create index if not exists idx_nur_stories_duplicate_of on nureine_stories (duplicate_of);

comment on column nureine_stories.duplicate_of is
  'Wenn gesetzt: diese Story ist eine thematische Dublette der referenzierten Story und wird öffentlich ausgeblendet (Zeile bleibt für FK/Historie).';
