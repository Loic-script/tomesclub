import { ENGLISH_LEVELS } from "@/lib/onboarding-options";

// Le catalogue des activités de groupe (rooms) : 13 activités,
// chacune avec ses catégories de thèmes (30 thèmes par activité) et ses formats.
// Utilisé par le formulaire (navigateur) ET par le serveur (vérification).

export type RoomActivity = {
  key: string;
  icon: string;
  name: string;
  description: string;
  categories: { name: string; topics: string[] }[];
  formats: string[];
};

/** La durée d'une salle, en minutes. */
export const ROOM_DURATIONS = [5, 10, 15, 20, 25, 30] as const;
export const DEFAULT_DURATION = 15;

/** Le niveau d'anglais visé par la salle. */
export const ROOM_LEVELS = [
  { value: "all", label: "All levels" },
  ...ENGLISH_LEVELS.map((level) => ({ value: level.value, label: level.label })),
];

/* ---------- Les données (reprises telles quelles du fichier "Online Activities") ---------- */

// [icône, nom, description, {catégorie: [thèmes]}, [formats]]
type Raw = [string, string, string, Record<string, string[]>, string[]];

const BASE: Raw[] = [
  ["🗣️", "Debate", "Two teams defend opposing views. Build arguments, disagree politely and back points with examples.", { "Society & Tech": ["Social media does more harm than good."], "Life & Values": ["Does true love really exist?", "Would you rather be rich or happy?"], "Work & Education": ["Education is more important than experience.", "Experience vs. skills: which matters more?"] }, ["Team debate", "Fishbowl", "Pro / Con pairs"]],
  ["💬", "Open Discussion", "A relaxed conversation on everyday and personal topics to build spontaneous speaking.", { "Life & Values": ["What does success mean to you?", "Can money buy happiness?"], Relationships: ["What makes a good friendship?", "Is it better to live alone or with family?"], Society: ["How has technology changed our lives?"] }, ["Whole group", "Breakout pairs", "Question cards"]],
  ["🎤", "Public Speaking", "Deliver a short speech to build confidence, pronunciation and clear structure.", { Inspiration: ["The person who inspires me the most."], Vision: ["If I could change one thing about the world.", "My vision of the future."], "Life lessons": ["Three lessons life has taught me.", "Why stepping out of your comfort zone matters."] }, ["Prepared speech", "Speech with one slide", "Speech + Q&A"]],
  ["⏱️", "Impromptu Speaking", "Draw a random question and speak with no preparation to build fluency and fight fear of mistakes.", { Everyday: ["Describe your perfect day.", "Name one thing you cannot live without."], Imagination: ["If you could travel anywhere, where would you go?", "What would you do if you won the lottery?"], Reflection: ["Is failure the key to success?"] }, ["Random card", "Timed rounds", "Chain speaking"]],
  ["🎲", "English Games", "Language games that build vocabulary, listening and quick thinking.", { Guessing: ["Who Am I?: guess a famous person by asking questions."], Vocabulary: ["Taboo: describe a word without the forbidden words.", "Word Association: respond with a related word fast."], "Bluff & Choice": ["Two Truths and a Lie: spot the false statement.", "Would You Rather?: choose between two tough options."] }, ["Individual", "Teams"]],
  ["🎭", "Role-Play & Real-Life Situations", "Act out realistic scenarios in different roles for practical, confident communication.", { Work: ["Job interview: employer vs. candidate.", "Negotiating a salary raise.", "Handling a difficult customer complaint."], "Daily life": ["At the restaurant: customer vs. waiter.", "Convincing a friend to travel with you."] }, ["Pairs", "Small groups", "With observer feedback"]],
  ["🕵️", "Guessing & Mystery Games", "Use clues and questions to uncover a hidden person, place, object or situation.", { Mysteries: ["Who stole the diamond? Solve a detective mystery.", "Solve a murder mystery together."], "Guess it": ["Guess the country from five clues.", "Identify a mystery object through questions.", "Guess the film from its description."] }, ["Teams", "Individual", "Host + guessers"]],
  ["📖", "Storytelling Challenge", "Tell stories from imagination, experience or a prompt. Organise ideas and use descriptive vocabulary.", { Prompts: ["Start a story with: “It was a normal Monday until…”", "Create a story using five random words."], Personal: ["Describe the most unforgettable day of your life."], Perspective: ["Tell a story from someone else’s perspective.", "Continue a story begun by another participant."] }, ["Solo story", "Relay story", "Story in pairs"]],
  ["🎓", "Guest Speaker Session", "An expert shares their experience; participants listen, ask questions and join a live conversation.", { "Business & Career": ["Entrepreneurship: how to start a business.", "Career development: how to build a successful career.", "Leadership: what makes a great leader?"], "Digital & Image": ["Digital skills: how AI is changing the workplace.", "Personal branding: how to stand out professionally."] }, ["Talk + Q&A", "Interview style", "Panel"]],
  ["💼", "Business English Challenge", "Business tasks and simulations for meetings, presentations and negotiations.", { Pitching: ["Pitch your business idea in two minutes.", "Present a new product to potential customers."], "Meetings & Deals": ["Negotiate a business partnership.", "Lead a team meeting in English.", "Present a solution to a business problem."] }, ["Individual pitch", "Team simulation", "Pairs"]],
  ["📊", "Mini Presentation", "Prepare a short presentation: structure information, explain ideas, use visuals, answer questions.", { Tech: ["Five apps that make my life easier.", "The future of artificial intelligence."], "Culture & World": ["A country everyone should visit.", "An invention that changed the world."], Business: ["A business idea that could change people’s lives."] }, ["Slides", "No slides", "Presentation + Q&A"]],
  ["🎯", "Persuasion Challenge", "Win others over to an idea, product or proposal with persuasive language and strong arguments.", { Everyday: ["Convince us to read your favourite book.", "Convince the group that your hometown is the best place to live."], Life: ["Why should we learn a second language?", "Convince your parents to let you travel alone."], Sales: ["Sell an ordinary object as if it were a luxury product."] }, ["Solo pitch", "Pair vs. pair", "Group vote"]],
  ["📰", "News & Current Events", "Explore news stories and global issues: summarise, share perspectives and give opinions.", { "Work & Tech": ["Should AI replace some human jobs?", "Is remote work better than office work?", "Are influencers good role models?"], Society: ["Should university education be free?", "Should governments invest more in renewable energy?"] }, ["Summary + opinion", "Group discussion", "Mini debate"]],
];

