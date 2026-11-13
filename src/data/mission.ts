export const scientificGoal = {
  id: 'destination-selection',
  title: 'Choose the next destination on Mars',
  question:
    'Which destination should astronauts investigate next, given their location, priorities and available evidence?',
  objective:
    'Compare named Mars features by distance and adjustable study interests, inspect orbital imagery and terrain context, and prepare a round trip.',
  outcome:
    'An explainable destination shortlist and a source-linked field plan, with missing evidence and travel assumptions visible.',
} as const;

export type MobilityMode = 'walking' | 'crewed-vehicle' | 'robotic-rover';

export interface MobilityProfile {
  id: MobilityMode;
  label: string;
  summary: string;
  requirements: readonly string[];
  capabilities: {
    speedKph: null;
    rangeKm: null;
    maximumSlopeDegrees: null;
    equipment: null;
    availableTimeMinutes: null;
    returnReserve: null;
  };
}

export const mobilityProfiles: readonly MobilityProfile[] = [
  {
    id: 'walking',
    label: 'Walking astronauts',
    summary:
      'Astronauts travel on foot and review candidate destinations and plan observations.',
    requirements: [
      'Crew size, carried equipment and time for each science task',
      'Walking speed, terrain limits, suit duration and return reserve',
    ],
    capabilities: {
      speedKph: null,
      rangeKm: null,
      maximumSlopeDegrees: null,
      equipment: null,
      availableTimeMinutes: null,
      returnReserve: null,
    },
  },
  {
    id: 'crewed-vehicle',
    label: 'Astronauts in a crew vehicle',
    summary:
      'Astronauts drive between stops; close surface work may require a separate walking excursion.',
    requirements: [
      'Crew size, vehicle type, payload and usable driving range',
      'Driving speed, terrain limits, energy or life-support budget and return reserve',
      'Walking limits and equipment for any task requiring the crew to leave the vehicle',
    ],
    capabilities: {
      speedKph: null,
      rangeKm: null,
      maximumSlopeDegrees: null,
      equipment: null,
      availableTimeMinutes: null,
      returnReserve: null,
    },
  },
  {
    id: 'robotic-rover',
    label: 'Robotic ground rover',
    summary:
      'Plan observations for a robotic rover with a specified camera and instrument payload.',
    requirements: [
      'Rover model, camera and instrument payload, and task duration',
      'Driving speed, terrain limits, range, energy budget and return reserve',
      'Communication and command constraints',
    ],
    capabilities: {
      speedKph: null,
      rangeKm: null,
      maximumSlopeDegrees: null,
      equipment: null,
      availableTimeMinutes: null,
      returnReserve: null,
    },
  },
];

export function mobilityProfile(mode: MobilityMode): MobilityProfile {
  const profile = mobilityProfiles.find((candidate) => candidate.id === mode);
  if (!profile) throw new Error(`Unknown exploration mode: ${mode}`);
  return profile;
}

export const initialMission = {
  goal: scientificGoal.id,
  base: null,
  mobility: 'walking' as MobilityMode,
} as const;
