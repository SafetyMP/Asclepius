import { examples, type ResourceExample } from './examples';
import { referralExamples } from './referral-examples';

export type JourneyId = 'routine' | 'referral';
export type JourneyStage = {
  title: string;
  subtitle: string;
  heading: string;
  description: string;
  takeaway: string;
  recordKeys: string[];
  owner?: string;
  status?: string;
  icon: 'person' | 'assessment' | 'report' | 'referral' | 'team' | 'handoff';
};
export type Journey = {
  id: JourneyId;
  number: string;
  label: string;
  headline: string;
  person: string;
  initials: string;
  summary: string;
  date: string;
  setting: string;
  team: string;
  records: ResourceExample[];
  stages: JourneyStage[];
  finalRecordKey: string;
  finalActionLabel: string;
};

/** Record identity includes its id: a journey can contain several records of one type. */
export function recordKey(example: ResourceExample): string {
  return `${example.type}/${String(example.resource.id)}`;
}

export const journeys: [Journey, Journey] = [
  {
    id: 'routine',
    number: '01',
    label: 'A routine follow-up',
    headline: 'One visit. The whole picture.',
    person: 'Alex Morgan',
    initials: 'AM',
    summary: 'A routine follow-up. A connected story.',
    date: '12 Nov 2026',
    setting: 'Willow Teaching Clinic',
    team: 'Jordan Lee · Care team',
    records: examples,
    stages: [
      {
        title: 'Check-in',
        subtitle: 'Who, where, and why',
        icon: 'person',
        heading: 'Start with the person, not the paperwork.',
        description:
          'Alex arrives at Willow Teaching Clinic for a fictional follow-up. The patient, care team, and visit each have a record of their own. References connect them without repeating the same information.',
        recordKeys: [
          'Patient/demo-alex',
          'Practitioner/demo-practitioner',
          'Organization/demo-clinic',
          'Encounter/demo-visit',
        ],
        takeaway: 'A visit is the connection point—not a container for everything.',
      },
      {
        title: 'Assessment',
        subtitle: 'Give observations context',
        icon: 'assessment',
        heading: 'A measurement means more with context.',
        description:
          'A measurement, a recorded concern, and a reported allergy describe different things. Explore their records to see how each points back to Alex and the same visit. Values are illustrative and are not clinically interpreted.',
        recordKeys: [
          'Observation/demo-observation',
          'Condition/demo-condition',
          'AllergyIntolerance/demo-allergy',
        ],
        takeaway: 'Separate records keep measurements and reported concerns distinct.',
      },
      {
        title: 'Follow-up',
        subtitle: 'Connect the next chapter',
        icon: 'report',
        heading: 'Follow the record back to its source.',
        description:
          'The example report links to the original measurement. A draft medication request illustrates an intended action—it does not mean a medicine was dispensed or taken. No treatment or safety assessment is made in this demo.',
        recordKeys: ['DiagnosticReport/demo-report', 'MedicationRequest/demo-medication'],
        takeaway: 'A report links to evidence. A draft request remains a proposal.',
      },
    ],
    finalRecordKey: 'DiagnosticReport/demo-report',
    finalActionLabel: 'Explore the report',
  },
  {
    id: 'referral',
    number: '02',
    label: 'A referral and handoff',
    headline: 'Two teams. One connected story.',
    person: 'Maya Chen',
    initials: 'MC',
    summary: 'A referral. A clear handoff. A next step still to come.',
    date: '13–14 Nov 2026',
    setting: 'Willow → Cedar',
    team: 'Sam Rivera → Taylor Brooks',
    records: referralExamples,
    stages: [
      {
        title: 'Referral',
        subtitle: 'Preserve the original context',
        icon: 'referral',
        heading: 'A request carries the context forward.',
        description:
          'At Willow, Sam prepares a fictional request for Maya to be reviewed by Cedar. The request points to Maya and the original visit, so the receiving team can see who initiated it and where it began. No clinical recommendation is made.',
        recordKeys: [
          'Patient/referral-maya',
          'Practitioner/referral-sam',
          'Organization/referral-willow',
          'Encounter/referral-origin-visit',
          'ServiceRequest/referral-request',
        ],
        takeaway:
          'The request connects the person, the originating visit, and the intended receiving team.',
        owner: 'Referring team · Willow',
        status: 'Request active · service not completed',
      },
      {
        title: 'Team review',
        subtitle: 'Make the receiving role visible',
        icon: 'team',
        heading: 'Receiving the context is a distinct step.',
        description:
          'Cedar is named as the intended receiving team. Taylor is attached to its planned visit, which points back to the referral. Explore both teams’ records to distinguish who requested the service from who will receive the person.',
        recordKeys: [
          'ServiceRequest/referral-request',
          'Organization/referral-cedar',
          'Practitioner/referral-taylor',
          'Encounter/referral-receiving-visit',
        ],
        takeaway:
          'A named team and planned visit make the next step visible; they do not prove that care happened.',
        owner: 'Receiving team · Cedar',
        status: 'Receiving visit planned',
      },
      {
        title: 'Handoff',
        subtitle: 'Separate coordination from care',
        icon: 'handoff',
        heading: 'A completed handoff is not completed care.',
        description:
          'The fixed teaching snapshot records Cedar’s coordination task as completed on November 14. Its output links to the planned receiving visit. The referral remains active and the visit has not been recorded as completed. These are separate statuses with separate meanings.',
        recordKeys: [
          'Task/referral-handoff',
          'ServiceRequest/referral-request',
          'Encounter/referral-receiving-visit',
          'Organization/referral-cedar',
        ],
        takeaway:
          'Follow Task → request → planned visit to see ownership and what is still pending.',
        owner: 'Coordination owner · Cedar',
        status: 'Coordination completed · visit still planned',
      },
    ],
    finalRecordKey: 'Task/referral-handoff',
    finalActionLabel: 'Explore the handoff',
  },
];

export function getJourney(id?: string | null): Journey {
  return journeys.find((journey) => journey.id === id) ?? journeys[0];
}
