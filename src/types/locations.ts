export interface Location {
  id: string;
  name: string;
  description: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'RTC (Rathinam Technical Campus)',
    description: 'Engineering Innovation, Empowering Futures',
    address: 'Main Campus, Block A , Block C',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'RCAS (Rathinam College of Arts and Science)',
    description: 'Shaping Global Citizens Through Knowledge',
    address: 'Main Campus, Block B,Chankya BlockList,CV Raman,Block C',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'RCPY (Rathinam College of Pharmacy)',
    description: 'Educating Future Pharmacists with Purpose and Precision',
    address: 'Main Campus, Block C',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'RCP (Rathinam College of Physiotherapy)',
    description: 'Healing Motion. Enhancing Lives',
    address: 'Medical Wing, Ground Floor',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'RIPS (Rathinam International Public School)',
    description: 'Laying Foundations for Lifelong Success',
    address: 'Rathinam Techzone Campus',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'KPM (K.Palaniappa Memorial EducationalTrust)',
    description: 'Live to Learn,Learn to live',
    address: 'Kurichi Main Road,Eachanari',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'Research Hub',
    description: 'Central platform for organizing, supporting, and advancing inquiry, fostering collaboration, innovation, data-driven insights, and knowledge creation.',
    address: 'Between RTC and RCAS',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'C Block Extension',
    description: 'Collaboration of Engineering, Arts and Science',
    address: 'C Block',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '9',
    name: 'Admin Block',
    description: 'Administrative and IT Companies',
    address: 'Rathinam TechZone Campus',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '10',
    name: 'Admission Block',
    description: 'Admission and Enquiries',
    address: 'Entrance of Rathinam Arts and Science',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
   {
    id: '11',
    name: 'Food court',
    description: 'Snacks and Juices',
    address: 'Opp to Chankya Block',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '12',
    name: 'Nous Building',
    description: 'It and Accounts',
    address: 'Adjacent to KPM School',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
];