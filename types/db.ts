export type Story = {
  id: string;
  user_id: string | null;
  title: string | null;
  tone: string;
  length_key: string;
  ruleset_id: string;
  context_json: Record<string, unknown>;
  status: string;
  created_at: string;
  chapters?: Chapter[];
};

export type Chapter = {
  id: string;
  story_id: string;
  chapter_index: number;
  recap_json: Record<string, unknown> | null;
  status: string;
  created_at: string;
  paragraphs?: Paragraph[];
};

export type Paragraph = {
  id: string;
  chapter_id: string;
  paragraph_index: number;
  text: string;
  audio_url: string | null;
  image_url: string | null;
  image_prompt: string | null;
  status: string;
  created_at: string;
};
