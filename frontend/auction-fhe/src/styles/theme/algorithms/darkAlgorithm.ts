import { MappingAlgorithm } from 'antd/es/theme/interface';

import { colorScales } from '@/components/color/colors';
import { neutralColorScales } from "@/components/color/neutrals";
import type { ColorScaleItem } from "@/components/color/types";

import { NeutralColors, PrimaryColors } from '../../customTheme';
import { generateColorNeutralPalette, generateColorPalette } from '../generateColorPalette';
import darkBaseToken from '../token/dark';

export const darkAlgorithm: MappingAlgorithm = (seedToken, mapToken) => {
  const primaryColor = (seedToken as any).primaryColor as PrimaryColors;
  const neutralColor = (seedToken as any).neutralColor as NeutralColors;

  let primaryTokens = {};
  let neutralTokens = {};

  // generate primary color Token with colorPrimary
  const primaryScale: ColorScaleItem = colorScales[primaryColor];

  if (primaryScale) {
    primaryTokens = generateColorPalette({
      appearance: 'dark',
      scale: primaryScale,
      type: 'Primary',
    });
  }

  // generate neutral color Token with colorBgBase
  const neutralScale = neutralColorScales[neutralColor];
  if (neutralScale) {
    neutralTokens = generateColorNeutralPalette({ appearance: 'dark', scale: neutralScale });
  }

  return {
    ...mapToken!,
    ...darkBaseToken,
    ...primaryTokens,
    ...neutralTokens,
  };
};