// 25 thèmes en plus par activité, dans l'ordre de ses catégories → 30 thèmes en tout.
const EXTRA: string[][][] = [
  [["Should smartphones be banned in schools?", "Is online privacy a myth?", "Are video games harmful for teenagers?", "Should social media have age limits?", "Is AI a threat to humanity?", "Cities are better than villages.", "Should plastic be banned?", "Cancel culture does more harm than good."], ["Is honesty always the best policy?", "Money is the root of all evil.", "Is it better to be feared or loved?", "Does age bring wisdom?", "Is marriage still necessary?", "Should we forgive and forget?", "Is it right to lie to protect someone?", "Do people ever really change?"], ["Homework should be abolished.", "The four-day work week is better.", "University degrees are overrated.", "Should students wear uniforms?", "Is working from home more productive?", "Should everyone learn to code?", "Gap years are a waste of time.", "Is a high salary more important than passion?", "Should exams be replaced by projects?"]],
  [["What are you most grateful for?", "How do you define a good life?", "What habit changed your life?", "What would you tell your younger self?", "What makes you truly happy?", "How do you handle stress?", "What is your biggest dream?", "What does freedom mean to you?"], ["What qualities do you look for in a partner?", "How important are family traditions?", "Can men and women be just friends?", "How do you deal with a difficult colleague?", "Who has influenced you most?", "What makes a good neighbour?", "How do you resolve a conflict?", "Is trust easy to rebuild?"], ["Is the world getting better or worse?", "How do you feel about social media?", "Which traditions should never disappear?", "Is travel good for the planet?", "What makes a city great to live in?", "How do you stay informed?", "Should everyone vote?", "What is the best age to be?", "How do you spend your weekends?"]],
  [["A teacher who changed my life.", "A book that shaped me.", "A hero from my country.", "My role model at work.", "A mistake that taught me something.", "Someone who believed in me.", "A person I admire from history.", "My proudest achievement."], ["My dream job in ten years.", "The city of the future.", "How I would improve education.", "A world without borders.", "What I would do as president for a day.", "Technology in 2050.", "How to make the world kinder.", "A cause worth fighting for."], ["Why failure is useful.", "The power of saying no.", "How to stay motivated.", "Learning from criticism.", "The value of patience.", "Why we should read more.", "How I overcame a fear.", "Why kindness matters.", "The importance of rest."]],
  [["Describe your morning routine.", "Your favourite meal and why.", "The last thing that made you laugh.", "Your ideal weekend.", "A place you love in your town.", "Your favourite season.", "The best advice you received.", "An object with a story."], ["What if you were invisible for a day?", "What if you could speak to animals?", "You wake up in the year 1900.", "You can have one superpower.", "You meet your future self.", "You own a private island.", "A day as a famous person.", "You can eat only one food forever.", "You are mayor for a week."], ["Is it better to give or receive?", "What is your biggest strength?", "Is money or time more valuable?", "What makes you proud?", "Do first impressions matter?", "Should we always tell the truth?", "What does home mean to you?", "What would you change about yourself?"]],
  [["20 Questions: animal", "20 Questions: object", "Guess the job from three clues", "Guess the food from its description", "Describe a place without naming it", "Guess the sport", "Who Am I? Historical figure", "Guess the invention"], ["Category Race: fruits", "Alphabet Game: countries", "Synonym Battle", "Antonym Challenge", "Rhyme Time", "Odd One Out", "Pictionary Words", "Spelling Bee", "Idiom Match-Up"], ["Would You Rather: food edition", "Would You Rather: travel edition", "Would You Rather: superpowers", "Two Truths and a Lie: travel", "Two Truths and a Lie: childhood", "Never Have I Ever", "This or That", "Lie Detector: spot the bluff"]],
  [["Asking your boss for a day off", "Presenting to a new client", "Resolving a conflict with a coworker", "First day at a new job", "Giving negative feedback", "Calming an angry client on the phone", "Interviewing a new employee", "Asking for a promotion", "Delivering bad news to a team", "Negotiating a project deadline", "Networking at a conference", "Quitting your job politely", "Training a new colleague"], ["Checking in at a hotel", "Booking a doctor’s appointment", "Returning a faulty product", "Asking for directions", "Renting an apartment", "Ordering at a café", "Complaining about noise", "Lost luggage at the airport", "Planning a trip with a friend", "Calling customer service", "Shopping for clothes", "Meeting your partner’s parents"]],
  [["The missing painting", "Who poisoned the CEO?", "The vanished passenger", "The stolen recipe", "Mystery at the museum", "The locked-room puzzle", "Who broke the window?", "The secret message", "The haunted house", "The missing exam papers", "Who ate the cake?", "The cursed necklace"], ["Guess the city from clues", "Guess the famous person", "Guess the animal", "Guess the profession", "Guess the sport", "Guess the famous building", "Guess the food from clues", "Guess the book", "Guess the invention", "Guess the hobby", "Guess the school subject", "Guess the festival", "Guess the language"]],
  [["The door was slightly open…", "I never expected to find…", "The last train had already left…", "A story that ends with: “and that changed everything.”", "A story with a surprising twist", "A story set in the year 2100", "A story that starts with a phone call", "A story about a lost object", "A story with a talking animal"], ["My first day at school", "A trip I will never forget", "A time I got lost", "My funniest memory", "A moment I was very proud", "A time I helped a stranger", "My best birthday", "An embarrassing moment"], ["A story told by a cat", "A story told by a traveller", "A teacher’s first day", "A robot learning emotions", "The last person on Earth", "A story told by a coffee cup", "A child seeing snow for the first time", "A story told by a detective"]],
  [["Building a startup from zero", "Raising funds for a business", "Job or own business?", "Work-life balance", "Networking tips", "Managing a remote team", "Negotiating your salary", "Overcoming failure in business", "Time management for professionals", "Changing careers at 30", "Mentoring and being mentored", "Soft skills employers want", "Leading a diverse team"], ["Using AI tools at work", "Building a LinkedIn profile", "Cybersecurity basics", "Freelancing online", "Content creation as a career", "Digital marketing trends", "Learning English for your career", "Social media for business", "Data skills for everyone", "Productivity apps", "Managing your online reputation", "The future of remote work"]],
  [["Pitch a mobile app", "Pitch to an investor in 90 seconds", "Present your company’s mission", "Launch a new service", "Pitch a green product", "Present quarterly results", "Introduce your company to a partner", "Pitch a food delivery startup", "Present a marketing campaign", "Pitch a travel agency idea", "Present a brand-new gadget", "Sell a software subscription"], ["Run a weekly team meeting", "Negotiate a supplier contract", "Handle a budget cut", "Brainstorm a marketing idea", "Write and discuss an agenda", "Interrupt politely in a meeting", "Close a sales deal", "Handle an unhappy client", "Discuss a project delay", "Agree on a deadline", "Make small talk with clients", "Present a SWOT analysis", "Follow up after a meeting"]],
  [["My favourite gadget", "How smartphones changed communication", "Online learning tools", "Pros and cons of social media", "Cybersecurity tips", "Electric cars", "How GPS works", "Video games and creativity", "Smart homes"], ["My favourite festival", "A traditional dish from my country", "A famous person from my country", "A hobby I love", "The history of my city", "An important historical event", "A film or book that inspired me", "A sport everyone should try"], ["A startup I admire", "How to save money", "A product I would improve", "Why customer service matters", "Remote work tips", "How to start a small business", "A successful brand story", "Ideas for a sustainable business"]],
  [["Convince us to try a new sport", "Why we should adopt a pet", "Convince us to try a new cuisine", "Why everyone should cycle to work", "Persuade us to visit your country", "Why we should wake up early", "Convince us to learn an instrument", "Why we should read daily", "Persuade us to watch a documentary"], ["Convince your boss to give you a raise", "Persuade a friend to quit a bad habit", "Convince your family to move abroad", "Persuade someone to volunteer", "Convince your teacher to give less homework", "Persuade a friend to study abroad", "Why we should save money early", "Convince a neighbour to recycle"], ["Sell a pen", "Sell an umbrella in the desert", "Sell a used bicycle", "Sell a new phone app", "Sell an English course", "Sell a holiday package", "Sell a cup of coffee", "Sell a pair of shoes"]],
  [["Should robots work in hospitals?", "Is a universal basic income a good idea?", "Do electric cars solve pollution?", "Should children use tablets?", "Is social media regulation needed?", "Are self-driving cars safe?", "Should companies track employees?", "Is the gig economy fair?", "Should coding be taught at school?", "Are cryptocurrencies the future?", "Is automation destroying jobs?", "Should AI art be copyrighted?", "Should deepfakes be illegal?"], ["Should fast food be taxed?", "Is tourism harming popular cities?", "Should voting be mandatory?", "Is climate change taken seriously enough?", "Should zoos exist?", "Is fast fashion a problem?", "Should the retirement age rise?", "Are cities too crowded?", "Should plastic bags be banned?", "Is online shopping killing local shops?", "Should public transport be free?", "Is celebrity culture harmful?"]],
];

/** "Role-Play & Real-Life Situations" → "role-play-real-life-situations" */
function keyOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const ROOM_ACTIVITIES: RoomActivity[] = BASE.map(([icon, name, description, categories, formats], index) => ({
  key: keyOf(name),
  icon,
  name,
  description,
  categories: Object.entries(categories).map(([category, topics], position) => ({
    name: category,
    topics: [...topics, ...(EXTRA[index]?.[position] ?? [])],
  })),
  formats,
}));

/** L'activité qui a cette clé (ou undefined). */
export function findActivity(key: string | null | undefined): RoomActivity | undefined {
  return key ? ROOM_ACTIVITIES.find((activity) => activity.key === key) : undefined;
}

/** Le nom lisible d'un niveau ("intermediate" → "Intermediate"). */
export function levelLabel(value: string | null | undefined): string | null {
  return ROOM_LEVELS.find((level) => level.value === value)?.label ?? null;
}
