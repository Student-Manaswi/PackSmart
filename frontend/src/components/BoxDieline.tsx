import { formatDimension } from "../utils/formatDimension";

/**
 * BoxDieline.tsx
 * Renders a 2D flat box dieline (net) using real L x W x H dimensions
 * from the backend detection results.
 *
 * Box Net Layout:
 *
 *                 [ LEFT ]
 *   [TOP] [FRONT] [BOTTOM] [BACK]
 *                 [ RIGHT]
 */

type BoxDielineProps = {
  length: number; // cm - depth (front to back)
  width: number;  // cm - left to right
  height: number; // cm - top to bottom
};

export default function BoxDieline({ length, width, height }: BoxDielineProps) {
  // â”€â”€ Scale: fit into SVG canvas and avoid overflow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const MAX_CANVAS_SIZE = 1100; // larger fixed viewport
  const PADDING = 80;
  const DESIRED_SCALE = 4.8; // increase scale for bigger diagram

  const rawW = Math.max(1, width);
  const rawH = Math.max(1, height);
  const rawL = Math.max(1, length);

  const neededWidth = rawL + rawW + rawL + rawW;
  const neededHeight = rawH * 3;

  const SCALE = DESIRED_SCALE; // always use fixed scale, no fitting calculation

  const W = rawW * SCALE;
  const H = rawH * SCALE;
  const L = rawL * SCALE;

  const neededWidthScaled = neededWidth * SCALE;
  const neededHeightScaled = neededHeight * SCALE;

  const svgWidth = Math.ceil(neededWidthScaled + PADDING * 2);
  const svgHeight = Math.ceil(neededHeightScaled + PADDING * 2);

  const xOffset = (svgWidth - neededWidthScaled) / 2;
  const yOffset = (svgHeight - neededHeightScaled) / 2;

  // Origin point (top-left of FRONT face)
  const ox = xOffset + L;
  const oy = yOffset + H;

  // Colors
  const fillColor = "#FEF9C3";       // light yellow
  const strokeColor = "#D97706";     // amber
  const textColor = "#92400E";       // dark amber
  const dimColor = "#3B82F6";        // blue for dimension lines
  const foldColor = "#D97706";       // dashed fold lines

  const strokeW = 1.5;
  const fontSize = 11;
  const labelSize = 13;

  // â”€â”€ Helper: dimension line with arrows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const DimLine = ({
    x1, y1, x2, y2, label, offset = 18, horizontal = true
  }: {
    x1: number; y1: number; x2: number; y2: number;
    label: string; offset?: number; horizontal?: boolean;
  }) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dimColor} strokeWidth={1} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        {horizontal ? (
          <text x={mx} y={y1 - 5} textAnchor="middle" fill={dimColor} fontSize={10} fontWeight="600">{label}</text>
        ) : (
          <text x={x1 - 5} y={my} textAnchor="end" fill={dimColor} fontSize={10} fontWeight="600" dominantBaseline="middle">{label}</text>
        )}
      </g>
    );
  };

  // â”€â”€ Face label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const FaceLabel = ({ x, y, label }: { x: number; y: number; label: string }) => (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={textColor} fontSize={labelSize} fontWeight="700" opacity={0.7}>
      {label}
    </text>
  );

  return (
    <div className="flex justify-center items-center w-full">
      <div style={{ maxWidth: "100%", display: "flex", justifyContent: "center", paddingLeft: "24px" }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto block"
        >
        {/* â”€â”€ Arrow marker definition â”€â”€ */}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={dimColor} />
          </marker>
        </defs>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            FACES
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

        {/* TOP face */}
        <rect x={ox} y={oy - H} width={W} height={H} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW} />
        <FaceLabel x={ox + W / 2} y={oy - H / 2} label="L" />

        {/* FRONT face */}
        <rect x={ox} y={oy} width={W} height={H} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW} />
        <FaceLabel x={ox + W / 2} y={oy + H / 2} label="F" />

        {/* BOTTOM face */}
        <rect x={ox} y={oy + H} width={W} height={H} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW} />
        <FaceLabel x={ox + W / 2} y={oy + H + H / 2} label="R" />

        {/* LEFT face */}
        <rect x={ox - L} y={oy} width={L} height={H} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW} />
        <FaceLabel x={ox - L / 2} y={oy + H / 2} label="T" />

        {/* RIGHT face */}
        <rect x={ox + W} y={oy} width={L} height={H} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW} />
        <FaceLabel x={ox + W + L / 2} y={oy + H / 2} label="GL" />

        {/* BACK face */}
        <rect x={ox + W + L} y={oy} width={W} height={H} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW} />
        <FaceLabel x={ox + W + L + W / 2} y={oy + H / 2} label="B" />

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            FOLD LINES (dashed)
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

        {/* fold: top-front */}
        <line x1={ox} y1={oy} x2={ox + W} y2={oy} stroke={foldColor} strokeWidth={1} strokeDasharray="6 4" />
        {/* fold: front-bottom */}
        <line x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} stroke={foldColor} strokeWidth={1} strokeDasharray="6 4" />
        {/* fold: left-front */}
        <line x1={ox} y1={oy} x2={ox} y2={oy + H} stroke={foldColor} strokeWidth={1} strokeDasharray="6 4" />
        {/* fold: front-right */}
        <line x1={ox + W} y1={oy} x2={ox + W} y2={oy + H} stroke={foldColor} strokeWidth={1} strokeDasharray="6 4" />
        {/* fold: right-back */}
        <line x1={ox + W + L} y1={oy} x2={ox + W + L} y2={oy + H} stroke={foldColor} strokeWidth={1} strokeDasharray="6 4" />

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            DIMENSION LINES
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

        {/* Width dimension (top, horizontal) */}
        <DimLine
          x1={ox} y1={oy - H - 20}
          x2={ox + W} y2={oy - H - 20}
          label={`W: ${formatDimension(width)} cm`}
          horizontal={true}
        />

        {/* Height dimension (left, vertical) */}
        <DimLine
          x1={ox - L - 20} y1={oy}
          x2={ox - L - 20} y2={oy + H}
          label={`H: ${formatDimension(height)} cm`}
          horizontal={false}
        />

        {/* Length dimension (side face, horizontal) */}
        <DimLine
          x1={ox + W} y1={oy + H + H + 20}
          x2={ox + W + L} y2={oy + H + H + 20}
          label={`L: ${formatDimension(length)} cm`}
          horizontal={true}
        />

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            CORNER MARKS (cut lines)
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {[[
          ox, oy - H], [ox + W, oy - H],
          [ox, oy + H + H], [ox + W, oy + H + H],
          [ox - L, oy], [ox - L, oy + H],
          [ox + W + L + W, oy], [ox + W + L + W, oy + H],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke="#9CA3AF" strokeWidth={1} />
            <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} stroke="#9CA3AF" strokeWidth={1} />
          </g>
        ))}
        
      </svg>
      </div>
    </div>
  );
}
