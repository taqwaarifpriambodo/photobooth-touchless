// ===== State Machine Types =====

export type AppState =
  | 'PERMISSION'
  | 'WELCOME'
  | 'CAMERA_READY'
  | 'FRAME_SELECTION'
  | 'MULTI_SHOT'
  | 'COMPOSITING'
  | 'UPLOADING'
  | 'RESULT'
  | 'ERROR';

export type SessionPhase =
  | 'COUNTDOWN'
  | 'FLASH'
  | 'CAPTURE'
  | 'PREVIEW'
  | 'NEXT';

// ===== Coordinate Types =====

export interface Point2D {
  x: number;
  y: number;
}

// ===== Frame Types =====

export interface PhotoSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameTemplate {
  id?: string;
  name: string;
  file: string;           // Nama file (e.g. frame_01_bunga.png)
  publicUrl?: string;     // Full public URL dari Supabase Storage
  status?: number;        // 1: Aktif, 0: Tidak Aktif
  canvasWidth: number;
  canvasHeight: number;
  slots: PhotoSlot[];
}

export interface FrameRecord {
  id: string;
  frame_name: string;
  filename: string;
  canvas_width?: number;
  canvas_height?: number;
  slots?: PhotoSlot[];
  status: number;         // 1: aktif, 0: tidak aktif
  created_at: string;
}

export interface FrameInfo {
  name: string;
  src: string;
  thumbnail: string;
}

// ===== Photo Session Types =====

export interface PhotoSessionState {
  currentShot: number;       // 1-3
  totalShots: number;        // 3
  capturedPhotos: Blob[];
  sessionPhase: SessionPhase;
  selectedFrame: FrameTemplate | null;
}

// ===== Database Types =====

export interface PhotoRecord {
  id: string;
  image_url: string;
  frame_used: string | null;
  photo_count: number;
  created_at: string;
}

// ===== Dwell Timer Types =====

export interface DwellState {
  isHovering: boolean;
  progress: number;       // 0-100
  isComplete: boolean;
}
