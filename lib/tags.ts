/**
 * Tag definitions for story generation.
 * Each tag has a directive injected into the prompt when selected.
 * See rulesets/TAG_DIRECTIVES.md for the full rule document.
 */

export type TagCategory = "characters" | "setting" | "theme";

export type TagDefinition = {
  id: string;
  name: string;
  nameSv: string;
  nameEs: string;
  category: TagCategory;
  directive: string;
};

export const TAG_DEFINITIONS: TagDefinition[] = [
  // Characters
  {
    id: "animals",
    name: "Animals",
    nameSv: "Djur",
    nameEs: "Animales",
    category: "characters",
    directive:
      "ANIMALS: All main characters must be animals (no human protagonists). Describe their animal traits—fur, feathers, scales, how they move. The setting should feel like their natural world. Use animal sounds and behaviors naturally in the story.",
  },
  {
    id: "fairies",
    name: "Fairies",
    nameSv: "Älvor",
    nameEs: "Hadas",
    category: "characters",
    directive:
      "FAIRIES: The story features fairies, pixies, or magical winged creatures as main characters or important helpers. Include wings, sparkles, small size, and gentle magic. The world has enchanted elements—glowing flowers, hidden groves, or magical dust.",
  },
  {
    id: "pirates",
    name: "Pirates",
    nameSv: "Pirater",
    nameEs: "Piratas",
    category: "characters",
    directive:
      "PIRATES: The story takes place on a ship, an island, or the high seas. Main characters are pirates or sea adventurers. Include treasure, maps, sailing, and friendly pirate tropes (parrots, treasure chests, gentle swashbuckling). Keep it playful, not scary.",
  },
  {
    id: "robots",
    name: "Robots",
    nameSv: "Robotar",
    nameEs: "Robots",
    category: "characters",
    directive:
      "ROBOTS: The story features robots or friendly machines as characters. They can be helpers, friends, or explorers. Include gentle technology—beeps, whirrs, helpful gadgets. The world can mix nature with friendly tech. Keep robots kind and curious.",
  },
  {
    id: "dinosaurs",
    name: "Dinosaurs",
    nameSv: "Dinosaurier",
    nameEs: "Dinosaurios",
    category: "characters",
    directive:
      "DINOSAURS: The story features friendly dinosaurs as main characters. All dinosaurs are gentle, kind, and curious—never scary or aggressive. Include big and small dinosaurs, describe their scales, long necks, or tiny arms. Use dinosaur vocabulary (roar, stomp, nest, eggs) in a playful way. Keep it wondrous and cozy.",
  },
  {
    id: "unicorns",
    name: "Unicorns",
    nameSv: "Enhörningar",
    nameEs: "Unicornios",
    category: "characters",
    directive:
      "UNICORNS: The story features unicorns or horse-like magical creatures as main characters. Include sparkles, rainbows, gentle horns, and soft magic. Unicorns are kind, helpful, and dreamy. Describe their flowing manes, glowing presence, and gentle nature. Keep it whimsical and delightful.",
  },
  {
    id: "dragons",
    name: "Dragons",
    nameSv: "Drakar",
    nameEs: "Dragones",
    category: "characters",
    directive:
      "DRAGONS: The story features friendly dragons as main characters or important companions. Dragons are gentle, wise, or playful—never terrifying. Include flying, gentle fire-breathing (warming cocoa, lighting campfires), colorful scales, and cozy dragon dens. Keep it magical and warm.",
  },
  {
    id: "mermaids",
    name: "Mermaids",
    nameSv: "Sjöjungfrur",
    nameEs: "Sirenas",
    category: "characters",
    directive:
      "MERMAIDS: The story features mermaids, mermen, or underwater folk as main characters. Include shimmering tails, underwater palaces, coral gardens, and sea creature friends. Mermaids are curious, musical, and kind. Describe the beauty of life under the waves. Keep it dreamy and gentle.",
  },
  {
    id: "superheroes",
    name: "Superheroes",
    nameSv: "Superhjältar",
    nameEs: "Superhéroes",
    category: "characters",
    directive:
      "SUPERHEROES: The story features child-friendly superheroes with gentle powers (flying, talking to animals, super kindness, growing flowers). The hero helps others through small, meaningful acts. Include capes, secret identities, and a simple challenge to overcome. Keep powers whimsical and age-appropriate—no violence.",
  },
  {
    id: "trolls",
    name: "Trolls",
    nameSv: "Troll",
    nameEs: "Trolls",
    category: "characters",
    directive:
      "TROLLS: The story features friendly Scandinavian-style trolls—big-nosed, mossy, and kind. They live in forests, under bridges, or inside mountains. Include troll humor, their love of nature, and gentle mischief. Trolls can be grumpy but always good-hearted. Keep it cozy and folklore-inspired.",
  },
  // Setting
  {
    id: "forest",
    name: "Forest",
    nameSv: "Skog",
    nameEs: "Bosque",
    category: "setting",
    directive:
      "FOREST: The story takes place in a forest, woodland, or among trees. Include trees, mushrooms, streams, leaves, and woodland creatures. The forest can be magical or cozy. Describe the sounds (rustling leaves, birds) and the feeling of being among trees.",
  },
  {
    id: "ocean",
    name: "Ocean",
    nameSv: "Hav",
    nameEs: "Océano",
    category: "setting",
    directive:
      "OCEAN: The story takes place by the sea, under the water, or on the shore. Include waves, shells, fish, sand, or underwater scenes. Use ocean vocabulary—tide, coral, seaweed, dolphins—naturally. Keep it calm and wondrous, not stormy or frightening.",
  },
  {
    id: "space",
    name: "Space",
    nameSv: "Rymden",
    nameEs: "Espacio",
    category: "setting",
    directive:
      "SPACE: The story takes place in space, on another planet, or in a rocket. Include stars, planets, moons, or zero-gravity moments. Use space vocabulary (stars, galaxy, astronaut, rocket) naturally. Keep it wondrous, not scary.",
  },
  {
    id: "castle",
    name: "Castle",
    nameSv: "Slott",
    nameEs: "Castillo",
    category: "setting",
    directive:
      "CASTLE: The story takes place in or around a castle. Include towers, courtyards, knights, royalty, or friendly castle life. The castle can be cozy, magical, or adventurous. Describe stone walls, tapestries, and castle sounds. Keep it gentle and storybook-like.",
  },
  {
    id: "farm",
    name: "Farm",
    nameSv: "Bondgård",
    nameEs: "Granja",
    category: "setting",
    directive:
      "FARM: The story takes place on a farm or in the countryside. Include farm animals, barns, fields, tractors, or gardens. Describe the sounds and smells of the farm. Characters can be farmers, animals, or children visiting. Keep it warm and cozy.",
  },
  {
    id: "jungle",
    name: "Jungle",
    nameSv: "Djungel",
    nameEs: "Jungla",
    category: "setting",
    directive:
      "JUNGLE: The story takes place in a lush tropical jungle or rainforest. Include tall trees, vines, colorful birds, monkeys, and exotic flowers. Describe the sounds—parrots, rustling leaves, distant waterfalls. The jungle is vibrant, alive, and full of wonder. Keep it exciting but safe.",
  },
  {
    id: "mountains",
    name: "Mountains",
    nameSv: "Berg",
    nameEs: "Montañas",
    category: "setting",
    directive:
      "MOUNTAINS: The story takes place in the mountains—peaks, valleys, cozy cabins, or snowy trails. Include mountain animals (goats, eagles, bears), fresh air, and big views. Describe the feeling of climbing, discovering hidden caves, or watching the sunset from a summit. Keep it adventurous and awe-inspiring.",
  },
  {
    id: "city",
    name: "City",
    nameSv: "Stad",
    nameEs: "Ciudad",
    category: "setting",
    directive:
      "CITY: The story takes place in a friendly, colorful city. Include parks, bakeries, buses, tall buildings, street musicians, or neighborhood shops. The city is bustling but safe. Characters might explore rooftops, find hidden gardens, or meet friendly neighbors. Keep it lively and warm.",
  },
  {
    id: "winter",
    name: "Winter",
    nameSv: "Vinter",
    nameEs: "Invierno",
    category: "setting",
    directive:
      "WINTER: The story takes place in a snowy, wintry landscape. Include snowflakes, frozen lakes, warm mittens, hot cocoa, sledding, and cozy fires. Describe the crunch of snow, frosty breath, and the stillness of a snowy night. Keep it magical, cozy, and full of winter wonder.",
  },
  // Theme
  {
    id: "friendship",
    name: "Friendship",
    nameSv: "Vänskap",
    nameEs: "Amistad",
    category: "theme",
    directive:
      "FRIENDSHIP: The central theme is friendship—making friends, helping a friend, or loyalty. The story must resolve around a friendship moment: meeting a new friend, helping a friend in need, or celebrating together. The moral should be about kindness and connection.",
  },
  {
    id: "bravery",
    name: "Bravery",
    nameSv: "Mod",
    nameEs: "Valentía",
    category: "theme",
    directive:
      "BRAVERY: The central theme is bravery—a character faces a fear or challenge and overcomes it. The challenge should be age-appropriate (trying something new, standing up for a friend, going to bed without fear). The moral should celebrate courage in small, relatable ways.",
  },
  {
    id: "magic",
    name: "Magic",
    nameSv: "Magi",
    nameEs: "Magia",
    category: "theme",
    directive:
      "MAGIC: The story includes magical elements—spells, wands, enchanted objects, or magical creatures. Magic should be gentle, wondrous, and used for good. Describe magic with sensory details (sparkles, glows, soft transformations). Keep it simple and delightful.",
  },
  {
    id: "discovery",
    name: "Discovery",
    nameSv: "Upptäckt",
    nameEs: "Descubrimiento",
    category: "theme",
    directive:
      "DISCOVERY: The central theme is discovery—exploring, learning something new, or finding something wonderful. The story follows a character's curiosity and what they find. Include moments of wonder, surprise, or gentle revelation. The moral celebrates curiosity and learning.",
  },
  {
    id: "family",
    name: "Family",
    nameSv: "Familj",
    nameEs: "Familia",
    category: "theme",
    directive:
      "FAMILY: The central theme is family—parents, siblings, grandparents, or loved ones. The story celebrates being together, helping at home, or a special family moment. Include warm family interactions, cozy routines, or a family adventure. The moral is about love, belonging, and connection with family.",
  },
  {
    id: "kindness",
    name: "Kindness",
    nameSv: "Snällhet",
    nameEs: "Amabilidad",
    category: "theme",
    directive:
      "KINDNESS: The central theme is kindness—helping others, sharing, or being nice. A character does something kind and it makes a difference. Include gentle acts of generosity, empathy, or care. The moral celebrates how kindness spreads and makes everyone feel good.",
  },
  {
    id: "silly",
    name: "Silly",
    nameSv: "Fånig",
    nameEs: "Gracioso",
    category: "theme",
    directive:
      "SILLY: The story has a playful, funny tone. Include silly moments—funny sounds, mixed-up words, gentle surprises, or playful chaos. Characters can be goofy or make silly mistakes that turn out okay. Keep humor gentle and age-appropriate. The story should make kids smile and giggle.",
  },
  {
    id: "bedtime",
    name: "Bedtime",
    nameSv: "Läggdags",
    nameEs: "Hora de dormir",
    category: "theme",
    directive:
      "BEDTIME: The story is designed for winding down before sleep. The pace should slow gradually—start gentle, end sleepy. Include yawning, stargazing, tucking in, soft lullabies, or drifting off. The final paragraph should be calming and drowsy. Use soft, soothing language throughout. End with the character falling asleep.",
  },
  {
    id: "mystery",
    name: "Mystery",
    nameSv: "Mysterium",
    nameEs: "Misterio",
    category: "theme",
    directive:
      "MYSTERY: The story follows a gentle mystery—a missing toy, a strange footprint, a hidden message, or an unexplained sound. Characters work together to figure it out using clues. The solution should be happy and surprising, never scary. Include moments of curiosity, guessing, and a satisfying reveal.",
  },
  {
    id: "music",
    name: "Music",
    nameSv: "Musik",
    nameEs: "Música",
    category: "theme",
    directive:
      "MUSIC: The story involves music, singing, or musical instruments. Characters might play together, discover a new instrument, or use music to solve a problem. Include rhythm, melodies, and the joy of making sounds together. Describe how music feels and what it sounds like. Keep it joyful and harmonious.",
  },
];

/** Get the directive text for a single tag by id or display name */
export function getTagDirective(tagIdOrName: string): string {
  const normalized = tagIdOrName.trim().toLowerCase();
  const tag = TAG_DEFINITIONS.find(
    (t) => t.id === normalized || t.name.toLowerCase() === normalized
  );
  return tag?.directive ?? "";
}

/**
 * Build the full tag directives block for the prompt.
 * Concatenates directives for all selected tags.
 * Returns empty string if no tags selected.
 */
export function buildTagDirectivesBlock(selectedTags: string[]): string {
  if (!selectedTags?.length) return "";
  const directives = selectedTags
    .map((id) => getTagDirective(id))
    .filter(Boolean);
  if (directives.length === 0) return "";
  return directives.join("\n\n");
}

/** Get available tags for the create page UI */
export function getAvailableTags(): string[] {
  return TAG_DEFINITIONS.map((t) => t.name);
}

/** Get tag definitions for the create page (includes id, name, nameSv, nameEs) */
export function getTagsForUI(): { id: string; name: string; nameSv: string; nameEs: string }[] {
  return TAG_DEFINITIONS.map((t) => ({ id: t.id, name: t.name, nameSv: t.nameSv, nameEs: t.nameEs }));
}
