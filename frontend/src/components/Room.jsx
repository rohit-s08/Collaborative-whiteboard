import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap'; // Added Form for inputs
import io from 'socket.io-client';
import Whiteboard from './Whiteboard';
import CodeEditor from './CodeEditor';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const Room = () => {
  const { roomId } = useParams();
  const [socket, setSocket] = useState(null);
  
  // --- NEW STATES ---
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000'); // Default black
  const [brushSize, setBrushSize] = useState(5); // Default size 5

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    if (roomId) {
      newSocket.emit('join-room', roomId);
    }
    return () => newSocket.disconnect();
  }, [roomId]);

  const handleUndo = () => {
    if (socket) socket.emit('undo', { roomId });
  };

  const handleClearAll = () => {
    if (socket) socket.emit('clear-canvas', { roomId });
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h3>Room ID: {roomId}</h3>
        <p>Status: {socket ? 'Connected' : 'Disconnected'}</p>
        <Link to="/dashboard">
          <Button variant="danger">Leave Room</Button>
        </Link>
      </div>
      
      <PanelGroup direction="horizontal" className="main-content">
        <Panel defaultSize={70} minSize={20}>
          <div className="whiteboard-area">
            {/* Pass color and brushSize to Whiteboard */}
            <Whiteboard 
              socket={socket} 
              roomId={roomId} 
              tool={tool} 
              color={color}
              brushSize={brushSize}
            />
          </div>
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        <Panel defaultSize={30} minSize={20}>
          <div className="tools-area">
            <div className="tool-buttons">
              <h5>Tools</h5>
              
              {/* Tool Selection */}
              <div className="d-flex gap-2 mb-2">
                <Button 
                  variant={tool === 'pen' ? 'primary' : 'outline-primary'} 
                  onClick={() => setTool('pen')}
                  className="w-50"
                >
                  Pen
                </Button>
                <Button 
                  variant={tool === 'eraser' ? 'primary' : 'outline-primary'} 
                  onClick={() => setTool('eraser')}
                  className="w-50"
                >
                  Eraser
                </Button>
              </div>

              {/* --- NEW: Color Picker --- */}
              <div className="mb-2">
                <label className="form-label text-light">Color</label>
                <Form.Control 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  title="Choose your color"
                  disabled={tool === 'eraser'} // Disable color if eraser is active
                />
              </div>

              {/* --- NEW: Brush Size Slider --- */}
              <div className="mb-3">
                <label className="form-label text-light">Size: {brushSize}px</label>
                <Form.Range 
                  min="1" 
                  max="20" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                />
              </div>

              <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={handleUndo} className="w-50">
                  Undo
                </Button>
                <Button variant="outline-danger" onClick={handleClearAll} className="w-50">
                  Clear
                </Button>
              </div>
            </div>
            <CodeEditor socket={socket} roomId={roomId} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Room;