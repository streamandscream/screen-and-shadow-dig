ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS cover_alt text;

UPDATE public.posts SET cover_url = 'https://image.tmdb.org/t/p/original/l8WXZDUihRDJuEMUCue6VUEx2gt.jpg', cover_alt = 'Poster art for Death in Apartment 603, the true crime documentary about the death of Ellen Greenberg' WHERE slug = 'death-in-apartment-603';

UPDATE public.posts SET cover_url = 'https://image.tmdb.org/t/p/original/eWYQAsM0o9MONQXMKaUmI8AEsn5.jpg', cover_alt = 'Poster art for Cold Case: The Tylenol Murders, the Netflix true crime documentary about the 1982 Chicago cyanide poisonings' WHERE slug = 'the-tylenol-murders';

UPDATE public.posts SET cover_url = 'https://image.tmdb.org/t/p/original/2NE7yN45zo19o4LJr6JFxDWmh2b.jpg', cover_alt = 'Poster art for The Perfect Neighbor, the Netflix true crime documentary about the fatal Florida stand your ground shooting' WHERE slug = 'the-perfect-neighbour';