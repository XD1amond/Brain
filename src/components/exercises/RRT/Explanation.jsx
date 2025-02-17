import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { cn } from '@/lib/utils';

function createGridFromMap(wordCoordMap) {
  const entries = Object.entries(wordCoordMap);
  const low = [...entries[0][1]];
  const high = [...entries[0][1]];

  // Find bounds
  for (const [_, coord] of entries) {
    for (const i in coord) {
      low[i] = Math.min(low[i], coord[i]);
      high[i] = Math.max(high[i], coord[i]);
    }
  }

  const dimensions = low.map((l, i) => high[i] - l + 1);
  
  // Create grid with proper dimensions
  const grid = Array(dimensions[1]).fill().map(() => 
    Array(dimensions[0]).fill('')
  );

  // Fill grid with words
  for (const [word, coord] of entries) {
    const x = coord[0] - low[0];
    const y = coord[1] - low[1];
    grid[y][x] = word;
  }

  return { grid, dimensions, low, high };
}

function Grid2D({ wordCoordMap }) {
  const { grid, dimensions } = createGridFromMap(wordCoordMap);
  const [width, height] = dimensions;

  return (
    <div 
      className="grid gap-2 mx-auto"
      style={{ 
        gridTemplateColumns: `repeat(${width}, minmax(60px, 1fr))`,
        width: `${Math.min(width * 70, 500)}px`
      }}
    >
      {grid.map((row, y) => (
        row.map((word, x) => (
          <div
            key={`${x}-${y}`}
            className={cn(
              "aspect-square rounded-lg transition-all duration-300 flex items-center justify-center p-1",
              "bg-card border border-border",
              word ? "bg-primary/10" : "bg-card"
            )}
          >
            {word && (
              <div className="text-primary font-medium text-center text-sm break-words w-full">
                {word}
              </div>
            )}
          </div>
        ))
      )).reverse()}
    </div>
  );
}

function DirectionLabel({ position, text }) {
  return (
    <Html position={position} center>
      <div
        style={{
          background: 'var(--muted)',
          color: 'var(--muted-foreground)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {text}
      </div>
    </Html>
  );
}

function Grid3D({ wordCoordMap }) {
  const entries = Object.entries(wordCoordMap);
  const low = [...entries[0][1]];
  const high = [...entries[0][1]];

  // Find bounds
  for (const [_, coord] of entries) {
    for (const i in coord) {
      low[i] = Math.min(low[i], coord[i]);
      high[i] = Math.max(high[i], coord[i]);
    }
  }

  const dimensions = low.map((l, i) => high[i] - l + 1);
  const maxDim = Math.max(...dimensions);
  const scale = 3 / maxDim;
  const spacing = 1.5;

  // Calculate grid extents for label positioning
  const gridExtent = (dimensions[0] - 1) / 2 * spacing * scale;
  const labelOffset = gridExtent + 2;

  return (
    <group scale={[scale, scale, scale]}>
      {/* Direction Labels */}
      <DirectionLabel position={[labelOffset, 0, 0]} text="East" />
      <DirectionLabel position={[-labelOffset, 0, 0]} text="West" />
      <DirectionLabel position={[0, 0, -labelOffset]} text="North" />
      <DirectionLabel position={[0, 0, labelOffset]} text="South" />

      {Array(dimensions[2]).fill().map((_, z) =>
        Array(dimensions[1]).fill().map((_, y) =>
          Array(dimensions[0]).fill().map((_, x) => {
            // x: east(+)/west(-) - left/right (inverted)
            const xPos = -(x - (dimensions[0] - 1) / 2) * spacing;
            // y: north(+)/south(-) - forward/back
            const yPos = ((dimensions[1] - 1) / 2 - y) * spacing;
            // z: above(+)/below(-) - up/down
            const zPos = (z - (dimensions[2] - 1) / 2) * spacing;

            const word = entries.find(([_, coord]) =>
              coord[0] - low[0] === x &&
              coord[1] - low[1] === y &&
              coord[2] - low[2] === z
            )?.[0];

            return (
              <group key={`${x}-${y}-${z}`} position={[xPos, -zPos, -yPos]}>
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshPhongMaterial
                    color={word ? '#3498db' : '#ffffff'}
                    opacity={word ? 1 : 0.1}
                    transparent
                    depthWrite={!!word}
                  />
                </mesh>
                {word && (
                 <Html center distanceFactor={10}>
                   <div
                     style={{
                       background: 'var(--primary)',
                       color: 'var(--primary-foreground)',
                       padding: '2px 4px',
                       borderRadius: '2px',
                       fontSize: '12px',
                       lineHeight: 1,
                       whiteSpace: 'nowrap',
                       fontWeight: 500,
                       textAlign: 'center',
                       display: 'flex',
                       justifyContent: 'center',
                       alignItems: 'center',
                       pointerEvents: 'none',
                       userSelect: 'none',
                       maxWidth: '90%'
                     }}
                   >
                     {word}
                   </div>
                 </Html>
                )}
              </group>
            );
          })
        )
      )}
    </group>
  );
}

function ComparisonVisualization({ question }) {
  const items = question.type === 'comparison' ? question.order : question.timeline;
  if (!items) return null;

  // Reverse the items since relationships are stored in reverse order
  // (relationships[a].has(b) means a > b)
  const orderedItems = [...items].reverse();

  return (
    <div className="p-4 bg-card rounded-lg">
      <div className="text-xl font-medium">
        {orderedItems.join(' > ')}
      </div>
    </div>
  );
}

function ExplanationDialog({ isOpen, onClose, question }) {
  if (!isOpen) return null;

  const renderExplanation = () => {
    if (question.type === 'comparison' || question.type === 'temporal') {
      return <ComparisonVisualization question={question} />;
    }

    if (question.type === 'distinction') {
      return (
        <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg">
          {question.buckets.map((bucket, i) => (
            <div key={i} className="space-y-2">
              {bucket.map((item, j) => (
                <div key={j} className="p-2 bg-muted rounded">
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (question.type.includes('direction') && question.wordCoordMap) {
      // Use 2D grid for 2D direction questions
      if (question.type === 'direction') {
        return (
          <div className="w-full p-4">
            <Grid2D wordCoordMap={question.wordCoordMap} />
          </div>
        );
      }
      
      // Use 3D grid for 3D/4D direction questions
      return (
        <div className="w-full h-[500px]">
          <Canvas camera={{ position: [4, 4, 6], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Grid3D wordCoordMap={question.wordCoordMap} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
              autoRotate={true}
              autoRotateSpeed={1}
            />
          </Canvas>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[500px]">
        <div className="bg-card rounded-lg shadow-lg border">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">Explanation</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="p-4">
            {renderExplanation()}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExplanationButton({ question }) {
  const [isOpen, setIsOpen] = useState(false);

  // Show button for all supported question types
  if (!question.type) return null;
  
  // Each type has its own visualization
  const hasVisualization = 
    (question.type === 'comparison' && question.order) ||
    (question.type === 'temporal' && question.timeline) ||
    (question.type === 'distinction' && question.buckets) ||
    (question.type.includes('direction') && question.wordCoordMap);
    
  if (!hasVisualization) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "px-2 py-1 text-sm rounded-md",
          "bg-primary/10 hover:bg-primary/20 text-primary",
          "transition-colors"
        )}
      >
        Show Explanation
      </button>
      <ExplanationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        question={question}
      />
    </>
  );
}