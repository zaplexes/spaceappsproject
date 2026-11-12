export const scientificGoal = {
  id: 'ancient-water',
  title: 'Investigate ancient water in Jezero',
  question:
    'How do sedimentary features at Skinner Ridge, Wildcat Ridge and Amalik help us investigate Jezero’s ancient water environment?',
  objective:
    'Use orbital imagery, terrain context and published rover observations to plan observations at the three candidate science stops.',
  outcome:
    'Produce a source-linked comparison of the stops, distinguishing documented observations, interpretations and missing evidence.',
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
    summary: 'Astronauts travel on foot and plan observations at each outcrop.',
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
