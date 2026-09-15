export type RsvpStatus = 'confirmed' | 'declined' | 'maybe' | 'pending';

export interface Friend {
  id: string;
  username: string;
  /** local require() or remote uri; undefined falls back to the initial */
  avatarUrl?: string;
}

export interface Dog {
  id: string;
  name: string;
  breed: string;
  ageYears: number;
  photoUrl?: string;
  /** set when the dog is co-owned with another user (shared household) */
  sharedWith?: Friend;
}

export interface WalkParticipant {
  friend: Friend;
  status: RsvpStatus;
  /** dogs this friend is bringing, only meaningful when status === 'confirmed' */
  dogs: Dog[];
}

export interface Walk {
  id: string;
  place: string;
  /** ISO 8601 start datetime */
  startsAt: string;
  durationMinutes: number;
  /** hard cap on dogs for the walk; the UI shows confirmedDogs / dogCapacity */
  dogCapacity: number;
  host: Friend;
  participants: WalkParticipant[];
  myStatus: RsvpStatus;
}

export const confirmedDogs = (walk: Walk): Dog[] =>
  walk.participants
    .filter((p) => p.status === 'confirmed')
    .flatMap((p) => p.dogs);

export const respondents = (walk: Walk, status: RsvpStatus = 'confirmed'): Friend[] =>
  walk.participants.filter((p) => p.status === status).map((p) => p.friend);
