export interface ScienceStop {
  id: string;
  name: string;
  sample: string;
  solSealed: number;
  dateSealed: string;
  rockType: 'Sedimentary';
  coordinates: null;
  coordinateStatus: 'pending_verification';
  additionalSample: { name: string; solSealed: number };
  source: string;
  contextSource?: string;
  description: string;
}
const catalog =
  'https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/';
export const stops: readonly ScienceStop[] = [
  {
    id: 'skinner-ridge',
    name: 'Skinner Ridge',
    sample: 'Swift Run',
    solSealed: 490,
    dateSealed: '2022-07-07',
    rockType: 'Sedimentary',
    coordinates: null,
    coordinateStatus: 'pending_verification',
    additionalSample: { name: 'Skyland', solSealed: 495 },
    source: catalog,
    description:
      'Perseverance collected sedimentary rock cores here in the delta front. The samples preserve evidence for studying the history of Jezero.',
  },
  {
    id: 'wildcat-ridge',
    name: 'Wildcat Ridge',
    sample: 'Hazeltop',
    solSealed: 509,
    dateSealed: '2022-07-27',
    rockType: 'Sedimentary',
    coordinates: null,
    coordinateStatus: 'pending_verification',
    additionalSample: { name: 'Bearwallow', solSealed: 516 },
    source: catalog,
    contextSource:
      'https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/',
    description:
      'A sedimentary outcrop in the ancient delta. Perseverance collected two rock cores and examined an abrasion patch here.',
  },
  {
    id: 'amalik',
    name: 'Amalik',
    sample: 'Shuyak',
    solSealed: 575,
    dateSealed: '2022-10-02',
    rockType: 'Sedimentary',
    coordinates: null,
    coordinateStatus: 'pending_verification',
    additionalSample: { name: 'Mageik', solSealed: 619 },
    source: catalog,
    description:
      'A sedimentary sampling feature in the delta front. NASA links the Shuyak and Mageik rock cores to this feature.',
  },
];
export const initialMission = {
  goal: null,
  base: null,
  mobility: 'walking',
  vehicleSupport: false,
  robotSupport: false,
} as const;
