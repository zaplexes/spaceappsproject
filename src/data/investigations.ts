import type { MobilityMode } from './mission';
import review from '../../data/manifests/sample-location-review.json' with { type: 'json' };

export interface StopInvestigation {
  stopId: string;
  question: string;
  observations: readonly string[];
  tasks: Record<MobilityMode, readonly string[]>;
  sourceUrl: string;
}

const dossier = (page: number) => `${review.sourceUrl}#page=${page}`;

// Proposed future activities, not measured results, completed fieldwork or
// claims that a selected crew/vehicle already has the required instruments.
export const investigations: readonly StopInvestigation[] = [
  {
    stopId: 'skinner-ridge',
    question:
      'What could rock textures and grain diversity reveal about sediment transport and deposition?',
    observations: [
      'Compare published Swift Run descriptions and surface references with the other two stops.',
      'Record image scale and resolution; leave unresolved grain characteristics unknown.',
    ],
    tasks: {
      walking: [
        'Plan overview and close-up photographs of the outcrop with scale references.',
        'Describe visible textures and identify any measurements requiring additional tools.',
      ],
      'crewed-vehicle': [
        'Plan an overview imaging position from the vehicle.',
        'Identify close-up observations requiring a separately assessed walking task.',
      ],
      'robotic-rover': [
        'Plan overview and close-up image targets, subject to camera reach and resolution.',
        'List texture observations that the specified rover payload could resolve.',
      ],
    },
    sourceUrl: dossier(14),
  },
  {
    stopId: 'wildcat-ridge',
    question:
      'What could layering and texture reveal about changes in sediment deposition?',
    observations: [
      'Review published Hazeltop and Wildcat Ridge observations for the sedimentary context.',
      'Compare visible layers and textures with Skinner Ridge and Amalik, retaining scale limitations.',
    ],
    tasks: {
      walking: [
        'Plan photographs of exposed layers from several viewpoints.',
        'Document visible changes and propose targeted measurements where evidence is insufficient.',
      ],
      'crewed-vehicle': [
        'Plan overview views of the outcrop from candidate vehicle observation positions.',
        'Separate any close inspection or measurement into a walking task with its own limits.',
      ],
      'robotic-rover': [
        'Plan a sequence of views of the exposed layers using the specified camera payload.',
        'Identify additional measurements needed to distinguish alternative interpretations.',
      ],
    },
    sourceUrl: dossier(58),
  },
  {
    stopId: 'amalik',
    question:
      'Which published observations could help investigate water-related alteration, and what remains uncertain?',
    observations: [
      'Review the published Shuyak dossier for observations and interpretations relevant to alteration.',
      'Identify evidence needed for a comparison with the other stops; direct mineral measurements are not available in this map.',
    ],
    tasks: {
      walking: [
        'Plan surface-context photographs and record candidate targets for follow-up analysis.',
        'Specify the instruments needed before proposing chemical or mineral measurements.',
      ],
      'crewed-vehicle': [
        'Plan vehicle-based context imaging of candidate outcrops.',
        'Identify any work requiring crew dismount or an additional instrument before scheduling it.',
      ],
      'robotic-rover': [
        'Plan surface-context imaging and identify candidate instrument targets.',
        'Check whether the selected rover payload supports the proposed follow-up measurements.',
      ],
    },
    sourceUrl: dossier(100),
  },
];
