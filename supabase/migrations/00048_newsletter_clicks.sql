-- Klick-Tracking für Newsletter-Story-Links. Jeder Klick über /r wird hier
-- protokolliert (fire-and-forget). So sehen wir pro Tag/Story, wie viele
-- Abonnenten über die Mail zur Story kamen — die Kern-Metrik "zieht der Newsletter?".
-- Additive Migration, keine bestehende Tabelle angefasst.
CREATE TABLE IF NOT EXISTS nureine_newsletter_clicks (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  story_id    uuid,
  category    text,
  clicked_at  timestamptz NOT NULL DEFAULT now(),
  day         date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Berlin')::date
);

CREATE INDEX IF NOT EXISTS idx_nl_clicks_day ON nureine_newsletter_clicks (day);
CREATE INDEX IF NOT EXISTS idx_nl_clicks_story ON nureine_newsletter_clicks (story_id);

ALTER TABLE nureine_newsletter_clicks ENABLE ROW LEVEL SECURITY;
