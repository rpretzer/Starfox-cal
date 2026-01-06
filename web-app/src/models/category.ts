import { Category } from '../types';

export const getDefaultCategories = (): Category[] => {
  return [
    { id: 'starfox', name: 'Starfox Team', colorValue: 0x4287f5 },
    { id: 'rds', name: 'RDS Team', colorValue: 0xf54242 },
    { id: 'mblart', name: 'MBL ART', colorValue: 0x42f56f },
    { id: 'zelda', name: 'Zelda Sub-team', colorValue: 0xf5ad42 },
    { id: 'enterprise', name: 'Enterprise-Wide', colorValue: 0x8442f5 },
    { id: 'partners', name: 'Bank Partners', colorValue: 0xf5429e },
  ];
};

