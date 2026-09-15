import type { Dog, Friend, Walk } from './types';

export const me: Friend = { id: 'u0', username: 'tom' };

export const friends: Friend[] = [
  { id: 'u1', username: 'lea' },
  { id: 'u2', username: 'sofia' },
  { id: 'u3', username: 'yanis' },
  { id: 'u4', username: 'amine' },
  { id: 'u5', username: 'marion' },
];

export const myDogs: Dog[] = [
  { id: 'd1', name: 'Mochi', breed: 'Shiba inu', ageYears: 3 },
  { id: 'd2', name: 'Nala', breed: 'Border collie', ageYears: 5, sharedWith: friends[0] },
  { id: 'd3', name: 'Taco', breed: 'Teckel', ageYears: 1 },
];

const leaDogs: Dog[] = [
  { id: 'd4', name: 'Pixel', breed: 'Cavalier king charles', ageYears: 2 },
  { id: 'd5', name: 'Brioche', breed: 'Épagneul breton', ageYears: 4 },
];

export const walks: Walk[] = [
  {
    id: 'w1',
    place: "Parc de la Tête d'Or",
    startsAt: '2026-09-19T10:00:00+02:00',
    durationMinutes: 90,
    dogCapacity: 10,
    host: me,
    myStatus: 'confirmed',
    participants: [
      { friend: friends[0], status: 'confirmed', dogs: leaDogs },
      { friend: friends[1], status: 'declined', dogs: [] },
      { friend: friends[2], status: 'pending', dogs: [] },
      { friend: friends[3], status: 'maybe', dogs: [] },
      { friend: me, status: 'confirmed', dogs: [myDogs[0], myDogs[1]] },
    ],
  },
  {
    id: 'w2',
    place: 'Berges du Rhône',
    startsAt: '2026-09-20T09:30:00+02:00',
    durationMinutes: 60,
    dogCapacity: 10,
    host: friends[2],
    myStatus: 'maybe',
    participants: [
      { friend: friends[2], status: 'confirmed', dogs: [] },
      { friend: friends[4], status: 'confirmed', dogs: [] },
      { friend: friends[1], status: 'pending', dogs: [] },
    ],
  },
  {
    id: 'w3',
    place: 'Forêt de Serre',
    startsAt: '2026-09-23T18:15:00+02:00',
    durationMinutes: 120,
    dogCapacity: 10,
    host: friends[3],
    myStatus: 'pending',
    participants: [
      { friend: friends[3], status: 'confirmed', dogs: [] },
      { friend: friends[0], status: 'confirmed', dogs: [] },
    ],
  },
];

/** Labels are French on purpose — API stays English, UI copy stays French. */
export const rsvpLabels = {
  confirmed: 'Confirmé',
  maybe: 'Peut-être',
  declined: 'Décliné',
  pending: 'En attente',
} as const;

export const durationOptions = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 90, label: '1 h 30' },
  { minutes: 120, label: '2 h' },
];

export const formatWalkDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));

export const formatWalkTime = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );

export const formatDuration = (minutes: number) =>
  minutes < 60
    ? minutes + ' min'
    : minutes % 60 === 0
      ? minutes / 60 + ' h'
      : Math.floor(minutes / 60) + ' h ' + (minutes % 60);
