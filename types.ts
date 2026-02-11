
export interface DiagnosticResult {
  confidence: number;
  issue: string;
  measured: string;
  limit: string;
  component: string;
}

export interface Detection {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [top, left, width, height] in percentages
  color: string;
}

export interface IncidentDetails {
  id: string;
  timestamp: string;
  shift: string;
  station: string;
  product: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
