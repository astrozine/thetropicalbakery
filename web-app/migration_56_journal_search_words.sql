-- migration_56_journal_search_words.sql
--
-- Security fix (2026-11-27): journal_recipes.text.search held every ingredient line WITH quantities, and that column is
-- public, so the library page sent premium ingredient lists to every visitor. It now holds single words only (see
-- searchFrom in src/lib/journal/journal.ts) plus a count of ingredient lines. Steps were never exposed.
--
-- Rewrites search/count for every recipe from its body (the 7 Sweet Escape ones below; any other recipe is fixed the next
-- time it is saved in the admin, and the public search field is blanked for those right now). Safe to run more than once.

BEGIN;

UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{pt,search}', to_jsonb('abacaxi amêndoas baunilha brancas caju canela caroço castanhas coco cruas cítricos cúrcuma decorar desidratado extrato filtrada flor gengibre macias natural passas ralado raspas tâmaras uvas água'::text)), '{pt,count}', to_jsonb(14))
WHERE slug = 'quadradinhos-paraiso-coco-abacaxi' AND text ? 'pt';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{en,search}', to_jsonb('almonds cashews cinnamon citrus coconut dates decorate dried extract filtered flower ginger natural pineapple pitted powder raisins shredded slice soft turmeric vanilla water white zest'::text)), '{en,count}', to_jsonb(14))
WHERE slug = 'quadradinhos-paraiso-coco-abacaxi' AND text ? 'en';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{pt,search}', to_jsonb('amêndoas aveia batidas baunilha brancas caju canela caroço castanhas cenoura cravo cremoso cruas cubos extrato farinha fermento ficar filtrada flocos grande laranja macias manga moscada passas pequena ralada raspas sanguínea suco todo triturada tâmaras uvas água'::text)), '{pt,count}', to_jsonb(13))
WHERE slug = 'muffins-de-manga-chai' AND text ? 'pt';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{en,search}', to_jsonb('almond baking blended blender blood caramel carrot cashews cinnamon cloves creaminess dates diced extract filtered flour food grated ground juice mango nutmeg oats orange pitted plus powder processor raisins sauce soft vanilla water white zest'::text)), '{en,count}', to_jsonb(13))
WHERE slug = 'muffins-de-manga-chai' AND text ? 'en';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{pt,search}', to_jsonb('amêndoas baunilha beterraba caroço cerejas coco cranberry desidratado extrato farinha flocos framboesa frescas frescos liofilizada macias morangos natural ralado tâmaras'::text)), '{pt,count}', to_jsonb(9))
WHERE slug = 'bliss-balls-frutas-vermelhas' AND text ? 'pt';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{en,search}', to_jsonb('almond beet cherries coconut cranberries dates dried extract flakes flour freeze natural pitted powder raspberry shredded soft strawberries vanilla'::text)), '{en,count}', to_jsonb(9))
WHERE slug = 'bliss-balls-frutas-vermelhas' AND text ? 'en';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{pt,search}', to_jsonb('amoras aveia batata baunilha cacau canela caroço doce extrato frescas frescos macias macio mirtilos média natural nozes roxa tofu tâmaras água'::text)), '{pt,count}', to_jsonb(17))
WHERE slug = 'cheesecake-longevidade-batata-doce-roxa' AND text ? 'pt';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{en,search}', to_jsonb('blackberries blueberries cacao cinnamon consistency dates extract natural oats pitted potato powder purple soft sweet tofu vanilla walnuts water'::text)), '{en,count}', to_jsonb(17))
WHERE slug = 'cheesecake-longevidade-batata-doce-roxa' AND text ? 'en';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{pt,search}', to_jsonb('amêndoas bananas baunilha brancas congeladas espirulina extrato farinha grosso natural passas pistache polvilhar punhadinho rodelas triturado uvas'::text)), '{pt,count}', to_jsonb(10))
WHERE slug = 'sanduiche-de-sorvete-pistache-laguna' AND text ? 'pt';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{en,search}', to_jsonb('almond bananas crushed extract flour frozen handful natural pistachios powder raisins roughly sliced spirulina sprinkle vanilla white'::text)), '{en,count}', to_jsonb(10))
WHERE slug = 'sanduiche-de-sorvete-pistache-laguna' AND text ? 'en';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{pt,search}', to_jsonb('amendoim banana baunilha caju canela caroço castanhas extrato grande macias natural torrado tâmaras água'::text)), '{pt,count}', to_jsonb(11))
WHERE slug = 'barrinhas-banoffee-de-amendoim' AND text ? 'pt';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{en,search}', to_jsonb('banana cashews cinnamon dates extract natural peanuts pitted roasted soft unsalted vanilla water'::text)), '{en,count}', to_jsonb(11))
WHERE slug = 'barrinhas-banoffee-de-amendoim' AND text ? 'en';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{pt,search}', to_jsonb('amargo aveia baunilha black cacau caroço casca chocolate cruas derretido extras extrato macias miolo natural nibs nozes orgânico pecã pera tâmaras vegano'::text)), '{pt,count}', to_jsonb(13))
WHERE slug = 'tartarugas-de-mousse-de-cacau' AND text ? 'pt';
UPDATE public.journal_recipes SET text = jsonb_set(jsonb_set(text, '{en,search}', to_jsonb('black chocolate cocoa cored dark dates extra extract melted natural nibs oats organic pear pecans peeled pitted powder soft vanilla vegan'::text)), '{en,count}', to_jsonb(13))
WHERE slug = 'tartarugas-de-mousse-de-cacau' AND text ? 'en';

-- Anything else (a recipe Dolly added since): drop the old line-by-line search until it is saved again.
UPDATE public.journal_recipes r SET text = (SELECT jsonb_object_agg(k, v - 'search') FROM jsonb_each(r.text) AS e(k, v))
WHERE r.slug NOT IN ('quadradinhos-paraiso-coco-abacaxi', 'muffins-de-manga-chai', 'bliss-balls-frutas-vermelhas', 'cheesecake-longevidade-batata-doce-roxa', 'sanduiche-de-sorvete-pistache-laguna', 'barrinhas-banoffee-de-amendoim', 'tartarugas-de-mousse-de-cacau') AND r.text::text LIKE '%"search"%';

COMMIT;

-- Check: no search text with a ' · ' separator (the old line-by-line form) is left.
SELECT count(*) FILTER (WHERE text::text LIKE '%·%') AS old_style_left, count(*) AS recipes FROM public.journal_recipes;
