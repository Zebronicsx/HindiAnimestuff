import raw from "../db/catalog.json";
import type { Anime, Episode } from "./types";

interface RawEntry {
  id: number;
  title: string;
  romaji: string;
  poster: string;
  color: string | null;
  banner: string | null;
  score: number;
  year: number;
  type: string;
  episodes: number;
  genres: string[];
  studio: string;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TITLE_FIX: Record<number, string> = {
  21: "One Piece",
  113415: "Jujutsu Kaisen",
  145064: "Jujutsu Kaisen Season 2",
  140960: "Spy x Family",
  11061: "Hunter x Hunter",
  20464: "Haikyu!!",
  21234: "Erased",
  105333: "Dr. Stone",
  151801: "Mashle: Magic and Muscles",
  153288: "Kaiju No. 8",
  128893: "Hell's Paradise: Jigokuraku",
  21519: "Your Name.",
  112151: "Demon Slayer: Mugen Train",
  131573: "Jujutsu Kaisen 0",
};

const EP_OVERRIDE: Record<number, number> = { 21: 1122, 1735: 500 };

const SYNOPSIS: Record<number, string> = {
  151807:
    "Duniya ka sabse kamzor hunter Sung Jinwoo ek double dungeon mein maut ke muh se laut-ta hai — aur usse milta hai ek mysterious System. Ab har level up ke saath woh Shadow Monarch ban-ne ki raah par hai. Hindi dub mein poora action, poora swagger.",
  145064:
    "Gojo aur Geto ki jawani ke din, aur phir Shibuya ka woh kaand jisne sab badal diya. Jujutsu Kaisen Season 2 — Hidden Inventory se lekar Shibuya Incident tak, ab Hindi audio ke saath.",
  101922:
    "Tanjiro ki family ka qatl ho chuka hai aur behen Nezuko ban gayi hai demon. Badla aur ilaaj ki is journey mein Harshad… sorry, Hashira milenge, demons milenge, aur Ufotable ka god-level animation milega — Hindi mein.",
  113415:
    "Yuji Itadori ne kha liya Sukuna ki ungli — aur ban gaya King of Curses ka vessel. Jujutsu High mein curses, exorcisms aur dosti ki aisi kahani jo Hindi dub mein aur bhi hit karti hai.",
  127230:
    "Denji ke paas na paisa hai na future — bas ek devil-dog Pochita aur bahut saara karza. Chainsaw Devil ke saath merge hoke woh ban jaata hai Chainsaw Man. MAPPA ka paagal animation, ab Hindi mein.",
  21: "Gol D. Roger ne marte waqt chhod gaya tha One Piece. Luffy apni Straw Hat crew ke saath Grand Line par nikla hai Pirate King ban-ne. 1100+ episodes ka mahasagar — Hindi dub ke saath doobki lagao.",
  153288:
    "Kafka Hibino 32 saal ka hai aur sapna abhi bhi Defense Force join karne ka hai. Phir ek chhota kaiju uske andar ghus jaata hai — aur woh khud ban jaata hai Kaiju No. 8. Monsters ke against, monster ki tarah.",
  140960:
    "Ek spy, ek assassin, aur ek telepath bacchi — Forger family dikhne mein perfect hai, par sabke apne raaz hain. Operation Strix ke liye Anya ko banna hai Imperial Scholar. Wholesome + action ka perfect combo, Hindi mein.",
  1735:
    "Sasuke ko wapas laana hai, Akatsuki ko rokna hai, aur Naruto ko banna hai Hokage. Shippuden mein har arc pehle se bada hai — Pain ka attack ho ya War arc, Hindi dub ke saath nostalgia double.",
  1535:
    "Light Yagami ko milta hai Death Note — jo naam likho, woh mar jaata hai. Saamne hai genius detective L. Dimaag ki is chess game mein koi bhi move galat nahi ho sakti. Psychological thriller ka baap.",
  16498:
    "Insaaniyat teen deewaron ke andar qaid hai, aur bahar hain Titans jo insaanon ko khaate hain. Eren Yeager ne kasam khaayi hai — ek bhi Titan nahi bachega. Survey Corps ke saath aazaadi ki jung, Hindi mein.",
  11061:
    "Gon apne papa ko dhoondhne nikla hai — jo duniya ke greatest Hunters mein se hai. Hunter Exam se Chimera Ant arc tak, dosti aur junoon ki epic saga. 148 episodes, zero filler, full Hindi.",
  5114:
    "Elric brothers ne ek forbidden alchemy se maa ko wapas laane ki koshish ki — aur keemat chukayi apne shareer se. Philosopher's Stone ki talaash mein poori duniya ki saazish khul jaati hai. GOAT-tier anime, ab Hindi mein.",
  21087:
    "Saitama ne itni training ki ki saare baal jhad gaye — ab har villain ek punch mein khatam. Problem yeh hai ki koi strong milta hi nahi! Hero association ki politics aur comedy ka dose, Hindi dub mein.",
  21459:
    "Izuku Midoriya quirk-less paida hua, par usse mila duniya ke No.1 hero All Might ka quirk — One For All. U.A. High mein ban-na hai Plus Ultra hero. Hindi mein har smash aur bhi loud lagta hai.",
  20605:
    "Kaneki ek normal college boy tha, ek date ke baad aadha ghoul ban gaya. Ab insaan aur ghoul dono duniya ke beech phansa hai. Dark, twisted aur binge-worthy — Hindi audio ke saath.",
  154587:
    "Demon King toh har gaya, par elf mage Frieren ke liye 10 saal ki journey bas ek pal thi. Apne doston ko samajhne ki uski nayi journey — slow, sundar aur seedha dil par lagne wali.",
  97940:
    "Asta ke paas magic ki ek boond nahi, par sapna hai Wizard King ban-ne ka. Anti-magic ki talwar aur kabhi na rukne wali zid — Clover Kingdom ka sabse loud underdog, Hindi mein.",
  269: "Ichigo Kurosaki ko mil gayi Soul Reaper ki powers. Ab Hollows se lekar Soul Society tak, har duniya mein talwar chalane ka mauka milta hai. Bankai! — Hindi dub ke saath classic shonen.",
  105333:
    "Poori duniya patthar ban gayi, 3700 saal beet gaye, aur genius Senku jaag gaya. Science ke dum par zero se civilization dobara khadi karni hai. Get excited! — Hindi mein.",
  101348:
    "Thorfinn ka bachpan battlefield par guzra, badle ki aag mein. Vikings ki is brutal saga mein sawal ek hi hai — kya khoon se sukoon milta hai? WIT + MAPPA ka masterpiece, Hindi dub.",
  20464:
    "Karasuno High ka chhota kad, bada sapna — nationals tak jaana hai. Hinata aur Kageyama ki jodi court par aag laga deti hai. Sports anime ka gold standard, ab Hindi commentary-feel ke saath.",
  20755:
    "Class 3-E ka target hai apna hi teacher — ek yellow octopus jisne chaand uda diya tha. Par Koro-sensei ab tak ka best teacher bhi hai. Hasi, action aur end mein aansu — sab Hindi mein.",
  101759:
    "Grace Field House ke bacche khush hain — jab tak Emma, Norman aur Ray ko sach nahi pata chalta. Orphanage ki deewaron ke bahar ka raaz rongte khada kar dega. Mind games, full tension, Hindi dub.",
  21234:
    "Satoru ke paas power hai kuch minute peeche jaane ki — aur ab usse 18 saal peeche jaakar bachana hai apni classmate ko ek serial killer se. Mystery + feels ka perfect blend, Hindi mein.",
  9253: "Ek microwave jo past mein message bhejta hai — aur uske chakkar mein Okabe aur uske dost time ki saazish mein phans jaate hain. El Psy Kongroo. Sci-fi thriller jo dimaag hila de, Hindi dub.",
  20623:
    "Raat ko Shinichi ke haath mein ghus gaya ek alien parasite — ab Migi uske saath jeeta hai, aur baaki parasites insaan khaate hain. Body-horror + philosophy ka killer combo, Hindi mein.",
  128893:
    "Death-row criminals ko bheja gaya hai ek khoobsurat par jaanleva island par — amrit dhoondhne. Gabimaru the Hollow ko sirf apni biwi ke paas wapas jaana hai. Flowers, monsters aur khoon — Hindi dub.",
  151801:
    "Magic ki duniya mein Mash ke paas magic nahi hai — bas itni muscles ki woh spells ko haath se uda deta hai. Cream puffs ka deewana, rules ka dushman. Harry Potter meets One Punch Man, Hindi mein.",
  21519:
    "Taki aur Mitsuha — do anjaan log jo neend mein ek-doosre ki body mein jaagte hain. Comet girne wala hai, aur waqt dono ke khilaaf hai. Makoto Shinkai ki visually stunning love story, ab Hindi mein.",
  20954:
    "Shoya ne bachpan mein Shoko ko bully kiya tha — ab saalon baad woh maafi dhoondh raha hai. Deafness, guilt aur redemption ki yeh film seedha dil cheer deti hai. Tissues ready rakho.",
  112151:
    "Mugen Train mein 40 log gayab ho chuke hain. Tanjiro, Zenitsu aur Inosuke ke saath Flame Hashira Rengoku bhi hai — par Lower One sapno mein phansa raha hai. Rengoku-san ka climax… Hindi mein aur bhi zor se lagta hai.",
  131573:
    "Yuta Okkotsu ke saath juda hai uski childhood friend Riko ki curse — duniya ki sabse khatarnaak spirits mein se ek. Gojo ke saath training, Geto se takkar. JJK ki origin story, Hindi dub mein.",
  142770:
    "Suzume ko milta hai ek mysterious ladka jo darwaze band karta phirta hai — kyunki khule darwazon se aati hai tabahi. Poore Japan ka road trip, pyaar aur toofaan. Shinkai magic, Hindi audio.",
  199: "Chihiro ke maa-baap pigs ban gaye aur woh phans gayi spirit-world mein. Yubaba ke bathhouse mein kaam karke unhe bachana hai. Studio Ghibli ki Oscar-winning classic — ab Hindi mein, poore parivaar ke liye.",
};

export const FEATURED_IDS = [151807, 145064, 101922, 127230, 21];
export const TRENDING_IDS = [
  151807, 145064, 101922, 21, 127230, 153288, 113415, 140960, 1735, 1535,
];
export const NEW_IDS = [151807, 153288, 151801, 145064, 154587, 128893, 142770, 131573];

export const STREAMS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
];

