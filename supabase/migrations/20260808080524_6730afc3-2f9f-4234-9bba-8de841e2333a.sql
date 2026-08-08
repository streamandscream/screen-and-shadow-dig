UPDATE public.posts SET cover_url = v.url FROM (VALUES
 ('a-deadly-american-marriage','https://image.tmdb.org/t/p/original/yzPpsg2HX6BcavbE43NzpgDig9F.jpg'),
 ('bad-vegan','https://image.tmdb.org/t/p/original/kcZ0dcgRo5miznCTJtqoB2b6p4j.jpg'),
 ('the-tinder-swindler','https://image.tmdb.org/t/p/original/iLUSFjdavIf0SrP7ldoQ1xomQVC.jpg'),
 ('american-murder-laci-peterson','https://image.tmdb.org/t/p/original/gCpQBGkMHylnIfR0Qr28j4qBnGd.jpg'),
 ('the-truth-and-tragedy-of-moriah-wilson','https://image.tmdb.org/t/p/original/zoa2XatA43nKhF1kx8nVcVyH1M0.jpg'),
 ('the-pike-county-murders-a-family-massacre','https://image.tmdb.org/t/p/original/al9AuLks9yJ8IAAoW404zvgFiqH.jpg'),
 ('on-my-block','https://image.tmdb.org/t/p/original/w6oviv65UEducvjAdH3sYYaxdu2.jpg'),
 ('never-have-i-ever','https://image.tmdb.org/t/p/original/hd5fnBixab6IzfUwjC5wfdbX3eM.jpg'),
 ('for-friends-like-these-murder-of-skylar-neese','https://image.tmdb.org/t/p/original/v3F3MFMFw2VXAt6V2ygsv85Ob2w.jpg'),
 ('shameless','https://image.tmdb.org/t/p/original/ifo31fMWLmyOVpdak9K0kY4jldQ.jpg'),
 ('the-sex-lives-of-college-girls','https://image.tmdb.org/t/p/original/wThMl6AhneaNw78XHC7fupBxNle.jpg'),
 ('formula-1-drive-to-survive','https://image.tmdb.org/t/p/original/xGOGjJFYYeRSoOpnhN9IHZTXIxj.jpg'),
 ('the-vampire-diaries','https://image.tmdb.org/t/p/original/b3vl6wV1W8PBezFfntKTrhrehCY.jpg'),
 ('skyking','https://image.tmdb.org/t/p/original/4uXL16pegV9mccBeUqB9VGos5hv.jpg')
) AS v(slug,url)
WHERE public.posts.slug = v.slug;