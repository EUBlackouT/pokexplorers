export interface MainQuest {
    id: string;
    title: string;
    desc: string;
    target: number;
    type: 'distance' | 'badges';
}

export const MAIN_QUESTS: MainQuest[] = [
    { id: 'q1', title: 'The First Step', desc: 'Reach distance 10 from the origin.', target: 10, type: 'distance' },
    { id: 'q2', title: 'Badge Collector', desc: 'Defeat a Gym Leader and earn your first badge.', target: 1, type: 'badges' },
    { id: 'q3', title: 'Rift Explorer', desc: 'Reach distance 50 from the origin.', target: 50, type: 'distance' },
    { id: 'q4', title: 'Elite Trainer', desc: 'Collect 4 badges to prove your strength.', target: 4, type: 'badges' },
    { id: 'q5', title: 'Master of the Rift', desc: 'Collect all 8 badges and reach distance 100.', target: 8, type: 'badges' },
    { id: 'q6', title: 'Legendary Hunter', desc: 'Reach distance 200 and find a Legendary Pokemon.', target: 200, type: 'distance' },
    { id: 'q7', title: 'Rift Conqueror', desc: 'Reach distance 500. The ultimate challenge.', target: 500, type: 'distance' },
    { id: 'q8', title: 'Infinite Voyager', desc: 'Reach distance 1000. Become a legend.', target: 1000, type: 'distance' },
];