const EP_TITLES = [
  "The Awakening", "Crimson Promise", "Where Blades Fall", "Echoes of Tomorrow",
  "The Silent Storm", "Broken Oath", "Flames of Resolve", "Into the Abyss",
  "The Last Stand", "Moonlit Reunion", "Scarlet Bonds", "The Hidden Truth",
  "Ashes and Embers", "Beyond the Wall", "The Final Hunt", "Shadows Collide",
  "A New Dawn", "The Weight of Fate", "Unbreakable", "Thunder and Steel",
  "The Vanishing Point", "Blood and Blossoms", "The Long Night", "Rise of the Fallen",
  "Fractured Skies", "The Promise Kept", "Edge of Destiny", "The Calm Before",
  "Wolves at the Gate", "Requiem", "The Turning Tide", "Heart of the Storm",
  "Zero Hour", "The Road Home", "Legends Never Die", "After the Rain",
];

const MOVIE_RUNTIME: Record<number, number> = {
  21519: 6360, 20954: 7800, 112151: 7020, 131573: 6300, 142770: 7320, 199: 7500,
};

export const CATALOG: Anime[] = (raw as RawEntry[]).map((r, i) => {
  const title = TITLE_FIX[r.id] ?? r.title;
  const isNew = NEW_IDS.includes(r.id);
  const tRank = TRENDING_IDS.indexOf(r.id);
  const fRank = FEATURED_IDS.indexOf(r.id);
  return {
    id: slugify(title),
    anilistId: r.id,
    title,
    romaji: r.romaji,
    synopsis: SYNOPSIS[r.id] ?? `${title} — ab Hindi dub mein, sirf AnimesFreak par.`,
    poster: r.poster,
    banner: r.banner,
    color: r.color,
    score: Math.round(r.score * 10) / 10,
    year: r.year,
    type: r.type === "movie" ? "movie" : "series",
    episodesCount: EP_OVERRIDE[r.id] ?? r.episodes,
    genres: r.genres,
    languages: r.id % 3 === 0 ? ["Hindi", "Japanese", "English"] : ["Hindi", "Japanese"],
    qualities: r.type === "movie" || isNew ? ["720p", "1080p", "4K"] : ["480p", "720p", "1080p"],
    studio: r.studio,
    trendingRank: tRank >= 0 ? tRank + 1 : null,
    featuredRank: fRank >= 0 ? fRank + 1 : null,
    isNew,
    createdAt: new Date(
      Date.now() - (isNew ? (i % 5) + 1 : 14 + i * 2) * 86400000
    ).toISOString(),
  } satisfies Anime;
});

