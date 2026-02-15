/**
 * Tag definitions for story generation.
 * Each tag has a directive injected into the prompt when selected.
 * See rulesets/TAG_DIRECTIVES.md for the full rule document.
 */

export type TagCategory = "characters" | "setting" | "theme";

export type TagDefinition = {
  id: string;
  name: string;
  category: TagCategory;
  directive: string;
};

export const TAG_DEFINITIONS: TagDefinition[] = [
  // Characters
  {
    id: "animals",
    name: "Animals",
    category: "characters",
    directive:
      "ANIMALS: All main characters must be animals (no human protagonists). Describe their animal traits—fur, feathers, scales, how they move. The setting should feel like their natural world. Use animal sounds and behaviors naturally in the story.",
  },
  {
    id: "fairies",
    name: "Fairies",
    category: "characters",
    directive:
      "FAIRIES: The story features fairies, pixies, or magical winged creatures as main characters or important helpers. Include wings, sparkles, small size, and gentle magic. The world has enchanted elements—glowing flowers, hidden groves, or magical dust.",
  },
  {
    id: "pirates",
    name: "Pirates",
    category: "characters",
    directive:
      "PIRATES: The story takes place on a ship, an island, or the high seas. Main characters are pirates or sea adventurers. Include treasure, maps, sailing, and friendly pirate tropes (parrots, treasure chests, gentle swashbuckling). Keep it playful, not scary.",
  },
  {
    id: "robots",
    name: "Robots",
    category: "characters",
    directive:
      "ROBOTS: The story features robots or friendly machines as characters. They can be helpers, friends, or explorers. Include gentle technology—beeps, whirrs, helpful gadgets. The world can mix nature with friendly tech. Keep robots kind and curious.",
  },
  {
    id: "dinosaurs",
    name: "Dinosaurs",
    category: "characters",
    directive:
      "DINOSAURS: The story features friendly dinosaurs as main characters. All dinosaurs are gentle, kind, and curious—never scary or aggressive. Include big and small dinosaurs, describe their scales, long necks, or tiny arms. Use dinosaur vocabulary (roar, stomp, nest, eggs) in a playful way. Keep it wondrous and cozy.",
  },
  {
    id: "unicorns",
    name: "Unicorns",
    category: "characters",
    directive:
      "UNICORNS: The story features unicorns or horse-like magical creatures as main characters. Include sparkles, rainbows, gentle horns, and soft magic. Unicorns are kind, helpful, and dreamy. Describe their flowing manes, glowing presence, and gentle nature. Keep it whimsical and delightful.",
  },
  // Setting
  {
    id: "forest",
    name: "Forest",
    category: "setting",
    directive:
      "FOREST: The story takes place in a forest, woodland, or among trees. Include trees, mushrooms, streams, leaves, and woodland creatures. The forest can be magical or cozy. Describe the sounds (rustling leaves, birds) and the feeling of being among trees.",
  },
  {
    id: "ocean",
    name: "Ocean",
    category: "setting",
    directive:
      "OCEAN: The story takes place by the sea, under the water, or on the shore. Include waves, shells, fish, sand, or underwater scenes. Use ocean vocabulary—tide, coral, seaweed, dolphins—naturally. Keep it calm and wondrous, not stormy or frightening.",
  },
  {
    id: "space",
    name: "Space",
    category: "setting",
    directive:
      "SPACE: The story takes place in space, on another planet, or in a rocket. Include stars, planets, moons, or zero-gravity moments. Use space vocabulary (stars, galaxy, astronaut, rocket) naturally. Keep it wondrous, not scary.",
  },
  {
    id: "castle",
    name: "Castle",
    category: "setting",
    directive:
      "CASTLE: The story takes place in or around a castle. Include towers, courtyards, knights, royalty, or friendly castle life. The castle can be cozy, magical, or adventurous. Describe stone walls, tapestries, and castle sounds. Keep it gentle and storybook-like.",
  },
  {
    id: "farm",
    name: "Farm",
    category: "setting",
    directive:
      "FARM: The story takes place on a farm or in the countryside. Include farm animals, barns, fields, tractors, or gardens. Describe the sounds and smells of the farm. Characters can be farmers, animals, or children visiting. Keep it warm and cozy.",
  },
  // Theme
  {
    id: "friendship",
    name: "Friendship",
    category: "theme",
    directive:
      "FRIENDSHIP: The central theme is friendship—making friends, helping a friend, or loyalty. The story must resolve around a friendship moment: meeting a new friend, helping a friend in need, or celebrating together. The moral should be about kindness and connection.",
  },
  {
    id: "bravery",
    name: "Bravery",
    category: "theme",
    directive:
      "BRAVERY: The central theme is bravery—a character faces a fear or challenge and overcomes it. The challenge should be age-appropriate (trying something new, standing up for a friend, going to bed without fear). The moral should celebrate courage in small, relatable ways.",
  },
  {
    id: "magic",
    name: "Magic",
    category: "theme",
    directive:
      "MAGIC: The story includes magical elements—spells, wands, enchanted objects, or magical creatures. Magic should be gentle, wondrous, and used for good. Describe magic with sensory details (sparkles, glows, soft transformations). Keep it simple and delightful.",
  },
  {
    id: "discovery",
    name: "Discovery",
    category: "theme",
    directive:
      "DISCOVERY: The central theme is discovery—exploring, learning something new, or finding something wonderful. The story follows a character's curiosity and what they find. Include moments of wonder, surprise, or gentle revelation. The moral celebrates curiosity and learning.",
  },
  {
    id: "family",
    name: "Family",
    category: "theme",
    directive:
      "FAMILY: The central theme is family—parents, siblings, grandparents, or loved ones. The story celebrates being together, helping at home, or a special family moment. Include warm family interactions, cozy routines, or a family adventure. The moral is about love, belonging, and connection with family.",
  },
  {
    id: "kindness",
    name: "Kindness",
    category: "theme",
    directive:
      "KINDNESS: The central theme is kindness—helping others, sharing, or being nice. A character does something kind and it makes a difference. Include gentle acts of generosity, empathy, or care. The moral celebrates how kindness spreads and makes everyone feel good.",
  },
  {
    id: "silly",
    name: "Silly",
    category: "theme",
    directive:
      "SILLY: The story has a playful, funny tone. Include silly moments—funny sounds, mixed-up words, gentle surprises, or playful chaos. Characters can be goofy or make silly mistakes that turn out okay. Keep humor gentle and age-appropriate. The story should make kids smile and giggle.",
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
