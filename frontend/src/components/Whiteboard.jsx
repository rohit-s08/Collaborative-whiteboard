import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';

// Accept new props: color, brushSize
const Whiteboard = ({ socket, roomId, tool, color, brushSize }) => {
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('drawing', (newLine) => {
      setLines((prevLines) => [...prevLines, newLine]);
    });

    socket.on('undo-line', () => {
      setLines((prevLines) => prevLines.slice(0, -1));
    });

    socket.on('canvas-cleared', () => {
      setLines([]);
    });

    return () => {
      socket.off('drawing');
      socket.off('undo-line');
      socket.off('canvas-cleared');
    };
  }, [socket]);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    
    // SAVE THE CURRENT COLOR AND SIZE WITH THE LINE
    const newLine = { 
      tool, 
      color, 
      brushSize, 
      points: [pos.x, pos.y] 
    };
    
    setLines([...lines, newLine]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    
    if (lastLine) {
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      lines.splice(lines.length - 1, 1, lastLine);
      setLines(lines.concat());
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    const lastLine = lines[lines.length - 1];
    if (socket && lastLine) {
      socket.emit('drawing', { newLine: lastLine, roomId });
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
      >
        <Layer>
          {lines.map((line, i) => {
            // Logic to determine style based on tool type
            const isEraser = line.tool === 'eraser';
            
            // If it's an eraser, use white and double the brush size for better erasing
            // If it's a pen, use the stored line.color and line.brushSize
            const strokeColor = isEraser ? '#ffffff' : line.color;
            const lineWidth = isEraser ? (line.brushSize * 2) : line.brushSize;

            return (
              <Line
                key={i}
                points={line.points}
                stroke={strokeColor}
                strokeWidth={lineWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  isEraser ? 'destination-out' : 'source-over'
                }
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Whiteboard;