export function buildEpisodes(a: Anime): Episode[] {
  const count = a.type === "movie" ? 1 : Math.min(a.episodesCount, 26);
  const list: Episode[] = [];
  for (let n = 1; n <= count; n++) {
    const seed = a.anilistId + n * 31;
    const duration =
      a.type === "movie"
        ? MOVIE_RUNTIME[a.anilistId] ?? 6600
        : 1300 + ((seed * 7) % 260);
    const stream = STREAMS[(a.anilistId + n * 3) % STREAMS.length];
    const mb = (factor: number) => `${Math.max(60, Math.round(duration * factor))} MB`;
    list.push({
      id: a.anilistId * 1000 + n,
      animeId: a.id,
      num: n,
      title:
        a.type === "movie"
          ? `${a.title} — Full Movie (Hindi Dub)`
          : EP_TITLES[seed % EP_TITLES.length],
      duration,
      stream,
      downloads: [
        { quality: "480p", size: mb(0.09), url: stream },
        { quality: "720p", size: mb(0.2), url: stream },
        { quality: "1080p", size: mb(0.38), url: stream },
        ...(a.qualities.includes("4K")
          ? [{ quality: "4K", size: mb(0.95), url: stream }]
          : []),
      ],
    });
  }
  return list;
}

export const ALL_GENRES = [...new Set(CATALOG.flatMap((a) => a.genres))].sort();

export function fallbackAnime(slug: string): Anime | undefined {
  return CATALOG.find((a) => a.id === slug);
}
