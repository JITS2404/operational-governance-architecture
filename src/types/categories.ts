export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Carpentry',
    description: 'Wood work, furniture repair, and carpentry services',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Civil',
    description: 'Construction, masonry, and civil engineering work',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },

  {
    id: '4',
    name: 'Fabrication',
    description: 'Metal work, welding, and fabrication services',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
   {
    id: '5',
    name: 'Electrical',
    description: 'Wiring, installation, maintenance, and servicing of electrical systems and equipment.',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Plumbing',
    description: 'Installation, repair, and maintenance of water supply, drainage, fixtures, and sewer systems..',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'Internet',
    description: 'Setup, configuration, troubleshooting, and maintenance of network connectivity, broadband, routers, and wireless systems.',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Painting',
    description: 'Preparation, priming, finishing, touch-ups, and maintaining surfaces with paint/coating to protect and decorate.',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '9',
    name: 'AC',
    description: 'Inspection, cleaning, servicing, and repair of air-conditioning systems (filters, coils, refrigerant, electricals) to ensure proper cooling, efficiency, and safety..',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },


];