
export interface GhostCharacter {
  char: string;
  code: number;
  hex: string;
  index: number;
  name: string;
}

export enum CheckMode {
  STRICT_ASCII = 'STRICT_ASCII', // 0-127
  EXTENDED_ASCII = 'EXTENDED_ASCII' // 0-255
}

export interface AnalysisResult {
  explanation: string;
  suggestions: {
    original: string;
    replacement: string;
    reason: string;
  }[];
}
