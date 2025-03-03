import { Html } from '@react-three/drei';
import { cn } from '@/lib/utils';

function Shape({ type, size = 80 }) {
  if (type === 'circle') {
    return (
      <svg width={size} height={size} className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="currentColor" className="opacity-50" />
      </svg>
    );
  }

  const getPoints = () => {
    const points = [];
    const sides = {
      triangle: 3,
      square: 4,
      pentagon: 5,
      hexagon: 6,
      heptagon: 7,
      octagon: 8
    }[type] || 3;
    
    // For triangle, adjust starting angle to center it
    const startAngle = type === 'triangle' ? -Math.PI / 2 : -Math.PI / 2;
    
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) + startAngle;
      points.push([
        size/2 * Math.cos(angle),
        size/2 * Math.sin(angle)
      ]);
    }
    return points.map(([x, y]) => `${x + size/2},${y + size/2}`).join(' ');
  };

  return (
    <svg width={size} height={size} className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <polygon points={getPoints()} fill="currentColor" className="opacity-50" />
    </svg>
  );
}

function CubeFace({ position, rotation, color, number, shape, isActive }) {
  return (
    <group position={position} rotation={rotation}>
      <Html transform scale={0.41} style={{ width: '180px', height: '180px', pointerEvents: 'none' }}>
        <div className="relative w-full h-full flex items-center justify-center bg-[color:var(--active-color)]" style={{ '--active-color': color }}>
          {shape && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Shape type={shape} size={130} />
            </div>
          )}
          <div className="relative z-10 font-bold text-5xl text-white">
            {number || (isActive ? '●' : '')}
          </div>
        </div>
      </Html>
    </group>
  );
}

export function Grid3D({ position, color, isActive, number, shape, positionEnabled }) {
  // If position isn't selected in settings, display a single cube
  if (!positionEnabled) {
    // Create a fake position to render a single inactive cube
    const inactivePosition = [999, 999, 999]; // Use a position that won't match any real position
    
    return (
      <group>
        <mesh>
          <boxGeometry args={[1.8, 1.8, 1.8]} />
          <meshPhongMaterial
            color={'#ffffff'}
            opacity={0.1}
            transparent={true}
            depthWrite={false}
          />
        </mesh>
        
        {/* Only render CubeFaces if there's actual content to display */}
        {(number || shape) && (
          <>
            {/* Front face */}
            <CubeFace
              position={[0, 0, 0.91]}
              rotation={[0, 0, 0]}
              color={color}
              number={number}
              shape={shape}
              isActive={isActive}
            />

            {/* Back face */}
            <CubeFace
              position={[0, 0, -0.91]}
              rotation={[0, Math.PI, 0]}
              color={color}
              number={number}
              shape={shape}
              isActive={isActive}
            />

            {/* Right face */}
            <CubeFace
              position={[0.91, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              color={color}
              number={number}
              shape={shape}
              isActive={isActive}
            />

            {/* Left face */}
            <CubeFace
              position={[-0.91, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              color={color}
              number={number}
              shape={shape}
              isActive={isActive}
            />

            {/* Top face */}
            <CubeFace
              position={[0, 0.91, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              color={color}
              number={number}
              shape={shape}
              isActive={isActive}
            />

            {/* Bottom face */}
            <CubeFace
              position={[0, -0.91, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              color={color}
              number={number}
              shape={shape}
              isActive={isActive}
            />
          </>
        )}
      </group>
    );
  }
  
  // Otherwise, show the full 3D grid
  return (
    <group>
      {Array(27).fill().map((_, i) => {
        const x = (i % 3) - 1;
        const y = Math.floor((i / 3) % 3) - 1;
        const z = Math.floor(i / 9) - 1;
        // Check if position exists before comparing
        const active = position ? (
          x === position[0] &&
          y === position[1] &&
          z === position[2]
        ) : false;
        
        return (
          <group key={i} position={[x * 2, y * 2, z * 2]}>
            <mesh>
              <boxGeometry args={[1.8, 1.8, 1.8]} />
              <meshPhongMaterial
                color={active ? color : '#ffffff'}
                opacity={active ? 1 : 0.1}
                transparent
                depthWrite={active}
              />
            </mesh>
            {active && (
              <>
                {/* Front face */}
                <CubeFace
                  position={[0, 0, 0.91]}
                  rotation={[0, 0, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Back face */}
                <CubeFace
                  position={[0, 0, -0.91]}
                  rotation={[0, Math.PI, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Right face */}
                <CubeFace
                  position={[0.91, 0, 0]}
                  rotation={[0, Math.PI / 2, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Left face */}
                <CubeFace
                  position={[-0.91, 0, 0]}
                  rotation={[0, -Math.PI / 2, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Top face */}
                <CubeFace
                  position={[0, 0.91, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Bottom face */}
                <CubeFace
                  position={[0, -0.91, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function Grid2D({ position, color, number, shape, forced, positionEnabled }) {
  // If position isn't selected in settings, display a single cell
  if (!positionEnabled) {
    return (
      <div className="relative">
        {forced && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded z-10">
            Forced
          </div>
        )}
        <div className="w-[300px] h-[300px] mx-auto flex items-center justify-center">
          <div
            className="rounded-lg transition-all duration-300 flex items-center justify-center text-2xl w-[150px] h-[150px] bg-card dark:bg-muted border border-border text-transparent"
          >
            {/* Only show content if there's actual content to display */}
            {(number || shape) && (
              <div className="relative w-full h-full flex items-center justify-center">
                {shape && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shape type={shape} size={120} />
                  </div>
                )}
                <div className="relative z-10 font-bold text-3xl" style={{ color: "white" }}>
                  {number}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Otherwise, show the full 2D grid
  return (
    <div className="relative">
      {forced && (
        <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded z-10">
          Forced
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 w-[300px] h-[300px] mx-auto">
        {Array(9).fill().map((_, i) => {
          const x = i % 3;
          const y = Math.floor(i / 3);
          // Check if position exists before comparing
          const active = position ? (
            x === position[0] &&
            y === position[1]
          ) : false;
          
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg transition-all duration-300 flex items-center justify-center text-2xl h-[90px]",
                active ? "bg-[color:var(--active-color)] text-white" : "bg-card dark:bg-muted border border-border",
                !active && "text-transparent"
              )}
              style={{ '--active-color': color }}
            >
              {active && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {shape && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shape type={shape} />
                    </div>
                  )}
                  <div className="relative z-10 font-bold text-3xl" style={{ color: "white" }}>
                    {number}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Shape };