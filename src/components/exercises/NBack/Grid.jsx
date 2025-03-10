import { Html, Sphere, Cone, Box, Cylinder, Text3D, Center, Edges } from '@react-three/drei';
import { cn } from '@/lib/utils';

// 2D Shape component for the 2D grid
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

// Create a polyhedron with the given number of sides
function createPolyhedron(sides) {
  // For simple shapes, we can use predefined geometries
  if (sides === 3) {
    // Tetrahedron (4 triangular faces)
    return (
      <mesh>
        <tetrahedronGeometry args={[0.9, 0]} />
      </mesh>
    );
  } else if (sides === 4) {
    // Cube (6 square faces)
    return (
      <mesh>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
      </mesh>
    );
  } else if (sides === 8) {
    // Octahedron (8 triangular faces)
    return (
      <mesh>
        <octahedronGeometry args={[0.9, 0]} />
      </mesh>
    );
  } else if (sides === 20) {
    // Icosahedron (20 triangular faces)
    return (
      <mesh>
        <icosahedronGeometry args={[0.9, 0]} />
      </mesh>
    );
  } else {
    // For other shapes, use a cylinder with the appropriate number of sides
    return (
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 1.2, sides]} />
      </mesh>
    );
  }
}

// 3D Shape component for the 3D grid
function Shape3D({ type, color, number }) {
  // Create a component for the number in the center
  const NumberDisplay = () => (
    <Html position={[0, 0, 0]} center distanceFactor={0.5}>
      <div className="font-bold text-9xl text-white" style={{
        textShadow: '0 0 5px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        zIndex: 1,
        transform: 'scale(2.5)'
      }}>
        {number}
      </div>
    </Html>
  );

  // Map shape types to appropriate 3D representations
  let shape;
  switch (type) {
    case 'circle': // Sphere
      shape = (
        <mesh>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshPhongMaterial color={color} opacity={0.9} transparent />
          <Edges color="white" threshold={15} scale={1.02} />
        </mesh>
      );
      break;
    case 'triangle': // Pyramid (Cone with 3 segments)
      shape = (
        <Cone args={[0.9, 1.4, 3]} position={[0, 0, 0]}>
          <meshPhongMaterial color={color} opacity={0.9} transparent />
          <Edges color="white" threshold={15} scale={1.02} />
        </Cone>
      );
      break;
    case 'square': // Cube
      shape = (
        <Box args={[1.2, 1.2, 1.2]}>
          <meshPhongMaterial color={color} opacity={0.9} transparent />
          <Edges color="white" threshold={15} scale={1.02} />
        </Box>
      );
      break;
    case 'pentagon': // Dodecahedron (12 pentagonal faces)
      shape = (
        <mesh>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshPhongMaterial color={color} opacity={0.9} transparent />
          <Edges color="white" threshold={15} scale={1.02} />
        </mesh>
      );
      break;
    case 'hexagon': // Icosahedron (20 triangular faces)
      shape = (
        <mesh>
          <icosahedronGeometry args={[0.9, 0]} />
          <meshPhongMaterial color={color} opacity={0.9} transparent />
          <Edges color="white" threshold={15} scale={1.02} />
        </mesh>
      );
      break;
    case 'heptagon': // Custom polyhedron
      shape = (
        <mesh>
          <dodecahedronGeometry args={[0.9, 1]} />
          <meshPhongMaterial color={color} opacity={0.9} transparent />
          <Edges color="white" threshold={15} scale={1.02} />
        </mesh>
      );
      break;
    case 'octagon': // Octahedron (8 triangular faces)
      shape = (
        <mesh>
          <octahedronGeometry args={[0.9, 0]} />
          <meshPhongMaterial color={color} opacity={0.9} transparent />
          <Edges color="white" threshold={15} scale={1.02} />
        </mesh>
      );
      break;
    default:
      return null;
  }

  return (
    <group>
      {shape}
      {number && <NumberDisplay />}
    </group>
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

export function Grid3D({ position, color, isActive, number, shape, positionEnabled, use3DShapes = true }) {

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
            opacity={0.2}
            transparent={true}
            depthWrite={false}
          />
        </mesh>
        
        {/* Only render content if there's actual content to display */}
        {(number || shape) && (
          <>
            {/* 3D shape in the center if shape is specified and use3DShapes is true */}
            {shape && use3DShapes && (
              <group>
                <Shape3D type={shape} color={color} number={number} />
              </group>
            )}

            {/* If no shape is specified or use3DShapes is false, render the cube faces with number/shape */}
            {(!shape || !use3DShapes) && (
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
                color={'#ffffff'}
                opacity={active ? 0.2 : 0.1}
                transparent
                depthWrite={false}
              />
            </mesh>
            {active && (
              <>
                {/* 3D shape in the center if shape is specified and use3DShapes is true */}
                {shape && use3DShapes && (
                  <group>
                    <Shape3D type={shape} color={color} number={number} />
                  </group>
                )}

                {/* If no shape is specified or use3DShapes is false, render the cube faces with number/shape */}
                {(!shape || !use3DShapes) && (
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
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function Grid2D({ position, color, number, shape, forced, positionEnabled, isMobile }) {
  const gridSize = isMobile ? 250 : 300;
  const cellSize = isMobile ? 75 : 90;
  const singleCellSize = isMobile ? 120 : 150;
  const shapeSize = isMobile ? 100 : 120;

  // If position isn't selected in settings, display a single cell
  if (!positionEnabled) {
    return (
      <div className="relative">
        {forced && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded z-10">
            Forced
          </div>
        )}
        <div className={`w-[${gridSize}px] h-[${gridSize}px] mx-auto flex items-center justify-center`}>
          <div
            className={cn(
              "rounded-lg transition-all duration-300 flex items-center justify-center",
              isMobile ? "text-xl" : "text-2xl",
              (number || shape) ? "bg-[color:var(--active-color)] text-white" : "bg-card dark:bg-muted border border-border text-transparent"
            )}
            style={{
              '--active-color': color,
              width: `${singleCellSize}px`,
              height: `${singleCellSize}px`
            }}
          >
            {/* Only show content if there's actual content to display */}
            {(number || shape) && (
              <div className="relative w-full h-full flex items-center justify-center">
                {shape && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shape type={shape} size={shapeSize} />
                  </div>
                )}
                <div className={cn("relative z-10 font-bold", isMobile ? "text-2xl" : "text-3xl")} style={{ color: "white" }}>
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
      <div
        className="grid grid-cols-3 gap-2 mx-auto"
        style={{
          width: `${gridSize}px`,
          height: `${gridSize}px`
        }}
      >
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
                "rounded-lg transition-all duration-300 flex items-center justify-center",
                isMobile ? "text-xl" : "text-2xl",
                active ? "bg-[color:var(--active-color)] text-white" : "bg-card dark:bg-muted border border-border",
                !active && "text-transparent"
              )}
              style={{
                '--active-color': color,
                height: `${cellSize}px`
              }}
            >
              {active && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {shape && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shape type={shape} size={isMobile ? 70 : 80} />
                    </div>
                  )}
                  <div className={cn("relative z-10 font-bold", isMobile ? "text-2xl" : "text-3xl")} style={{ color: "white" }}>
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